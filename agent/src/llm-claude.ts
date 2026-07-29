import Anthropic from "@anthropic-ai/sdk";
import { LLMProvider, AnalyzeResult, SYSTEM_PROMPT } from "./llm";

export class ClaudeProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = "claude-sonnet-4-20250514") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async analyzeCommitMessages(messages: string[]): Promise<AnalyzeResult> {
    const userContent = messages
      .map((msg, i) => `${i + 1}. ${msg}`)
      .join("\n");

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const block = response.content[0];
    if (block?.type !== "text") {
      throw new Error("Claude returned non-text response");
    }

    return parseResult(block.text);
  }
}

function parseResult(text: string): AnalyzeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Failed to parse LLM response as JSON");
  }

  if (!isValidResult(parsed)) {
    throw new Error("LLM response has unexpected shape");
  }

  return parsed;
}

function isValidResult(obj: unknown): obj is AnalyzeResult {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;
  if (!["patch", "minor", "major"].includes(r.bump as string)) return false;
  if (!Array.isArray(r.changes)) return false;
  for (const c of r.changes) {
    if (!c || typeof c !== "object") return false;
    if (typeof (c as Record<string, unknown>).type !== "string") return false;
    if (typeof (c as Record<string, unknown>).message !== "string") return false;
  }
  if (typeof r.summary !== "string") return false;
  return true;
}
