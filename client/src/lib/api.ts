import type { Vehicle, InsertVehicle, ServiceRecord, InsertServiceRecord, BuildNote } from "@shared/schema";

const API_BASE = "/api";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture: string | null;
};

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch(`${API_BASE}/auth/me`);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, { method: "POST" });
}

export async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch(`${API_BASE}/vehicles`);
  if (!res.ok) throw new Error("Failed to fetch vehicles");
  return res.json();
}

export async function fetchVehicle(id: string): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles/${id}`);
  if (!res.ok) throw new Error("Failed to fetch vehicle");
  return res.json();
}

export async function createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vehicle),
  });
  if (!res.ok) throw new Error("Failed to create vehicle");
  return res.json();
}

export async function updateVehicle(id: string, updates: Partial<InsertVehicle>): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update vehicle");
  return res.json();
}

export async function deleteVehicle(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/vehicles/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete vehicle");
}

export async function fetchServiceRecords(vehicleId: string): Promise<ServiceRecord[]> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/services`);
  if (!res.ok) throw new Error("Failed to fetch service records");
  return res.json();
}

export async function createServiceRecord(vehicleId: string, record: Omit<InsertServiceRecord, "vehicleId">): Promise<ServiceRecord> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error("Failed to create service record");
  return res.json();
}

export async function fetchBuildNotes(vehicleId: string): Promise<BuildNote[]> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/notes`);
  if (!res.ok) throw new Error("Failed to fetch build notes");
  return res.json();
}

export async function upsertBuildNotes(vehicleId: string, notes: Array<{ key: string; value: string }>): Promise<BuildNote[]> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/notes`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notes),
  });
  if (!res.ok) throw new Error("Failed to upsert build notes");
  return res.json();
}
