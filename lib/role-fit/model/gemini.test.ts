import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { loadApprovedEvidence } from "../knowledge/load-approved-evidence.ts";
import { getRoleAnalysisItems } from "../report/compose-report.ts";
import { serializeRoleDraftForBoundary, validateRoleText } from "../server/role-understanding.ts";
import { completeChatAnswer, createGeminiRoleFitProvider } from "./gemini.ts";

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.GEMINI_API_KEY;
const originalChatModel = process.env.GOOGLE_AI_STUDIO_CHAT_MODEL;
const originalChatFallbackModel = process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL;
const originalAnalysisModel = process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL;
const originalReportModel = process.env.GOOGLE_AI_STUDIO_REPORT_MODEL;
const originalAbortSignalTimeout = AbortSignal.timeout;

afterEach(() => {
  globalThis.fetch = originalFetch;
  AbortSignal.timeout = originalAbortSignalTimeout;
  if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalApiKey;
  if (originalChatModel === undefined) delete process.env.GOOGLE_AI_STUDIO_CHAT_MODEL;
  else process.env.GOOGLE_AI_STUDIO_CHAT_MODEL = originalChatModel;
  if (originalChatFallbackModel === undefined) delete process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL;
  else process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL = originalChatFallbackModel;
  if (originalAnalysisModel === undefined) delete process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL;
  else process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = originalAnalysisModel;
  if (originalReportModel === undefined) delete process.env.GOOGLE_AI_STUDIO_REPORT_MODEL;
  else process.env.GOOGLE_AI_STUDIO_REPORT_MODEL = originalReportModel;
});

function captureProviderTimeouts() {
  const timeouts: number[] = [];
  AbortSignal.timeout = (milliseconds) => {
    timeouts.push(milliseconds);
    return originalAbortSignalTimeout(milliseconds);
  };
  return timeouts;
}

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

