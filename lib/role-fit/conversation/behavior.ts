export type ConversationLanguage = "he" | "en";
export type ConversationRoleField = "company" | "title" | "responsibilities" | "requirements";

export const maxRoleClarificationAttempts = 3;

export function isHebrewLanguage(language: "he" | "en" | "mixed") {
  return language === "he" || language === "mixed";
}

export function resolveConversationLanguage(message: string, currentLanguage: ConversationLanguage): ConversationLanguage {
  if (/[֐-׿]/.test(message)) return "he";
  if (/\b(?:answer|continue|reply|speak|switch)\s+(?:in|to)\s+english\b/i.test(message)) return "en";

  const looksLikeEnglishRole =
    message.length > 240 ||
    /\b(?:job description|responsibilities|requirements|qualifications|what you(?:'|’)ll do|about the role)\b/i.test(message);

  return currentLanguage === "he" && looksLikeEnglishRole ? "he" : "en";
}

function fieldQuestion(field: ConversationRoleField | undefined, language: "he" | "en" | "mixed") {
  if (isHebrewLanguage(language)) {
    if (field === "title") return "מה שם המשרה?";
    if (field === "responsibilities") return "מהם תחומי האחריות או התוצאות המרכזיות של המשרה?";
    if (field === "requirements") return "מהן הדרישות או הכישורים המרכזיים למשרה?";
    if (field === "company") return "מה שם החברה?";
    return "איזה פרט מרכזי חסר במשרה?";
  }

  if (field === "title") return "What is the role title?";
  if (field === "responsibilities") return "What are the role's main responsibilities or expected outcomes?";
  if (field === "requirements") return "What are the role's main requirements or qualifications?";
  if (field === "company") return "What is the company name?";
  return "What key role detail is still missing?";
}

export function isReportConfirmationText(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[.!?…]+$/u, "").trim();
  return /^(yes|yep|sure|ok|okay|go ahead|generate|continue|confirm|great|nice|sounds good|יופי|כן|יאללה|אפשר|קדימה|מעולה|בסדר|מאשרת|תמשיכי|נמשיך)$/i.test(normalized);
}

function fieldLabel(field: ConversationRoleField, language: "he" | "en" | "mixed") {
  if (isHebrewLanguage(language)) {
    return {
      company: "שם החברה, אם ידוע",
      title: "שם המשרה",
      responsibilities: "תחומי אחריות מרכזיים",
      requirements: "דרישות או כישורים מרכזיים",
    }[field];
  }

  return {
    company: "Company name, if available",
    title: "Role title",
    responsibilities: "Main responsibilities",
    requirements: "Main requirements or qualifications",
  }[field];
}

export function missingDetailsAnswer(input: {
  missingField: ConversationRoleField | undefined;
  missingFields?: ConversationRoleField[];
  language: "he" | "en" | "mixed";
  repeatedInput: boolean;
}) {
  const fields = [...new Set(input.missingFields ?? (input.missingField ? [input.missingField] : []))];
  if (fields.length > 1) {
    const heading = isHebrewLanguage(input.language) ? "כדי ליצור את הדוח חסרים:" : "To create the report, I still need:";
    const action = isHebrewLanguage(input.language) ? "אפשר להוסיף את הפרטים בהודעה אחת." : "You can add them in one message.";
    return `${heading}\n${fields.map((field) => `- ${fieldLabel(field, input.language)}`).join("\n")}\n${action}`;
  }

  const question = fieldQuestion(fields[0] ?? input.missingField, input.language);
  if (!input.repeatedInput) return question;
  return isHebrewLanguage(input.language) ? `הפרט הזה עדיין חסר: ${question}` : `That detail is still missing: ${question}`;
}

export function genericRoleTitleAnswer(language: "he" | "en" | "mixed") {
  return isHebrewLanguage(language)
    ? "איזה סוג תפקיד זה?\n- UX\n- Strategy\n- Innovation\n- AI\nאבנה מהבחירה שם משרה גנרי."
    : "What type of role is it?\n- UX\n- Strategy\n- Innovation\n- AI\nI will use the selection as a generic role title.";
}

export function clarificationLimitAnswer(language: "he" | "en" | "mixed") {
  return isHebrewLanguage(language)
    ? "עדיין אין לי מספיק מידע כדי להשלים את המשרה. אפשר להדביק תיאור משרה מלא כשנוח."
    : "I still do not have enough information to complete the role. You can paste the full job description when ready.";
}

export function readyForReportAnswer(input: { title: string; companyName?: string; language: "he" | "en" | "mixed"; repeatedInput: boolean }) {
  if (isHebrewLanguage(input.language)) {
    const roleLabel = input.title ? ` עבור ${input.title}` : "";
    const companyLabel = input.companyName ? ` ב־${input.companyName}` : "";
    return input.repeatedInput
      ? `יש לי כבר את כל הפרטים${roleLabel}${companyLabel}. להפיק את הדוח?`
      : `יש לי את כל מה שאני צריכה כדי להפיק דוח${roleLabel}${companyLabel}. שנמשיך?`;
  }

  const roleLabel = input.title ? ` for ${input.title}` : "";
  const companyLabel = input.companyName ? ` at ${input.companyName}` : "";
  return input.repeatedInput
    ? `I already have all the role details${roleLabel}${companyLabel}. Shall I generate the report?`
    : `I have everything I need to generate a report${roleLabel}${companyLabel}. Shall we continue?`;
}

export function roleSubmissionSetupAnswer(language: "he" | "en" | "mixed") {
  return isHebrewLanguage(language)
    ? "מעולה, אפשר להעלות קובץ או להדביק כאן את טקסט המשרה, ואני אקח את זה משם."
    : "You can upload a file or paste the role text here, and I’ll take it from there.";
}

export function existingReportAnswer(language: "he" | "en" | "mixed") {
  return isHebrewLanguage(language)
    ? "המשרה הזו כבר נותחה בדוח הפעיל. אפשר לשאול אותי מה תרצי לבדוק בו."
    : "This role is already covered by the active report. You can ask what you would like to examine in it.";
}

export function reportLimitAnswer(language: "he" | "en" | "mixed") {
  return isHebrewLanguage(language)
    ? "הגעת למגבלת הדוחות בסשן הזה. עדיין אפשר לשאול על הדוח הנוכחי או להמשיך לסייר בפורטפוליו."
    : "You’ve reached the report limit for this session. You can still ask about the current report or explore the portfolio.";
}

export function looksLikeRoleSubmissionSetup(message: string) {
  return /\b(upload|paste|provide|add|send)\b.*\b(job|role|description|jd|details)\b/i.test(message) || /להעלות|להדביק|להזין|לשלוח|משרה|תיאור תפקיד/.test(message);
}

export function looksLikeNewReportRequest(message: string) {
  return /\b(?:another|new|second|additional)\b.{0,30}\b(?:report|fit analysis)\b/i.test(message) || /דוח\s+(?:חדש|נוסף|שני)/.test(message);
}
