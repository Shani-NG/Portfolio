import type { RoleFitModelResult, RoleFitProviderFailure } from "./provider.ts";

const retryableCategories = new Set(["provider_timeout", "network_failure"]);
const retryDelayMs = 400;

export function shouldRetryReportProviderFailure(failure: RoleFitProviderFailure): boolean {
  return failure.retryable === true && (
    failure.providerStatus === 503
    || failure.providerStatus === 429
    || (failure.providerStatus === undefined && retryableCategories.has(failure.diagnostics?.failureCategory ?? ""))
  );
}

export async function generateReportWithRetry(
  generate: () => Promise<RoleFitModelResult>,
  wait: (milliseconds: number) => Promise<void> = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
): Promise<{ result: RoleFitModelResult; attempts: number }> {
  const first = await generate();
  if (first.ok || !shouldRetryReportProviderFailure(first)) return { result: first, attempts: 1 };

  await wait(retryDelayMs);
  return { result: await generate(), attempts: 2 };
}
