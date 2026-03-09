import type { Vehicle, InsertVehicle, ServiceRecord, InsertServiceRecord, BuildNote, VehicleDocument, VehicleShare, FuelLog, InsertFuelLog } from "@shared/schema";

const API_BASE = "/api";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  alias: string | null;
  avatarColor: string | null;
  currency: string;
  timezone: string;
};

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch(`${API_BASE}/auth/me`);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export async function updateProfile(updates: { currency?: string; timezone?: string }): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update profile");
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

export async function updateServiceRecord(
  vehicleId: string,
  serviceId: string,
  updates: Partial<Omit<InsertServiceRecord, "vehicleId">>,
): Promise<ServiceRecord> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/services/${serviceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update service record");
  return res.json();
}

export async function deleteServiceRecord(vehicleId: string, serviceId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/services/${serviceId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete service record");
}

export async function fetchBuildNotes(vehicleId: string): Promise<BuildNote[]> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/notes`);
  if (!res.ok) throw new Error("Failed to fetch build notes");
  return res.json();
}

export async function upsertBuildNotes(vehicleId: string, notes: Array<{ key: string; value: string; date?: string | null; cost?: number | null; notes?: string | null }>): Promise<BuildNote[]> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/notes`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notes),
  });
  if (!res.ok) throw new Error("Failed to upsert build notes");
  return res.json();
}

export async function fetchDocuments(vehicleId: string): Promise<VehicleDocument[]> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function fetchAllDocuments(): Promise<VehicleDocument[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function createDocument(
  vehicleId: string,
  data: { type: string; label?: string; expiryDate: string; notes?: string; file?: File },
): Promise<VehicleDocument> {
  const formData = new FormData();
  formData.append("type", data.type);
  formData.append("expiryDate", data.expiryDate);
  if (data.label) formData.append("label", data.label);
  if (data.notes) formData.append("notes", data.notes);
  if (data.file) formData.append("file", data.file);

  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/documents`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to create document");
  return res.json();
}

export async function deleteDocument(vehicleId: string, docId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/documents/${docId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete document");
}

export type ShareInfo = VehicleShare & { email: string; name: string; picture: string | null };

export async function fetchShares(vehicleId: string): Promise<ShareInfo[]> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/shares`);
  if (res.status === 403) return []; // not the owner
  if (!res.ok) throw new Error("Failed to fetch shares");
  return res.json();
}

export async function shareVehicle(vehicleId: string, email: string): Promise<ShareInfo> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/shares`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to share vehicle");
  }
  return res.json();
}

export async function unshareVehicle(vehicleId: string, userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/shares/${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove share");
}

export async function fetchFuelLogs(vehicleId: string): Promise<FuelLog[]> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/fuel-logs`);
  if (!res.ok) throw new Error("Failed to fetch fuel logs");
  return res.json();
}

export async function createFuelLog(vehicleId: string, log: Omit<InsertFuelLog, "vehicleId">): Promise<FuelLog> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/fuel-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(log),
  });
  if (!res.ok) throw new Error("Failed to create fuel log");
  return res.json();
}

export async function updateFuelLog(
  vehicleId: string,
  logId: string,
  updates: Partial<Omit<InsertFuelLog, "vehicleId">>,
): Promise<FuelLog> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/fuel-logs/${logId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update fuel log");
  return res.json();
}

export async function deleteFuelLog(vehicleId: string, logId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/fuel-logs/${logId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete fuel log");
}
