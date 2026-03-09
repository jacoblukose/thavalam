import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import { createServer } from "http";

vi.mock("../server/storage", () => ({
  storage: {
    getVehicles: vi.fn(),
    getVehicle: vi.fn(),
    createVehicle: vi.fn(),
    updateVehicle: vi.fn(),
    deleteVehicle: vi.fn(),
    isVehicleOwner: vi.fn(),
    getServiceRecords: vi.fn(),
    createServiceRecord: vi.fn(),
    updateServiceRecord: vi.fn(),
    deleteServiceRecord: vi.fn(),
    getBuildNotes: vi.fn(),
    upsertBuildNotes: vi.fn(),
    getDocuments: vi.fn(),
    getDocumentsByUser: vi.fn(),
    createDocument: vi.fn(),
    deleteDocument: vi.fn(),
    canAccessVehicle: vi.fn(),
    getShares: vi.fn(),
    shareVehicle: vi.fn(),
    unshareVehicle: vi.fn(),
    findUserByEmail: vi.fn(),
  },
}));

vi.mock("../server/supabase-storage", () => ({
  uploadToSupabase: vi.fn(),
  deleteFromSupabase: vi.fn(),
}));

import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";

const mockStorage = storage as unknown as Record<string, ReturnType<typeof vi.fn>>;
const testUser = { id: "user-1", email: "test@test.com", name: "Test" };

function buildApp(authenticated = true) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    if (authenticated) {
      req.isAuthenticated = () => true;
      req.user = testUser;
    } else {
      req.isAuthenticated = () => false;
      req.user = null;
    }
    next();
  });
  return app;
}

async function request(app: express.Express, method: string, url: string, body?: any) {
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);

  return new Promise<{ status: number; body: any }>((resolve) => {
    httpServer.listen(0, () => {
      const addr = httpServer.address() as any;
      const options: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (body) options.body = JSON.stringify(body);

      fetch(`http://127.0.0.1:${addr.port}${url}`, options)
        .then(async (res) => {
          const text = await res.text();
          let json;
          try { json = JSON.parse(text); } catch { json = text; }
          httpServer.close();
          resolve({ status: res.status, body: json });
        });
    });
  });
}

describe("Vehicle routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    const app = buildApp(false);
    const res = await request(app, "GET", "/api/vehicles");
    expect(res.status).toBe(401);
  });

  it("GET /api/vehicles returns vehicle list", async () => {
    const vehicles = [
      { id: "v1", nickname: "Bike", model: "Honda", year: "2021" },
    ];
    mockStorage.getVehicles.mockResolvedValue(vehicles);

    const app = buildApp();
    const res = await request(app, "GET", "/api/vehicles");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(vehicles);
    expect(mockStorage.getVehicles).toHaveBeenCalledWith("user-1");
  });

  it("POST /api/vehicles creates a vehicle with valid data", async () => {
    const newVehicle = { id: "v2", nickname: "Car", model: "VW Taigun", year: "2022" };
    mockStorage.createVehicle.mockResolvedValue(newVehicle);

    const app = buildApp();
    const res = await request(app, "POST", "/api/vehicles", {
      nickname: "Car",
      model: "VW Taigun",
      year: "2022",
    });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(newVehicle);
  });

  it("POST /api/vehicles rejects invalid data", async () => {
    const app = buildApp();
    const res = await request(app, "POST", "/api/vehicles", {
      nickname: "Car",
      // missing model and year
    });
    expect(res.status).toBe(400);
  });

  it("PATCH /api/vehicles/:id updates a vehicle", async () => {
    const updated = { id: "v1", nickname: "Updated", model: "Honda", year: "2021" };
    mockStorage.updateVehicle.mockResolvedValue(updated);

    const app = buildApp();
    const res = await request(app, "PATCH", "/api/vehicles/v1", {
      nickname: "Updated",
    });
    expect(res.status).toBe(200);
    expect(res.body.nickname).toBe("Updated");
  });

  it("PATCH /api/vehicles/:id returns 404 for unknown vehicle", async () => {
    mockStorage.updateVehicle.mockResolvedValue(undefined);

    const app = buildApp();
    const res = await request(app, "PATCH", "/api/vehicles/unknown", {
      nickname: "Updated",
    });
    expect(res.status).toBe(404);
  });

  it("DELETE /api/vehicles/:id requires ownership", async () => {
    mockStorage.isVehicleOwner.mockResolvedValue(false);

    const app = buildApp();
    const res = await request(app, "DELETE", "/api/vehicles/v1");
    expect(res.status).toBe(403);
  });

  it("DELETE /api/vehicles/:id succeeds for owner", async () => {
    mockStorage.isVehicleOwner.mockResolvedValue(true);
    mockStorage.deleteVehicle.mockResolvedValue(undefined);

    const app = buildApp();
    const res = await request(app, "DELETE", "/api/vehicles/v1");
    expect(res.status).toBe(204);
  });
});

