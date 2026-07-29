import express, { Express } from "express";
import dotenv from "dotenv";
import { loadConfig } from "./config";

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/webhook", (_req, res) => {
    res.status(501).json({ message: "not implemented" });
  });

  return app;
}

if (require.main === module) {
  dotenv.config();
  const config = loadConfig();
  const app = createApp();
  app.listen(config.PORT, () => {
    console.log(`AI Release Manager listening on port ${config.PORT}`);
  });
}
