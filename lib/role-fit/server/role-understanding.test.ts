import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { goldenCorpusFixtures } from "./golden-corpus/fixtures.ts";
import { getRoleAnalysisItems } from "../report/compose-report.ts";
import { applyRoleDraftCorrection, clearRoleDraftField, createRoleDraftFromText, detectRoleCorrection, extractRoleContent, extractStandaloneRoleTitle, isNoRoleTitleAnswer, isPlausibleRoleTitle, isRoleTitleRejection, looksLikeRoleInput, mergeRoleDraftClarification, mergeStructuredRoleDraft, normalizeCompanyName, normalizeRoleTitleClarification, referencesPreviouslyProvidedTitle, resolveEnglishReportTitle, roleIntakeChatState, serializeRoleDraftForBoundary, shouldTreatAsRoleClarification, shouldValidateRoleCollectionMessage, validateRoleText, validateStructuredRoleDraft } from "./role-understanding.ts";

describe("Role Fit pasted job understanding", () => {
  it("admits the exact Gong replay JD and keeps its canonical role fields clean", () => {
    // PR13 completed this exact replay; keep its intake behavior while retaining PR19 validation and confirmation gates.
    const roleText = "Senior Product Designer\nAbout the job\nGong harnesses the power of AI to transform how revenue teams win. The Gong Revenue AI Operating System unifies data, insights, and workflows into a single, trusted system that observes, guides, and acts alongside the world’s most successful revenue teams. Powered by the Gong Revenue Graph, AI-powered intelligence, specialized agents, and trusted applications, Gong helps more than 5,000 companies around the world deeply understand their teams and customers, automate critical sales workflows, and close more deals with less effort. For more information, visit [www.gong.io](http://www.gong.io).\nAt Gong, you will join a company built on innovative products, ambitious goals, and passionate people. We are shaping the future of revenue intelligence and we want people who are excited to build what comes next. You will work with a team that dreams big, moves fast, and cares deeply about the craft and about each other. Here, transparency and trust are core to how we operate, and every person has the opportunity to make a visible impact. If you want to grow, stretch, and do work that truly matters, Gong is the place to do the best work of your career.\nWe’re seeking a highly motivated, Senior Product Designer to play a key role in designing, exploring, and continually delivering innovative solutions and experiences. If you have a passion for creating innovative products and thrive on identifying and solving user needs, we want you!\nYou'll Own\nDrive the user experience and design for one of Gong’s key product areas.\nLead end-to-end design processes- from ideation and wireframes to polished, high-fidelity designs.\nChampion user-centered design principles and act as the voice of the user across the product lifecycle.\nHelp shape and refine Gong’s UI pattern libraries and design guidelines.\nTake ownership of creating intuitive, scalable, and impactful product experiences.\nYou'll Solve\nResearch and deeply understand complex user problems in B2B SaaS environments.\nTransform complicated workflows into elegant, simple, and easy-to-use solutions.\nBalance strategic thinking with attention to detail while designing flows and interfaces.\nCollaborate closely with Product Managers and Engineers to bring ideas to life.\nUse prototyping, user research, and testing methodologies to validate and improve solutions.\nYou'll Impact\nCreate exceptional UX experiences that turn users into loyal advocates and “raving fans.”\nInfluence how revenue teams worldwide work more productively and make smarter decisions.\nContribute to products used by more than 4,500 companies globally.\nHelp build innovative AI-powered experiences that drive measurable business outcomes.\nBe part of Gong’s “Own. Solve. Impact.” culture by delivering meaningful product and customer impact.\nHow You’ll Succeed Here\n8+ years of experience designing flows, experiences, and UI for web and mobile products, preferably in B2B SaaS.\nStrong skills in both rapid and high-fidelity prototyping.\nExperience creating clear, intuitive, and user-friendly designs.\nA highly creative and self-driven mindset with strong problem-solving abilities.\nAbility to simplify complex challenges into elegant solutions.\nPassion for crafting exceptional user experiences.\nExperience with user research methodologies and usability testing.\nProficiency with Figma and other design tools.\nStrong collaboration and interpersonal skills.\nExcellent communication, presentation, and organizational abilities.\nHigh level of written and verbal English.\nPortfolio showcasing recent relevant work.\nDegree in a related field (Design, Human Factors Engineering, Cognitive / Applied Psychology)- an advantage.\nWhat makes the Product Design department at Gong unique?\nHere at Gong, we trust and empower our employees with ownership to solve complex problems, make the right decisions, and build the best products that create radical impact. We call this “Own. Solve. Impact.”\nBeing a Product Designer at Gong is all about engaging with customers, understanding their needs, and building great products to address those needs. We have empowered teams. Each product designer works closely with a product manager and an engineering team to drive forward an agenda or domain. The pod is responsible for working with customers, iterating towards a great solution, and driving it towards success. There are many amazingly talented PDs to work with, collaborate, learn from, and contribute from your own knowledge.\nWe encourage our employees to express their personality and identity (whether gender, ethnic, religious, or sexual), and we ensure fairness and equal opportunities. We follow a hybrid working model that combines working from home, on the go, or at the office. This allows us: flexibility, autonomy, positive work relationships, and effective work habits.\nIf these considerations are important to you when choosing a work place, we'd love to see you with us.";
    const result = validateRoleText({ conversationId: "gong_replay", traceId: "gong_replay", roleText, detectedLanguage: "en" });
    const draft = result.roleDraft;

    assert.equal(looksLikeRoleInput(roleText), true);
    assert.equal(shouldValidateRoleCollectionMessage({ message: roleText, roleCollectionActive: false }), true);
    assert.equal(result.parseStatus, "valid-complete");
    assert.equal(roleIntakeChatState(result), "awaiting-report-confirmation");
    assert.equal(draft.title?.originalValue, "Senior Product Designer");
    assert.equal(draft.company?.originalValue, "Gong");
    assert.ok(draft.responsibilities.some((item) => item.originalValue.startsWith("Drive the user experience")));
    assert.ok(draft.responsibilities.some((item) => item.originalValue.startsWith("Research and deeply understand")));
    assert.ok(draft.requirements.some((item) => item.originalValue.startsWith("8+ years of experience")));
    assert.ok(draft.preferredQualifications.some((item) => item.originalValue.startsWith("Degree in a related field")));
    assert.equal(draft.requirements.some((item) => item.originalValue.includes("What makes the Product Design department")), false);
    assert.equal(draft.requirements.some((item) => item.originalValue.includes("We encourage our employees")), false);
    assert.equal(draft.responsibilities.some((item) => item.originalValue.includes("Be part of Gong's")), false);
    assert.deepEqual(createRoleDraftFromText(`Uploaded file: gong.txt\n\n${roleText}`), draft);
    assert.equal(
      serializeRoleDraftForBoundary(mergeStructuredRoleDraft(draft, createRoleDraftFromText(roleText))),
      serializeRoleDraftForBoundary(draft),
    );
  });

  it("finds a source title at the end of a Markdown JD without losing its earlier role details", () => {
    const roleText = [
      "## About the job",
      "At Gong, we’re seeking a highly motivated, Senior Product Designer to design product experiences.",
      "**You'll Own**",
      "- Drive the user experience and design for a key product area.",
      "- Lead end-to-end design processes with product and engineering teams.",
      "**How You’ll Succeed Here**",
      "- 8+ years of experience designing flows and UI for web products.",
      "- Portfolio showcasing recent relevant work.",
      "**What makes the department unique?**",
      "Our design team owns complex customer problems.",
      "SENIOR PRODUCT DESIGNER",
    ].join("\n\n");
    const result = validateRoleText({ conversationId: "tail_title", traceId: "tail_title", roleText, detectedLanguage: "en" });

    assert.equal(looksLikeRoleInput(roleText), true);
    assert.equal(result.parseStatus, "valid-complete");
    assert.equal(roleIntakeChatState(result), "awaiting-report-confirmation");
    assert.equal(result.roleDraft.title?.originalValue, "SENIOR PRODUCT DESIGNER");
    assert.ok(result.roleDraft.responsibilities.some((item) => item.originalValue.startsWith("Drive the user experience")));
    assert.ok(result.roleDraft.requirements.some((item) => item.originalValue.startsWith("8+ years")));
  });

  it("accepts natural role headings while keeping an incomplete JD on the existing clarification path", () => {
    const complete = [
      "Service Design Lead",
      "What You'll Shape",
      "Lead service discovery across complex customer journeys.",
      "Design prototypes with product and engineering partners.",
      "To Succeed In This Role",
      "Strong experience in service design and research.",
      "Portfolio showing end-to-end design work.",
    ].join("\n");
    const incomplete = [
      "Service Design Lead",
      "You'll Own",
      "Lead service discovery across complex customer journeys.",
      "Design prototypes with product and engineering partners.",
      "About Us",
      "Our company has years of experience delivering digital services.",
    ].join("\n");

    assert.equal(looksLikeRoleInput(complete), true);
    assert.equal(validateRoleText({ conversationId: "natural", traceId: "natural", roleText: complete, detectedLanguage: "en" }).parseStatus, "valid-complete");
    assert.equal(looksLikeRoleInput(incomplete), true);
    const incompleteResult = validateRoleText({ conversationId: "incomplete", traceId: "incomplete", roleText: incomplete, detectedLanguage: "en" });
    assert.equal(incompleteResult.parseStatus, "valid-incomplete");
    assert.equal(roleIntakeChatState(incompleteResult), "awaiting-role-completion");
    assert.deepEqual(incompleteResult.missingFields, ["requirements"]);
  });

  it("infers unfamiliar standalone section boundaries from the source lines that follow", () => {
    const roleText = [
      "Product Research Lead",
      "The Work Ahead",
      "Lead interviews to uncover product needs.",
      "Design studies with product and engineering teams.",
      "Candidate Profile",
      "Strong experience conducting mixed-method research.",
      "Portfolio showing clear research outcomes.",
      "Our Team Culture",
      "We are a collaborative and supportive group.",
    ].join("\n");
    const result = validateRoleText({ conversationId: "unknown", traceId: "unknown", roleText, detectedLanguage: "en" });

    assert.equal(looksLikeRoleInput(roleText), true);
    assert.equal(result.parseStatus, "valid-complete");
    assert.deepEqual(result.roleDraft.responsibilities.map((item) => item.originalValue), [
      "Lead interviews to uncover product needs.",
      "Design studies with product and engineering teams.",
    ]);
    assert.deepEqual(result.roleDraft.requirements.map((item) => item.originalValue), [
      "Strong experience conducting mixed-method research.",
      "Portfolio showing clear research outcomes.",
    ]);
  });

  it("keeps source duties, candidate criteria, and company context in separate fields", () => {
    const roleText = [
      "Senior Service Designer",
      "You'll Own",
      "Lead discovery with customers and stakeholders.",
      "Strong experience running service design research.",
      "Our team values thoughtful collaboration.",
      "How You'll Succeed Here",
      "Design prototypes with engineers and product managers.",
      "Portfolio showing clear service design outcomes.",
    ].join("\n");
    const draft = createRoleDraftFromText(roleText);
    const responsibilities = draft.responsibilities.map((item) => item.originalValue);
    const requirements = draft.requirements.map((item) => item.originalValue);

    assert.equal(looksLikeRoleInput(roleText), true);
    assert.deepEqual(responsibilities, [
      "Lead discovery with customers and stakeholders.",
      "Design prototypes with engineers and product managers.",
    ]);
    assert.deepEqual(requirements, [
      "Strong experience running service design research.",
      "Portfolio showing clear service design outcomes.",
    ]);
    assert.equal(draft.description?.originalValue.includes("Our team values thoughtful collaboration."), true);
  });

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

  it("requires structural lines for headings instead of detecting them inside continuous prose", () => {
    const continuous =
      "Product Design Lead About the role Own the end-to-end product design practice. Responsibilities Lead discovery and align teams. What You Have 8+ years in product design. Preferred Qualifications Enterprise SaaS experience.";
    const structured = [
      "Product Design Lead",
      "About the role",
      "Own the end-to-end product design practice.",
      "Responsibilities",
      "Lead discovery and align teams.",
      "What You Have",
      "8+ years in product design.",
      "Preferred Qualifications",
      "Enterprise SaaS experience.",
    ].join("\n");

    const continuousDraft = createRoleDraftFromText(continuous);
    const structuredDraft = createRoleDraftFromText(structured);

    assert.equal(continuousDraft.responsibilities.length, 0);
    assert.equal(continuousDraft.requirements.length, 0);
    assert.equal(continuousDraft.preferredQualifications.length, 0);
    assert.equal(looksLikeRoleInput(continuous), false);
    assert.equal(structuredDraft.responsibilities.length, 1);
    assert.equal(structuredDraft.requirements.length, 1);
    assert.equal(structuredDraft.preferredQualifications.length, 1);
  });

  it("recognizes standalone bold Markdown headings without treating prose as structure", () => {
    const structured = [
      "We're looking for a Senior Product Designer to join the team.",
      "**About The Role**",
      "- Design complex workflows",
      "- Validate solutions with customers",
      "**Requirements**",
      "- 5+ years of product design experience",
      "**Nice to have**",
      "- Conversational interface experience",
    ].join("\n");
    const prose = "Our team discusses **requirements** and **nice to have** ideas as part of ordinary product planning.";

    const draft = createRoleDraftFromText(structured);
    assert.equal(looksLikeRoleInput(structured), true);
    assert.equal(draft.title?.originalValue, "Senior Product Designer");
    assert.deepEqual(draft.responsibilities.map((item) => item.originalValue), ["Design complex workflows", "Validate solutions with customers"]);
    assert.deepEqual(draft.requirements.map((item) => item.originalValue), ["5+ years of product design experience"]);
    assert.deepEqual(draft.preferredQualifications.map((item) => item.originalValue), ["Conversational interface experience"]);
    assert.equal(looksLikeRoleInput(prose), false);
  });

  it("preserves the frozen Golden Corpus structure and source-backed content", async () => {
    const normalize = (value: string) => value
      .normalize("NFKC")
      .replaceAll("’", "'")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    for (const fixture of goldenCorpusFixtures) {
      const sourceText = await readFile(new URL(`./golden-corpus/source/${fixture.sourceFile}`, import.meta.url), "utf8");
      const draft = createRoleDraftFromText(sourceText);
      const validation = validateStructuredRoleDraft({
        conversationId: `golden_${fixture.id}`,
        traceId: `golden_${fixture.id}`,
        roleDraft: draft,
        detectedLanguage: /[\u0590-\u05ff]/.test(sourceText) ? "mixed" : "en",
      });
      const outputItems = [
        ...(draft.description?.originalValue ?? "").split(/\r?\n/).filter(Boolean),
        ...draft.responsibilities.map((item) => item.originalValue),
        ...draft.requirements.map((item) => item.originalValue),
        ...draft.preferredQualifications.map((item) => item.originalValue),
      ];
      const searchableOutput = normalize(outputItems.join("\n"));
      const searchableSource = normalize(sourceText);

      assert.equal(validation.parseStatus, "valid-complete", `${fixture.id} should be structurally complete`);
      assert.equal(looksLikeRoleInput(sourceText), true, `${fixture.id} should pass structural admission`);
      if (fixture.expectedCompany) assert.equal(draft.company?.originalValue, fixture.expectedCompany, `${fixture.id} company`);
      assert.equal(draft.title?.originalValue, fixture.expectedTitle, `${fixture.id} title`);
      assert.deepEqual({
        responsibilities: draft.responsibilities.length,
        requirements: draft.requirements.length,
        preferred: draft.preferredQualifications.length,
      }, fixture.expectedCounts, `${fixture.id} structural cardinality`);
      assert.equal(getRoleAnalysisItems(draft).length, draft.responsibilities.length + draft.requirements.length, `${fixture.id} roleItems integrity`);
      for (const item of outputItems.filter(Boolean)) {
        assert.equal(searchableSource.includes(normalize(item)), true, `${fixture.id} output must remain source-backed: ${item}`);
      }
      for (const fragment of fixture.criticalSourceFragments) {
        assert.equal(searchableOutput.includes(normalize(fragment)), true, `${fixture.id} lost critical source fragment: ${fragment}`);
      }
      for (const fragment of fixture.contaminationFragments) {
        assert.equal(searchableOutput.includes(normalize(fragment)), false, `${fixture.id} contains contamination: ${fragment}`);
      }

      const uploadedDraft = createRoleDraftFromText(`Uploaded file: ${fixture.sourceFile}\n\n${sourceText}`);
      assert.deepEqual(uploadedDraft, draft, `${fixture.id} upload transport must converge with pasted text`);
      assert.equal(looksLikeRoleInput(`Uploaded file: ${fixture.sourceFile}\n\n${sourceText}`), true, `${fixture.id} upload should pass structural admission`);
    }
  });

  it("does not admit isolated headings, professional keywords, or long prose without role structure", () => {
    const negativeCases = [
      "Job Description",
      "Qualifications",
      "Can you explain product strategy requirements?",
      "Can you tell me about the Senior Product Designer case study in your portfolio?",
      "I am a product designer and want advice about responsibilities, qualifications, stakeholder alignment, research, and design systems for my next career move.",
      "Job Description\nThis paragraph describes a collaborative workplace but supplies no source-backed title, responsibilities, or requirements.",
    ];

    for (const message of negativeCases) assert.equal(looksLikeRoleInput(message), false, message);
  });

  it("admits structured role details without a title so the existing title clarification can complete them", () => {
    const details = "Responsibilities: Lead product discovery with stakeholders\nRequirements: Strong UX strategy experience";
    assert.equal(looksLikeRoleInput(details), true);
    const draft = createRoleDraftFromText(details);
    const completed = mergeRoleDraftClarification(draft, "title", "Senior UX Strategist");
    const validation = validateStructuredRoleDraft({ conversationId: "conv_structured", traceId: "trace_structured", roleDraft: completed, detectedLanguage: "en" });
    assert.equal(validation.parseStatus, "valid-complete");
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

  it("extracts only high-confidence company introductions", () => {
    const labeled = createRoleDraftFromText("Company: Base44\nTitle: Product Designer\nResponsibilities: Lead discovery\nRequirements: Product design experience");
    const introduced = createRoleDraftFromText("We're Base44, a newly acquired part of Wix.\nTitle: Product Designer\nResponsibilities: Lead discovery\nRequirements: Product design experience");
    const atCompany = createRoleDraftFromText("At monday.com, we build collaborative products.\nTitle: Product Designer\nResponsibilities: Lead discovery\nRequirements: Product design experience");
    const domainHiring = createRoleDraftFromText("monday.com is looking for a Product Designer\nResponsibilities: Lead discovery\nRequirements: Product design experience");
    const labeledDescription = createRoleDraftFromText("Company: monday.com is a work operating system\nTitle: Product Designer\nResponsibilities: Lead discovery\nRequirements: Product design experience");
    const ambiguous = createRoleDraftFromText("Our team partners with Wix on shared initiatives.\nTitle: Product Designer\nResponsibilities: Lead discovery\nRequirements: Product design experience");
    const ownedProduct = createRoleDraftFromText("Harmony is a voice-agent platform.\nWe're a monday.com company.\nTitle: Product Designer\nResponsibilities: Lead discovery\nRequirements: Product design experience");
    const productOnly = createRoleDraftFromText("Harmony is a voice-agent platform.\nTitle: Product Designer\nResponsibilities: Lead discovery\nRequirements: Product design experience");

    assert.equal(normalizeCompanyName("Base44, a newly acquired part of Wix"), "Base44");
    assert.equal(labeled.company?.originalValue, "Base44");
    assert.equal(introduced.company?.originalValue, "Base44");
    assert.equal(atCompany.company?.originalValue, "monday.com");
    assert.equal(domainHiring.company?.originalValue, "monday.com");
    assert.equal(labeledDescription.company?.originalValue, "monday.com");
    assert.equal(ambiguous.company?.originalValue, "");
    assert.equal(ownedProduct.company?.originalValue, "monday.com");
    assert.equal(productOnly.company?.originalValue, "");
  });

  it("keeps an explicitly optional Hebrew qualification out of hard requirements", () => {
    const draft = createRoleDraftFromText([
      "שם המשרה: מנהל.ת מוצר",
      "תחומי אחריות",
      "הובלת מפת דרכים ותהליכי מוצר",
      "דרישות",
      "ניסיון של 3 שנים בניהול מוצר – חובה",
      "ניסיון בניהול תוכניות מורכבות – יתרון משמעותי",
    ].join("\n"));

    assert.deepEqual(draft.requirements.map((item) => item.originalValue), ["ניסיון של 3 שנים בניהול מוצר – חובה"]);
    assert.deepEqual(draft.preferredQualifications.map((item) => item.originalValue), ["ניסיון בניהול תוכניות מורכבות – יתרון משמעותי"]);
  });

  it("normalizes explicit company clarifications before report generation", () => {
    const clarified = mergeRoleDraftClarification(undefined, "company", "monday.com, the work operating system");
    const corrected = applyRoleDraftCorrection(
      createRoleDraftFromText("Company: Acme\nTitle: Product Designer\nResponsibilities: Lead discovery\nRequirements: Product design experience"),
      { field: "company", value: "monday.com, the work operating system" },
    );

    assert.equal(clarified.company?.originalValue, "monday.com");
    assert.equal(corrected.company?.originalValue, "monday.com");
  });

  it("keeps company optional for an otherwise valid role", () => {
    const roleDraft = createRoleDraftFromText("Title: Product Designer\nResponsibilities: Lead product discovery and align the delivery team\nRequirements: Strong product design and user research experience");
    const result = validateStructuredRoleDraft({
      conversationId: "conv_company_optional",
      traceId: "trace_company_optional",
      roleDraft,
      detectedLanguage: "en",
    });

    assert.equal(roleDraft.company?.originalValue, "");
    assert.equal(result.parseStatus, "valid-complete");
    assert.deepEqual(result.missingFields, []);
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

  it("uses an explicit hiring sentence in a Rubrik-like JD without promoting chrome or awards", () => {
    const roleText = [
      "Based in Tel Aviv office, in hybrid model.",
      "About Rubrik",
      "Rubrik helps organizations protect and recover business data.",
      "About Team & About Role",
      "We are looking for a highly-skilled UX Designer for our Israel site to join a product team.",
      "- Red Dot design Award",
      "- iF Design Award",
      "- Rubrik Design Medium Page",
      "Sneak peak to our product:",
      "https://www.youtube.com/watch?v=F9949Q-_onc&t=9s",
      "What You'll Do",
      "Own end-to-end design work for complex user workflows",
      "Collaborate with product and engineering on discovery and delivery",
      "What You'll Bring To The Team",
      "Strong UX design experience in product teams",
      "Ability to translate complex requirements into clear interaction flows",
      "Rubrik is an Equal Opportunity Employer.",
      "Join Us in Securing the World's Data",
    ].join("\n");

    const result = validateRoleText({
      conversationId: "conv_rubrik",
      traceId: "trace_rubrik",
      roleText,
      detectedLanguage: "en",
    });

    assert.equal(isPlausibleRoleTitle("Sneak peak to our product: https://www.youtube.com/watch?v=F9949Q-_onc&t=9s"), false);
    assert.equal(isPlausibleRoleTitle("Product Designer example.com/apply"), false);
    assert.equal(isPlausibleRoleTitle("Sneak peek to our product:"), false);
    assert.equal(isPlausibleRoleTitle("Watch our product overview"), false);
    assert.equal(isPlausibleRoleTitle("Rubrik"), false);
    assert.equal(isPlausibleRoleTitle("Red Dot design Award"), false);
    assert.equal(isPlausibleRoleTitle("iF Design Award"), false);
    assert.equal(isPlausibleRoleTitle("Rubrik Design Medium Page"), false);
    assert.equal(result.parseStatus, "valid-complete");
    assert.deepEqual(result.missingFields, []);
    assert.equal(result.roleDraft.company?.originalValue, "Rubrik");
    assert.equal(result.roleDraft.title?.originalValue, "UX Designer");
    assert.notEqual(result.roleDraft.title?.originalValue, "Sneak peak to our product:");
    assert.notEqual(result.roleDraft.title?.originalValue, "https://www.youtube.com/watch?v=F9949Q-_onc&t=9s");
    assert.equal(result.roleDraft.title?.confirmed, true);
    assert.ok(result.roleDraft.responsibilities.length >= 2);
    assert.ok(result.roleDraft.requirements.length >= 2);
    assert.doesNotMatch(serializeRoleDraftForBoundary(result.roleDraft), /Red Dot|iF Design|Medium Page|Equal Opportunity/);
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

  it("clears only a rejected title and lets a replacement title complete the preserved draft", () => {
    const original = createRoleDraftFromText("Title: Product Designer\nResponsibilities: Lead product discovery\nRequirements: Product design experience");
    const titleRejected = clearRoleDraftField(original, "title");
    const rejectedValidation = validateStructuredRoleDraft({ conversationId: "conv_test", traceId: "trace_rejected", roleDraft: titleRejected, detectedLanguage: "he" });
    const corrected = mergeRoleDraftClarification(titleRejected, "title", "Senior Product Designer");
    const correctedValidation = validateStructuredRoleDraft({ conversationId: "conv_test", traceId: "trace_corrected", roleDraft: corrected, detectedLanguage: "en" });

    assert.equal(isRoleTitleRejection("שם המשרה לא נכון"), true);
    assert.equal(isRoleTitleRejection("the job title is wrong"), true);
    assert.equal(titleRejected.title, undefined);
    assert.deepEqual(titleRejected.responsibilities, original.responsibilities);
    assert.deepEqual(titleRejected.requirements, original.requirements);
    assert.equal(rejectedValidation.parseStatus, "valid-incomplete");
    assert.deepEqual(rejectedValidation.missingFields, ["title"]);
    assert.equal(correctedValidation.parseStatus, "valid-complete");
    assert.equal(correctedValidation.roleDraft.title?.originalValue, "Senior Product Designer");
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