describe("Service record routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/vehicles/:id/services returns 404 for unknown vehicle", async () => {
    mockStorage.getVehicle.mockResolvedValue(undefined);

    const app = buildApp();
    const res = await request(app, "GET", "/api/vehicles/unknown/services");
    expect(res.status).toBe(404);
  });

  it("GET /api/vehicles/:id/services returns records for valid vehicle", async () => {
    mockStorage.getVehicle.mockResolvedValue({ id: "v1" });
    mockStorage.getServiceRecords.mockResolvedValue([
      { id: "s1", title: "Oil change" },
    ]);

    const app = buildApp();
    const res = await request(app, "GET", "/api/vehicles/v1/services");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("PATCH /api/vehicles/:id/services/:svcId passes vehicleId to storage", async () => {
    mockStorage.getVehicle.mockResolvedValue({ id: "v1" });
    mockStorage.updateServiceRecord.mockResolvedValue({ id: "s1", title: "Updated" });

    const app = buildApp();
    const res = await request(app, "PATCH", "/api/vehicles/v1/services/s1", {
      title: "Updated",
    });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated");
    expect(mockStorage.updateServiceRecord).toHaveBeenCalledWith("s1", "v1", expect.any(Object));
  });

  it("PATCH /api/vehicles/:id/services/:svcId returns 404 for unknown record", async () => {
    mockStorage.getVehicle.mockResolvedValue({ id: "v1" });
    mockStorage.updateServiceRecord.mockResolvedValue(undefined);

    const app = buildApp();
    const res = await request(app, "PATCH", "/api/vehicles/v1/services/unknown", {
      title: "Updated",
    });
    expect(res.status).toBe(404);
  });

  it("DELETE /api/vehicles/:id/services/:svcId passes vehicleId to storage", async () => {
    mockStorage.getVehicle.mockResolvedValue({ id: "v1" });
    mockStorage.deleteServiceRecord.mockResolvedValue(true);

    const app = buildApp();
    const res = await request(app, "DELETE", "/api/vehicles/v1/services/s1");
    expect(res.status).toBe(204);
    expect(mockStorage.deleteServiceRecord).toHaveBeenCalledWith("s1", "v1");
  });

  it("DELETE /api/vehicles/:id/services/:svcId returns 404 when record not in vehicle", async () => {
    mockStorage.getVehicle.mockResolvedValue({ id: "v1" });
    mockStorage.deleteServiceRecord.mockResolvedValue(false);

    const app = buildApp();
    const res = await request(app, "DELETE", "/api/vehicles/v1/services/s-other");
    expect(res.status).toBe(404);
  });

  it("DELETE /api/vehicles/:id/services/:svcId returns 404 for unknown vehicle", async () => {
    mockStorage.getVehicle.mockResolvedValue(undefined);

    const app = buildApp();
    const res = await request(app, "DELETE", "/api/vehicles/v1/services/s1");
    expect(res.status).toBe(404);
  });
});

