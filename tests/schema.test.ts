import { describe, it, expect } from "vitest";
import { insertVehicleSchema, insertServiceRecordSchema, insertVehicleDocumentSchema } from "../shared/schema";

describe("insertVehicleSchema", () => {
  it("accepts a minimal vehicle with only required fields", () => {
    const result = insertVehicleSchema.safeParse({
      nickname: "My Bike",
      model: "Honda CB500X",
      year: "2021",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a full vehicle with all fields", () => {
    const result = insertVehicleSchema.safeParse({
      nickname: "My Bike",
      model: "Honda CB500X",
      year: "2021",
      odoKm: 5000,
      lastServiceKm: 3000,
      nextServiceKm: 8000,
      health: 95,
      location: "Bengaluru",
      tags: ["Motorcycle", "Touring"],
      status: "owned",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when nickname is missing", () => {
    const result = insertVehicleSchema.safeParse({
      model: "Honda CB500X",
      year: "2021",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when model is missing", () => {
    const result = insertVehicleSchema.safeParse({
      nickname: "My Bike",
      year: "2021",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when year is missing", () => {
    const result = insertVehicleSchema.safeParse({
      nickname: "My Bike",
      model: "Honda CB500X",
    });
    expect(result.success).toBe(false);
  });

  it("allows partial updates via .partial()", () => {
    const result = insertVehicleSchema.partial().safeParse({
      odoKm: 12000,
      status: "sold",
    });
    expect(result.success).toBe(true);
  });
});

describe("insertServiceRecordSchema", () => {
  it("accepts a valid service record", () => {
    const result = insertServiceRecordSchema.safeParse({
      vehicleId: "some-uuid",
      title: "Oil change",
      date: "2025-01-15",
      odometerKm: 5000,
      amount: 2500,
      workshop: "Honda Service",
      items: ["Engine oil", "Oil filter"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects when title is missing", () => {
    const result = insertServiceRecordSchema.safeParse({
      vehicleId: "some-uuid",
      date: "2025-01-15",
      odometerKm: 5000,
      workshop: "Honda Service",
    });
    expect(result.success).toBe(false);
  });
});

describe("insertVehicleDocumentSchema", () => {
  it("accepts a valid document", () => {
    const result = insertVehicleDocumentSchema.safeParse({
      vehicleId: "some-uuid",
      type: "insurance",
      expiryDate: "2026-06-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when type is missing", () => {
    const result = insertVehicleDocumentSchema.safeParse({
      vehicleId: "some-uuid",
      expiryDate: "2026-06-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when expiryDate is missing", () => {
    const result = insertVehicleDocumentSchema.safeParse({
      vehicleId: "some-uuid",
      type: "puc",
    });
    expect(result.success).toBe(false);
  });
});
