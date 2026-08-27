export type RoleFitPolicy = {
  maxMessagesPerSession: number;
  maxReportsPerSession: 1 | 2;
  maxInputChars: number;
  maxOutputTokens: number;
};

function readNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getRoleFitPolicy(): RoleFitPolicy {
  const maxReports = readNumber("ROLE_FIT_MAX_REPORTS_PER_SESSION", 2);

  return {
    maxMessagesPerSession: readNumber("ROLE_FIT_MAX_MESSAGES_PER_SESSION", 30),
    maxReportsPerSession: maxReports >= 2 ? 2 : 1,
    maxInputChars: readNumber("ROLE_FIT_MAX_INPUT_CHARS", 12000),
    maxOutputTokens: readNumber("ROLE_FIT_MAX_OUTPUT_TOKENS", 2500),
  };
}

export function getGoogleAiStudioModel(task: "chat" | "analysis"): string | undefined {
  if (task === "analysis") {
    return process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL ?? process.env.GOOGLE_AI_STUDIO_MODEL;
  }

  return process.env.GOOGLE_AI_STUDIO_CHAT_MODEL ?? process.env.GOOGLE_AI_STUDIO_MODEL;
}

export function getGoogleAiStudioChatFallbackModel(primaryModel?: string): string | undefined {
  const fallbackModel = process.env.GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL?.trim();
  if (!fallbackModel) return undefined;
  if (primaryModel && fallbackModel === primaryModel) return undefined;
  return fallbackModel;
}
