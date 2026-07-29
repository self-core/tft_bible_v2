import { describe, it, expect, vi } from "vitest";
import { Octokit } from "octokit";
import { createRelease } from "./release";
import { ReleaseNotes } from "./changelog";

const MOCK_NOTES: ReleaseNotes = {
  version: "v1.3.0",
  bump: "minor",
  summary: "Minor release with new features and bug fixes",
  changes: [
    { type: "feat", message: "add new feature" },
    { type: "fix", message: "fix a bug" },
  ],
  body: "## v1.3.0 (2026-07-29)\n\nMinor release with new features and bug fixes\n\n### Changes\n- **feat:** add new feature\n- **fix:** fix a bug",
  previousTag: "v1.2.3",
};

function makeOctokit(): Octokit {
  return {
    rest: {
      repos: {
        get: vi.fn().mockResolvedValue({
          data: { default_branch: "main" },
        }),
        createRelease: vi.fn().mockResolvedValue({
          data: {
            html_url: "https://github.com/test-owner/test-repo/releases/tag/v1.3.0",
            tag_name: "v1.3.0",
          },
        }),
      },
    },
  } as unknown as Octokit;
}

describe("createRelease", () => {
  it("creates a GitHub Release with correct parameters", async () => {
    const octokit = makeOctokit();

    const result = await createRelease({
      owner: "test-owner",
      repo: "test-repo",
      octokit,
      notes: MOCK_NOTES,
    });

    expect(octokit.rest.repos.createRelease).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      tag_name: "v1.3.0",
      name: "v1.3.0",
      body: MOCK_NOTES.body,
      target_commitish: "main",
    });
  });

  it("returns the release URL and tag", async () => {
    const octokit = makeOctokit();

    const result = await createRelease({
      owner: "test-owner",
      repo: "test-repo",
      octokit,
      notes: MOCK_NOTES,
    });

    expect(result).toEqual({
      releaseUrl:
        "https://github.com/test-owner/test-repo/releases/tag/v1.3.0",
      tag: "v1.3.0",
    });
  });

  it("fetches default branch when targetCommitish is not provided", async () => {
    const octokit = makeOctokit();

    await createRelease({
      owner: "test-owner",
      repo: "test-repo",
      octokit,
      notes: MOCK_NOTES,
    });

    expect(octokit.rest.repos.get).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
    });
  });

  it("uses provided targetCommitish instead of fetching default branch", async () => {
    const octokit = makeOctokit();

    await createRelease({
      owner: "test-owner",
      repo: "test-repo",
      octokit,
      notes: MOCK_NOTES,
      targetCommitish: "develop",
    });

    expect(octokit.rest.repos.get).not.toHaveBeenCalled();
    expect(octokit.rest.repos.createRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        target_commitish: "develop",
      })
    );
  });

  it("handles API errors", async () => {
    const octokit = {
      rest: {
        repos: {
          get: vi.fn().mockResolvedValue({
            data: { default_branch: "main" },
          }),
          createRelease: vi
            .fn()
            .mockRejectedValue(new Error("API rate limit exceeded")),
        },
      },
    } as unknown as Octokit;

    await expect(
      createRelease({
        owner: "test-owner",
        repo: "test-repo",
        octokit,
        notes: MOCK_NOTES,
      })
    ).rejects.toThrow("API rate limit exceeded");
  });
});
