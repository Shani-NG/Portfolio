import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { existingReportAnswer, genericRoleTitleAnswer, isReportConfirmationText, missingDetailsAnswer, readyForReportAnswer, reportLimitAnswer, resolveConversationLanguage, roleSubmissionSetupAnswer } from "./behavior.ts";

describe("Role Fit conversation behavior", () => {
  it("keeps a Hebrew conversation in Hebrew when an English JD is pasted", () => {
    const jd = "Senior Product Designer\nResponsibilities: Lead product discovery and collaborate with engineering.\nQualifications: 8+ years of product design experience.";
    assert.equal(resolveConversationLanguage(jd, "he"), "he");
  });

  it("switches when the visitor clearly continues in the other language", () => {
    assert.equal(resolveConversationLanguage("Can we continue in English?", "he"), "en");
    assert.equal(resolveConversationLanguage("אפשר להמשיך בעברית?", "en"), "he");
  });

  it("asks one focused clarification and shortens repeated-input copy", () => {
    assert.equal(missingDetailsAnswer({ missingField: "responsibilities", language: "en", repeatedInput: false }), "What are the role's main responsibilities or expected outcomes?");
    assert.match(missingDetailsAnswer({ missingField: "requirements", language: "he", repeatedInput: true }), /^הפרט הזה עדיין חסר:/);
  });

  it("lists multiple missing details as short scannable bullets", () => {
    assert.equal(
      missingDetailsAnswer({
        missingField: "title",
        missingFields: ["title", "responsibilities", "requirements"],
        language: "en",
        repeatedInput: false,
      }),
      "To create the report, I still need:\n- Role title\n- Main responsibilities\n- Main requirements or qualifications\nYou can add them in one message.",
    );
  });

  it("offers approved generic title categories after a no-title answer", () => {
    const answer = genericRoleTitleAnswer("en");
    assert.match(answer, /- UX\n- Strategy\n- Innovation\n- AI/);
  });

  it("accepts short confirmations with normal punctuation", () => {
    assert.equal(isReportConfirmationText("Yes!"), true);
    assert.equal(isReportConfirmationText("כן."), true);
    assert.equal(isReportConfirmationText("not yet"), false);
  });

  it("requests explicit report confirmation after role completion", () => {
    const answer = readyForReportAnswer({ title: "Senior Product Designer", companyName: "Acme", language: "he", repeatedInput: false });
    assert.match(answer, /Senior Product Designer/);
    assert.match(answer, /שנמשיך\?$/);
    assert.doesNotMatch(answer, /[“”„"]/);
  });

  it("provides contextual deterministic copy without generic chatbot filler", () => {
    assert.match(roleSubmissionSetupAnswer("he"), /להעלות קובץ או להדביק/);
    assert.match(existingReportAnswer("en"), /active report/);
    assert.match(reportLimitAnswer("en"), /report limit/);
  });
});
