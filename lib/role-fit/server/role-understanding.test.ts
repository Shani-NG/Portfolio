import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRoleDraftFromText, looksLikeRoleInput, validateRoleText } from "./role-understanding.ts";

describe("Role Fit pasted job understanding", () => {
  it("recognizes LinkedIn sections with curly apostrophes", () => {
    const roleText = [
      "Senior UX Strategist",
      "About the job",
      "Lead strategic UX work for complex products.",
      "What You’ll Do",
      "Shape product direction",
      "Align product and engineering",
      "What We’re Looking For",
      "Experience leading UX strategy",
      "Strong stakeholder facilitation",
      "Nice to Have",
      "Experience with AI-enabled workflows",
    ].join("\n");

    const result = validateRoleText({
      conversationId: "conv_test",
      traceId: "trace_test",
      roleText,
      detectedLanguage: "en",
    });

    assert.equal(looksLikeRoleInput(roleText), true);
    assert.equal(result.parseStatus, "valid-complete");
    assert.deepEqual(result.missingFields, []);
    assert.equal(result.roleDraft.responsibilities.length, 2);
    assert.equal(result.roleDraft.requirements.length, 2);
    assert.equal(result.roleDraft.preferredQualifications.length, 1);
  });

  it("recognizes headings embedded in continuous text", () => {
    const roleText =
      "Product Design Lead About the role Own the end-to-end product design practice. Responsibilities Lead discovery and align teams. What You Have 8+ years in product design. Preferred Qualifications Enterprise SaaS experience.";

    const draft = createRoleDraftFromText(roleText);

    assert.equal(looksLikeRoleInput(roleText), true);
    assert.equal(draft.responsibilities.length, 1);
    assert.equal(draft.requirements.length, 1);
    assert.equal(draft.preferredQualifications.length, 1);
  });

  it("treats preferred qualifications as optional", () => {
    const roleText = [
      "Title: UX Research Lead",
      "Responsibilities: Lead discovery research",
      "Requirements: Experience with mixed-method research",
    ].join("\n");

    const result = validateRoleText({
      conversationId: "conv_test",
      traceId: "trace_test",
      roleText,
      detectedLanguage: "en",
    });

    assert.equal(result.parseStatus, "valid-complete");
  });

  it("maps key responsibilities and qualifications into required role fields", () => {
    const roleText = [
      "Product Designer",
      "KEY RESPONSIBILITIES",
      "Lead product discovery with product and engineering",
      "Create user flows and prototypes for complex workflows",
      "QUALIFICATIONS",
      "Strong UX and Figma experience",
      "Ability to communicate clearly with stakeholders",
    ].join("\n");

    const result = validateRoleText({
      conversationId: "conv_test",
      traceId: "trace_test",
      roleText,
      detectedLanguage: "en",
    });

    assert.equal(result.parseStatus, "valid-complete");
    assert.equal(result.roleDraft.responsibilities.length, 2);
    assert.equal(result.roleDraft.requirements.length, 2);
  });

  it("infers responsibilities and requirements from item content when headings are weak", () => {
    const roleText = [
      "UX Strategy Lead",
      "Lead discovery and align product direction with engineering teams",
      "Deliver prototypes and support decision-making in complex workflows",
      "Strong product UX experience",
      "Figma",
    ].join("\n");

    const result = validateRoleText({
      conversationId: "conv_test",
      traceId: "trace_test",
      roleText,
      detectedLanguage: "en",
    });

    assert.equal(result.parseStatus, "valid-complete");
    assert.ok(result.roleDraft.responsibilities.length >= 1);
    assert.ok(result.roleDraft.requirements.length >= 1);
  });
});
