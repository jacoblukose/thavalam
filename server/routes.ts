import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import { insertVehicleSchema, insertServiceRecordSchema, insertVehicleDocumentSchema, insertFuelLogSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { uploadToSupabase, deleteFromSupabase } from "./supabase-storage";
import crypto from "crypto";
import path from "path";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

// Magic bytes for file type validation
const MAGIC_BYTES: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF
};

function validateMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const signatures = MAGIC_BYTES[mimetype];
  if (!signatures) return false;
  return signatures.some((sig) =>
    sig.every((byte, i) => buffer[i] === byte)
  );
}

function sanitizeFilename(filename: string): string {
  // Extract extension, generate random name
  const ext = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, "");
  const safe = crypto.randomBytes(8).toString("hex");
  return `${safe}${ext}`;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Accepted: PDF, JPEG, PNG, WebP`));
    }
  },
});

const buildNoteSchema = z.object({
  key: z.string().min(1).max(200),
  value: z.string().max(2000),
  date: z.string().nullable().optional(),
  cost: z.number().int().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

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

  // Non-vehicle API routes that also need auth
  app.use("/api/documents", requireAuth as RequestHandler);
  app.use("/api/notifications", requireAuth as RequestHandler);

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
      const isOwner = await storage.isVehicleOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ error: "Only the owner can update a vehicle" });
      }
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
      if (!(await storage.isVehicleOwner(req.params.vehicleId, req.user!.id))) {
        return res.status(403).json({ error: "Only the owner can add service records" });
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

  app.patch("/api/vehicles/:vehicleId/services/:serviceId", async (req, res) => {
    try {
      if (!(await storage.isVehicleOwner(req.params.vehicleId, req.user!.id))) {
        return res.status(403).json({ error: "Only the owner can update service records" });
      }
      const result = insertServiceRecordSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const record = await storage.updateServiceRecord(req.params.serviceId, req.params.vehicleId, result.data);
      if (!record) {
        return res.status(404).json({ error: "Service record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error updating service record:", error);
      res.status(500).json({ error: "Failed to update service record" });
    }
  });

  app.delete("/api/vehicles/:vehicleId/services/:serviceId", async (req, res) => {
    try {
      if (!(await storage.isVehicleOwner(req.params.vehicleId, req.user!.id))) {
        return res.status(403).json({ error: "Only the owner can delete service records" });
      }
      const deleted = await storage.deleteServiceRecord(req.params.serviceId, req.params.vehicleId);
      if (!deleted) {
        return res.status(404).json({ error: "Service record not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service record:", error);
      res.status(500).json({ error: "Failed to delete service record" });
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
      if (!(await storage.isVehicleOwner(req.params.vehicleId, req.user!.id))) {
        return res.status(403).json({ error: "Only the owner can update build notes" });
      }
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Expected array of notes" });
      }
      const parsed = z.array(buildNoteSchema).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromError(parsed.error).toString() });
      }
      const notes = await storage.upsertBuildNotes(req.params.vehicleId, parsed.data);
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
      // Notify the target user
      const vehicle = await storage.getVehicle(req.params.vehicleId, req.user!.id);
      await storage.createNotification(
        targetUser.id,
        "vehicle_shared",
        "Vehicle shared with you",
        `${req.user!.name} shared "${vehicle?.nickname || vehicle?.model || "a vehicle"}" with you.`,
      );
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
      if (!(await storage.isVehicleOwner(req.params.vehicleId, req.user!.id))) {
        return res.status(403).json({ error: "Only the owner can add documents" });
      }

      let fileUrl: string | null = null;
      let fileName: string | null = null;

      if (req.file) {
        // Validate file content matches declared MIME type
        if (!validateMagicBytes(req.file.buffer, req.file.mimetype)) {
          return res.status(400).json({ error: "File content does not match declared type" });
        }
        fileName = req.file.originalname;
        const safeName = sanitizeFilename(fileName);
        fileUrl = await uploadToSupabase(
          req.file.buffer,
          `${req.user!.id}/${req.params.vehicleId}/${Date.now()}-${safeName}`,
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
    } catch (error: any) {
      if (error?.message?.includes("File type")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.delete("/api/vehicles/:vehicleId/documents/:docId", async (req, res) => {
    try {
      if (!(await storage.isVehicleOwner(req.params.vehicleId, req.user!.id))) {
        return res.status(403).json({ error: "Only the owner can delete documents" });
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

  // Fuel Logs — verify vehicle belongs to user
  app.get("/api/vehicles/:vehicleId/fuel-logs", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId, req.user!.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const logs = await storage.getFuelLogs(req.params.vehicleId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching fuel logs:", error);
      res.status(500).json({ error: "Failed to fetch fuel logs" });
    }
  });

  app.post("/api/vehicles/:vehicleId/fuel-logs", async (req, res) => {
    try {
      if (!(await storage.isVehicleOwner(req.params.vehicleId, req.user!.id))) {
        return res.status(403).json({ error: "Only the owner can add fuel logs" });
      }
      const result = insertFuelLogSchema.safeParse({
        ...req.body,
        vehicleId: req.params.vehicleId,
      });
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const log = await storage.createFuelLog(result.data);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating fuel log:", error);
      res.status(500).json({ error: "Failed to create fuel log" });
    }
  });

  app.patch("/api/vehicles/:vehicleId/fuel-logs/:logId", async (req, res) => {
    try {
      if (!(await storage.isVehicleOwner(req.params.vehicleId, req.user!.id))) {
        return res.status(403).json({ error: "Only the owner can update fuel logs" });
      }
      const result = insertFuelLogSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const log = await storage.updateFuelLog(req.params.logId, req.params.vehicleId, result.data);
      if (!log) {
        return res.status(404).json({ error: "Fuel log not found" });
      }
      res.json(log);
    } catch (error) {
      console.error("Error updating fuel log:", error);
      res.status(500).json({ error: "Failed to update fuel log" });
    }
  });

  app.delete("/api/vehicles/:vehicleId/fuel-logs/:logId", async (req, res) => {
    try {
      if (!(await storage.isVehicleOwner(req.params.vehicleId, req.user!.id))) {
        return res.status(403).json({ error: "Only the owner can delete fuel logs" });
      }
      const deleted = await storage.deleteFuelLog(req.params.logId, req.params.vehicleId);
      if (!deleted) {
        return res.status(404).json({ error: "Fuel log not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting fuel log:", error);
      res.status(500).json({ error: "Failed to delete fuel log" });
    }
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifs = await storage.getNotifications(req.user!.id);
      res.json(notifs);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id, req.user!.id);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ error: "Failed to mark notification read" });
    }
  });

  app.post("/api/notifications/read-all", async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.user!.id);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error marking all notifications read:", error);
      res.status(500).json({ error: "Failed to mark all read" });
    }
  });

  app.delete("/api/notifications", async (req, res) => {
    try {
      await storage.clearNotifications(req.user!.id);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error clearing notifications:", error);
      res.status(500).json({ error: "Failed to clear notifications" });
    }
  });

  return httpServer;
}
