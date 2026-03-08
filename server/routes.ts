import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertVehicleSchema, insertServiceRecordSchema, insertVehicleDocumentSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { uploadToSupabase, deleteFromSupabase } from "./supabase-storage";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // All vehicle routes require auth
  app.use("/api/vehicles", requireAuth as RequestHandler);

  // Vehicles
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getVehicles(req.user!.id);
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id, req.user!.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ error: "Failed to fetch vehicle" });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const result = insertVehicleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const vehicle = await storage.createVehicle(req.user!.id, result.data);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      res.status(500).json({ error: "Failed to create vehicle" });
    }
  });

  app.patch("/api/vehicles/:id", async (req, res) => {
    try {
      const result = insertVehicleSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const vehicle = await storage.updateVehicle(req.params.id, req.user!.id, result.data);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      res.status(500).json({ error: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const isOwner = await storage.isVehicleOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ error: "Only the owner can delete a vehicle" });
      }
      await storage.deleteVehicle(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ error: "Failed to delete vehicle" });
    }
  });

  // Service Records — verify vehicle belongs to user
  app.get("/api/vehicles/:vehicleId/services", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId, req.user!.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const records = await storage.getServiceRecords(req.params.vehicleId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching service records:", error);
      res.status(500).json({ error: "Failed to fetch service records" });
    }
  });

  app.post("/api/vehicles/:vehicleId/services", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId, req.user!.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const result = insertServiceRecordSchema.safeParse({
        ...req.body,
        vehicleId: req.params.vehicleId,
      });
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const record = await storage.createServiceRecord(result.data);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating service record:", error);
      res.status(500).json({ error: "Failed to create service record" });
    }
  });

  // Build Notes — verify vehicle belongs to user
  app.get("/api/vehicles/:vehicleId/notes", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId, req.user!.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const notes = await storage.getBuildNotes(req.params.vehicleId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching build notes:", error);
      res.status(500).json({ error: "Failed to fetch build notes" });
    }
  });

  app.put("/api/vehicles/:vehicleId/notes", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId, req.user!.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Expected array of notes" });
      }
      const notes = await storage.upsertBuildNotes(req.params.vehicleId, req.body);
      res.json(notes);
    } catch (error) {
      console.error("Error upserting build notes:", error);
      res.status(500).json({ error: "Failed to upsert build notes" });
    }
  });

  // Sharing — owner only
  app.get("/api/vehicles/:vehicleId/shares", async (req, res) => {
    try {
      const isOwner = await storage.isVehicleOwner(req.params.vehicleId, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ error: "Only the owner can manage sharing" });
      }
      const shares = await storage.getShares(req.params.vehicleId);
      res.json(shares);
    } catch (error) {
      console.error("Error fetching shares:", error);
      res.status(500).json({ error: "Failed to fetch shares" });
    }
  });

  app.post("/api/vehicles/:vehicleId/shares", async (req, res) => {
    try {
      const isOwner = await storage.isVehicleOwner(req.params.vehicleId, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ error: "Only the owner can manage sharing" });
      }
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }
      const targetUser = await storage.findUserByEmail(email.trim().toLowerCase());
      if (!targetUser) {
        return res.status(404).json({ error: "No user found with that email. They need to sign in at least once first." });
      }
      if (targetUser.id === req.user!.id) {
        return res.status(400).json({ error: "You can't share with yourself" });
      }
      const share = await storage.shareVehicle(req.params.vehicleId, targetUser.id);
      res.status(201).json({ ...share, email: targetUser.email, name: targetUser.name, picture: targetUser.picture });
    } catch (error) {
      console.error("Error sharing vehicle:", error);
      res.status(500).json({ error: "Failed to share vehicle" });
    }
  });

  app.delete("/api/vehicles/:vehicleId/shares/:userId", async (req, res) => {
    try {
      const isOwner = await storage.isVehicleOwner(req.params.vehicleId, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ error: "Only the owner can manage sharing" });
      }
      await storage.unshareVehicle(req.params.vehicleId, req.params.userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unsharing vehicle:", error);
      res.status(500).json({ error: "Failed to unshare vehicle" });
    }
  });

  // Documents — verify vehicle belongs to user
  app.get("/api/vehicles/:vehicleId/documents", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId, req.user!.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const docs = await storage.getDocuments(req.params.vehicleId);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // All documents for user (for landing page alerts)
  app.get("/api/documents", async (req, res) => {
    try {
      const docs = await storage.getDocumentsByUser(req.user!.id);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching all documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/vehicles/:vehicleId/documents", upload.single("file") as any, async (req: any, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId, req.user!.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      let fileUrl: string | null = null;
      let fileName: string | null = null;

      if (req.file) {
        fileName = req.file.originalname;
        fileUrl = await uploadToSupabase(
          req.file.buffer,
          `${req.user!.id}/${req.params.vehicleId}/${Date.now()}-${fileName}`,
          req.file.mimetype,
        );
      }

      const result = insertVehicleDocumentSchema.safeParse({
        vehicleId: req.params.vehicleId,
        type: req.body.type,
        label: req.body.label || null,
        expiryDate: req.body.expiryDate,
        fileUrl,
        fileName,
        notes: req.body.notes || null,
      });

      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }

      const doc = await storage.createDocument(result.data);
      res.status(201).json(doc);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.delete("/api/vehicles/:vehicleId/documents/:docId", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId, req.user!.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const docs = await storage.getDocuments(req.params.vehicleId);
      const doc = docs.find(d => d.id === req.params.docId);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }
      if (doc.fileUrl) {
        await deleteFromSupabase(doc.fileUrl);
      }
      await storage.deleteDocument(req.params.docId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  return httpServer;
}
