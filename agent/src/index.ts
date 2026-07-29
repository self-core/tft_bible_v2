import express, { Express, Request } from "express";
import dotenv from "dotenv";
import { loadConfig, Config } from "./config";
import { verifyWebhookSignature, routeWebhookEvent } from "./webhooks";
import { getAuthenticatedOctokit } from "./github";

declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}

export function createApp(config?: Config): Express {
  const app = express();
  const cfg = config ?? loadConfig();

  app.use(
    express.json({
      verify: (req: Request, _res, buf) => {
        req.rawBody = buf.toString();
      },
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/webhook", async (req, res) => {
    const signature = req.headers["x-hub-signature-256"] as string | undefined;
    const event = req.headers["x-github-event"] as string | undefined;
    const rawBody = req.rawBody;

    if (!signature || !rawBody) {
      res.status(401).json({ message: "missing signature" });
      return;
    }

    if (!verifyWebhookSignature(rawBody, signature, cfg.GITHUB_APP_WEBHOOK_SECRET)) {
      res.status(401).json({ message: "invalid signature" });
      return;
    }

    const installationId = req.body?.installation?.id as number | undefined;
    if (!installationId) {
      res.status(400).json({ message: "missing installation id" });
      return;
    }

    try {
      const octokit = await getAuthenticatedOctokit(cfg, installationId);
      await routeWebhookEvent(event ?? "", req.body, octokit, cfg.GITHUB_OWNER, cfg.GITHUB_REPO);
    } catch (err) {
      console.error("Webhook processing error:", err);
    }

    res.json({ status: "ok" });
  });

  return app;
}

if (require.main === module) {
  dotenv.config();
  const config = loadConfig();
  const app = createApp(config);
  app.listen(config.PORT, () => {
    console.log(`AI Release Manager listening on port ${config.PORT}`);
  });
}
