import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  googleId: text("google_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  picture: text("picture"),
  alias: text("alias"),
  avatarColor: text("avatar_color"),
  currency: text("currency").notNull().default("INR"),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;

export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  nickname: text("nickname").notNull(),
  model: text("model").notNull(),
  year: text("year").notNull(),
  odoKm: integer("odo_km").notNull().default(0),
  lastServiceKm: integer("last_service_km").notNull().default(0),
  nextServiceKm: integer("next_service_km").notNull().default(0),
  health: integer("health").notNull().default(100),
  location: text("location").notNull().default(""),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  status: text("status").notNull().default("owned"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export const serviceRecords = pgTable("service_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  date: text("date").notNull(),
  odometerKm: integer("odometer_km").notNull(),
  amount: integer("amount").notNull().default(0),
  workshop: text("workshop").notNull(),
  items: text("items").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertServiceRecordSchema = createInsertSchema(serviceRecords).omit({
  id: true,
  createdAt: true,
});

export type InsertServiceRecord = z.infer<typeof insertServiceRecordSchema>;
export type ServiceRecord = typeof serviceRecords.$inferSelect;

export const buildNotes = pgTable("build_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBuildNoteSchema = createInsertSchema(buildNotes).omit({
  id: true,
  createdAt: true,
});

export type InsertBuildNote = z.infer<typeof insertBuildNoteSchema>;
export type BuildNote = typeof buildNotes.$inferSelect;

export const vehicleShares = pgTable("vehicle_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VehicleShare = typeof vehicleShares.$inferSelect;

export const vehicleDocuments = pgTable("vehicle_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "insurance" | "puc"
  label: text("label"),
  expiryDate: text("expiry_date").notNull(), // stored as ISO date string
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVehicleDocumentSchema = createInsertSchema(vehicleDocuments).omit({
  id: true,
  createdAt: true,
});

export type InsertVehicleDocument = z.infer<typeof insertVehicleDocumentSchema>;
export type VehicleDocument = typeof vehicleDocuments.$inferSelect;
