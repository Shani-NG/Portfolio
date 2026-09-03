import type { RoleFitModelResult } from "./provider.ts";

export const publicReportRetryTimeoutMs = 45_000;
export const earlyProvider503MaxElapsedMs = 10_000;
export const earlyRetryRouteElapsedLimitMs = 15_000;

function providerElapsedMs(result: RoleFitModelResult) {
  return result.ok ? result.diagnostics.providerElapsedMs : result.diagnostics?.elapsedMs ?? 0;
}

function attemptOutcome(result: RoleFitModelResult) {
  if (result.ok) return "success";
  return result.diagnostics?.failureCategory ?? result.error;
}

export function shouldRetryEarlyPublicReport503(input: {
  result: RoleFitModelResult;
  routeElapsedMs: number;
}) {
  const { result, routeElapsedMs } = input;
  return !result.ok
    && result.retryable === true
    && result.providerStatus === 503
    && result.diagnostics?.attemptPhase === "initial-analysis"
    && result.diagnostics.failureCategory === "provider_http_503"
    && providerElapsedMs(result) <= earlyProvider503MaxElapsedMs
    && routeElapsedMs <= earlyRetryRouteElapsedLimitMs;
}

function attemptDiagnostic(attempt: 1 | 2, result: RoleFitModelResult) {
  return {
    attempt,
    attemptPhase: attempt === 1 ? "initial-analysis" as const : "initial-analysis-retry" as const,
    elapsedMs: providerElapsedMs(result),
    outcome: attemptOutcome(result),
    ...(!result.ok && result.providerStatus !== undefined ? { providerStatus: result.providerStatus } : {}),
  };
}

export async function retryEarlyPublicReport503(input: {
  initialResult: RoleFitModelResult;
  routeElapsedMs: number;
  retry: () => Promise<RoleFitModelResult>;
}) {
  const firstAttempt = attemptDiagnostic(1, input.initialResult);
  if (!shouldRetryEarlyPublicReport503({ result: input.initialResult, routeElapsedMs: input.routeElapsedMs })) {
    return {
      result: input.initialResult,
      retryUsed: false,
      attempts: [firstAttempt],
      totalProviderElapsedMs: firstAttempt.elapsedMs,
      finalOutcome: firstAttempt.outcome,
    };
  }

  const retryResult = await input.retry();
  const retryAttempt = attemptDiagnostic(2, retryResult);
  return {
    result: retryResult,
    retryUsed: true,
    attempts: [firstAttempt, retryAttempt],
    totalProviderElapsedMs: firstAttempt.elapsedMs + retryAttempt.elapsedMs,
    finalOutcome: retryAttempt.outcome,
  };
}
