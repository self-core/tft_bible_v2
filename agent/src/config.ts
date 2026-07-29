import dotenv from "dotenv";

export type LlmProvider = "openai" | "claude" | "ollama";

export interface Config {
  PORT: number;
  GITHUB_APP_ID: string;
  GITHUB_APP_PRIVATE_KEY: string;
  GITHUB_APP_WEBHOOK_SECRET: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  LLM_PROVIDER: LlmProvider;
  OPENAI_API_KEY?: string;
  CLAUDE_API_KEY?: string;
  OLLAMA_BASE_URL: string;
  OLLAMA_MODEL: string;
}

export function loadConfig(): Config {
  const required: (keyof Config)[] = [
    "GITHUB_APP_ID",
    "GITHUB_APP_PRIVATE_KEY",
    "GITHUB_APP_WEBHOOK_SECRET",
    "GITHUB_OWNER",
    "GITHUB_REPO",
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  return {
    PORT: parseInt(process.env.PORT ?? "3000", 10),
    GITHUB_APP_ID: process.env.GITHUB_APP_ID!,
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY!,
    GITHUB_APP_WEBHOOK_SECRET: process.env.GITHUB_APP_WEBHOOK_SECRET!,
    GITHUB_OWNER: process.env.GITHUB_OWNER!,
    GITHUB_REPO: process.env.GITHUB_REPO!,
    LLM_PROVIDER: (process.env.LLM_PROVIDER ?? "openai") as LlmProvider,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    OLLAMA_MODEL: process.env.OLLAMA_MODEL ?? "llama3",
  };
}
