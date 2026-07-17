import { createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE_NAME = "portfolio_access";

const ACCESS_MESSAGE = "portfolio-access-v1";

function getSessionSecret(): string | null {
  const secret = process.env.ACCESS_SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

function normalizePassword(value: string | undefined): string | null {
  const normalized = value?.normalize("NFC").trim();
  return normalized ? normalized : null;
}

function getExpectedPassword(): string | null {
  return normalizePassword(process.env.SITE_PASSWORD);
}

function digest(value: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(value, "utf8").digest();
}

export function isAccessConfigured(): boolean {
  return Boolean(getExpectedPassword() && getSessionSecret());
}

export function createAccessToken(): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;

  return digest(ACCESS_MESSAGE, secret).toString("base64url");
}

export function isAccessTokenValid(token: string | undefined): boolean {
  const secret = getSessionSecret();
  if (!secret || !token) return false;

  const expected = digest(ACCESS_MESSAGE, secret);
  let received: Buffer;

  try {
    received = Buffer.from(token, "base64url");
  } catch {
    return false;
  }

  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function isPasswordValid(candidate: string): boolean {
  const expectedPassword = getExpectedPassword();
  const normalizedCandidate = normalizePassword(candidate);
  const secret = getSessionSecret();
  if (!expectedPassword || !normalizedCandidate || !secret) return false;

  const expected = digest(expectedPassword, secret);
  const received = digest(normalizedCandidate, secret);
  return timingSafeEqual(received, expected);
}
