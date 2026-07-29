import { Octokit } from "octokit";
import jwt from "jsonwebtoken";
import { Config } from "./config";

let cachedOctokit: Octokit | null = null;
const cachedInstallationOctokit = new Map<number, Octokit>();

export function createAppJwt(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now,
    exp: now + 600,
    iss: appId,
  };
  const key = privateKey.replace(/\\n/g, "\n");
  return jwt.sign(payload, key, { algorithm: "RS256" });
}

export async function getInstallationOctokit(
  appId: string,
  privateKey: string,
  installationId: number
): Promise<Octokit> {
  const appJwt = createAppJwt(appId, privateKey);
  const appOctokit = new Octokit({ auth: appJwt });
  const {
    data: { token },
  } = await appOctokit.rest.apps.createInstallationAccessToken({
    installation_id: installationId,
  });
  return new Octokit({ auth: token });
}

export async function getAppOctokit(
  appId: string,
  privateKey: string
): Promise<Octokit> {
  const appJwt = createAppJwt(appId, privateKey);
  return new Octokit({ auth: appJwt });
}

export async function getAuthenticatedOctokit(
  config: Config,
  installationId?: number
): Promise<Octokit> {
  if (installationId !== undefined) {
    const cached = cachedInstallationOctokit.get(installationId);
    if (cached) return cached;
    const octokit = await getInstallationOctokit(
      config.GITHUB_APP_ID,
      config.GITHUB_APP_PRIVATE_KEY,
      installationId
    );
    cachedInstallationOctokit.set(installationId, octokit);
    return octokit;
  }
  if (cachedOctokit) return cachedOctokit;
  const octokit = await getAppOctokit(
    config.GITHUB_APP_ID,
    config.GITHUB_APP_PRIVATE_KEY
  );
  cachedOctokit = octokit;
  return octokit;
}