describe("Build notes routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/vehicles/:id/notes returns 404 for unknown vehicle", async () => {
    mockStorage.getVehicle.mockResolvedValue(undefined);

    const app = buildApp();
    const res = await request(app, "GET", "/api/vehicles/unknown/notes");
    expect(res.status).toBe(404);
  });

  it("GET /api/vehicles/:id/notes returns notes", async () => {
    mockStorage.getVehicle.mockResolvedValue({ id: "v1" });
    mockStorage.getBuildNotes.mockResolvedValue([{ id: "n1", key: "Engine", value: "Stock" }]);

    const app = buildApp();
    const res = await request(app, "GET", "/api/vehicles/v1/notes");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("PUT /api/vehicles/:id/notes rejects non-array body", async () => {
    mockStorage.getVehicle.mockResolvedValue({ id: "v1" });

    const app = buildApp();
    const res = await request(app, "PUT", "/api/vehicles/v1/notes", { key: "Engine" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("array");
  });

  it("PUT /api/vehicles/:id/notes rejects invalid note objects", async () => {
    mockStorage.getVehicle.mockResolvedValue({ id: "v1" });

    const app = buildApp();
    const res = await request(app, "PUT", "/api/vehicles/v1/notes", [
      { key: "", value: "Tuned" }, // key too short
    ]);
    expect(res.status).toBe(400);
  });

  it("PUT /api/vehicles/:id/notes rejects notes with missing fields", async () => {
    mockStorage.getVehicle.mockResolvedValue({ id: "v1" });

    const app = buildApp();
    const res = await request(app, "PUT", "/api/vehicles/v1/notes", [
      { foo: "bar" }, // missing key and value
    ]);
    expect(res.status).toBe(400);
  });

  it("PUT /api/vehicles/:id/notes upserts valid notes", async () => {
    mockStorage.getVehicle.mockResolvedValue({ id: "v1" });
    const notes = [{ key: "Engine", value: "Tuned" }];
    mockStorage.upsertBuildNotes.mockResolvedValue(notes);

    const app = buildApp();
    const res = await request(app, "PUT", "/api/vehicles/v1/notes", notes);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(notes);
  });
});

describe("Document routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/vehicles/:id/documents returns 404 for unknown vehicle", async () => {
    mockStorage.getVehicle.mockResolvedValue(undefined);

    const app = buildApp();
    const res = await request(app, "GET", "/api/vehicles/unknown/documents");
    expect(res.status).toBe(404);
  });

  it("GET /api/vehicles/:id/documents returns docs", async () => {
    mockStorage.getVehicle.mockResolvedValue({ id: "v1" });
    mockStorage.getDocuments.mockResolvedValue([{ id: "d1", type: "insurance" }]);

    const app = buildApp();
    const res = await request(app, "GET", "/api/vehicles/v1/documents");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("GET /api/documents returns 401 for unauthenticated requests", async () => {
    const app = buildApp(false);
    const res = await request(app, "GET", "/api/documents");
    expect(res.status).toBe(401);
  });

  it("GET /api/documents returns all user documents", async () => {
    mockStorage.getDocumentsByUser.mockResolvedValue([
      { id: "d1", type: "puc" },
      { id: "d2", type: "insurance" },
    ]);

    const app = buildApp();
    const res = await request(app, "GET", "/api/documents");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("DELETE /api/vehicles/:id/documents/:docId returns 404 for unknown vehicle", async () => {
    mockStorage.getVehicle.mockResolvedValue(undefined);

    const app = buildApp();
    const res = await request(app, "DELETE", "/api/vehicles/v1/documents/d1");
    expect(res.status).toBe(404);
  });

  it("DELETE /api/vehicles/:id/documents/:docId returns 404 for unknown doc", async () => {
    mockStorage.getVehicle.mockResolvedValue({ id: "v1" });
    mockStorage.getDocuments.mockResolvedValue([]);

    const app = buildApp();
    const res = await request(app, "DELETE", "/api/vehicles/v1/documents/d1");
    expect(res.status).toBe(404);
  });

  it("DELETE /api/vehicles/:id/documents/:docId deletes a doc", async () => {
    mockStorage.getVehicle.mockResolvedValue({ id: "v1" });
    mockStorage.getDocuments.mockResolvedValue([{ id: "d1", type: "puc", fileUrl: null }]);
    mockStorage.deleteDocument.mockResolvedValue(undefined);

    const app = buildApp();
    const res = await request(app, "DELETE", "/api/vehicles/v1/documents/d1");
    expect(res.status).toBe(204);
  });
});

describe("Sharing routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/vehicles/:id/shares returns 403 for non-owner", async () => {
    mockStorage.isVehicleOwner.mockResolvedValue(false);

    const app = buildApp();
    const res = await request(app, "GET", "/api/vehicles/v1/shares");
    expect(res.status).toBe(403);
  });

  it("POST share rejects sharing with yourself", async () => {
    mockStorage.isVehicleOwner.mockResolvedValue(true);
    mockStorage.findUserByEmail.mockResolvedValue(testUser);

    const app = buildApp();
    const res = await request(app, "POST", "/api/vehicles/v1/shares", {
      email: "test@test.com",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("yourself");
  });

  it("POST share succeeds for valid target user", async () => {
    const targetUser = { id: "user-2", email: "other@test.com", name: "Other", picture: null };
    mockStorage.isVehicleOwner.mockResolvedValue(true);
    mockStorage.findUserByEmail.mockResolvedValue(targetUser);
    mockStorage.shareVehicle.mockResolvedValue({ vehicleId: "v1", userId: "user-2" });

    const app = buildApp();
    const res = await request(app, "POST", "/api/vehicles/v1/shares", {
      email: "other@test.com",
    });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe("other@test.com");
  });

  it("POST share returns 404 for unknown email", async () => {
    mockStorage.isVehicleOwner.mockResolvedValue(true);
    mockStorage.findUserByEmail.mockResolvedValue(undefined);

    const app = buildApp();
    const res = await request(app, "POST", "/api/vehicles/v1/shares", {
      email: "nobody@test.com",
    });
    expect(res.status).toBe(404);
  });
});
