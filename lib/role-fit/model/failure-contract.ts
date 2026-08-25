import type { RoleFitProviderFailure } from "./provider.ts";

export type ReportProviderFailureContract = {
  status: number;
  body: {
    state: "provider-retryable" | "model-unavailable";
    provider: RoleFitProviderFailure["provider"];
    model?: string;
    error: RoleFitProviderFailure["error"];
    safeMessageKey: string;
    safeMessage: string;
    retryable: boolean;
    providerStatus?: number;
    retryAfterSeconds?: number;
    detail?: string;
  };
};

const temporaryProviderMessage = "The analysis service is temporarily busy. Your job details are saved. Try generating the report again shortly.";
const genericProviderMessage = "I couldn't generate the report this time. Your role details are still here. Please try again later.";

export function createReportProviderFailureContract(failure: RoleFitProviderFailure): ReportProviderFailureContract {
  if (failure.error === "rate-limited" && failure.providerStatus === 429) {
    return {
      status: 429,
      body: {
        state: "provider-retryable",
        provider: failure.provider,
        ...(failure.model ? { model: failure.model } : {}),
        error: "rate-limited",
        safeMessageKey: failure.safeMessageKey,
        safeMessage: temporaryProviderMessage,
        retryable: true,
        providerStatus: 429,
        ...(failure.retryAfterSeconds !== undefined ? { retryAfterSeconds: failure.retryAfterSeconds } : {}),
      },
    };
  }

  return {
    status: 503,
    body: {
      state: "model-unavailable",
      provider: failure.provider,
      ...(failure.model ? { model: failure.model } : {}),
      error: failure.error,
      safeMessageKey: failure.safeMessageKey,
      safeMessage: genericProviderMessage,
      retryable: false,
      ...(failure.providerStatus !== undefined ? { providerStatus: failure.providerStatus } : {}),
      ...(failure.error === "invalid-output" && failure.detail ? { detail: failure.detail } : {}),
    },
  };
}
