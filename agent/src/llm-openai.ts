import OpenAI from "openai";
import { LLMProvider, AnalyzeResult, SYSTEM_PROMPT } from "./llm";

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async analyzeCommitMessages(messages: string[]): Promise<AnalyzeResult> {
    const userContent = messages
      .map((msg, i) => `${i + 1}. ${msg}`)
      .join("\n");

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    });

    const text = response.choices[0]?.message?.content;
    if (!text) {
      throw new Error("OpenAI returned empty response");
    }

    return parseResult(text);
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
