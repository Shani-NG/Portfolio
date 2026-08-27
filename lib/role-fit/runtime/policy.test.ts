import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import { getGoogleAiStudioChatFallbackModel, getGoogleAiStudioModel, getRoleFitPolicy } from "./policy.ts";

const envKeys = [
  "GOOGLE_AI_STUDIO_MODEL",
  "GOOGLE_AI_STUDIO_CHAT_MODEL",
  "GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL",
  "GOOGLE_AI_STUDIO_ANALYSIS_MODEL",
  "ROLE_FIT_MAX_MESSAGES_PER_SESSION",
  "ROLE_FIT_MAX_REPORTS_PER_SESSION",
  "ROLE_FIT_MAX_INPUT_CHARS",
  "ROLE_FIT_MAX_OUTPUT_TOKENS",
] as const;

const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of envKeys) {
    const previousValue = previousEnv[key];
    if (previousValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = previousValue;
    }
  }
});

describe("Role Fit runtime policy", () => {
  test("uses safe defaults when environment values are missing", () => {
    for (const key of envKeys) delete process.env[key];

    assert.deepEqual(getRoleFitPolicy(), {
      maxMessagesPerSession: 30,
      maxReportsPerSession: 2,
      maxInputChars: 12000,
      maxOutputTokens: 2500,
    });
  });

  test("reads configured limits while keeping reports capped to the approved range", () => {
    process.env.ROLE_FIT_MAX_MESSAGES_PER_SESSION = "40";
    process.env.ROLE_FIT_MAX_REPORTS_PER_SESSION = "9";
    process.env.ROLE_FIT_MAX_INPUT_CHARS = "16000";
    process.env.ROLE_FIT_MAX_OUTPUT_TOKENS = "3500";

    assert.deepEqual(getRoleFitPolicy(), {
      maxMessagesPerSession: 40,
      maxReportsPerSession: 2,
      maxInputChars: 16000,
      maxOutputTokens: 3500,
    });
  });

  test("selects split Gemini models with fallback to the legacy single model variable", () => {
    process.env.GOOGLE_AI_STUDIO_MODEL = "gemini-fallback";
    process.env.GOOGLE_AI_STUDIO_CHAT_MODEL = "gemini-chat";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-analysis";

    assert.equal(getGoogleAiStudioModel("chat"), "gemini-chat");
    assert.equal(getGoogleAiStudioModel("analysis"), "gemini-analysis");

    delete process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL;
    assert.equal(getGoogleAiStudioModel("analysis"), "gemini-fallback");
  });

  test("reads a distinct optional chat fallback model", () => {
    delete process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL;
    assert.equal(getGoogleAiStudioChatFallbackModel("gemini-primary"), undefined);

    process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL = "";
    assert.equal(getGoogleAiStudioChatFallbackModel("gemini-primary"), undefined);

    process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL = "gemini-primary";
    assert.equal(getGoogleAiStudioChatFallbackModel("gemini-primary"), undefined);

    process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL = "gemini-fallback";
    assert.equal(getGoogleAiStudioChatFallbackModel("gemini-primary"), "gemini-fallback");
  });
});
