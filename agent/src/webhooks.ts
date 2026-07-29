import crypto from "crypto";
import { Octokit } from "octokit";

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
  _octokit: Octokit,
  _owner: string,
  _repo: string
): Promise<void> {
  const pr = payload.pull_request as Record<string, unknown> | undefined;
  console.log(`PR #${pr?.number} opened`);
}

export async function handlePushToMain(
  _payload: Record<string, unknown>,
  _octokit: Octokit,
  _owner: string,
  _repo: string
): Promise<void> {
  console.log("Push to main");
}

export async function routeWebhookEvent(
  event: string,
  payload: Record<string, unknown>,
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<void> {
  if (event === "pull_request") {
    const action = payload.action;
    if (action === "opened" || action === "synchronize") {
      await handlePullRequestOpened(payload, octokit, owner, repo);
    }
  } else if (event === "push") {
    await handlePushToMain(payload, octokit, owner, repo);
  }
}
