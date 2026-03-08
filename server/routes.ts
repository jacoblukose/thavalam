import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, insertServiceRecordSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Vehicles
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id);
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
      const vehicle = await storage.createVehicle(result.data);
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
      const vehicle = await storage.updateVehicle(req.params.id, result.data);
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
      await storage.deleteVehicle(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ error: "Failed to delete vehicle" });
    }
  });

  // Service Records
  app.get("/api/vehicles/:vehicleId/services", async (req, res) => {
    try {
      const records = await storage.getServiceRecords(req.params.vehicleId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching service records:", error);
      res.status(500).json({ error: "Failed to fetch service records" });
    }
  });

  app.post("/api/vehicles/:vehicleId/services", async (req, res) => {
    try {
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

  // Build Notes
  app.get("/api/vehicles/:vehicleId/notes", async (req, res) => {
    try {
      const notes = await storage.getBuildNotes(req.params.vehicleId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching build notes:", error);
      res.status(500).json({ error: "Failed to fetch build notes" });
    }
  });

  app.put("/api/vehicles/:vehicleId/notes", async (req, res) => {
    try {
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
