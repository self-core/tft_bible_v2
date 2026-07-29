import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";
import {
  verifyWebhookSignature,
  handlePullRequestOpened,
  handlePushToMain,
  routeWebhookEvent,
} from "./webhooks";

function createSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload, "utf8");
  return `sha256=${hmac.digest("hex")}`;
}

describe("verifyWebhookSignature", () => {
  it("passes with valid signature", () => {
    const payload = '{"test": true}';
    const secret = "my-secret";
    const signature = createSignature(payload, secret);
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it("fails with invalid signature", () => {
    const payload = '{"test": true}';
    const secret = "my-secret";
    expect(verifyWebhookSignature(payload, "sha256=invalid", secret)).toBe(false);
  });

  it("fails with wrong secret", () => {
    const payload = '{"test": true}';
    const signature = createSignature(payload, "correct-secret");
    expect(verifyWebhookSignature(payload, signature, "wrong-secret")).toBe(false);
  });

  it("fails when signature length differs", () => {
    const payload = '{"test": true}';
    const secret = "my-secret";
    expect(verifyWebhookSignature(payload, "sha256=short", secret)).toBe(false);
  });
});

describe("handlePullRequestOpened", () => {
  it("logs PR number", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const payload = { pull_request: { number: 42 } };
    handlePullRequestOpened(payload, {} as any, "owner", "repo");
    expect(spy).toHaveBeenCalledWith("PR #42 opened");
    spy.mockRestore();
  });
});

describe("handlePushToMain", () => {
  it("logs push to main", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    handlePushToMain({}, {} as any, "owner", "repo");
    expect(spy).toHaveBeenCalledWith("Push to main");
    spy.mockRestore();
  });
});

describe("routeWebhookEvent", () => {
  it("routes pull_request opened to handlePullRequestOpened", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const payload = { action: "opened", pull_request: { number: 10 } };
    await routeWebhookEvent("pull_request", payload, {} as any, "owner", "repo");
    expect(spy).toHaveBeenCalledWith("PR #10 opened");
    spy.mockRestore();
  });

  it("routes pull_request synchronize to handlePullRequestOpened", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const payload = { action: "synchronize", pull_request: { number: 15 } };
    await routeWebhookEvent("pull_request", payload, {} as any, "owner", "repo");
    expect(spy).toHaveBeenCalledWith("PR #15 opened");
    spy.mockRestore();
  });

  it("routes push to handlePushToMain", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await routeWebhookEvent("push", {}, {} as any, "owner", "repo");
    expect(spy).toHaveBeenCalledWith("Push to main");
    spy.mockRestore();
  });

  it("does nothing for unknown events", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await routeWebhookEvent("issues", { action: "opened" }, {} as any, "owner", "repo");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does nothing for pull_request closed", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await routeWebhookEvent("pull_request", { action: "closed" }, {} as any, "owner", "repo");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
