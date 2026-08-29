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
    if (field === "title") return "איך נקראת המשרה? אם אין לה שם רשמי, אפשר גם לתאר בקצרה איזה סוג תפקיד זה.";
    if (field === "responsibilities") return "אני מבינה את הדרישות, אבל עדיין לא ברור לי מה האדם בתפקיד יהיה אמור להוביל בפועל. אפשר לשתף את שניים או שלושה תחומי האחריות המרכזיים?";
    if (field === "requirements") return "יש לי כבר את שם התפקיד ואת תחומי האחריות. כדי להבין מה החברה מחפשת באמת, חסרות לי עכשיו הדרישות המרכזיות — למשל הניסיון או היכולות החשובים לתפקיד. אפשר להדביק אותן כאן?";
    if (field === "company") return "מה שם החברה, אם הוא מופיע במשרה? אם השם לא ידוע, אפשר להמשיך גם בלעדיו.";
    return "קיבלתי חלק מתיאור המשרה. איזה פרט מרכזי נוסף יעזור להשלים את התמונה?";
  }

  if (field === "title") return "What is the role called? If it has no formal title, you can briefly describe the type of role instead.";
  if (field === "responsibilities") return "I understand the requirements, but I still need to know what the person in this role would be expected to lead. Can you share the two or three main responsibilities?";
  if (field === "requirements") return "I already have the role title and responsibilities. To understand what the company is really looking for, I still need the core requirements—such as the experience or capabilities that matter most. Can you paste them here?";
  if (field === "company") return "What is the company name, if it appears in the job description? If it is not known, we can continue without it.";
  return "I have part of the job description. What other key detail would help complete the picture?";
}

export function isReportConfirmationText(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[.!?…]+$/u, "").trim();
  const explicitReportAction = /^(?:(?:please|can you|could you|let's|lets)\s+)?(?:generate(?:\s+(?:the|this))?\s+report(?:\s+again)?|create(?:\s+(?:the|this))?\s+report|try\s+again|retry(?:\s+(?:the|this))?\s*report?|run(?:\s+(?:it|the report|report))?\s+again|start(?:\s+generating)?\s+(?:the\s+)?report)$/i;
  if (explicitReportAction.test(normalized)) return true;
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
    const heading = isHebrewLanguage(input.language)
      ? "קיבלתי חלק מתיאור המשרה. כדי לבדוק אותה בצורה אחראית, חסרים לי עדיין:"
      : "I have part of the job description. To assess it responsibly, I still need:";
    const action = isHebrewLanguage(input.language)
      ? "אפשר לשלוח את הפרטים יחד, גם בקיצור ובניסוח חופשי."
      : "You can send the details together, briefly and in your own words.";
    return `${heading}\n${fields.map((field) => `- ${fieldLabel(field, input.language)}`).join("\n")}\n${action}`;
  }

  return fieldQuestion(fields[0] ?? input.missingField, input.language);
}

export function genericRoleTitleAnswer(language: "he" | "en" | "mixed") {
  return isHebrewLanguage(language)
    ? "אם אין למשרה שם ברור, אפשר לסווג אותה לפי הכיוון המרכזי שלה:\n- UX או Product Design\n- Strategy\n- Innovation\n- AI או AI Product\nזה רק יעזור לי לשמור על ההקשר — זה לא יקבע מראש את תוצאת ההתאמה."
    : "If the role does not have a clear title, we can keep the context by identifying its main direction:\n- UX or Product Design\n- Strategy\n- Innovation\n- AI or AI Product\nThis only helps frame the role; it does not determine the fit result.";
}

export function clarificationLimitAnswer(language: "he" | "en" | "mixed") {
  return isHebrewLanguage(language)
    ? "עדיין אין לי מספיק מידע כדי להשלים את המשרה. אפשר להדביק תיאור משרה מלא כשנוח."
    : "I still do not have enough information to complete the role. You can paste the full job description when ready.";
}

function conciseResponsibilities(values: string[] | undefined, language: "he" | "en" | "mixed") {
  const items = (values ?? [])
    .map((value) => value.replace(/\s+/g, " ").trim().replace(/[.;,]+$/u, "").slice(0, 140))
    .filter(Boolean)
    .slice(0, 2);

  if (items.length === 0) return "";
  return items.join(isHebrewLanguage(language) ? " ו־" : " and ");
}

export function readyForReportAnswer(input: {
  title: string;
  companyName?: string;
  responsibilities?: string[];
  language: "he" | "en" | "mixed";
  repeatedInput: boolean;
}) {
  const responsibilities = conciseResponsibilities(input.responsibilities, input.language);

  if (isHebrewLanguage(input.language)) {
    const opening = input.repeatedInput ? "התמונה עדיין מספיק ברורה לי." : "עכשיו התמונה מספיק ברורה לי.";
    const roleLabel = input.title ? `זו משרת ${input.title}` : "זהו התפקיד שתיארת";
    const companyLabel = input.companyName ? ` ב־${input.companyName}` : "";
    const focusLabel = responsibilities ? `, עם דגש על ${responsibilities}` : "";
    return `${opening} ממה שהבנתי, ${roleLabel}${companyLabel}${focusLabel}. אם זה מתאר נכון את התפקיד, אפשר שאכין את בדיקת ההתאמה. אם משהו לא מדויק, אפשר לתקן אותו לפני שאמשיך.`;
  }

  const opening = input.repeatedInput ? "I still have a clear enough picture." : "I have a clear enough picture now.";
  const roleLabel = input.title ? `this is a ${input.title} position` : "this is the role you described";
  const companyLabel = input.companyName ? ` at ${input.companyName}` : "";
  const focusLabel = responsibilities ? `, focused mainly on ${responsibilities}` : "";
  return `${opening} As I understand it, ${roleLabel}${companyLabel}${focusLabel}. If that is accurate, I can prepare the fit review. If anything is off, you can correct it before I continue.`;
}

