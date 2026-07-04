import { randomBytes } from "node:crypto";

/** URL-safe, unguessable share token. 24 bytes -> 32 base64url chars. */
export function generateShareToken(): string {
  return randomBytes(24).toString("base64url");
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

export function isValidShareToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}
