import assert from "node:assert/strict";
import { test } from "node:test";

import { getRoleFitModelProvider } from "./index.ts";

test("runtime always resolves the configured real provider", () => {
  assert.equal(getRoleFitModelProvider().name, "gemini");
});

test("missing provider credentials return a controlled failure", async () => {
  const previousStudioKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  const previousGeminiKey = process.env.GEMINI_API_KEY;

  delete process.env.GOOGLE_AI_STUDIO_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const result = await getRoleFitModelProvider().generateChat({
      message: "Hello",
      language: "en",
      maxOutputTokens: 100,
      approvedContext: "Approved portfolio context",
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.provider, "gemini");
      assert.equal(result.error, "missing-configuration");
    }
  } finally {
    if (previousStudioKey === undefined) delete process.env.GOOGLE_AI_STUDIO_API_KEY;
    else process.env.GOOGLE_AI_STUDIO_API_KEY = previousStudioKey;

    if (previousGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousGeminiKey;
  }
});
