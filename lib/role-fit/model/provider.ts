import type { ReportUIPayload } from "../contracts/index.ts";

export type RoleFitModelProviderName = "mock" | "gemini";

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
    evidenceSourceIds: string[];
  }>;
};

export type RoleFitModelInput = {
  roleText: string;
  language: "he" | "en" | "mixed";
  task: "chat" | "analysis";
  maxOutputTokens: number;
  mode?: "fit-analysis" | "report-follow-up";
  runtimeState?: string;
  approvedEvidence?: string;
  conversationContext?: string;
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

export type RoleFitModelResult =
  | {
      ok: true;
      provider: RoleFitModelProviderName;
      model: string;
      report: ReportUIPayload;
    }
  | {
      ok: true;
      provider: RoleFitModelProviderName;
      model: string;
      analysis: QualitativeReportAnalysis;
    }
  | {
      ok: false;
      provider: RoleFitModelProviderName;
      model?: string;
      error: "missing-configuration" | "provider-error" | "invalid-output";
      safeMessageKey: string;
      detail?: string;
    };

export type RoleFitChatResult =
  | {
      ok: true;
      provider: RoleFitModelProviderName;
      model: string;
      answer: string;
    }
  | {
      ok: false;
      provider: RoleFitModelProviderName;
      model?: string;
      error: "missing-configuration" | "provider-error" | "invalid-output";
      safeMessageKey: string;
      detail?: string;
    };

export type RoleFitModelProvider = {
  name: RoleFitModelProviderName;
  generateChat(input: RoleFitChatInput): Promise<RoleFitChatResult>;
  generateReport(input: RoleFitModelInput): Promise<RoleFitModelResult>;
};
