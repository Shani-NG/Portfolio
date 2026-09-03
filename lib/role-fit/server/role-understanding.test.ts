import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyRoleDraftCorrection, createRoleDraftFromText, detectRoleCorrection, extractRoleContent, extractStandaloneRoleTitle, isNoRoleTitleAnswer, isPlausibleRoleTitle, looksLikeRoleInput, mergeRoleDraftClarification, mergeStructuredRoleDraft, normalizeRoleTitleClarification, referencesPreviouslyProvidedTitle, resolveEnglishReportTitle, serializeRoleDraftForBoundary, shouldTreatAsRoleClarification, shouldValidateRoleCollectionMessage, validateRoleText, validateStructuredRoleDraft } from "./role-understanding.ts";

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

  it("recognizes Hebrew gender-hyphen role titles at the start of a pasted JD", () => {
    const roleText = [
      "יועץ-ת מוביל-ה לתחום ה-AI About the job התפקיד כולל הובלת תחום הבינה המלאכותית וזיהוי צרכים עסקיים.",
      "תחומי אחריות: הובלת יוזמות AI מקצה לקצה; איסוף והגדרת Use Cases בעלי ערך עסקי גבוה",
      "דרישות התפקיד (חובה): ניסיון בהובלת פרויקטים דיגיטליים או טכנולוגיים; ניסיון בפיתוח או יישום פתרונות AI ואוטומציה",
    ].join("\n");

    const result = validateRoleText({
      conversationId: "conv_he_title",
      traceId: "trace_he_title",
      roleText,
      detectedLanguage: "he",
    });

    assert.equal(isPlausibleRoleTitle("יועץ-ת מוביל-ה לתחום ה-AI"), true);
    assert.equal(extractStandaloneRoleTitle("יועץ-ת מוביל-ה לתחום ה-AI"), "יועץ-ת מוביל-ה לתחום ה-AI");
    assert.equal(result.roleDraft.title?.originalValue, "יועץ-ת מוביל-ה לתחום ה-AI");
    assert.equal(result.parseStatus, "valid-complete");
    assert.deepEqual(result.missingFields, []);
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

  it("rejects unlabeled promotional or media lines as inferred titles", () => {
    const rejectedCandidates = [
      "Sneak peak to our product: https://www.youtube.com/watch?v=F9949Q-_onc&t=9s",
      "Sneak peek at our product",
      "Watch our product demo",
      "Learn more about our product",
      "Visit our product page",
      "Click here for our product overview",
    ];

    for (const candidate of rejectedCandidates) {
      const result = validateRoleText({
        conversationId: "conv_promotional_title",
        traceId: "trace_promotional_title",
        roleText: [
          candidate,
          "Responsibilities: Lead discovery and align product with engineering stakeholders",
          "Requirements: Strong product design and UX strategy experience",
        ].join("\n"),
        detectedLanguage: "en",
      });

      assert.equal(result.roleDraft.title?.originalValue, "");
      assert.deepEqual(result.missingFields, ["title"]);
    }
  });

  it("preserves valid unlabeled product and architecture titles", () => {
    for (const title of ["Product Designer", "Senior Product Designer", "Product Design Lead", "Solution Architect"]) {
      const draft = createRoleDraftFromText([
        title,
        "Responsibilities: Lead discovery and align product with engineering stakeholders",
        "Requirements: Strong relevant design or solution architecture experience",
      ].join("\n"));

      assert.equal(draft.title?.originalValue, title);
    }
  });

  it("keeps an explicitly labeled title authoritative", () => {
    const draft = createRoleDraftFromText([
      "Sneak peek at our product: https://example.com/demo",
      "Title: Senior Product Designer",
      "Responsibilities: Lead product discovery with engineering stakeholders",
      "Requirements: Strong product design and UX strategy experience",
    ].join("\n"));

    assert.equal(draft.title?.originalValue, "Senior Product Designer");
  });

  it("separates a conversational prefix from a complete English JD", () => {
    const roleText = [
      "נסה עבור זאת",
      "Senior Product Innovation Manager",
      "About the job",
      "Lead product and AI innovation programs across complex services.",
      "Responsibilities",
      "Shape product strategy and align cross-functional delivery teams",
      "Requirements",
      "Experience leading product innovation and AI-enabled initiatives",
    ].join("\n");

    const roleContent = extractRoleContent(roleText);
    const draft = createRoleDraftFromText(roleText);

    assert.match(roleContent, /^Senior Product Innovation Manager/);
    assert.doesNotMatch(serializeRoleDraftForBoundary(draft), /נסה עבור זאת/);
    assert.equal(draft.title?.originalValue, "Senior Product Innovation Manager");
  });

  it("keeps a Hebrew canonical title while producing a faithful English report title", () => {
    const canonicalTitle = "אסטרטגית חוויית משתמש בכירה";
    const draft = createRoleDraftFromText([
      "תבדקי לי את זו",
      `תפקיד: ${canonicalTitle}`,
      "תחומי אחריות: הובלת אסטרטגיית חוויית משתמש במערכות מורכבות",
      "דרישות: ניסיון באסטרטגיית UX ובהובלה חוצת תחומים",
    ].join("\n"));

    assert.equal(draft.title?.originalValue, canonicalTitle);
    assert.equal(resolveEnglishReportTitle(canonicalTitle), "Senior UX Strategist");
    assert.doesNotMatch(resolveEnglishReportTitle(canonicalTitle), /[\u0590-\u05ff]/);
  });

  it("keeps a labeled company as company without promoting it to the role title", () => {
    const roleText = [
      "Company: Example Product Team",
      "Responsibilities: Lead product discovery and align stakeholders",
      "Requirements: Strong UX strategy and research experience",
    ].join("\n");

    const result = validateRoleText({
      conversationId: "conv_test",
      traceId: "trace_test",
      roleText,
      detectedLanguage: "en",
    });

    assert.equal(extractStandaloneRoleTitle("Company: Example Product Team"), null);
    assert.equal(result.roleDraft.company?.originalValue, "Example Product Team");
    assert.equal(result.roleDraft.title?.originalValue, "");
    assert.equal(result.parseStatus, "valid-incomplete");
    assert.deepEqual(result.missingFields, ["title"]);
  });

  it("keeps an explicit title authoritative when a labeled company precedes it", () => {
    const roleText = [
      "Company: Example Product Team",
      "Title: Senior UX Strategist",
      "Responsibilities: Lead product discovery and align stakeholders",
      "Requirements: Strong UX strategy and research experience",
    ].join("\n");

    const result = validateRoleText({
      conversationId: "conv_test",
      traceId: "trace_test",
      roleText,
      detectedLanguage: "en",
    });

    assert.equal(result.roleDraft.company?.originalValue, "Example Product Team");
    assert.equal(result.roleDraft.title?.originalValue, "Senior UX Strategist");
    assert.equal(result.parseStatus, "valid-complete");
    assert.deepEqual(result.missingFields, []);
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

  it("preserves a standalone title supplied before the role details", () => {
    const title = extractStandaloneRoleTitle("Senior UX Strategist");
    assert.equal(title, "Senior UX Strategist");
    assert.equal(extractStandaloneRoleTitle("מנהלת מוצר"), "מנהלת מוצר");
    assert.equal(extractStandaloneRoleTitle("שם המשרה: מנהלת מוצר"), "מנהלת מוצר");

    const titleDraft = mergeRoleDraftClarification(undefined, "title", title ?? "");
    const titleValidation = validateStructuredRoleDraft({ conversationId: "conv_test", traceId: "trace_title", roleDraft: titleDraft, detectedLanguage: "en" });
    assert.equal(titleValidation.parseStatus, "valid-incomplete");
    assert.equal(titleValidation.roleDraft.title?.originalValue, "Senior UX Strategist");
    assert.deepEqual(titleValidation.missingFields, ["responsibilities", "requirements"]);

    const detailsDraft = createRoleDraftFromText("Responsibilities: Lead product discovery and align stakeholders across product and engineering teams\nRequirements: Strong UX strategy, research, and stakeholder facilitation experience");
    const completedRole = mergeStructuredRoleDraft(titleDraft, detailsDraft, { replaceCompleteRole: true });
    const completedValidation = validateStructuredRoleDraft({ conversationId: "conv_test", traceId: "trace_details", roleDraft: completedRole, detectedLanguage: "en" });

    assert.equal(completedValidation.parseStatus, "valid-complete");
    assert.equal(completedValidation.roleDraft.title?.originalValue, "Senior UX Strategist");
  });

  it("preserves role details supplied before the standalone title", () => {
    const details = createRoleDraftFromText("Responsibilities: Lead product discovery and align stakeholders across product and engineering teams\nRequirements: Strong UX strategy, research, and stakeholder facilitation experience");
    const detailsValidation = validateStructuredRoleDraft({ conversationId: "conv_test", traceId: "trace_details", roleDraft: details, detectedLanguage: "en" });
    assert.deepEqual(detailsValidation.missingFields, ["title"]);

    const completedRole = mergeRoleDraftClarification(details, "title", "Senior UX Strategist");
    const completedValidation = validateStructuredRoleDraft({ conversationId: "conv_test", traceId: "trace_title", roleDraft: completedRole, detectedLanguage: "en" });

    assert.equal(completedValidation.parseStatus, "valid-complete");
    assert.equal(completedValidation.roleDraft.title?.originalValue, "Senior UX Strategist");
  });

  it("keeps existing responsibilities and requirements when a later title clarification completes the draft", () => {
    const details = createRoleDraftFromText([
      "תחומי אחריות: הובלת יוזמות AI ביחידה מקצה לקצה; תכנון ויישום workflows לתהליכים עסקיים",
      "דרישות: ניסיון בהובלת פרויקטים דיגיטליים; ניסיון בפיתוח או יישום פתרונות AI ואוטומציה",
    ].join("\n"));

    const completedRole = mergeRoleDraftClarification(details, "title", "יועץ-ת מוביל-ה לתחום ה-AI");
    const result = validateStructuredRoleDraft({
      conversationId: "conv_he_title_late",
      traceId: "trace_he_title_late",
      roleDraft: completedRole,
      detectedLanguage: "he",
    });

    assert.equal(result.parseStatus, "valid-complete");
    assert.equal(result.roleDraft.title?.originalValue, "יועץ-ת מוביל-ה לתחום ה-AI");
    assert.equal(result.roleDraft.responsibilities.length, details.responsibilities.length);
    assert.equal(result.roleDraft.requirements.length, details.requirements.length);
    assert.equal(referencesPreviouslyProvidedTitle("שם המשרה כתוב בשורה הראשונה"), true);
  });

  it("does not classify a normal conversational question as a standalone title", () => {
    assert.equal(extractStandaloneRoleTitle("What does a Product Manager do?"), null);
    assert.equal(extractStandaloneRoleTitle("How can a UX strategist help a startup"), null);
    assert.equal(extractStandaloneRoleTitle("Tell me about product strategy"), null);
    assert.equal(extractStandaloneRoleTitle("איך מנהלת מוצר יכולה לעזור לצוות"), null);
  });

  it("treats a long pasted role as role input after a new analysis starts", () => {
    const pastedRole = [
      "Senior Product Designer",
      "We are looking for a designer to lead discovery, align product and engineering, define flows, create prototypes, and support roadmap decisions across complex products.",
      "The ideal candidate has strong UX strategy experience, stakeholder facilitation skills, product design background, and the ability to translate ambiguity into clear direction.",
    ].join("\n");

    assert.equal(shouldValidateRoleCollectionMessage({ message: pastedRole, roleCollectionActive: true }), true);
    assert.equal(shouldValidateRoleCollectionMessage({ message: "Tell me more about Shani", roleCollectionActive: true }), false);
  });

  it("keeps a short Hebrew title when details are added afterward", () => {
    const titleDraft = mergeRoleDraftClarification(undefined, "title", "מנהל מוצר");
    const detailsDraft = createRoleDraftFromText("Responsibilities: Lead product discovery with stakeholders\nRequirements: Strong UX strategy experience");
    const merged = mergeStructuredRoleDraft(titleDraft, detailsDraft, { replaceCompleteRole: true });
    const result = validateStructuredRoleDraft({ conversationId: "conv_test", traceId: "trace_test", roleDraft: merged, detectedLanguage: "he" });

    assert.equal(result.roleDraft.title?.originalValue, "מנהל מוצר");
    assert.equal(result.parseStatus, "valid-complete");
  });

  it("parses a complete Hebrew JD through the approved Hebrew path", () => {
    const roleText = [
      "חברה: חברת מוצר רפואי",
      "תפקיד: אסטרטגית חוויית משתמש בכירה",
      "תיאור המשרה: הובלת חוויית המוצר במערכת רפואית מורכבת",
      "תחומי אחריות: הובלת מחקר משתמשים; הגדרת אסטרטגיית מוצר; עבודה עם צוותי פיתוח",
      "דרישות: ניסיון במערכות מורכבות; ניסיון במחקר משתמשים; הובלה חוצת ארגון",
      "יתרון: ניסיון במוצרים רפואיים",
    ].join("\n");
    const result = validateRoleText({ conversationId: "conv_he", traceId: "trace_he", roleText, detectedLanguage: "he" });

    assert.equal(looksLikeRoleInput(roleText), true);
    assert.equal(result.parseStatus, "valid-complete");
    assert.deepEqual(result.missingFields, []);
    assert.equal(result.roleDraft.company?.originalValue, "חברת מוצר רפואי");
    assert.equal(result.roleDraft.title?.originalValue, "אסטרטגית חוויית משתמש בכירה");
    assert.equal(result.roleDraft.responsibilities.length, 3);
    assert.equal(result.roleDraft.requirements.length, 3);
    assert.equal(result.roleDraft.preferredQualifications.length, 1);
  });

  it("merges a requested title as a labeled deterministic clarification", () => {
    const initialRole = createRoleDraftFromText([
      "Responsibilities: Lead product discovery and align stakeholders",
      "Requirements: Strong UX strategy and research experience",
    ].join("\n"));
    const clarifiedRole = mergeRoleDraftClarification(initialRole, "title", "Senior UX Strategist");

    const result = validateStructuredRoleDraft({
      conversationId: "conv_test",
      traceId: "trace_test",
      roleDraft: clarifiedRole,
      detectedLanguage: "en",
    });

    assert.equal(result.parseStatus, "valid-complete");
    assert.equal(result.roleDraft.title?.originalValue, "Senior UX Strategist");
  });

  it("turns an approved generic category into a usable role title", () => {
    assert.equal(isNoRoleTitleAnswer("There is no title"), true);
    assert.equal(normalizeRoleTitleClarification("UX"), "UX Position");
    assert.equal(normalizeRoleTitleClarification("strategy"), "Strategy Position");

    const clarifiedRole = mergeRoleDraftClarification(
      createRoleDraftFromText("Responsibilities: Lead product discovery\nRequirements: Strong UX strategy experience"),
      "title",
      "AI",
    );
    const result = validateStructuredRoleDraft({ conversationId: "conv_test", traceId: "trace_test", roleDraft: clarifiedRole, detectedLanguage: "en" });
    assert.equal(result.roleDraft.title?.originalValue, "AI Position");
  });

  it("keeps a short title category attached to the existing role draft", () => {
    assert.equal(shouldTreatAsRoleClarification("title", "Innovation"), true);
    assert.equal(
      shouldTreatAsRoleClarification("title", "Title: Innovation Lead\nResponsibilities: Lead discovery\nRequirements: Innovation strategy experience"),
      false,
    );

    const merged = mergeRoleDraftClarification(
      createRoleDraftFromText("Responsibilities: Lead discovery\nRequirements: Innovation strategy experience"),
      "title",
      "Innovation",
    );
    assert.equal(merged.title?.originalValue, "Innovation Position");
  });

  it("appends structured role details to an active incomplete role", () => {
    const titleDraft = mergeRoleDraftClarification(undefined, "title", "UX");
    const detailsDraft = createRoleDraftFromText("Responsibilities: Lead product discovery with stakeholders\nRequirements: Strong UX strategy experience");
    const merged = mergeStructuredRoleDraft(titleDraft, detailsDraft, { replaceCompleteRole: true });
    const result = validateStructuredRoleDraft({ conversationId: "conv_test", traceId: "trace_test", roleDraft: merged, detectedLanguage: "en" });

    assert.equal(result.roleDraft.title?.originalValue, "UX Position");
    assert.equal(result.parseStatus, "valid-complete");
  });

  it("keeps the approved role draft when a report-status follow-up is not a new role", () => {
    const savedRoleDraft = createRoleDraftFromText([
      "Company: Example Systems",
      "Title: Senior UX / Human Factors Specialist",
      "Description: Shape complex operational products",
      "Responsibilities: Lead UX research and product alignment",
      "Requirements: Human factors and complex-system UX experience",
    ].join("\n"));

    const selectedRoleDraft = savedRoleDraft;
    const result = validateStructuredRoleDraft({
      conversationId: "conv_test",
      traceId: "trace_test",
      roleDraft: selectedRoleDraft,
      detectedLanguage: "en",
    });

    assert.equal(selectedRoleDraft, savedRoleDraft);
    assert.equal(result.parseStatus, "valid-complete");
    assert.equal(result.roleDraft.title?.originalValue, "Senior UX / Human Factors Specialist");
  });

  it("detects and applies an explicit title correction", () => {
    const correction = detectRoleCorrection("Actually, the title is Principal Product Designer.");
    assert.deepEqual(correction, { field: "title", value: "Principal Product Designer" });

    const original = createRoleDraftFromText("Company: Acme\nTitle: Senior Product Designer\nResponsibilities: Lead discovery\nRequirements: Product design experience");
    const updated = applyRoleDraftCorrection(original, correction!);
    const result = validateStructuredRoleDraft({ conversationId: "conv_test", traceId: "trace_test", roleDraft: updated, detectedLanguage: "en" });
    assert.equal(result.roleDraft.title?.originalValue, "Principal Product Designer");
  });

  it("merges details-first and title-first flows through the same structured RoleDraft path", () => {
    const details = createRoleDraftFromText("Responsibilities: Lead product discovery and stakeholder alignment\nRequirements: Product strategy and UX research experience");
    const detailsFirst = mergeRoleDraftClarification(details, "title", "Senior UX Strategist");
    assert.equal(detailsFirst.title?.originalValue, "Senior UX Strategist");
    assert.equal(detailsFirst.responsibilities.length, 1);
    assert.equal(detailsFirst.requirements.length, 1);

    const titleFirst = mergeRoleDraftClarification(undefined, "title", "Senior UX Strategist");
    const completed = mergeStructuredRoleDraft(titleFirst, details, { replaceCompleteRole: true });
    assert.equal(completed.title?.originalValue, "Senior UX Strategist");
    assert.equal(completed.responsibilities.length, 1);
    assert.equal(completed.requirements.length, 1);
  });

  it("applies an explicit title correction without losing structured role details", () => {
    const original = createRoleDraftFromText("Title: Product Designer\nResponsibilities: Lead product discovery\nRequirements: Product design experience");
    const corrected = applyRoleDraftCorrection(original, { field: "title", value: "Principal Product Designer" });
    assert.equal(corrected.title?.originalValue, "Principal Product Designer");
    assert.deepEqual(corrected.responsibilities, original.responsibilities);
    assert.deepEqual(corrected.requirements, original.requirements);
  });

  it("replaces an existing role when a new complete JD follows conversational context", () => {
    const oldRole = createRoleDraftFromText("Title: UX Researcher\nResponsibilities: Lead discovery research\nRequirements: UX research experience");
    const newRole = createRoleDraftFromText([
      "ומה לגבי זאת?",
      "Title: AI Implementation Lead",
      "Responsibilities: Lead AI workflow adoption across product teams",
      "Requirements: Experience implementing human-centered AI initiatives",
    ].join("\n"));
    const merged = mergeStructuredRoleDraft(oldRole, newRole, { replaceCompleteRole: true });

    assert.equal(merged.title?.originalValue, "AI Implementation Lead");
    assert.equal(merged.responsibilities.some((item) => /discovery research/i.test(item.originalValue)), false);
  });
});
