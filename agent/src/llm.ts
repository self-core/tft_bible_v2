import { Config } from "./config";
import { OpenAIProvider } from "./llm-openai";
import { ClaudeProvider } from "./llm-claude";
import { OllamaProvider } from "./llm-ollama";

export interface AnalyzeResult {
  bump: "patch" | "minor" | "major";
  changes: Array<{ type: string; message: string }>;
  summary: string;
}

export interface LLMProvider {
  analyzeCommitMessages(messages: string[]): Promise<AnalyzeResult>;
}

export const SYSTEM_PROMPT = `You are a release manager analyzing git commits. Classify each commit by type (feat, fix, chore, docs, refactor, test, perf, ci), suggest a semver bump (patch, minor, or major), and provide a one-line release summary.

Respond with valid JSON:
{
  "bump": "patch|minor|major",
  "changes": [
    { "type": "feat", "message": "commit message text" }
  ],
  "summary": "Brief release summary"
}`;

export function createLLMProvider(config: Config): LLMProvider {
  switch (config.LLM_PROVIDER) {
    case "openai": {
      if (!config.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is required when using OpenAI provider");
      }
      return new OpenAIProvider(config.OPENAI_API_KEY, config.OPENAI_MODEL);
    }
    case "claude": {
      if (!config.CLAUDE_API_KEY) {
        throw new Error("CLAUDE_API_KEY is required when using Claude provider");
      }
      return new ClaudeProvider(config.CLAUDE_API_KEY, config.CLAUDE_MODEL);
    }
    case "ollama":
      return new OllamaProvider(config.OLLAMA_BASE_URL, config.OLLAMA_MODEL);
    default:
      throw new Error(
        `Unknown LLM provider: ${config.LLM_PROVIDER}. Supported providers: openai, claude, ollama`
      );
  }
}
