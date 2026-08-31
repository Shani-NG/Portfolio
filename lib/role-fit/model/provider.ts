export type RoleFitModelProviderName = "gemini";

export type QualitativeReportAnalysis = {
  fitLevel: "strong" | "good" | "partial" | "insufficient" | "out-of-scope";
  fitRationale: string;
  evidenceConfidence: "high" | "medium" | "low" | "insufficient";
  evidenceConfidenceRationale: string;
  skillsCoverageLabel: string;
  items: Array<{
    roleItemIndex: number;
    displayLabel: string;
    importance: "must-have" | "core" | "supporting";
    matchType: "direct" | "semantic" | "transferable" | "partial" | "insufficient-evidence" | "real-gap";
    impact: "strength" | "gap" | "neutral";
    evidenceConfidence: "high" | "medium" | "low" | "insufficient";
    shortRationale: string;
    sharedCapability?: string;
    contextDifference?: string;
    bridgeability?: string;
    unproven?: string;
    evidenceSourceIds: string[];
  }>;
};

export type RoleFitModelInput = {
  roleText: string;
  language: "he" | "en" | "mixed";
  task: "chat" | "analysis";
  maxOutputTokens: number;
  mode?: "fit-analysis" | "report-follow-up";
  diagnosticAttemptPhase?: "initial-analysis" | "composition-repair";
  runtimeState?: string;
  approvedEvidence?: string;
  conversationContext?: string;
  modelOverride?: string;
};

export type RoleFitProviderFailure = {
  ok: false;
  provider: RoleFitModelProviderName;
  model?: string;
  error: "missing-configuration" | "provider-error" | "rate-limited" | "invalid-output";
  safeMessageKey: string;
  detail?: string;
  providerStatus?: number;
  retryable?: boolean;
  retryAfterSeconds?: number;
  diagnostics?: {
    attemptPhase?: "initial-analysis" | "schema-repair" | "composition-repair";
    repairTriggerCategory?: "max_tokens" | "empty_response" | "invalid_json" | "schema_invalid" | "invalid_role_index" | "duplicate_role_index";
    elapsedMs?: number;
    failureCategory?: "provider_timeout" | "network_failure" | "provider_http_503" | "provider_http_429" | "max_tokens" | "invalid_json" | "schema_invalid" | "empty_response" | "invalid_role_index" | "duplicate_role_index" | "unknown_transport_failure";
    finishReason?: string;
    providerStatus?: number;
    retryAfterSeconds?: number;
    responseBodyPresent?: boolean;
    promptTokenCount?: number;
    outputTokenCount?: number;
    totalTokenCount?: number;
  };
};

export type RoleFitChatInput = {
  message: string;
  language: "he" | "en" | "mixed";
  maxOutputTokens: number;
  approvedContext: string;
  mode?: "general-chat" | "report-follow-up";
  runtimeState?: string;
  conversationContext?: string;
};

export type RoleFitChatDiagnostics = {
  primaryModel?: string;
  primaryElapsedMs?: number;
  primaryOutcome: "success" | "timeout" | "429" | "503" | "network" | "max-tokens" | "empty" | "provider-error";
  fallbackUsed: boolean;
  fallbackModel?: string;
  fallbackElapsedMs?: number;
  fallbackOutcome?: "success" | "timeout" | "429" | "503" | "network" | "max-tokens" | "empty" | "provider-error";
  retryOccurred: boolean;
  retryReason?: "max-tokens" | "empty";
  retryElapsedMs?: number;
  retryOutcome?: "success" | "timeout" | "429" | "503" | "network" | "max-tokens" | "empty" | "provider-error";
  totalProviderElapsedMs: number;
};

export type RoleFitModelResult =
  | {
      ok: true;
      provider: RoleFitModelProviderName;
      model: string;
      analysis: QualitativeReportAnalysis;
      diagnostics: {
        providerElapsedMs: number;
        schemaRepairUsed: boolean;
      };
    }
  | RoleFitProviderFailure;

export type RoleFitChatResult =
  | {
      ok: true;
      provider: RoleFitModelProviderName;
      model: string;
      answer: string;
      diagnostics?: RoleFitChatDiagnostics;
    }
  | (Omit<RoleFitProviderFailure, "diagnostics"> & { diagnostics?: RoleFitChatDiagnostics });

export type RoleFitModelProvider = {
  name: RoleFitModelProviderName;
  generateChat(input: RoleFitChatInput): Promise<RoleFitChatResult>;
  generateReport(input: RoleFitModelInput): Promise<RoleFitModelResult>;
};
