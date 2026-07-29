import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { createAppJwt } from "./github";

function generateKey(): string {
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return privateKey;
}

describe("createAppJwt", () => {
  it("returns a valid JWT string", () => {
    const privateKey = generateKey();
    const appId = "12345";
    const token = createAppJwt(appId, privateKey);
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("decodes to have iss equal to appId and exp > iat", () => {
    const privateKey = generateKey();
    const appId = "12345";
    const token = createAppJwt(appId, privateKey);
    const parts = token.split(".");
    const decoded = JSON.parse(
      Buffer.from(parts[1], "base64url").toString()
    );
    expect(decoded.iss).toBe(appId);
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
    expect(decoded.exp - decoded.iat).toBe(600);
  });

  it("replaces escaped newlines in private key", () => {
    const privateKey = generateKey();
    const escapedKey = privateKey.replace(/\n/g, "\\n");
    const appId = "12345";
    const token = createAppJwt(appId, escapedKey);
    expect(token.split(".")).toHaveLength(3);
    const parts = token.split(".");
    const decoded = JSON.parse(
      Buffer.from(parts[1], "base64url").toString()
    );
    expect(decoded.iss).toBe(appId);
  });
});
