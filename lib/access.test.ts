import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import {
  createAccessToken,
  isAccessConfigured,
  isAccessTokenValid,
  isPasswordValid,
} from "./access.ts";

const originalPassword = process.env.SITE_PASSWORD;
const originalSecret = process.env.ACCESS_SESSION_SECRET;

afterEach(() => {
  restoreEnvironment("SITE_PASSWORD", originalPassword);
  restoreEnvironment("ACCESS_SESSION_SECRET", originalSecret);
});

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

function configure(password = "PortfolioTest2026") {
  process.env.SITE_PASSWORD = password;
  process.env.ACCESS_SESSION_SECRET = "s".repeat(64);
}

describe("portfolio access configuration", () => {
  test("fails closed when configuration is missing", () => {
    delete process.env.SITE_PASSWORD;
    delete process.env.ACCESS_SESSION_SECRET;

    assert.equal(isAccessConfigured(), false);
    assert.equal(isPasswordValid("anything"), false);
    assert.equal(createAccessToken(), null);
  });

  test("rejects session secrets shorter than 32 characters", () => {
    process.env.SITE_PASSWORD = "PortfolioTest2026";
    process.env.ACCESS_SESSION_SECRET = "too-short";

    assert.equal(isAccessConfigured(), false);
  });

  test("accepts an exact password and rejects a wrong password", () => {
    configure();

    assert.equal(isAccessConfigured(), true);
    assert.equal(isPasswordValid("PortfolioTest2026"), true);
    assert.equal(isPasswordValid("PortfolioTest2027"), false);
  });

  test("normalizes harmless whitespace introduced during copy and paste", () => {
    configure("  PortfolioTest2026  ");

    assert.equal(isPasswordValid("\nPortfolioTest2026\t"), true);
  });

  test("normalizes equivalent Unicode input", () => {
    configure("Cafe\u0301Portfolio2026");

    assert.equal(isPasswordValid("CaféPortfolio2026"), true);
  });

  test("creates a valid signed session token and rejects tampering", () => {
    configure();
    const token = createAccessToken();

    assert.ok(token);
    assert.equal(isAccessTokenValid(token), true);
    assert.equal(isAccessTokenValid(`${token}x`), false);
  });
});
