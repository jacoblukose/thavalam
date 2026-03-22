import {
  type Vehicle,
  type InsertVehicle,
  type ServiceRecord,
  type InsertServiceRecord,
  type BuildNote,
  type VehicleDocument,
  type InsertVehicleDocument,
  type VehicleShare,
  type FuelLog,
  type InsertFuelLog,
  type Notification,
  vehicles,
  serviceRecords,
  buildNotes,
  vehicleDocuments,
  vehicleShares,
  fuelLogs,
  users,
  notifications,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, inArray } from "drizzle-orm";

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
  updateServiceRecord(id: string, vehicleId: string, updates: Partial<InsertServiceRecord>): Promise<ServiceRecord | undefined>;
  deleteServiceRecord(id: string, vehicleId: string): Promise<boolean>;

  // Build Notes
  getBuildNotes(vehicleId: string): Promise<BuildNote[]>;
  upsertBuildNotes(vehicleId: string, notes: Array<{ key: string; value: string; date?: string | null; cost?: number | null; notes?: string | null }>): Promise<BuildNote[]>;

  // Documents
  getDocuments(vehicleId: string): Promise<VehicleDocument[]>;
  getDocumentsByUser(userId: string): Promise<VehicleDocument[]>;
  createDocument(doc: InsertVehicleDocument): Promise<VehicleDocument>;
  deleteDocument(id: string): Promise<void>;

  // Fuel Logs
  getFuelLogs(vehicleId: string): Promise<FuelLog[]>;
  createFuelLog(log: InsertFuelLog): Promise<FuelLog>;
  updateFuelLog(id: string, vehicleId: string, updates: Partial<InsertFuelLog>): Promise<FuelLog | undefined>;
  deleteFuelLog(id: string, vehicleId: string): Promise<boolean>;

  // Sharing
  canAccessVehicle(vehicleId: string, userId: string): Promise<boolean>;
  isVehicleOwner(vehicleId: string, userId: string): Promise<boolean>;
  getShares(vehicleId: string): Promise<Array<VehicleShare & { email: string; name: string; picture: string | null }>>;
  shareVehicle(vehicleId: string, targetUserId: string): Promise<VehicleShare>;
  unshareVehicle(vehicleId: string, targetUserId: string): Promise<void>;
  findUserByEmail(email: string): Promise<{ id: string; email: string; name: string; picture: string | null } | undefined>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(userId: string, type: string, title: string, message: string, metadata?: string): Promise<Notification>;
  markNotificationRead(id: string, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  clearNotifications(userId: string): Promise<void>;
}

