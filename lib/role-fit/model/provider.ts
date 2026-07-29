import type { ReportUIPayload } from "../contracts/index.ts";

export type RoleFitModelProviderName = "mock" | "gemini";

export type RoleFitModelInput = {
  roleText: string;
  language: "he" | "en" | "mixed";
  task: "chat" | "analysis";
  maxOutputTokens: number;
};

export type RoleFitChatInput = {
  message: string;
  language: "he" | "en" | "mixed";
  maxOutputTokens: number;
  approvedContext: string;
};

export type RoleFitModelResult =
  | {
      ok: true;
      provider: RoleFitModelProviderName;
      model: string;
      report: ReportUIPayload;
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
