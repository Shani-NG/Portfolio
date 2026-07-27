import { createGeminiRoleFitProvider } from "./gemini.ts";
import { createMockRoleFitProvider } from "./mock.ts";
import type { RoleFitModelProvider, RoleFitModelProviderName } from "./provider.ts";

export function getRoleFitModelProvider(): RoleFitModelProvider {
  const provider = (process.env.ROLE_FIT_MODEL_PROVIDER ?? "mock") as RoleFitModelProviderName;

  if (provider === "gemini") {
    return createGeminiRoleFitProvider();
  }

  return createMockRoleFitProvider();
}

export type { RoleFitModelInput, RoleFitModelProvider, RoleFitModelProviderName, RoleFitModelResult } from "./provider.ts";
