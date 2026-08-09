import { createGeminiRoleFitProvider } from "./gemini.ts";
import type { RoleFitModelProvider, RoleFitModelProviderName } from "./provider.ts";

export function getRoleFitModelProvider(): RoleFitModelProvider {
  return createGeminiRoleFitProvider();
}

export type { RoleFitModelInput, RoleFitModelProvider, RoleFitModelProviderName, RoleFitModelResult } from "./provider.ts";
