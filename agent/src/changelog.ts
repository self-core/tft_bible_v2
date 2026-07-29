import { Octokit } from "octokit";
import { LLMProvider } from "./llm";

export interface ReleaseNotes {
  version: string;
  bump: "patch" | "minor" | "major";
  summary: string;
  changes: Array<{ type: string; message: string }>;
  body: string;
  previousTag: string | null;
}

export function bumpVersion(
  current: string,
  bump: "patch" | "minor" | "major"
): string {
  const cleaned = current.startsWith("v") ? current.slice(1) : current;
  const parts = cleaned.split(".").map(Number);
  if (bump === "patch") {
    parts[2] += 1;
  } else if (bump === "minor") {
    parts[1] += 1;
    parts[2] = 0;
  } else if (bump === "major") {
    parts[0] += 1;
    parts[1] = 0;
    parts[2] = 0;
  }
  return `v${parts.join(".")}`;
}

export async function generateReleaseNotes(params: {
  owner: string;
  repo: string;
  octokit: Octokit;
  llm: LLMProvider;
  since?: string;
}): Promise<ReleaseNotes> {
  const { owner, repo, octokit, llm, since } = params;

  let previousTag: string | null = null;
  let commits: Array<{ commit: { message: string } }>;

  if (since) {
    previousTag = since;
    const { data: compare } = await octokit.rest.repos.compareCommits({
      owner,
      repo,
      base: since,
      head: "HEAD",
    });
    commits = compare.commits;
  } else {
    const { data: releases } = await octokit.rest.repos.listReleases({
      owner,
      repo,
      per_page: 1,
    });
    if (releases.length > 0) {
      previousTag = releases[0].tag_name;
      const { data: compare } = await octokit.rest.repos.compareCommits({
        owner,
        repo,
        base: previousTag,
        head: "HEAD",
      });
      commits = compare.commits;
    } else {
      const { data: list } = await octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 30,
      });
      commits = list;
    }
  }

  const messages = commits.map((c) => c.commit.message);
  const analysis = await llm.analyzeCommitMessages(messages);

  const latestTag = previousTag ?? "v0.1.0";
  const version = bumpVersion(latestTag, analysis.bump);

  const date = new Date().toISOString().split("T")[0];
  const changesMd = analysis.changes
    .map((c) => `- **${c.type}:** ${c.message}`)
    .join("\n");
  const body = `## ${version} (${date})\n\n${analysis.summary}\n\n### Changes\n${changesMd}`;

  return {
    version,
    bump: analysis.bump,
    summary: analysis.summary,
    changes: analysis.changes,
    body,
    previousTag,
  };
}
