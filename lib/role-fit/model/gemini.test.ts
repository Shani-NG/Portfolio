import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { completeChatAnswer, createGeminiRoleFitProvider } from "./gemini.ts";

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.GEMINI_API_KEY;
const originalChatModel = process.env.GOOGLE_AI_STUDIO_CHAT_MODEL;
const originalChatFallbackModel = process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL;
const originalAnalysisModel = process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalApiKey;
  if (originalChatModel === undefined) delete process.env.GOOGLE_AI_STUDIO_CHAT_MODEL;
  else process.env.GOOGLE_AI_STUDIO_CHAT_MODEL = originalChatModel;
  if (originalChatFallbackModel === undefined) delete process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL;
  else process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL = originalChatFallbackModel;
  if (originalAnalysisModel === undefined) delete process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL;
  else process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = originalAnalysisModel;
});

function geminiResponse(text: string, finishReason: string) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function requestedModel(input: RequestInfo | URL): string {
  const url = String(input);
  const match = url.match(/\/models\/([^:]+):generateContent/);
  return match ? decodeURIComponent(match[1]) : "unknown";
}

describe("Gemini chat completion guard", () => {
  it("keeps only complete sentences and never returns a trailing fragment", () => {
    assert.equal(completeChatAnswer("First complete sentence. Second complete sentence. unfinished"), "First complete sentence. Second complete sentence.");
    assert.equal(completeChatAnswer("שמחה שהצלחנו להתחבר. אני"), "שמחה שהצלחנו להתחבר.");
  });

  it("preserves scannable bullets and removes visible markdown decoration", () => {
    assert.equal(
      completeChatAnswer("**Relevant skills**\n* **UX strategy**\n* \"Research\"\n* Innovation"),
      "Relevant skills\n- UX strategy\n- Research\n- Innovation",
    );
  });

  it("turns multiple suggested directions into scannable bullets", () => {
    assert.equal(
      completeChatAnswer("I can suggest two useful directions. If you want high-stakes systems, explore the defense work. If you want product strategy, review the monitoring case study."),
      "I can suggest two useful directions.\n- If you want high-stakes systems, explore the defense work.\n- If you want product strategy, review the monitoring case study.",
    );
  });

  it("retries MAX_TOKENS once with a larger plain-text budget", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_CHAT_MODEL = "gemini-3-flash-preview";
    const requests: Array<Record<string, unknown>> = [];
    globalThis.fetch = async (_input, init) => {
      requests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return requests.length === 1
        ? geminiResponse("שמחה שהצלחנו להתחבר. אני", "MAX_TOKENS")
        : geminiResponse("שמחה שהצלחנו להתחבר. אני כאן כדי לעזור בשאלה הבאה.", "STOP");
    };

    const result = await createGeminiRoleFitProvider().generateChat({
      message: "שלום",
      language: "he",
      maxOutputTokens: 800,
      approvedContext: "Approved profile context.",
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.answer, "שמחה שהצלחנו להתחבר. אני כאן כדי לעזור בשאלה הבאה.");
    assert.equal(requests.length, 2);
    const firstConfig = requests[0]?.generationConfig as Record<string, unknown>;
    const retryConfig = requests[1]?.generationConfig as Record<string, unknown>;
    assert.equal(firstConfig.responseMimeType, undefined);
    assert.deepEqual(firstConfig.thinkingConfig, { thinkingLevel: "low" });
    assert.equal(firstConfig.maxOutputTokens, 800);
    assert.equal(retryConfig.maxOutputTokens, 1800);
  });

  it("passes a normal concise response through unchanged without retrying", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_CHAT_MODEL = "gemini-3.5-flash-lite";
    process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL = "gemini-3.1-flash-lite";
    const models: string[] = [];
    globalThis.fetch = async (input) => {
      models.push(requestedModel(input));
      return geminiResponse("What would you like to explore next?", "STOP");
    };

    const result = await createGeminiRoleFitProvider().generateChat({
      message: "Can you help me?",
      language: "en",
      maxOutputTokens: 800,
      approvedContext: "Approved profile context.",
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.answer, "What would you like to explore next?");
    assert.deepEqual(models, ["gemini-3.5-flash-lite"]);
  });

  it("uses the chat fallback once for a primary 429 and preserves the same prompt context", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_CHAT_MODEL = "gemini-3.5-flash-lite";
    process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL = "gemini-3.1-flash-lite";
    const requests: Array<{ model: string; body: Record<string, unknown> }> = [];
    globalThis.fetch = async (input, init) => {
      requests.push({
        model: requestedModel(input),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });

      return requests.length === 1
        ? new Response(JSON.stringify({ error: { message: "quota" } }), { status: 429, statusText: "Too Many Requests" })
        : geminiResponse("Fallback response is available now.", "STOP");
    };

    const result = await createGeminiRoleFitProvider().generateChat({
      message: "Answer about the active report.",
      language: "en",
      maxOutputTokens: 900,
      approvedContext: "Approved profile context.",
      mode: "report-follow-up",
      runtimeState: "An existing validated report is active. Answer only about that report.",
      conversationContext: "REPORT_CONTEXT: Fit is good.",
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.model, "gemini-3.1-flash-lite");
    assert.equal(result.answer, "Fallback response is available now.");
    assert.deepEqual(requests.map((request) => request.model), ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]);
    assert.deepEqual(requests[0]?.body, requests[1]?.body);
    const prompt = String((requests[1]?.body.contents as Array<{ parts: Array<{ text: string }> }>)[0]?.parts[0]?.text);
    assert.match(prompt, /REPORT_CONTEXT: Fit is good/);
    assert.match(prompt, /existing validated report is active/i);
  });

  it("uses the chat fallback once for a primary 503 without retrying the primary model", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_CHAT_MODEL = "gemini-3.5-flash-lite";
    process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL = "gemini-3.1-flash-lite";
    const models: string[] = [];
    globalThis.fetch = async (input) => {
      models.push(requestedModel(input));
      return models.length === 1
        ? new Response(JSON.stringify({ error: { message: "overloaded" } }), { status: 503, statusText: "Service Unavailable" })
        : geminiResponse("Fallback handled the temporary provider load.", "STOP");
    };

    const result = await createGeminiRoleFitProvider().generateChat({
      message: "Can you answer?",
      language: "en",
      maxOutputTokens: 800,
      approvedContext: "Approved profile context.",
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.answer, "Fallback handled the temporary provider load.");
    assert.deepEqual(models, ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]);
  });

  it("returns the temporary-capacity failure only after both chat models fail", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_CHAT_MODEL = "gemini-3.5-flash-lite";
    process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL = "gemini-3.1-flash-lite";
    const models: string[] = [];
    globalThis.fetch = async (input) => {
      models.push(requestedModel(input));
      return new Response(JSON.stringify({ error: { message: "overloaded" } }), { status: 503, statusText: "Service Unavailable" });
    };

    const result = await createGeminiRoleFitProvider().generateChat({
      message: "Can you answer?",
      language: "en",
      maxOutputTokens: 800,
      approvedContext: "Approved profile context.",
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.safeMessageKey, "model.chat_temporary_capacity");
    assert.equal(result.retryable, true);
    assert.deepEqual(models, ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]);
  });

  it("does not use chat fallback for credential failures", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_CHAT_MODEL = "gemini-3.5-flash-lite";
    process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL = "gemini-3.1-flash-lite";
    const models: string[] = [];
    globalThis.fetch = async (input) => {
      models.push(requestedModel(input));
      return new Response(JSON.stringify({ error: { message: "unauthorized" } }), { status: 401, statusText: "Unauthorized" });
    };

    const result = await createGeminiRoleFitProvider().generateChat({
      message: "Can you answer?",
      language: "en",
      maxOutputTokens: 800,
      approvedContext: "Approved profile context.",
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.safeMessageKey, "model.google_ai_studio_provider_error");
    assert.deepEqual(models, ["gemini-3.5-flash-lite"]);
  });

  it("keeps report generation isolated from chat fallback models", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_CHAT_MODEL = "gemini-3.5-flash-lite";
    process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL = "gemini-3.1-flash-lite";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3.5-flash";
    const models: string[] = [];
    const validAnalysis = JSON.stringify({
      fitLevel: "good",
      fitRationale: "Approved evidence supports the role context.",
      evidenceConfidence: "high",
      evidenceConfidenceRationale: "The assessment uses approved project evidence.",
      skillsCoverageLabel: "Evidence-backed coverage",
      items: [{
        roleItemIndex: 0,
        displayLabel: "Complex product strategy",
        importance: "core",
        matchType: "direct",
        impact: "strength",
        evidenceConfidence: "high",
        shortRationale: "Approved evidence shows this capability.",
        evidenceSourceIds: ["c4i"],
      }],
    });
    globalThis.fetch = async (input) => {
      models.push(requestedModel(input));
      return geminiResponse(validAnalysis, "STOP");
    };

    const result = await createGeminiRoleFitProvider().generateReport({
      roleText: "Title: Senior UX Strategist",
      language: "en",
      task: "analysis",
      maxOutputTokens: 2500,
      approvedEvidence: "### APPROVED_SOURCE_ID: c4i",
      runtimeState: JSON.stringify({ roleItems: [{ originalText: "Complex product strategy", source: "requirement" }] }),
    });

    assert.equal(result.ok, true);
    assert.deepEqual(models, ["gemini-3.5-flash"]);
  });

  it("returns the complete sentence when a retry ends with a trailing fragment", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_CHAT_MODEL = "gemini-3-flash-preview";
    globalThis.fetch = async () => geminiResponse("שמחה שהצלחנו להתחבר. אני", "MAX_TOKENS");

    const result = await createGeminiRoleFitProvider().generateChat({
      message: "שלום",
      language: "he",
      maxOutputTokens: 800,
      approvedContext: "Approved profile context.",
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.answer, "שמחה שהצלחנו להתחבר.");
  });

  it("retries a MAX_TOKENS report once and rejects a second truncated JSON response", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3-flash-preview";
    const requests: Array<Record<string, unknown>> = [];
    globalThis.fetch = async (_input, init) => {
      requests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return geminiResponse('{"fitLevel":"strong"', "MAX_TOKENS");
    };

    const result = await createGeminiRoleFitProvider().generateReport({
      roleText: "Title: Senior UX Strategist",
      language: "en",
      task: "analysis",
      maxOutputTokens: 2500,
      approvedEvidence: "### APPROVED_SOURCE_ID: c4i",
      runtimeState: JSON.stringify({ roleItems: [] }),
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error, "invalid-output");
    assert.equal(result.detail, "qualitative-analysis-finish-reason:MAX_TOKENS");
    assert.equal(requests.length, 2);
    const firstConfig = requests[0]?.generationConfig as Record<string, unknown>;
    const retryConfig = requests[1]?.generationConfig as Record<string, unknown>;
    assert.equal(firstConfig.responseMimeType, "application/json");
    assert.deepEqual(firstConfig.thinkingConfig, { thinkingLevel: "minimal" });
    assert.equal(firstConfig.maxOutputTokens, 2500);
    assert.deepEqual(retryConfig.thinkingConfig, { thinkingLevel: "minimal" });
    assert.equal(retryConfig.maxOutputTokens, 5000);
  });

  it("classifies HTTP 429 as a retryable rate limit and preserves safe Retry-After metadata", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3-flash-preview";
    globalThis.fetch = async () => new Response(JSON.stringify({
      error: { message: "raw quota detail that must not be exposed" },
    }), {
      status: 429,
      statusText: "Too Many Requests",
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "34",
      },
    });

    const result = await createGeminiRoleFitProvider().generateReport({
      roleText: "Title: Director UX/UI",
      language: "en",
      task: "analysis",
      maxOutputTokens: 2500,
      approvedEvidence: "### APPROVED_SOURCE_ID: c4i",
      runtimeState: JSON.stringify({ roleItems: [{ originalText: "Lead UX strategy", source: "requirement" }] }),
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error, "rate-limited");
    assert.equal(result.safeMessageKey, "model.provider_rate_limited");
    assert.equal(result.providerStatus, 429);
    assert.equal(result.retryable, true);
    assert.equal(result.retryAfterSeconds, 34);
    assert.equal(result.detail, undefined);
  });

  it("repairs one schema-invalid report response before failing the request", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3-flash-preview";
    const requests: Array<Record<string, unknown>> = [];
    const validAnalysis = JSON.stringify({
      fitLevel: "good",
      fitRationale: "Approved evidence supports the role context.",
      evidenceConfidence: "high",
      evidenceConfidenceRationale: "The assessment uses approved project evidence.",
      skillsCoverageLabel: "Evidence-backed coverage",
      items: [{
        roleItemIndex: 0,
        displayLabel: "Complex product strategy",
        importance: "core",
        matchType: "direct",
        impact: "strength",
        evidenceConfidence: "high",
        shortRationale: "Approved evidence shows this capability.",
        evidenceSourceIds: ["c4i"],
      }],
    });
    globalThis.fetch = async (_input, init) => {
      requests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return requests.length === 1
        ? geminiResponse('{"fitLevel":"good"}', "STOP")
        : geminiResponse(validAnalysis, "STOP");
    };

    const result = await createGeminiRoleFitProvider().generateReport({
      roleText: "Title: Senior UX Strategist",
      language: "en",
      task: "analysis",
      maxOutputTokens: 2500,
      approvedEvidence: "### APPROVED_SOURCE_ID: c4i",
      runtimeState: JSON.stringify({ roleItems: [{ originalText: "Complex product strategy", source: "requirement" }] }),
    });

    assert.equal(result.ok, true);
    assert.equal(requests.length, 2);
    const reportPrompt = String((requests[0]?.contents as Array<{ parts: Array<{ text: string }> }>)[0]?.parts[0]?.text);
    assert.match(reportPrompt, /ROLE_ITEM_CANDIDATE_SOURCE_IDS are ranked suggestions.*not an authorization boundary/);
    assert.match(reportPrompt, /CV fallback/);
    assert.match(reportPrompt, /same canonical evidence ID may support multiple requirements/);
  });

  it("repairs a report that references a role item outside the runtime index set", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3-flash-preview";
    const requests: Array<Record<string, unknown>> = [];
    const analysisWithIndex = (roleItemIndex: number) => JSON.stringify({
      fitLevel: "good",
      fitRationale: "Approved evidence supports the role context.",
      evidenceConfidence: "high",
      evidenceConfidenceRationale: "The assessment uses approved project evidence.",
      skillsCoverageLabel: "Evidence-backed coverage",
      items: [{
        roleItemIndex,
        displayLabel: "Complex product strategy",
        importance: "core",
        matchType: "direct",
        impact: "strength",
        evidenceConfidence: "high",
        shortRationale: "Approved evidence shows this capability.",
        evidenceSourceIds: ["c4i"],
      }],
    });
    globalThis.fetch = async (_input, init) => {
      requests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return requests.length === 1
        ? geminiResponse(analysisWithIndex(3), "STOP")
        : geminiResponse(analysisWithIndex(0), "STOP");
    };

    const result = await createGeminiRoleFitProvider().generateReport({
      roleText: "Title: Senior UX Strategist",
      language: "en",
      task: "analysis",
      maxOutputTokens: 2500,
      approvedEvidence: "### APPROVED_SOURCE_ID: c4i",
      runtimeState: JSON.stringify({ roleItems: [{ originalText: "Complex product strategy", source: "requirement" }] }),
    });

    assert.equal(result.ok, true);
    assert.equal(requests.length, 2);
    const retryPrompt = String((requests[1]?.contents as Array<{ parts: Array<{ text: string }> }>)[0]?.parts[0]?.text);
    assert.match(retryPrompt, /allowed=0;received=3/);
  });
});