export function roleSubmissionSetupAnswer(language: "he" | "en" | "mixed") {
  return isHebrewLanguage(language)
    ? "אפשר להעלות קובץ או להדביק כאן את תיאור המשרה. אין צורך לסדר אותו במיוחד — אני אעבור עליו ואבין מה חשוב בתפקיד."
    : "You can upload a file or paste the job description here. It does not need to be specially formatted—I’ll work out what matters in the role.";
}

export function existingReportAnswer(language: "he" | "en" | "mixed") {
  return isHebrewLanguage(language)
    ? "המשרה הזו כבר נותחה בדוח הפעיל. אפשר לשאול אותי מה תרצי לבדוק בו."
    : "This role is already covered by the active report. You can ask what you would like to examine in it.";
}

export function reportLimitAnswer(language: "he" | "en" | "mixed") {
  return isHebrewLanguage(language)
    ? "כבר יצרנו שני דוחות בסשן הזה, ולכן לא אכין כרגע דוח נוסף. אפשר להמשיך לשאול אותי על הדוחות הקיימים, לבדוק נקודת חוזק או פער, ליצור קשר עם שני, או לחזור בסשן חדש."
    : "Two reports have already been created in this session, so I will not generate another one right now. You can continue asking about the existing reports, explore a strength or gap, contact Shani, or return in a new session.";
}

export function reportLoadingAnswer(language: "he" | "en" | "mixed") {
  return isHebrewLanguage(language)
    ? "אני עוברת עכשיו על דרישות התפקיד ומשווה אותן לניסיון הרלוונטי שלי."
    : "I’m reviewing the role requirements and comparing them with the relevant experience documented in the portfolio.";
}

export function reportReadyAnswer(language: "he" | "en" | "mixed") {
  return isHebrewLanguage(language)
    ? "בדיקת ההתאמה מוכנה באנגלית. אפשר להתחיל מהתמונה הכללית, או לשאול אותי על דרישה, נקודת חוזק או פער מסוים."
    : "The fit review is ready. You can start with the overall picture, or ask me about a specific requirement, strength, or gap.";
}

export type RoleFileError = "unsupported" | "too-large" | "empty" | "unreadable";

export function roleFileErrorAnswer(error: RoleFileError, language: "he" | "en" | "mixed") {
  if (isHebrewLanguage(language)) {
    if (error === "unsupported") return "הקובץ הזה אינו בפורמט שאני יכולה לקרוא כרגע. אפשר להעלות TXT, Markdown או CSV, או פשוט להדביק כאן את הטקסט של המשרה.";
    if (error === "too-large") return "הקובץ גדול מדי לעיבוד כאן. אפשר להעלות גרסה קטנה מ־64 KB, או להדביק את תיאור התפקיד, תחומי האחריות והדרישות.";
    if (error === "empty") return "הקובץ ריק. אפשר לבחור קובץ טקסט אחר או להדביק כאן את תוכן המשרה.";
    return "לא הצלחתי לקרוא את הקובץ. אפשר לנסות קובץ טקסט אחר או להדביק כאן את תוכן המשרה.";
  }

  if (error === "unsupported") return "I can’t read this file format right now. You can upload a TXT, Markdown, or CSV file, or paste the job description here.";
  if (error === "too-large") return "This file is too large to process here. You can upload a version smaller than 64 KB, or paste the role description, responsibilities, and requirements.";
  if (error === "empty") return "This file is empty. You can choose another text file or paste the job description here.";
  return "I couldn’t read this file. You can try another text file or paste the job description here.";
}

export function genericRecoverableErrorAnswer(language: "he" | "en" | "mixed") {
  return isHebrewLanguage(language)
    ? "משהו השתבש בזמן עיבוד הבקשה. פרטי המשרה עדיין כאן, ואפשר לנסות שוב עכשיו או לשלוח מחדש רק את החלק האחרון."
    : "Something went wrong while processing the request. Your role details are still here, and you can try again now or resend only the last part.";
}

export function looksLikeRoleSubmissionSetup(message: string) {
  return /\b(upload|paste|provide|add|send)\b.*\b(job|role|description|jd|details)\b/i.test(message) || /להעלות|להדביק|להזין|לשלוח|משרה|תיאור תפקיד/.test(message);
}

export function looksLikeNewReportRequest(message: string) {
  return /\b(?:another|new|second|additional)\b.{0,30}\b(?:report|fit analysis)\b/i.test(message) || /דוח\s+(?:חדש|נוסף|שני)/.test(message);
}
