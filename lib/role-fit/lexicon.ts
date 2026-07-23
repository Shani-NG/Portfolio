import lexiconData from "../../content/role-fit-professional-lexicon.json" with { type: "json" };

export type LexiconLanguage = "en" | "he" | "mixed";
export type LexiconEntryKind = "title_family" | "capability";
export type LexiconEntryStatus = "draft" | "approved" | "needs_review" | "blocked";

export type LexiconEntry = {
  id: string;
  language: "en" | "he";
  concept_id: string;
  kind: LexiconEntryKind;
  preferred_label: string;
  aliases: string[];
  keywords: string[];
  related_titles: string[];
  not_equivalent: string[];
  context_signals: string[];
  status: LexiconEntryStatus;
};

export type LexiconMatch = {
  entry: LexiconEntry;
  matched_by: "preferred_label" | "alias" | "keyword";
  matched_term: string;
  score: number;
  requires_context: true;
};

const entries = lexiconData.entries as LexiconEntry[];

export const roleFitLexiconVersion = lexiconData.version;

export function normalizeLexiconText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[‐‑‒–—-]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function termMatchesText(text: string, term: string): boolean {
  const normalizedTerm = normalizeLexiconText(term);
  if (!normalizedTerm) return false;

  if (text.includes(normalizedTerm)) return true;

  const termTokens = normalizedTerm.split(" ");
  return termTokens.length === 1 && termTokens[0].length >= 2 && text.split(" ").includes(termTokens[0]);
}

function findMatch(text: string, entry: LexiconEntry): Omit<LexiconMatch, "entry"> | null {
  if (termMatchesText(text, entry.preferred_label)) {
    return {
      matched_by: "preferred_label",
      matched_term: entry.preferred_label,
      score: 1,
      requires_context: true,
    };
  }

  const alias = entry.aliases.find((candidate) => termMatchesText(text, candidate));
  if (alias) {
    return {
      matched_by: "alias",
      matched_term: alias,
      score: 0.9,
      requires_context: true,
    };
  }

  const keyword = entry.keywords.find((candidate) => termMatchesText(text, candidate));
  if (keyword) {
    return {
      matched_by: "keyword",
      matched_term: keyword,
      score: 0.6,
      requires_context: true,
    };
  }

  return null;
}

export function findLexiconMatches(input: {
  text: string;
  language?: LexiconLanguage;
  includeDraft?: boolean;
}): LexiconMatch[] {
  const normalizedText = normalizeLexiconText(input.text);
  if (!normalizedText) return [];

  return entries
    .filter((entry) => {
      const languageMatches = !input.language || input.language === "mixed" || entry.language === input.language;
      const statusMatches = (input.includeDraft ?? true) || entry.status === "approved";
      return languageMatches && statusMatches;
    })
    .map((entry) => {
      const match = findMatch(normalizedText, entry);
      return match ? { entry, ...match } : null;
    })
    .filter((match): match is LexiconMatch => match !== null)
    .sort((left, right) => right.score - left.score || left.entry.id.localeCompare(right.entry.id));
}


