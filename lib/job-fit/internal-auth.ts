import { timingSafeEqual } from "node:crypto";

function internalApiSecret() {
  const value = process.env.JOB_FIT_INTERNAL_API_KEY?.trim();
  return value && value.length >= 32 ? value : null;
}

export function isInternalJobFitApiConfigured() {
  return Boolean(internalApiSecret());
}

export function isInternalJobFitRequestAuthorized(request: Request) {
  const expected = internalApiSecret();
  const authorization = request.headers.get("authorization");
  if (!expected || !authorization?.startsWith("Bearer ")) return false;
  const received = Buffer.from(authorization.slice("Bearer ".length), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer);
}
