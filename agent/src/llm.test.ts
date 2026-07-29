import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLLMProvider, LLMProvider } from "./llm";
import { Config } from "./config";

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    PORT: 3000,
    GITHUB_APP_ID: "test",
    GITHUB_APP_PRIVATE_KEY: "test",
    GITHUB_APP_WEBHOOK_SECRET: "test",
    GITHUB_OWNER: "test",
    GITHUB_REPO: "test",
    LLM_PROVIDER: "openai",
    OPENAI_API_KEY: "sk-test",
    OPENAI_MODEL: "gpt-4o-mini",
    CLAUDE_API_KEY: "sk-ant-test",
    CLAUDE_MODEL: "claude-sonnet-4-20250514",
    OLLAMA_BASE_URL: "http://localhost:11434",
    OLLAMA_MODEL: "llama3",
    ...overrides,
  };
}

const MOCK_RESPONSE: unknown = {
  bump: "minor",
  changes: [
    { type: "feat", message: "add new feature" },
    { type: "fix", message: "fix a bug" },
  ],
  summary: "Minor release with new features and bug fixes",
};

describe("createLLMProvider", () => {
  it("returns OpenAIProvider when LLM_PROVIDER is openai", () => {
    const cfg = makeConfig({ LLM_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" });
    const provider = createLLMProvider(cfg);
    expect(provider.constructor.name).toBe("OpenAIProvider");
  });

  it("returns ClaudeProvider when LLM_PROVIDER is claude", () => {
    const cfg = makeConfig({ LLM_PROVIDER: "claude", CLAUDE_API_KEY: "sk-ant-test" });
    const provider = createLLMProvider(cfg);
    expect(provider.constructor.name).toBe("ClaudeProvider");
  });

  it("returns OllamaProvider when LLM_PROVIDER is ollama", () => {
    const cfg = makeConfig({ LLM_PROVIDER: "ollama" });
    const provider = createLLMProvider(cfg);
    expect(provider.constructor.name).toBe("OllamaProvider");
  });

  it("throws for unknown provider", () => {
    const cfg = makeConfig({ LLM_PROVIDER: "unknown" as never });
    expect(() => createLLMProvider(cfg)).toThrow("Unknown LLM provider");
  });

  it("throws if OPENAI_API_KEY is missing for openai provider", () => {
    const cfg = makeConfig({ LLM_PROVIDER: "openai", OPENAI_API_KEY: undefined });
    expect(() => createLLMProvider(cfg)).toThrow("OPENAI_API_KEY is required");
  });

  it("throws if CLAUDE_API_KEY is missing for claude provider", () => {
    const cfg = makeConfig({ LLM_PROVIDER: "claude", CLAUDE_API_KEY: undefined });
    expect(() => createLLMProvider(cfg)).toThrow("CLAUDE_API_KEY is required");
  });
});

describe("OpenAIProvider", () => {
  let provider: LLMProvider;

  beforeEach(() => {
    vi.resetModules();
  });

  it("analyzes commit messages and returns structured result", async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [
        {
          message: { content: JSON.stringify(MOCK_RESPONSE) },
        },
      ],
    });

    vi.doMock("openai", () => ({
      default: class {
        constructor() {
          this.chat = {
            completions: { create: mockCreate },
          };
        }
        chat: { completions: { create: typeof mockCreate } };
      },
    }));

    const { OpenAIProvider } = await import("./llm-openai");
    provider = new OpenAIProvider("sk-test", "gpt-4o-mini");

    const result = await provider.analyzeCommitMessages(["add new feature", "fix a bug"]);
    expect(result.bump).toBe("minor");
    expect(result.changes).toHaveLength(2);
    expect(result.changes[0].type).toBe("feat");
    expect(result.summary).toBe("Minor release with new features and bug fixes");
  });

  it("throws on empty response", async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    vi.doMock("openai", () => ({
      default: class {
        constructor() {
          this.chat = {
            completions: { create: mockCreate },
          };
        }
        chat: { completions: { create: typeof mockCreate } };
      },
    }));

    const { OpenAIProvider } = await import("./llm-openai");
    provider = new OpenAIProvider("sk-test", "gpt-4o-mini");

    await expect(
      provider.analyzeCommitMessages(["test"])
    ).rejects.toThrow("OpenAI returned empty response");
  });
});

describe("ClaudeProvider", () => {
  let provider: LLMProvider;

  beforeEach(() => {
    vi.resetModules();
  });

  it("analyzes commit messages and returns structured result", async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(MOCK_RESPONSE) }],
    });

    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class {
        constructor() {
          this.messages = { create: mockCreate };
        }
        messages: { create: typeof mockCreate };
      },
    }));

    const { ClaudeProvider } = await import("./llm-claude");
    provider = new ClaudeProvider("sk-ant-test", "claude-sonnet-4-20250514");

    const result = await provider.analyzeCommitMessages(["add new feature", "fix a bug"]);
    expect(result.bump).toBe("minor");
    expect(result.changes).toHaveLength(2);
    expect(result.changes[0].type).toBe("feat");
    expect(result.summary).toBe("Minor release with new features and bug fixes");
  });

  it("throws on non-text response", async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      content: [{ type: "tool_use", text: "{}" }],
    });

    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class {
        constructor() {
          this.messages = { create: mockCreate };
        }
        messages: { create: typeof mockCreate };
      },
    }));

    const { ClaudeProvider } = await import("./llm-claude");
    provider = new ClaudeProvider("sk-ant-test", "claude-sonnet-4-20250514");

    await expect(
      provider.analyzeCommitMessages(["test"])
    ).rejects.toThrow("Claude returned non-text response");
  });
});

describe("OllamaProvider", () => {
  let provider: LLMProvider;

  beforeEach(() => {
    vi.resetModules();
  });

  it("analyzes commit messages and returns structured result", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ message: { content: JSON.stringify(MOCK_RESPONSE) } }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { OllamaProvider } = await import("./llm-ollama");
    provider = new OllamaProvider("http://localhost:11434", "llama3");

    const result = await provider.analyzeCommitMessages(["add new feature", "fix a bug"]);
    expect(result.bump).toBe("minor");
    expect(result.changes).toHaveLength(2);
    expect(result.changes[0].type).toBe("feat");
    expect(result.summary).toBe("Minor release with new features and bug fixes");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:11434/api/chat",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("llama3"),
      })
    );
  });

  it("throws on non-ok response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });
    vi.stubGlobal("fetch", mockFetch);

    const { OllamaProvider } = await import("./llm-ollama");
    provider = new OllamaProvider("http://localhost:11434", "llama3");

    await expect(
      provider.analyzeCommitMessages(["test"])
    ).rejects.toThrow("Ollama API returned status 500");
  });

  it("throws on empty message content", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: { content: null } }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { OllamaProvider } = await import("./llm-ollama");
    provider = new OllamaProvider("http://localhost:11434", "llama3");

    await expect(
      provider.analyzeCommitMessages(["test"])
    ).rejects.toThrow("Ollama returned empty response");
  });
});
