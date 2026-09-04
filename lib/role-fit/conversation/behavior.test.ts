import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  existingReportAnswer,
  genericRecoverableErrorAnswer,
  genericRoleTitleAnswer,
  isReportConfirmationText,
  missingDetailsAnswer,
  previouslyProvidedTitleAnswer,
  readyForReportAnswer,
  reportLimitAnswer,
  reportLoadingAnswer,
  reportReadyAnswer,
  reportRetryableFailureAnswer,
  resolveConversationLanguage,
  roleFileErrorAnswer,
  roleSubmissionSetupAnswer,
} from "./behavior.ts";

describe("Role Fit conversation behavior", () => {
  it("keeps a Hebrew conversation in Hebrew when an English JD is pasted", () => {
    const jd = "Senior Product Designer\nResponsibilities: Lead product discovery and collaborate with engineering.\nQualifications: 8+ years of product design experience.";
    assert.equal(resolveConversationLanguage(jd, "he"), "he");
  });

  it("switches when the visitor clearly continues in the other language", () => {
    assert.equal(resolveConversationLanguage("Can we continue in English?", "he"), "en");
    assert.equal(resolveConversationLanguage("אפשר להמשיך בעברית?", "en"), "he");
  });

  it("asks one focused clarification without exposing field-validation language", () => {
    assert.match(missingDetailsAnswer({ missingField: "responsibilities", language: "en", repeatedInput: false }), /what the person in this role would be expected to lead/i);
    assert.match(missingDetailsAnswer({ missingField: "requirements", language: "he", repeatedInput: true }), /כדי להבין מה החברה מחפשת באמת/);
    assert.doesNotMatch(missingDetailsAnswer({ missingField: "requirements", language: "he", repeatedInput: true }), /הפרט הזה עדיין חסר/);
  });

  it("lists multiple missing details as short scannable bullets", () => {
    assert.equal(
      missingDetailsAnswer({
        missingField: "title",
        missingFields: ["title", "responsibilities", "requirements"],
        language: "en",
        repeatedInput: false,
      }),
      "I have part of the job description. To assess it responsibly, I still need:\n- Role title\n- Main responsibilities\n- Main requirements or qualifications\nYou can send the details together, briefly and in your own words.",
    );

    assert.match(
      missingDetailsAnswer({
        missingField: "title",
        missingFields: ["title", "responsibilities", "requirements"],
        language: "he",
        repeatedInput: false,
      }),
      /^קיבלתי חלק מתיאור המשרה/,
    );
  });

  it("offers approved generic title categories after a no-title answer", () => {
    const answer = genericRoleTitleAnswer("en");
    assert.match(answer, /- UX or Product Design\n- Strategy\n- Innovation\n- AI or AI Product/);
    assert.match(answer, /does not determine the fit result/);
  });

  it("accepts short confirmations with normal punctuation", () => {
    assert.equal(isReportConfirmationText("Yes!"), true);
    assert.equal(isReportConfirmationText("כן."), true);
    assert.equal(isReportConfirmationText("Please generate the report again"), true);
    assert.equal(isReportConfirmationText("let's try again"), true);
    assert.equal(isReportConfirmationText("retry the report"), true);
    assert.equal(isReportConfirmationText("not yet"), false);
    assert.equal(isReportConfirmationText("continue exploring the portfolio"), false);
  });

  it("requests explicit report confirmation after role completion", () => {
    const answer = readyForReportAnswer({
      title: "Senior Product Designer",
      companyName: "Acme",
      responsibilities: ["Lead product discovery", "Collaborate with engineering"],
      language: "he",
      repeatedInput: false,
    });
    assert.match(answer, /Senior Product Designer/);
    assert.match(answer, /Lead product discovery/);
    assert.match(answer, /אפשר שאכין את בדיקת ההתאמה/);
    assert.match(answer, /אפשר לתקן אותו לפני שאמשיך/);
    assert.doesNotMatch(answer, /התאמה חזקה|התאמה טובה|פער|נקודת חוזק/);
    assert.doesNotMatch(answer, /[“”„"]/);
  });

  it("provides contextual deterministic copy without generic chatbot filler", () => {
    assert.match(roleSubmissionSetupAnswer("he"), /אין צורך לסדר אותו במיוחד/);
    assert.match(roleSubmissionSetupAnswer("en"), /does not need to be specially formatted/);
    assert.match(existingReportAnswer("en"), /active report/);
    assert.match(reportLimitAnswer("en"), /Two reports have already been created/);
    assert.match(reportLimitAnswer("he"), /שני דוחות/);
    assert.doesNotMatch(reportLimitAnswer("en"), /sorry/i);
  });

  it("keeps report transition copy conversational and free of internal terminology", () => {
    assert.match(reportLoadingAnswer("he"), /דוח ה־RoleFit שלך/);
    assert.match(reportLoadingAnswer("en"), /I’m working on your RoleFit report now/);
    assert.doesNotMatch(reportLoadingAnswer("en"), /Evidence Cards|payload|persistence|Gemini|Google|provider|server|retry|timeout|infrastructure/i);
    assert.match(reportReadyAnswer("he"), /בדיקת ההתאמה מוכנה/);
    assert.match(reportReadyAnswer("en"), /specific requirement, strength, or gap/);
  });

  it("provides a practical recovery path for file and generic errors in both languages", () => {
    assert.match(roleFileErrorAnswer("unsupported", "he"), /TXT, Markdown או CSV/);
    assert.match(roleFileErrorAnswer("too-large", "en"), /smaller than 64 KB/);
    assert.match(roleFileErrorAnswer("empty", "he"), /הקובץ ריק/);
    assert.match(roleFileErrorAnswer("unreadable", "en"), /paste the job description/);
    assert.match(genericRecoverableErrorAnswer("he"), /פרטי המשרה עדיין כאן/);
    assert.match(genericRecoverableErrorAnswer("en"), /resend only the last part/);
    assert.match(reportRetryableFailureAnswer("he"), /בלי להדביק אותם מחדש/);
    assert.match(reportRetryableFailureAnswer("en"), /without pasting them again/);
  });

  it("acknowledges an uncaptured previous title without implying the role draft was lost", () => {
    assert.equal(
      previouslyProvidedTitleAnswer("he"),
      "יכול להיות שהכותרת לא נקלטה מההדבקה הקודמת. שאר פרטי המשרה עדיין אצלי. שלחי רק את שם המשרה כפי שהוא מופיע בשורה הראשונה, ואני אחבר אותו לתיאור שכבר קיבלתי.",
    );
    assert.match(previouslyProvidedTitleAnswer("en"), /I still have the rest of the role details/);
  });
});
