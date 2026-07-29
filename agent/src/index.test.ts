import { describe, it, expect, beforeEach, afterEach } from "vitest";
import http from "http";
import express from "express";
import crypto from "crypto";
import { createApp } from "./index";

const REQUIRED_VARS = {
  GITHUB_APP_ID: "test-app-id",
  GITHUB_APP_PRIVATE_KEY: "test-private-key",
  GITHUB_APP_WEBHOOK_SECRET: "test-webhook-secret",
  GITHUB_OWNER: "test-owner",
  GITHUB_REPO: "test-repo",
};

function setEnv(vars: Record<string, string>): void {
  for (const [key, value] of Object.entries(vars)) {
    process.env[key] = value;
  }
}

function unsetEnv(vars: Record<string, string>): void {
  for (const key of Object.keys(vars)) {
    delete process.env[key];
  }
}

function createSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload, "utf8");
  return `sha256=${hmac.digest("hex")}`;
}

function request(
  app: express.Express,
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app).listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("Could not get server address"));
        return;
      }
      const port = addr.port;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...extraHeaders,
      };
      const options: http.RequestOptions = {
        hostname: "localhost",
        port,
        path,
        method,
        headers,
      };
      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk: string) => {
          data += chunk;
        });
        res.on("end", () => {
          server.close();
          resolve({ statusCode: res.statusCode ?? 0, body: data });
        });
      });
      req.on("error", (err) => {
        server.close();
        reject(err);
      });
      if (body !== undefined) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  });
}

describe("index", () => {
  beforeEach(() => {
    setEnv(REQUIRED_VARS);
  });

  afterEach(() => {
    unsetEnv(REQUIRED_VARS);
  });

  it("GET /health returns 200 with status ok", async () => {
    const app = createApp();
    const res = await request(app, "GET", "/health");
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.status).toBe("ok");
    expect(parsed.timestamp).toBeDefined();
  });

  it("POST /webhook returns 401 without signature", async () => {
    const app = createApp();
    const res = await request(app, "POST", "/webhook", {});
    expect(res.statusCode).toBe(401);
    const parsed = JSON.parse(res.body);
    expect(parsed.message).toBe("missing signature");
  });

  it("POST /webhook returns 401 with invalid signature", async () => {
    const app = createApp();
    const res = await request(
      app,
      "POST",
      "/webhook",
      {},
      { "x-hub-signature-256": "sha256=invalid", "x-github-event": "push" }
    );
    expect(res.statusCode).toBe(401);
    const parsed = JSON.parse(res.body);
    expect(parsed.message).toBe("invalid signature");
  });

  it("POST /webhook returns 400 with valid signature but missing installation id", async () => {
    const app = createApp();
    const body = {};
    const rawBody = JSON.stringify(body);
    const signature = createSignature(
      rawBody,
      REQUIRED_VARS.GITHUB_APP_WEBHOOK_SECRET
    );
    const res = await request(
      app,
      "POST",
      "/webhook",
      body,
      {
        "x-hub-signature-256": signature,
        "x-github-event": "push",
      }
    );
    expect(res.statusCode).toBe(400);
    const parsed = JSON.parse(res.body);
    expect(parsed.message).toBe("missing installation id");
  });
});
