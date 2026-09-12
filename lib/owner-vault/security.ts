import { createHash, randomBytes } from "node:crypto";

export function hashVaultSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createVaultSecret() {
  return `cvv_live_${randomBytes(32).toString("base64url")}`;
}

export function createVaultNumber() {
  const year = new Date().getUTCFullYear();
  return `CV-${year}-${randomBytes(6).toString("hex").toUpperCase()}`;
}
