import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import {
  verifyWebhookSignature,
  handlePullRequestOpened,
  handlePushToMain,
  routeWebhookEvent,
  WebhookContext,
} from "./webhooks";

const { mockAnalyzeAndComment } = vi.hoisted(() => ({
  mockAnalyzeAndComment: vi.fn().mockResolvedValue(undefined),
}));

const { mockGenerateReleaseNotes, mockCreateRelease } = vi.hoisted(() => ({
  mockGenerateReleaseNotes: vi.fn().mockResolvedValue({
    version: "v1.1.0",
    bump: "minor",
    summary: "Test release",
    changes: [{ type: "feat", message: "test" }],
    body: "## v1.1.0\n\nTest release",
    previousTag: "v1.0.0",
  }),
  mockCreateRelease: vi.fn().mockResolvedValue({
    releaseUrl: "https://github.com/test/releases/tag/v1.1.0",
    tag: "v1.1.0",
  }),
}));

vi.mock("./pr-comment", () => ({
  analyzeAndCommentPullRequest: mockAnalyzeAndComment,
}));

vi.mock("./changelog", () => ({
  generateReleaseNotes: mockGenerateReleaseNotes,
}));

vi.mock("./release", () => ({
  createRelease: mockCreateRelease,
}));

function createSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload, "utf8");
  return `sha256=${hmac.digest("hex")}`;
}

function makeContext(overrides?: Partial<WebhookContext>): WebhookContext {
  return {
    octokit: {} as any,
    llm: { analyzeCommitMessages: vi.fn() },
    owner: "test-owner",
    repo: "test-repo",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

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
  it("calls analyzeAndCommentPullRequest with correct params", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const payload = { pull_request: { number: 42 } };
    const context = makeContext();

    await handlePullRequestOpened(payload, context);

    expect(spy).toHaveBeenCalledWith("PR #42 opened");
    expect(mockAnalyzeAndComment).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      pullNumber: 42,
      octokit: context.octokit,
      llm: context.llm,
    });
    spy.mockRestore();
  });

  it("does nothing when pull_request is missing", async () => {
    await handlePullRequestOpened({}, makeContext());
    expect(mockAnalyzeAndComment).not.toHaveBeenCalled();
  });
});

describe("handlePushToMain", () => {
  it("generates release notes and creates release", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const context = makeContext();

    await handlePushToMain({ ref: "refs/heads/main" }, context);

    expect(spy).toHaveBeenCalledWith("Push to main (ref: refs/heads/main)");
    expect(mockGenerateReleaseNotes).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      octokit: context.octokit,
      llm: context.llm,
    });
    expect(mockCreateRelease).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      octokit: context.octokit,
      notes: expect.objectContaining({ version: "v1.1.0" }),
    });
    expect(spy).toHaveBeenCalledWith(
      "Release created: https://github.com/test/releases/tag/v1.1.0"
    );
    spy.mockRestore();
  });
});

describe("routeWebhookEvent", () => {
  it("routes pull_request opened to handlePullRequestOpened", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const payload = { action: "opened", pull_request: { number: 10 } };
    const context = makeContext();

    await routeWebhookEvent("pull_request", payload, context);

    expect(spy).toHaveBeenCalledWith("PR #10 opened");
    spy.mockRestore();
  });

  it("routes pull_request synchronize to handlePullRequestOpened", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const payload = { action: "synchronize", pull_request: { number: 15 } };
    const context = makeContext();

    await routeWebhookEvent("pull_request", payload, context);

    expect(spy).toHaveBeenCalledWith("PR #15 opened");
    spy.mockRestore();
  });

  it("routes push to handlePushToMain", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const context = makeContext();
    const payload = { ref: "refs/heads/main" };

    await routeWebhookEvent("push", payload, context);

    expect(spy).toHaveBeenCalledWith("Push to main (ref: refs/heads/main)");
    spy.mockRestore();
  });

  it("does nothing for unknown events", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await routeWebhookEvent("issues", { action: "opened" }, makeContext());
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does nothing for pull_request closed", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await routeWebhookEvent("pull_request", { action: "closed" }, makeContext());
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
