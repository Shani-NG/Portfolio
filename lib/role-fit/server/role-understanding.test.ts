import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyRoleCorrection, createRoleDraftFromText, detectRoleCorrection, isNoRoleTitleAnswer, looksLikeRoleInput, mergeRoleClarification, normalizeRoleTitleClarification, resolveRoleTextForValidation, shouldTreatAsRoleClarification, shouldValidateRoleCollectionMessage, validateRoleText } from "./role-understanding.ts";

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

  it("extracts required experience, location, and work model from the role context", () => {
    const roleText = [
      "Senior UX Strategist",
      "Location: Tel Aviv, Israel (Hybrid)",
      "Responsibilities: Lead operational product strategy",
      "Requirements: Minimum 8+ years of relevant experience",
    ].join("\n");

    const draft = createRoleDraftFromText(roleText);

    assert.equal(draft.yearsOfExperience?.originalValue, 8);
    assert.equal(draft.location?.originalValue, "Tel Aviv, Israel");
    assert.equal(draft.workModel?.originalValue, "Hybrid");
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

  it("does not promote setup instructions to the role title", () => {
    const roleText = [
      "Great, I am going to upload a role",
      "Responsibilities: Lead product discovery and align stakeholders",
      "Requirements: Strong UX strategy and research experience",
    ].join("\n");

    const result = validateRoleText({
      conversationId: "conv_test",
      traceId: "trace_test",
      roleText,
      detectedLanguage: "en",
    });

    assert.equal(result.roleDraft.title?.originalValue, "");
    assert.deepEqual(result.missingFields, ["title"]);
  });

  it("does not promote a responsibility sentence when the first line is a section heading", () => {
    const roleText = [
      "About the role",
      "Translate user research and business objectives into clear, elegant, high-converting design",
      "Responsibilities",
      "Lead product discovery and align stakeholders",
      "Requirements",
      "Strong UX strategy and research experience",
    ].join("\n");

    const result = validateRoleText({ conversationId: "conv_test", traceId: "trace_test", roleText, detectedLanguage: "en" });
    assert.equal(result.roleDraft.title?.originalValue, "");
    assert.deepEqual(result.missingFields, ["title"]);
  });

  it("accepts a title-only reply while role collection is active", () => {
    assert.equal(shouldValidateRoleCollectionMessage({ message: "UX", roleCollectionActive: true }), true);
    assert.equal(shouldValidateRoleCollectionMessage({ message: "UX", roleCollectionActive: false }), false);
    assert.equal(shouldValidateRoleCollectionMessage({ message: "Tell me about Shani", roleCollectionActive: true }), false);
  });

  it("merges a requested title as a labeled deterministic clarification", () => {
    const initialRole = [
      "Responsibilities: Lead product discovery and align stakeholders",
      "Requirements: Strong UX strategy and research experience",
    ].join("\n");
    const clarifiedRole = mergeRoleClarification(initialRole, "title", "Senior UX Strategist");

    const result = validateRoleText({
      conversationId: "conv_test",
      traceId: "trace_test",
      roleText: clarifiedRole,
      detectedLanguage: "en",
    });

    assert.equal(result.parseStatus, "valid-complete");
    assert.equal(result.roleDraft.title?.originalValue, "Senior UX Strategist");
  });

  it("turns an approved generic category into a usable role title", () => {
    assert.equal(isNoRoleTitleAnswer("There is no title"), true);
    assert.equal(normalizeRoleTitleClarification("UX"), "UX Position");
    assert.equal(normalizeRoleTitleClarification("strategy"), "Strategy Position");

    const clarifiedRole = mergeRoleClarification(
      "Responsibilities: Lead product discovery\nRequirements: Strong UX strategy experience",
      "title",
      "AI",
    );
    const result = validateRoleText({ conversationId: "conv_test", traceId: "trace_test", roleText: clarifiedRole, detectedLanguage: "en" });
    assert.equal(result.roleDraft.title?.originalValue, "AI Position");
  });

  it("keeps a short title category attached to the existing role draft", () => {
    assert.equal(shouldTreatAsRoleClarification("title", "Innovation"), true);
    assert.equal(
      shouldTreatAsRoleClarification("title", "Title: Innovation Lead\nResponsibilities: Lead discovery\nRequirements: Innovation strategy experience"),
      false,
    );

    const merged = resolveRoleTextForValidation({
      message: "Innovation",
      savedRoleText: "Responsibilities: Lead discovery\nRequirements: Innovation strategy experience",
      pendingField: "title",
      hasRoleInput: false,
      hasReportIntent: false,
    });
    assert.match(merged, /Title: Innovation Position/);
  });

  it("appends structured role details to an active incomplete role", () => {
    const merged = resolveRoleTextForValidation({
      message: "Responsibilities: Lead product discovery with stakeholders\nRequirements: Strong UX strategy experience",
      savedRoleText: "Title: UX Position",
      pendingField: "responsibilities",
      hasRoleInput: true,
      hasReportIntent: false,
    });
    const result = validateRoleText({ conversationId: "conv_test", traceId: "trace_test", roleText: merged, detectedLanguage: "en" });

    assert.equal(result.roleDraft.title?.originalValue, "UX Position");
    assert.equal(result.parseStatus, "valid-complete");
  });

  it("keeps the approved role draft when a report-status follow-up is not a new role", () => {
    const savedRoleText = [
      "Company: Example Systems",
      "Title: Senior UX / Human Factors Specialist",
      "Description: Shape complex operational products",
      "Responsibilities: Lead UX research and product alignment",
      "Requirements: Human factors and complex-system UX experience",
    ].join("\n");

    const selectedRoleText = resolveRoleTextForValidation({
      message: "I don't see the report",
      savedRoleText,
      hasRoleInput: false,
      hasReportIntent: true,
    });
    const result = validateRoleText({
      conversationId: "conv_test",
      traceId: "trace_test",
      roleText: selectedRoleText,
      detectedLanguage: "en",
    });

    assert.equal(selectedRoleText, savedRoleText);
    assert.equal(result.parseStatus, "valid-complete");
    assert.equal(result.roleDraft.title?.originalValue, "Senior UX / Human Factors Specialist");
  });

  it("detects and applies an explicit title correction", () => {
    const correction = detectRoleCorrection("Actually, the title is Principal Product Designer.");
    assert.deepEqual(correction, { field: "title", value: "Principal Product Designer" });

    const updated = applyRoleCorrection(
      "Company: Acme\nTitle: Senior Product Designer\nResponsibilities: Lead discovery\nRequirements: Product design experience",
      correction!,
    );
    const result = validateRoleText({ conversationId: "conv_test", traceId: "trace_test", roleText: updated, detectedLanguage: "en" });
    assert.equal(result.roleDraft.title?.originalValue, "Principal Product Designer");
  });
});
