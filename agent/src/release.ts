import { Octokit } from "octokit";
import { ReleaseNotes } from "./changelog";

export async function createRelease(params: {
  owner: string;
  repo: string;
  octokit: Octokit;
  notes: ReleaseNotes;
  targetCommitish?: string;
}): Promise<{ releaseUrl: string; tag: string }> {
  const { owner, repo, octokit, notes, targetCommitish } = params;

  let defaultBranch = targetCommitish;
  if (!defaultBranch) {
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    defaultBranch = repoData.default_branch;
  }

  const { data: release } = await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: notes.version,
    name: notes.version,
    body: notes.body,
    target_commitish: defaultBranch,
  });

  return {
    releaseUrl: release.html_url,
    tag: release.tag_name,
  };
}
