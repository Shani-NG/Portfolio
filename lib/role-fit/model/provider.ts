import type { ReportUIPayload } from "../contracts/index.ts";

export type RoleFitModelProviderName = "mock" | "gemini";

export type RoleFitModelInput = {
  roleText: string;
  language: "he" | "en" | "mixed";
  task: "chat" | "analysis";
  maxOutputTokens: number;
};

export type RoleFitModelResult =
  | {
      ok: true;
      provider: RoleFitModelProviderName;
      report: ReportUIPayload;
    }
  | {
      ok: false;
      provider: RoleFitModelProviderName;
      error: "missing-configuration" | "provider-error" | "invalid-output";
      safeMessageKey: string;
    };

export type RoleFitModelProvider = {
  name: RoleFitModelProviderName;
  generateReport(input: RoleFitModelInput): Promise<RoleFitModelResult>;
};
