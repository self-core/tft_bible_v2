import crypto from "crypto";
import { Octokit } from "octokit";
import { LLMProvider } from "./llm";
import { analyzeAndCommentPullRequest } from "./pr-comment";
import { generateReleaseNotes } from "./changelog";
import { createRelease } from "./release";

export interface WebhookContext {
  octokit: Octokit;
  llm: LLMProvider;
  owner: string;
  repo: string;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload, "utf8");
  const expected = `sha256=${hmac.digest("hex")}`;
  if (signature.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function handlePullRequestOpened(
  payload: Record<string, unknown>,
  context: WebhookContext
): Promise<void> {
  const pr = payload.pull_request as Record<string, unknown> | undefined;
  const pullNumber = pr?.number as number | undefined;
  if (!pullNumber) return;
  console.log(`PR #${pullNumber} opened`);
  await analyzeAndCommentPullRequest({
    owner: context.owner,
    repo: context.repo,
    pullNumber,
    octokit: context.octokit,
    llm: context.llm,
  });
}

export async function handlePushToMain(
  payload: Record<string, unknown>,
  context: WebhookContext
): Promise<void> {
  const ref = payload.ref as string | undefined;
  console.log(`Push to main (ref: ${ref})`);
  const notes = await generateReleaseNotes({
    owner: context.owner,
    repo: context.repo,
    octokit: context.octokit,
    llm: context.llm,
  });
  const result = await createRelease({
    owner: context.owner,
    repo: context.repo,
    octokit: context.octokit,
    notes,
  });
  console.log(`Release created: ${result.releaseUrl}`);
}

export async function routeWebhookEvent(
  event: string,
  payload: Record<string, unknown>,
  context: WebhookContext
): Promise<void> {
  if (event === "pull_request") {
    const action = payload.action;
    if (action === "opened" || action === "synchronize") {
      await handlePullRequestOpened(payload, context);
    }
  } else if (event === "push") {
    await handlePushToMain(payload, context);
  }
}
