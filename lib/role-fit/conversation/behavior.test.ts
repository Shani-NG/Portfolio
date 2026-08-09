import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { existingReportAnswer, missingDetailsAnswer, readyForReportAnswer, reportLimitAnswer, resolveConversationLanguage, roleSubmissionSetupAnswer } from "./behavior.ts";

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

  it("requests explicit report confirmation after role completion", () => {
    const answer = readyForReportAnswer({ title: "Senior Product Designer", companyName: "Acme", language: "he", repeatedInput: false });
    assert.match(answer, /Senior Product Designer/);
    assert.match(answer, /שנמשיך\?$/);
  });

  it("provides contextual deterministic copy without generic chatbot filler", () => {
    assert.match(roleSubmissionSetupAnswer("he"), /להעלות קובץ או להדביק/);
    assert.match(existingReportAnswer("en"), /active report/);
    assert.match(reportLimitAnswer("en"), /report limit/);
  });
});
