import type { RoleFitModelResult, RoleFitProviderFailure } from "./provider.ts";

const retryableCategories = new Set(["provider_timeout", "network_failure"]);
const retryDelayMs = 400;
const maxInlineRetryDelayMs = 25_000;

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
  observe?: (attempt: number, result?: RoleFitModelResult) => void,
): Promise<{ result: RoleFitModelResult; attempts: number }> {
  observe?.(1);
  const first = await generate();
  observe?.(1, first);
  if (first.ok || !shouldRetryReportProviderFailure(first)) return { result: first, attempts: 1 };

  const requestedDelayMs = first.retryAfterSeconds === undefined
    ? retryDelayMs
    : Math.max(retryDelayMs, first.retryAfterSeconds * 1_000);
  if (requestedDelayMs > maxInlineRetryDelayMs) return { result: first, attempts: 1 };

  await wait(requestedDelayMs);
  observe?.(2);
  const second = await generate();
  observe?.(2, second);
  return { result: second, attempts: 2 };
}
