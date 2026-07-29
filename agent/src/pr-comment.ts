import { Octokit } from "octokit";
import { LLMProvider, AnalyzeResult } from "./llm";

const COMMENT_MARKER = "<!-- release-impact-analysis -->";

function formatComment(analysis: AnalyzeResult): string {
  const changesRows = analysis.changes
    .map((c) => `| ${c.type} | ${c.message} |`)
    .join("\n");
  return [
    "## 🤖 Release Impact Analysis",
    "",
    `**Release Summary:** ${analysis.summary}`,
    "",
    `**Suggested Version:** ${analysis.bump}`,
    "",
    "**Changes classified:**",
    "| Type | Message |",
    "|------|---------|",
    changesRows,
    "",
    COMMENT_MARKER,
  ].join("\n");
}

export async function analyzeAndCommentPullRequest(params: {
  owner: string;
  repo: string;
  pullNumber: number;
  octokit: Octokit;
  llm: LLMProvider;
}): Promise<void> {
  const { owner, repo, pullNumber, octokit, llm } = params;

  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  const { data: commits } = await octokit.rest.pulls.listCommits({
    owner,
    repo,
    pull_number: pullNumber,
  });

  const messages = commits.map((c: { commit: { message: string } }) => c.commit.message);

  const analysis = await llm.analyzeCommitMessages(messages);

  const body = formatComment(analysis);

  const { data: existingComments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: pullNumber,
  });

  const existing = existingComments.find((c: { body?: string }) =>
    c.body?.includes(COMMENT_MARKER)
  );

  if (existing) {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    });
  } else {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body,
    });
  }
}
