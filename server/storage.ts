import {
  type Vehicle,
  type InsertVehicle,
  type ServiceRecord,
  type InsertServiceRecord,
  type BuildNote,
  vehicles,
  serviceRecords,
  buildNotes,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Vehicles
  getVehicles(userId: string): Promise<Vehicle[]>;
  getVehicle(id: string, userId: string): Promise<Vehicle | undefined>;
  createVehicle(userId: string, vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, userId: string, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: string, userId: string): Promise<void>;

  // Service Records
  getServiceRecords(vehicleId: string): Promise<ServiceRecord[]>;
  createServiceRecord(record: InsertServiceRecord): Promise<ServiceRecord>;

  // Build Notes
  getBuildNotes(vehicleId: string): Promise<BuildNote[]>;
  upsertBuildNotes(vehicleId: string, notes: Array<{ key: string; value: string }>): Promise<BuildNote[]>;
}

export class DbStorage implements IStorage {
  async getVehicles(userId: string): Promise<Vehicle[]> {
    return await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.userId, userId))
      .orderBy(desc(vehicles.createdAt));
  }

  async getVehicle(id: string, userId: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)));
    return vehicle;
  }

  async createVehicle(userId: string, insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db
      .insert(vehicles)
      .values({ ...insertVehicle, userId })
      .returning();
    return vehicle;
  }

  async updateVehicle(id: string, userId: string, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .update(vehicles)
      .set(updates)
      .where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)))
      .returning();
    return vehicle;
  }

  async deleteVehicle(id: string, userId: string): Promise<void> {
    await db
      .delete(vehicles)
      .where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)));
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