function validReportAnalysis(roleItemIndex = 0) {
  return JSON.stringify({
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
}

function timeoutError() {
  const error = new Error("provider timed out");
  error.name = "TimeoutError";
  return error;
}

function requestGenerationConfig(request: Record<string, unknown>) {
  return request.generationConfig as Record<string, unknown>;
}

function requestPrompt(request: Record<string, unknown>) {
  return String((request.contents as Array<{ parts: Array<{ text: string }> }>)[0]?.parts[0]?.text);
}

function collectSchemaKeywords(schema: unknown, parentKeyword?: string, keywords = new Set<string>()) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return keywords;

  for (const [key, value] of Object.entries(schema)) {
    if (parentKeyword === "properties" || parentKeyword === "$defs") {
      collectSchemaKeywords(value, undefined, keywords);
    } else {
      keywords.add(key);
      collectSchemaKeywords(value, key, keywords);
    }
  }

  return keywords;
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
    const firstConfig = requestGenerationConfig(requests[0] ?? {});
    const retryConfig = requestGenerationConfig(requests[1] ?? {});
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
    if (!result.ok) return;
    assert.equal(typeof result.diagnostics.providerElapsedMs, "number");
    assert.equal(result.diagnostics.schemaRepairUsed, false);
    assert.deepEqual(models, ["gemini-3.5-flash"]);
  });

  it("uses a request-level timeout override only for the initial report request", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3.5-flash";
    const timeouts = captureProviderTimeouts();
    globalThis.fetch = async () => geminiResponse(validReportAnalysis(0), "STOP");

    const result = await createGeminiRoleFitProvider().generateReport({
      roleText: "Title: Senior UX Strategist",
      language: "en",
      task: "analysis",
      maxOutputTokens: 2500,
      initialProviderTimeoutMs: 90_000,
      approvedEvidence: "### APPROVED_SOURCE_ID: c4i",
      runtimeState: JSON.stringify({ roleItems: [{ originalText: "Complex product strategy", source: "requirement" }] }),
    });

    assert.equal(result.ok, true);
    assert.deepEqual(timeouts, [90_000]);
  });

  it("keeps schema repair at the default timeout after an overridden initial report request", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3.5-flash";
    const timeouts = captureProviderTimeouts();
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return calls === 1
        ? geminiResponse('{"fitLevel":"good"', "MAX_TOKENS")
        : geminiResponse(validReportAnalysis(0), "STOP");
    };

    const result = await createGeminiRoleFitProvider().generateReport({
      roleText: "Title: Senior UX Strategist",
      language: "en",
      task: "analysis",
      maxOutputTokens: 2500,
      initialProviderTimeoutMs: 90_000,
      approvedEvidence: "### APPROVED_SOURCE_ID: c4i",
      runtimeState: JSON.stringify({ roleItems: [{ originalText: "Complex product strategy", source: "requirement" }] }),
    });

    assert.equal(result.ok, true);
    assert.deepEqual(timeouts, [90_000, 45_000]);
  });

  it("keeps default report and Chat requests at 45 seconds", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3.5-flash";
    process.env.GOOGLE_AI_STUDIO_CHAT_MODEL = "gemini-3.5-flash-lite";
    const timeouts = captureProviderTimeouts();
    globalThis.fetch = async (_input, init) => {
      const request = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return requestGenerationConfig(request).responseMimeType === "application/json"
        ? geminiResponse(validReportAnalysis(0), "STOP")
        : geminiResponse("The requested information is ready.", "STOP");
    };

    const reportResult = await createGeminiRoleFitProvider().generateReport({
      roleText: "Title: Senior UX Strategist",
      language: "en",
      task: "analysis",
      maxOutputTokens: 2500,
      approvedEvidence: "### APPROVED_SOURCE_ID: c4i",
      runtimeState: JSON.stringify({ roleItems: [{ originalText: "Complex product strategy", source: "requirement" }] }),
    });
    const chatResult = await createGeminiRoleFitProvider().generateChat({
      message: "What should I review?",
      language: "en",
      maxOutputTokens: 800,
      approvedContext: "Approved profile context.",
    });

    assert.equal(reportResult.ok, true);
    assert.equal(chatResult.ok, true);
    assert.deepEqual(timeouts, [45_000, 45_000]);
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
    const firstConfig = requestGenerationConfig(requests[0] ?? {});
    const retryConfig = requestGenerationConfig(requests[1] ?? {});
    assert.equal(firstConfig.responseMimeType, "application/json");
    assert.ok(firstConfig.responseJsonSchema);
    assert.deepEqual(firstConfig.thinkingConfig, { thinkingLevel: "minimal" });
    assert.equal(firstConfig.maxOutputTokens, 2500);
    assert.ok(retryConfig.responseJsonSchema);
    assert.deepEqual(retryConfig.thinkingConfig, { thinkingLevel: "minimal" });
    assert.equal(retryConfig.maxOutputTokens, 5000);
    assert.equal(result.diagnostics?.attemptPhase, "schema-repair");
    assert.equal(result.diagnostics?.repairTriggerCategory, "max_tokens");
    assert.equal(result.diagnostics?.failureCategory, "max_tokens");
    assert.equal(result.diagnostics?.finishReason, "MAX_TOKENS");
  });

  it("sends a sanitized native Gemini schema while preserving the canonical prompt schema", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3.5-flash";
    const requests: Array<Record<string, unknown>> = [];
    const models: string[] = [];
    globalThis.fetch = async (input, init) => {
      models.push(requestedModel(input));
      requests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return geminiResponse(validReportAnalysis(0), "STOP");
    };

    const result = await createGeminiRoleFitProvider().generateReport({
      roleText: "Title: Senior UX Strategist",
      language: "en",
      task: "analysis",
      modelOverride: "gemini-report",
      maxOutputTokens: 4000,
      approvedEvidence: "### APPROVED_SOURCE_ID: c4i",
      runtimeState: JSON.stringify({ roleItems: [{ originalText: "Complex product strategy", source: "requirement" }] }),
    });

    assert.equal(result.ok, true);
    assert.equal(requests.length, 1);
    assert.deepEqual(models, ["gemini-report"]);
    const config = requestGenerationConfig(requests[0] ?? {});
    assert.equal(config.responseMimeType, "application/json");
    assert.equal(config.maxOutputTokens, 4000);
    assert.ok(config.responseJsonSchema);

    const schema = config.responseJsonSchema as Record<string, unknown>;
    const keywords = collectSchemaKeywords(schema);
    assert.equal(keywords.has("$schema"), false);
    assert.equal(keywords.has("minLength"), false);
    assert.equal(keywords.has("properties"), true);
    assert.equal(keywords.has("required"), true);
    assert.equal(keywords.has("additionalProperties"), true);

    const topLevelProperties = schema.properties as Record<string, unknown>;
    assert.ok(topLevelProperties.fitRationale);
    assert.ok(topLevelProperties.items);

    const prompt = requestPrompt(requests[0] ?? {});
    assert.match(prompt, /Exact qualitative analysis JSON Schema:/);
    assert.match(prompt, /"minLength":1/);
  });

  it("keeps the maximum five-item compact inference package within the static budget without closing the evidence ladder", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3-flash-preview";
    const fixture = [
      "Title: Senior UX Strategist",
      "Responsibilities: Lead product discovery and align stakeholders",
      "Requirements: Complex-system UX strategy; Cross-functional product alignment; Evidence-based decisions; Conversation design; Privacy-aware product architecture",
    ].join("\n");
    const validation = validateRoleText({
      conversationId: "static_packing_test",
      traceId: "static_packing_test",
      roleText: fixture,
      detectedLanguage: "en",
    });
    const roleText = serializeRoleDraftForBoundary(validation.roleDraft);
    const roleItems = getRoleAnalysisItems(validation.roleDraft).slice(0, 5);
    const evidence = await loadApprovedEvidence(roleText, roleItems);
    let request: Record<string, unknown> | undefined;
    globalThis.fetch = async (_input, init) => {
      request = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return geminiResponse(validReportAnalysis(0), "STOP");
    };

    const result = await createGeminiRoleFitProvider().generateReport({
      roleText,
      language: "en",
      task: "analysis",
      maxOutputTokens: 4_000,
      runtimeState: JSON.stringify({ validation, roleItems }),
      approvedEvidence: evidence.promptContext,
    });

    assert.equal(result.ok, true);
    assert.ok(request);
    const prompt = requestPrompt(request);
    const estimatedInputTokens = Math.ceil(prompt.length / 4);
    const compactSourceIds = [...prompt.matchAll(/^EVIDENCE_ID: ([^\s|]+)/gm)].map((match) => match[1]);
    const candidateCounts = [...prompt.matchAll(/^ROLE_ITEM_CANDIDATE_SOURCE_IDS: (.+)$/gm)].map((match) =>
      match[1] === "none" ? 0 : match[1]!.split(", ").length,
    );
    const richSourceIds = [...prompt.matchAll(/^### APPROVED_SOURCE_ID: ([^\s]+)/gm)].map((match) => match[1]);
    const projectTitles = new Set([...prompt.matchAll(/\| PROJECT: ([^|\n]+)/g)].map((match) => match[1]?.trim()));

    assert.equal(roleItems.length, 5);
    assert.ok(estimatedInputTokens >= 10_000 && estimatedInputTokens <= 12_000, `estimated ${estimatedInputTokens} input tokens`);
    assert.ok(compactSourceIds.length <= 12);
    assert.deepEqual(candidateCounts, [4, 5, 5, 2, 5]);
    assert.equal(richSourceIds.length, 4);
    assert.ok(projectTitles.size >= 4);
    assert.match(prompt, /transferable capabilities, limitations, and ownership boundaries/);
    assert.match(prompt, /Any exact EVIDENCE_ID in the compact approved index may support any role item/);
    assert.match(prompt, /EVIDENCE_ID: cv/);
    assert.match(prompt, /direct case study, semantic\/contextual case study, transferable case study, legitimate reuse, CV fallback, then insufficient evidence/);
    for (const sourceId of [...compactSourceIds, ...richSourceIds]) {
      assert.ok(evidence.sources.some((source) => source.id === sourceId), sourceId);
    }
    assert.ok((evidence.candidatesByRoleItem?.[0]?.candidates.length ?? 0) > candidateCounts[0]!);
  });

  it("uses the same native schema for schema repair and caps repair output at 5000", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3.5-flash";
    const requests: Array<Record<string, unknown>> = [];
    globalThis.fetch = async (_input, init) => {
      requests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return requests.length === 1
        ? geminiResponse('{"fitLevel":"good"}', "STOP")
        : geminiResponse(validReportAnalysis(0), "STOP");
    };

    const result = await createGeminiRoleFitProvider().generateReport({
      roleText: "Title: Senior UX Strategist",
      language: "en",
      task: "analysis",
      maxOutputTokens: 4000,
      approvedEvidence: "### APPROVED_SOURCE_ID: c4i",
      runtimeState: JSON.stringify({ roleItems: [{ originalText: "Complex product strategy", source: "requirement" }] }),
    });

    assert.equal(result.ok, true);
    assert.equal(requests.length, 2);
    const firstConfig = requestGenerationConfig(requests[0] ?? {});
    const repairConfig = requestGenerationConfig(requests[1] ?? {});
    assert.equal(firstConfig.maxOutputTokens, 4000);
    assert.equal(repairConfig.maxOutputTokens, 5000);
    assert.deepEqual(repairConfig.responseJsonSchema, firstConfig.responseJsonSchema);
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
    assert.equal(result.diagnostics?.attemptPhase, "initial-analysis");
    assert.equal(result.diagnostics?.failureCategory, "provider_http_429");
    assert.equal(result.diagnostics?.providerStatus, 429);
    assert.equal(result.diagnostics?.retryAfterSeconds, 34);
    assert.equal(result.diagnostics?.responseBodyPresent, true);
  });

  it("classifies report transport failures without a provider status as retryable", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3-flash-preview";
    globalThis.fetch = (async () => { throw new Error("network down"); }) as typeof fetch;

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
    assert.equal(result.error, "provider-error");
    assert.equal(result.providerStatus, undefined);
    assert.equal(result.retryable, true);
    assert.equal(result.diagnostics?.attemptPhase, "initial-analysis");
    assert.equal(result.diagnostics?.failureCategory, "network_failure");
    assert.equal(result.diagnostics?.responseBodyPresent, false);
  });

  it("classifies provider 503 report failures as retryable without using a fallback model", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3.5-flash";
    const models: string[] = [];
    globalThis.fetch = (async (input) => {
      models.push(requestedModel(input));
      return new Response(JSON.stringify({ error: { message: "overloaded" } }), { status: 503, statusText: "Service Unavailable" });
    }) as typeof fetch;

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
    assert.equal(result.providerStatus, 503);
    assert.equal(result.retryable, true);
    assert.equal(result.diagnostics?.attemptPhase, "initial-analysis");
    assert.equal(result.diagnostics?.failureCategory, "provider_http_503");
    assert.equal(result.diagnostics?.providerStatus, 503);
    assert.equal(result.diagnostics?.responseBodyPresent, true);
    assert.deepEqual(models, ["gemini-3.5-flash"]);
  });

  it("keeps permanent report provider errors non-retryable", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3.5-flash";
    globalThis.fetch = (async () => new Response(JSON.stringify({ error: { message: "unauthorized" } }), { status: 401, statusText: "Unauthorized" })) as typeof fetch;

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
    assert.equal(result.providerStatus, 401);
    assert.equal(result.retryable, undefined);
  });

  it("records a max_tokens repair trigger when the schema-repair call times out", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3-flash-preview";
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      if (calls === 1) return geminiResponse('{"fitLevel":"strong"', "MAX_TOKENS");
      throw timeoutError();
    };

    const result = await createGeminiRoleFitProvider().generateReport({
      roleText: "Title: Senior UX Strategist",
      language: "en",
      task: "analysis",
      maxOutputTokens: 2500,
      approvedEvidence: "### APPROVED_SOURCE_ID: c4i",
      runtimeState: JSON.stringify({ roleItems: [{ originalText: "Complex product strategy", source: "requirement" }] }),
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error, "provider-error");
    assert.equal(result.retryable, true);
    assert.equal(result.diagnostics?.attemptPhase, "schema-repair");
    assert.equal(result.diagnostics?.repairTriggerCategory, "max_tokens");
    assert.equal(result.diagnostics?.failureCategory, "provider_timeout");
    assert.equal(result.diagnostics?.responseBodyPresent, false);
  });

  it("records an invalid_json repair trigger when the schema-repair call has a network failure", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3-flash-preview";
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      if (calls === 1) return geminiResponse("not json", "STOP");
      throw new Error("network down");
    };

    const result = await createGeminiRoleFitProvider().generateReport({
      roleText: "Title: Senior UX Strategist",
      language: "en",
      task: "analysis",
      maxOutputTokens: 2500,
      approvedEvidence: "### APPROVED_SOURCE_ID: c4i",
      runtimeState: JSON.stringify({ roleItems: [{ originalText: "Complex product strategy", source: "requirement" }] }),
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.retryable, true);
    assert.equal(result.diagnostics?.attemptPhase, "schema-repair");
    assert.equal(result.diagnostics?.repairTriggerCategory, "invalid_json");
    assert.equal(result.diagnostics?.failureCategory, "network_failure");
  });

  it("records schema_invalid, invalid_role_index, and duplicate_role_index repair triggers", async () => {
    for (const [firstText, expectedCategory] of [
      ['{"fitLevel":"good"}', "schema_invalid"],
      [validReportAnalysis(3), "invalid_role_index"],
      [JSON.stringify({
        fitLevel: "good",
        fitRationale: "Approved evidence supports the role context.",
        evidenceConfidence: "high",
        evidenceConfidenceRationale: "The assessment uses approved project evidence.",
        skillsCoverageLabel: "Evidence-backed coverage",
        items: [
          JSON.parse(validReportAnalysis(0)).items[0],
          JSON.parse(validReportAnalysis(0)).items[0],
        ],
      }), "duplicate_role_index"],
    ] as const) {
      process.env.GEMINI_API_KEY = "test-key";
      process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3-flash-preview";
      let calls = 0;
      globalThis.fetch = async () => {
        calls += 1;
        if (calls === 1) return geminiResponse(firstText, "STOP");
        throw new Error("network down");
      };

      const result = await createGeminiRoleFitProvider().generateReport({
        roleText: "Title: Senior UX Strategist",
        language: "en",
        task: "analysis",
        maxOutputTokens: 2500,
        approvedEvidence: "### APPROVED_SOURCE_ID: c4i",
        runtimeState: JSON.stringify({
          roleItems: [
            { originalText: "Complex product strategy", source: "requirement" },
            { originalText: "Strategic systems thinking", source: "requirement" },
          ],
        }),
      });

      assert.equal(result.ok, false);
      if (result.ok) return;
      assert.equal(result.retryable, true);
      assert.equal(result.diagnostics?.attemptPhase, "schema-repair");
      assert.equal(result.diagnostics?.repairTriggerCategory, expectedCategory);
      assert.equal(result.diagnostics?.failureCategory, "network_failure");
    }
  });

  it("captures safe usage metadata token counts when Gemini returns them", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "gemini-3-flash-preview";
    globalThis.fetch = async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: validReportAnalysis(0) }] }, finishReason: "STOP" }],
      usageMetadata: {
        promptTokenCount: 1200,
        candidatesTokenCount: 340,
        totalTokenCount: 1540,
      },
    }), { status: 200, headers: { "Content-Type": "application/json" } });

    const result = await createGeminiRoleFitProvider().generateReport({
      roleText: "Title: Senior UX Strategist",
      language: "en",
      task: "analysis",
      maxOutputTokens: 2500,
      approvedEvidence: "### APPROVED_SOURCE_ID: c4i",
      runtimeState: JSON.stringify({ roleItems: [{ originalText: "Complex product strategy", source: "requirement" }] }),
    });

    assert.equal(result.ok, true);
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
    const reportPrompt = requestPrompt(requests[0] ?? {});
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
    const retryPrompt = requestPrompt(requests[1] ?? {});
    assert.match(retryPrompt, /allowed=0;received=3/);
  });
});
