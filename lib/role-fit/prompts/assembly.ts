import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type PromptMode = "general-chat" | "fit-analysis" | "report-follow-up";

export type PromptAssemblyInput = {
  mode: PromptMode;
  language: "he" | "en" | "mixed";
  runtimeState?: string;
  approvedEvidence?: string;
  conversationContext?: string;
  userInput: string;
};

const canonicalPromptCache = new Map<string, string>();

function getCanonicalPromptPath() {
  return (
    process.env.ROLE_FIT_CANONICAL_PROMPT_PATH ??
    join(
      process.cwd(),
      "PORTFOLIO_IMPLEMENTATION",
      "role-fit-agent",
      "docs",
      "canonical",
      "Final_Portfolio_Agent_System_Prompt.md",
    )
  );
}

function section(title: string, content: string | undefined) {
  const trimmed = content?.trim();
  return trimmed ? `## ${title}\n${trimmed}` : undefined;
}

function modeInstruction(mode: PromptMode) {
  if (mode === "fit-analysis") {
    return "Active internal mode: Fit Analysis. Analyze role fit only from approved evidence supplied by the application. Do not create evidence, scores, rankings, hiring recommendations, or claims that are not supported.";
  }

  if (mode === "report-follow-up") {
    return "Active internal mode: Report Follow-up. Answer questions about the existing report and supplied context only. Do not regenerate, expand, or contradict the validated report state.";
  }

  return "Active internal mode: Role Understanding / General Chat. Answer concise portfolio questions, guide role submission, and do not generate a report inside normal chat.";
}

function languageInstruction(language: PromptAssemblyInput["language"]) {
  if (language === "he") {
    return "Active language: Hebrew. Respond in Hebrew. When referring to yourself as the agent, use feminine Hebrew form. Address the user in gender-neutral Hebrew unless their gender is explicit.";
  }

  if (language === "mixed") {
    return "Active language: mixed. Prefer the user's current conversation language. If responding in Hebrew, use feminine self-reference and gender-neutral user address unless gender is explicit.";
  }

  return "Active language: English. Respond in English unless the user clearly switches language.";
}

export function loadCanonicalSystemPrompt(): string {
  const promptPath = getCanonicalPromptPath();
  const cached = canonicalPromptCache.get(promptPath);

  if (cached) return cached;

  if (!existsSync(promptPath)) {
    throw new Error(`Canonical Portfolio Agent System Prompt is missing at: ${promptPath}`);
  }

  const content = readFileSync(promptPath, "utf8").trim();

  if (!content) {
    throw new Error(`Canonical Portfolio Agent System Prompt is empty at: ${promptPath}`);
  }

  canonicalPromptCache.set(promptPath, content);
  return content;
}

export function buildPortfolioAgentPrompt(input: PromptAssemblyInput): string {
  const canonicalPrompt = loadCanonicalSystemPrompt();
  const parts = [
    canonicalPrompt,
    section("Runtime Mode", modeInstruction(input.mode)),
    section("Runtime Language", languageInstruction(input.language)),
    section("Deterministic Runtime State", input.runtimeState),
    section("Retrieved Approved Evidence", input.approvedEvidence),
    section("Relevant Conversation Context", input.conversationContext),
    section("Current User Input", input.userInput),
  ];

  return parts.filter(Boolean).join("\n\n---\n\n");
}
