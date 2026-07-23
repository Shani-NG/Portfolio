import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  findLexiconMatches,
  normalizeLexiconText,
  roleFitLexiconVersion,
} from "./lexicon.ts";

describe("Role Fit professional lexicon", () => {
  test("normalizes punctuation, case, and hyphen variants", () => {
    assert.equal(normalizeLexiconText("  UX‐Strategy / Lead  "), "ux strategy lead");
  });

  test("loads the editable bilingual lexicon", () => {
    const english = findLexiconMatches({
      text: "We need a User Experience Researcher for a complex product.",
      language: "en",
      includeDraft: true,
    });

    assert.equal(roleFitLexiconVersion, "0.1.1");
    assert.equal(english[0]?.entry.concept_id, "ux_research");
    assert.equal(english[0]?.matched_by, "alias");
    assert.equal(english[0]?.requires_context, true);
  });

  test("searches draft entries for candidates without treating them as proof", () => {
    const matches = findLexiconMatches({ text: "Product Designer", language: "en" });

    assert.equal(matches[0]?.entry.status, "draft");
    assert.equal(matches[0]?.requires_context, true);
  });
  test("finds Hebrew aliases without translating the source text", () => {
    const hebrew = findLexiconMatches({
      text: "דרושה אסטרטגית חוויית משתמש להובלת מערכות מורכבות",
      language: "he",
      includeDraft: true,
    });

    assert.equal(hebrew[0]?.entry.concept_id, "ux_strategy");
    assert.equal(hebrew[0]?.matched_by, "alias");
  });

  test("can search mixed-language input", () => {
    const mixed = findLexiconMatches({
      text: "UX Strategist / אסטרטגית UX",
      language: "mixed",
      includeDraft: true,
    });

    assert.ok(mixed.some((match) => match.entry.concept_id === "ux_strategy"));
    assert.ok(mixed.every((match) => match.requires_context));
  });

  test("does not treat related titles as direct lexicon matches", () => {
    const matches = findLexiconMatches({
      text: "Market Researcher",
      language: "en",
      includeDraft: true,
    });

    assert.equal(matches.some((match) => match.entry.concept_id === "ux_research"), false);
  });
});


