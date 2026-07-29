import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "./config";

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

describe("config", () => {
  beforeEach(() => {
    setEnv(REQUIRED_VARS);
  });

  afterEach(() => {
    unsetEnv(REQUIRED_VARS);
  });

  it("loads config successfully when all env vars are set", () => {
    const cfg = loadConfig();
    expect(cfg.GITHUB_APP_ID).toBe("test-app-id");
    expect(cfg.GITHUB_OWNER).toBe("test-owner");
    expect(cfg.GITHUB_REPO).toBe("test-repo");
  });

  it("throws when GITHUB_APP_ID is missing", () => {
    delete process.env.GITHUB_APP_ID;
    expect(() => loadConfig()).toThrow(
      "Missing required environment variables: GITHUB_APP_ID"
    );
  });

  it("throws when all required vars are missing", () => {
    unsetEnv(REQUIRED_VARS);
    expect(() => loadConfig()).toThrow("Missing required environment variables");
  });

  it("defaults PORT to 3000", () => {
    delete process.env.PORT;
    const cfg = loadConfig();
    expect(cfg.PORT).toBe(3000);
  });

  it("reads PORT from env", () => {
    process.env.PORT = "4000";
    const cfg = loadConfig();
    expect(cfg.PORT).toBe(4000);
  });

  it("defaults LLM_PROVIDER to openai", () => {
    delete process.env.LLM_PROVIDER;
    const cfg = loadConfig();
    expect(cfg.LLM_PROVIDER).toBe("openai");
  });

  it("reads LLM_PROVIDER from env", () => {
    process.env.LLM_PROVIDER = "claude";
    const cfg = loadConfig();
    expect(cfg.LLM_PROVIDER).toBe("claude");
  });

  it("defaults OLLAMA_BASE_URL to http://localhost:11434", () => {
    delete process.env.OLLAMA_BASE_URL;
    const cfg = loadConfig();
    expect(cfg.OLLAMA_BASE_URL).toBe("http://localhost:11434");
  });

  it("defaults OLLAMA_MODEL to llama3", () => {
    delete process.env.OLLAMA_MODEL;
    const cfg = loadConfig();
    expect(cfg.OLLAMA_MODEL).toBe("llama3");
  });
});
