import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Octokit } from "octokit";
import { generateReleaseNotes, bumpVersion } from "./changelog";
import { AnalyzeResult } from "./llm";

const MOCK_RELEASE = {
  data: [{ tag_name: "v1.2.3", published_at: "2024-01-15T00:00:00Z" }],
};

const MOCK_COMPARE = {
  data: {
    commits: [
      { commit: { message: "feat: add new feature" } },
      { commit: { message: "fix: fix a bug" } },
      { commit: { message: "chore: update deps" } },
    ],
  },
};

const MOCK_ANALYZE_RESULT: AnalyzeResult = {
  bump: "minor",
  changes: [
    { type: "feat", message: "add new feature" },
    { type: "fix", message: "fix a bug" },
    { type: "chore", message: "update deps" },
  ],
  summary: "Minor release with new features and bug fixes",
};

function makeOctokit(overrides?: Record<string, unknown>): Octokit {
  return {
    rest: {
      repos: {
        listReleases: vi.fn().mockResolvedValue(MOCK_RELEASE),
        compareCommits: vi.fn().mockResolvedValue(MOCK_COMPARE),
        listCommits: vi.fn(),
        ...overrides,
      },
    },
  } as unknown as Octokit;
}

function makeLLM(result?: AnalyzeResult) {
  return {
    analyzeCommitMessages: vi.fn().mockResolvedValue(
      result ?? MOCK_ANALYZE_RESULT
    ),
  };
}

describe("bumpVersion", () => {
  it("bumps patch version: 1.2.3 -> 1.2.4", () => {
    expect(bumpVersion("v1.2.3", "patch")).toBe("v1.2.4");
  });

  it("bumps minor version: 1.2.3 -> 1.3.0", () => {
    expect(bumpVersion("v1.2.3", "minor")).toBe("v1.3.0");
  });

  it("bumps major version: 1.2.3 -> 2.0.0", () => {
    expect(bumpVersion("v1.2.3", "major")).toBe("v2.0.0");
  });

  it("handles tag without v prefix", () => {
    expect(bumpVersion("1.2.3", "patch")).toBe("v1.2.4");
  });

  it("defaults to v0.1.0 when given v0.0.0", () => {
    expect(bumpVersion("v0.0.0", "patch")).toBe("v0.0.1");
    expect(bumpVersion("v0.0.0", "minor")).toBe("v0.1.0");
    expect(bumpVersion("v0.0.0", "major")).toBe("v1.0.0");
  });
});

describe("generateReleaseNotes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("generates release notes from commits since last tag", async () => {
    const octokit = makeOctokit();
    const llm = makeLLM();
    const result = await generateReleaseNotes({
      owner: "test-owner",
      repo: "test-repo",
      octokit,
      llm,
    });

    expect(result.version).toBe("v1.3.0");
    expect(result.bump).toBe("minor");
    expect(result.summary).toBe("Minor release with new features and bug fixes");
    expect(result.changes).toHaveLength(3);
    expect(result.changes[0].type).toBe("feat");
    expect(result.previousTag).toBe("v1.2.3");

    expect(octokit.rest.repos.listReleases).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      per_page: 1,
    });
    expect(octokit.rest.repos.compareCommits).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      base: "v1.2.3",
      head: "HEAD",
    });
  });

  it("fetches last 30 commits when no previous release exists", async () => {
    const octokit = makeOctokit({
      listReleases: vi.fn().mockResolvedValue({ data: [] }),
      compareCommits: vi.fn(),
      listCommits: vi.fn().mockResolvedValue({
        data: [
          { commit: { message: "feat: initial commit" } },
          { commit: { message: "fix: first fix" } },
        ],
      }),
    });
    const llm = makeLLM({
      bump: "major",
      changes: [
        { type: "feat", message: "initial commit" },
        { type: "fix", message: "first fix" },
      ],
      summary: "Initial release",
    });

    const result = await generateReleaseNotes({
      owner: "test-owner",
      repo: "test-repo",
      octokit,
      llm,
    });

    expect(result.version).toBe("v1.0.0");
    expect(result.bump).toBe("major");
    expect(result.previousTag).toBeNull();

    expect(octokit.rest.repos.listCommits).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      per_page: 30,
    });
    expect(octokit.rest.repos.compareCommits).not.toHaveBeenCalled();
  });

  it("uses since parameter when provided", async () => {
    const octokit = makeOctokit();
    const llm = makeLLM();

    await generateReleaseNotes({
      owner: "test-owner",
      repo: "test-repo",
      octokit,
      llm,
      since: "v1.0.0",
    });

    expect(octokit.rest.repos.compareCommits).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      base: "v1.0.0",
      head: "HEAD",
    });
    expect(octokit.rest.repos.listReleases).not.toHaveBeenCalled();
  });

  it("formats markdown body correctly", async () => {
    const octokit = makeOctokit();
    const llm = makeLLM();

    const result = await generateReleaseNotes({
      owner: "test-owner",
      repo: "test-repo",
      octokit,
      llm,
    });

    expect(result.body).toContain("## v1.3.0");
    expect(result.body).toContain("Minor release with new features and bug fixes");
    expect(result.body).toContain("### Changes");
    expect(result.body).toContain("- **feat:** add new feature");
    expect(result.body).toContain("- **fix:** fix a bug");
    expect(result.body).toContain("- **chore:** update deps");
    expect(result.body).toContain("(2026-07-29)");
  });

  it("passes commit messages to LLM for analysis", async () => {
    const octokit = makeOctokit();
    const llm = makeLLM();

    await generateReleaseNotes({
      owner: "test-owner",
      repo: "test-repo",
      octokit,
      llm,
    });

    expect(llm.analyzeCommitMessages).toHaveBeenCalledWith([
      "feat: add new feature",
      "fix: fix a bug",
      "chore: update deps",
    ]);
  });
});
