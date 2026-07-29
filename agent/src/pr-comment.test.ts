import { describe, it, expect, vi } from "vitest";
import { Octokit } from "octokit";
import { AnalyzeResult, LLMProvider } from "./llm";
import { analyzeAndCommentPullRequest } from "./pr-comment";

const MOCK_ANALYSIS: AnalyzeResult = {
  bump: "minor",
  changes: [
    { type: "feat", message: "add new feature" },
    { type: "fix", message: "fix a bug" },
  ],
  summary: "Minor release with new features and bug fixes",
};

function makeOctokit(): Octokit {
  return {
    rest: {
      pulls: {
        get: vi.fn().mockResolvedValue({
          data: { number: 42, title: "Test PR" },
        }),
        listCommits: vi.fn().mockResolvedValue({
          data: [
            { commit: { message: "feat: add new feature" } },
            { commit: { message: "fix: fix a bug" } },
          ],
        }),
      },
      issues: {
        listComments: vi.fn().mockResolvedValue({ data: [] }),
        createComment: vi.fn().mockResolvedValue({ data: { id: 1 } }),
        updateComment: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      },
    },
  } as unknown as Octokit;
}

function makeLLM(): LLMProvider {
  return {
    analyzeCommitMessages: vi.fn().mockResolvedValue(MOCK_ANALYSIS),
  };
}

function expectedCommentBody(): string {
  return [
    "## 🤖 Release Impact Analysis",
    "",
    "**Release Summary:** Minor release with new features and bug fixes",
    "",
    "**Suggested Version:** minor",
    "",
    "**Changes classified:**",
    "| Type | Message |",
    "|------|---------|",
    "| feat | add new feature |",
    "| fix | fix a bug |",
    "",
    "<!-- release-impact-analysis -->",
  ].join("\n");
}

describe("analyzeAndCommentPullRequest", () => {
  it("fetches PR details and commits, then posts analysis comment", async () => {
    const octokit = makeOctokit();
    const llm = makeLLM();

    await analyzeAndCommentPullRequest({
      owner: "test-owner",
      repo: "test-repo",
      pullNumber: 42,
      octokit,
      llm,
    });

    expect(octokit.rest.pulls.get).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      pull_number: 42,
    });

    expect(octokit.rest.pulls.listCommits).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      pull_number: 42,
    });

    expect(llm.analyzeCommitMessages).toHaveBeenCalledWith([
      "feat: add new feature",
      "fix: fix a bug",
    ]);

    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 42,
      body: expectedCommentBody(),
    });
  });

  it("updates existing comment instead of creating new one", async () => {
    const octokit = {
      rest: {
        pulls: {
          get: vi.fn().mockResolvedValue({
            data: { number: 42, title: "Test PR" },
          }),
          listCommits: vi.fn().mockResolvedValue({
            data: [
              { commit: { message: "feat: add new feature" } },
            ],
          }),
        },
        issues: {
          listComments: vi.fn().mockResolvedValue({
            data: [
              { id: 99, body: "Some other comment" },
              { id: 100, body: "## 🤖 Release Impact Analysis\n\n<!-- release-impact-analysis -->" },
            ],
          }),
          createComment: vi.fn().mockResolvedValue({ data: { id: 1 } }),
          updateComment: vi.fn().mockResolvedValue({ data: { id: 100 } }),
        },
      },
    } as unknown as Octokit;
    const llm = makeLLM();

    await analyzeAndCommentPullRequest({
      owner: "test-owner",
      repo: "test-repo",
      pullNumber: 42,
      octokit,
      llm,
    });

    expect(octokit.rest.issues.updateComment).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      comment_id: 100,
      body: expectedCommentBody(),
    });

    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it("handles API failures from pulls.get", async () => {
    const octokit = {
      rest: {
        pulls: {
          get: vi.fn().mockRejectedValue(new Error("Not found")),
          listCommits: vi.fn(),
        },
        issues: {
          listComments: vi.fn(),
          createComment: vi.fn(),
          updateComment: vi.fn(),
        },
      },
    } as unknown as Octokit;
    const llm = makeLLM();

    await expect(
      analyzeAndCommentPullRequest({
        owner: "test-owner",
        repo: "test-repo",
        pullNumber: 42,
        octokit,
        llm,
      })
    ).rejects.toThrow("Not found");
  });

  it("handles API failures from listCommits", async () => {
    const octokit = {
      rest: {
        pulls: {
          get: vi.fn().mockResolvedValue({ data: { number: 42 } }),
          listCommits: vi.fn().mockRejectedValue(new Error("API error")),
        },
        issues: {
          listComments: vi.fn(),
          createComment: vi.fn(),
          updateComment: vi.fn(),
        },
      },
    } as unknown as Octokit;
    const llm = makeLLM();

    await expect(
      analyzeAndCommentPullRequest({
        owner: "test-owner",
        repo: "test-repo",
        pullNumber: 42,
        octokit,
        llm,
      })
    ).rejects.toThrow("API error");
  });

  it("handles LLM analysis failures", async () => {
    const octokit = makeOctokit();
    const llm: LLMProvider = {
      analyzeCommitMessages: vi.fn().mockRejectedValue(new Error("LLM failed")),
    };

    await expect(
      analyzeAndCommentPullRequest({
        owner: "test-owner",
        repo: "test-repo",
        pullNumber: 42,
        octokit,
        llm,
      })
    ).rejects.toThrow("LLM failed");
  });
});