export class DbStorage implements IStorage {
  async getVehicles(userId: string): Promise<Vehicle[]> {
    // Get IDs of vehicles shared with this user
    const shared = await db
      .select({ vehicleId: vehicleShares.vehicleId })
      .from(vehicleShares)
      .where(eq(vehicleShares.userId, userId));
    const sharedIds = shared.map((s) => s.vehicleId);

    if (sharedIds.length === 0) {
      return await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.userId, userId))
        .orderBy(desc(vehicles.createdAt));
    }

    return await db
      .select()
      .from(vehicles)
      .where(or(eq(vehicles.userId, userId), inArray(vehicles.id, sharedIds)))
      .orderBy(desc(vehicles.createdAt));
  }

  async getVehicle(id: string, userId: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id));
    if (!vehicle) return undefined;
    if (vehicle.userId === userId) return vehicle;
    // Check if shared
    const [share] = await db
      .select()
      .from(vehicleShares)
      .where(and(eq(vehicleShares.vehicleId, id), eq(vehicleShares.userId, userId)));
    return share ? vehicle : undefined;
  }

  async createVehicle(userId: string, insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db
      .insert(vehicles)
      .values({ ...insertVehicle, userId })
      .returning();
    return vehicle;
  }

  async updateVehicle(id: string, userId: string, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    // Verify access (owner or shared)
    const canAccess = await this.canAccessVehicle(id, userId);
    if (!canAccess) return undefined;

    const [vehicle] = await db
      .update(vehicles)
      .set(updates)
      .where(eq(vehicles.id, id))
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

  async updateServiceRecord(id: string, vehicleId: string, updates: Partial<InsertServiceRecord>): Promise<ServiceRecord | undefined> {
    const [record] = await db
      .update(serviceRecords)
      .set(updates)
      .where(and(eq(serviceRecords.id, id), eq(serviceRecords.vehicleId, vehicleId)))
      .returning();
    return record;
  }

  async deleteServiceRecord(id: string, vehicleId: string): Promise<boolean> {
    const result = await db
      .delete(serviceRecords)
      .where(and(eq(serviceRecords.id, id), eq(serviceRecords.vehicleId, vehicleId)))
      .returning();
    return result.length > 0;
  }

  async getBuildNotes(vehicleId: string): Promise<BuildNote[]> {
    return await db.select().from(buildNotes).where(eq(buildNotes.vehicleId, vehicleId));
  }

  async upsertBuildNotes(
    vehicleId: string,
    notes: Array<{ key: string; value: string; date?: string | null; cost?: number | null; notes?: string | null }>,
  ): Promise<BuildNote[]> {
    await db.delete(buildNotes).where(eq(buildNotes.vehicleId, vehicleId));

    if (notes.length === 0) {
      return [];
    }

    const insertData = notes.map((note) => ({
      vehicleId,
      key: note.key,
      value: note.value,
      date: note.date ?? null,
      cost: note.cost ?? null,
      notes: note.notes ?? null,
    }));

    return await db.insert(buildNotes).values(insertData).returning();
  }
  async getDocuments(vehicleId: string): Promise<VehicleDocument[]> {
    return await db
      .select()
      .from(vehicleDocuments)
      .where(eq(vehicleDocuments.vehicleId, vehicleId))
      .orderBy(desc(vehicleDocuments.createdAt));
  }

  async getDocumentsByUser(userId: string): Promise<VehicleDocument[]> {
    const allVehicles = await this.getVehicles(userId);
    if (allVehicles.length === 0) return [];

    const allDocs: VehicleDocument[] = [];
    for (const v of allVehicles) {
      const docs = await db
        .select()
        .from(vehicleDocuments)
        .where(eq(vehicleDocuments.vehicleId, v.id));
      allDocs.push(...docs);
    }
    return allDocs;
  }

  async createDocument(doc: InsertVehicleDocument): Promise<VehicleDocument> {
    const [document] = await db.insert(vehicleDocuments).values(doc).returning();
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(vehicleDocuments).where(eq(vehicleDocuments.id, id));
  }

  async getFuelLogs(vehicleId: string): Promise<FuelLog[]> {
    return await db
      .select()
      .from(fuelLogs)
      .where(eq(fuelLogs.vehicleId, vehicleId))
      .orderBy(desc(fuelLogs.createdAt));
  }

  async createFuelLog(log: InsertFuelLog): Promise<FuelLog> {
    const [fuelLog] = await db.insert(fuelLogs).values(log).returning();
    return fuelLog;
  }

  async updateFuelLog(id: string, vehicleId: string, updates: Partial<InsertFuelLog>): Promise<FuelLog | undefined> {
    const [log] = await db
      .update(fuelLogs)
      .set(updates)
      .where(and(eq(fuelLogs.id, id), eq(fuelLogs.vehicleId, vehicleId)))
      .returning();
    return log;
  }

  async deleteFuelLog(id: string, vehicleId: string): Promise<boolean> {
    const result = await db
      .delete(fuelLogs)
      .where(and(eq(fuelLogs.id, id), eq(fuelLogs.vehicleId, vehicleId)))
      .returning();
    return result.length > 0;
  }

  async canAccessVehicle(vehicleId: string, userId: string): Promise<boolean> {
    const v = await this.getVehicle(vehicleId, userId);
    return !!v;
  }

  async isVehicleOwner(vehicleId: string, userId: string): Promise<boolean> {
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)));
    return !!vehicle;
  }

  async getShares(vehicleId: string): Promise<Array<VehicleShare & { email: string; name: string; picture: string | null }>> {
    const shares = await db
      .select()
      .from(vehicleShares)
      .where(eq(vehicleShares.vehicleId, vehicleId));

    const result = [];
    for (const share of shares) {
      const [user] = await db.select().from(users).where(eq(users.id, share.userId));
      if (user) {
        result.push({ ...share, email: user.email, name: user.name, picture: user.picture });
      }
    }
    return result;
  }

  async shareVehicle(vehicleId: string, targetUserId: string): Promise<VehicleShare> {
    // Check if already shared
    const [existing] = await db
      .select()
      .from(vehicleShares)
      .where(and(eq(vehicleShares.vehicleId, vehicleId), eq(vehicleShares.userId, targetUserId)));
    if (existing) return existing;

    const [share] = await db.insert(vehicleShares).values({ vehicleId, userId: targetUserId }).returning();
    return share;
  }

  async unshareVehicle(vehicleId: string, targetUserId: string): Promise<void> {
    await db
      .delete(vehicleShares)
      .where(and(eq(vehicleShares.vehicleId, vehicleId), eq(vehicleShares.userId, targetUserId)));
  }

  async findUserByEmail(email: string): Promise<{ id: string; email: string; name: string; picture: string | null } | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) return undefined;
    return { id: user.id, email: user.email, name: user.name, picture: user.picture };
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(userId: string, type: string, title: string, message: string, metadata?: string): Promise<Notification> {
    const [notif] = await db.insert(notifications).values({ userId, type, title, message, metadata: metadata ?? null }).returning();
    return notif;
  }

  async markNotificationRead(id: string, userId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }

  async clearNotifications(userId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.userId, userId));
  }

  async getUserDataExport(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return null;

    const ownedVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, userId));
    const vehicleIds = ownedVehicles.map((v) => v.id);

    const allServiceRecords = vehicleIds.length > 0
      ? await db.select().from(serviceRecords).where(inArray(serviceRecords.vehicleId, vehicleIds))
      : [];
    const allBuildNotes = vehicleIds.length > 0
      ? await db.select().from(buildNotes).where(inArray(buildNotes.vehicleId, vehicleIds))
      : [];
    const allDocuments = vehicleIds.length > 0
      ? await db.select().from(vehicleDocuments).where(inArray(vehicleDocuments.vehicleId, vehicleIds))
      : [];
    const allFuelLogs = vehicleIds.length > 0
      ? await db.select().from(fuelLogs).where(inArray(fuelLogs.vehicleId, vehicleIds))
      : [];
    const allShares = vehicleIds.length > 0
      ? await db.select().from(vehicleShares).where(inArray(vehicleShares.vehicleId, vehicleIds))
      : [];
    const allNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId));

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        alias: user.alias,
        avatarColor: user.avatarColor,
        currency: user.currency,
        timezone: user.timezone,
        createdAt: user.createdAt,
      },
      vehicles: ownedVehicles,
      serviceRecords: allServiceRecords,
      buildNotes: allBuildNotes,
      documents: allDocuments,
      fuelLogs: allFuelLogs,
      vehicleShares: allShares,
      notifications: allNotifications,
      exportedAt: new Date().toISOString(),
    };
  }

  async deleteUserAccount(userId: string): Promise<void> {
    const ownedVehicles = await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.userId, userId));
    const vehicleIds = ownedVehicles.map((v) => v.id);

    if (vehicleIds.length > 0) {
      await db.delete(serviceRecords).where(inArray(serviceRecords.vehicleId, vehicleIds));
      await db.delete(buildNotes).where(inArray(buildNotes.vehicleId, vehicleIds));
      await db.delete(vehicleDocuments).where(inArray(vehicleDocuments.vehicleId, vehicleIds));
      await db.delete(fuelLogs).where(inArray(fuelLogs.vehicleId, vehicleIds));
      await db.delete(vehicleShares).where(inArray(vehicleShares.vehicleId, vehicleIds));
    }

    // Remove shares where this user was a shared-to user
    await db.delete(vehicleShares).where(eq(vehicleShares.userId, userId));
    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(vehicles).where(eq(vehicles.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  }
}

export const storage = new DbStorage();
