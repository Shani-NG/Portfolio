import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { completeChatAnswer, createGeminiRoleFitProvider } from "./gemini.ts";

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.GEMINI_API_KEY;
const originalChatModel = process.env.GOOGLE_AI_STUDIO_CHAT_MODEL;
const originalAnalysisModel = process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalApiKey;
  if (originalChatModel === undefined) delete process.env.GOOGLE_AI_STUDIO_CHAT_MODEL;
  else process.env.GOOGLE_AI_STUDIO_CHAT_MODEL = originalChatModel;
  if (originalAnalysisModel === undefined) delete process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL;
  else process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = originalAnalysisModel;
});

function geminiResponse(text: string, finishReason: string) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
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
    process.env.GOOGLE_AI_STUDIO_CHAT_MODEL = "gemini-3-flash-preview";
    let requestCount = 0;
    globalThis.fetch = async () => {
      requestCount += 1;
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
    assert.equal(requestCount, 1);
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
    assert.match(reportPrompt, /CV\/profile evidence is a fallback only when no case-study source supports that claim/);
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
