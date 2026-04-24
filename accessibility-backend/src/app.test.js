import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import app from "./app.js";

describe("app", () => {
  it("returns health status", async () => {
    const response = await request(app).get("/health").expect(200);

    assert.equal(response.body.status, "ok");
    assert.equal(response.body.service, "accessibility-tracker-api");
  });

  it("protects authenticated routes", async () => {
    const response = await request(app).get("/api/scans").expect(401);

    assert.equal(response.body.message, "Authentication token is required");
  });
});
