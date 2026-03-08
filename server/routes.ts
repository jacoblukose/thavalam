import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, insertServiceRecordSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";

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

  return httpServer;
}
