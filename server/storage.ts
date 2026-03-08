import {
  type Vehicle,
  type InsertVehicle,
  type ServiceRecord,
  type InsertServiceRecord,
  type BuildNote,
  type InsertBuildNote,
  vehicles,
  serviceRecords,
  buildNotes,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Vehicles
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<void>;

  // Service Records
  getServiceRecords(vehicleId: string): Promise<ServiceRecord[]>;
  createServiceRecord(record: InsertServiceRecord): Promise<ServiceRecord>;

  // Build Notes
  getBuildNotes(vehicleId: string): Promise<BuildNote[]>;
  upsertBuildNotes(vehicleId: string, notes: Array<{ key: string; value: string }>): Promise<BuildNote[]>;
}

export class DbStorage implements IStorage {
  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db.insert(vehicles).values(insertVehicle).returning();
    return vehicle;
  }

  async updateVehicle(id: string, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [vehicle] = await db.update(vehicles).set(updates).where(eq(vehicles.id, id)).returning();
    return vehicle;
  }

  async deleteVehicle(id: string): Promise<void> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  async getServiceRecords(vehicleId: string): Promise<ServiceRecord[]> {
    return await db
      .select()
      .from(serviceRecords)
      .where(eq(serviceRecords.vehicleId, vehicleId))
      .orderBy(desc(serviceRecords.createdAt));
  }

  async createServiceRecord(record: InsertServiceRecord): Promise<ServiceRecord> {
    const [serviceRecord] = await db.insert(serviceRecords).values(record).returning();
    return serviceRecord;
  }

  async getBuildNotes(vehicleId: string): Promise<BuildNote[]> {
    return await db.select().from(buildNotes).where(eq(buildNotes.vehicleId, vehicleId));
  }

  async upsertBuildNotes(
    vehicleId: string,
    notes: Array<{ key: string; value: string }>,
  ): Promise<BuildNote[]> {
    await db.delete(buildNotes).where(eq(buildNotes.vehicleId, vehicleId));
    
    if (notes.length === 0) {
      return [];
    }

    const insertData = notes.map((note) => ({
      vehicleId,
      key: note.key,
      value: note.value,
    }));

    return await db.insert(buildNotes).values(insertData).returning();
  }
}

export const storage = new DbStorage();
