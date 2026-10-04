export function guardUnstartedReportClaim(
  answer: string,
  language: "he" | "en" | "mixed",
  hasRoleDraft: boolean,
): string {
  const reportNoun = /(?:(?:role[ -]?fit|fit)\s+)?(?:report|review)/i;
  const reportOperation = /(?:generating|creating|preparing|opening|displaying|showing)/i;
  const operationClaim = new RegExp(
    `(?:\\b(?:i(?:'m| am)|we(?:'re| are))\\s+(?:now\\s+)?|(?:^|[.!?]\\s+|\\n)\\s*)${reportOperation.source}\\s+(?:(?:the|your|a|this)\\s+)?${reportNoun.source}\\b`,
    "i",
  );
  const completedClaim = /\b(?:(?:the|your)\s+(?:(?:role[ -]?fit|fit)\s+)?(?:report|review)\s+(?:is\s+)?(?:being\s+generated|being\s+prepared|ready|complete|completed|displayed|shown|open)|(?:i(?:'ve| have)|we(?:'ve| have))\s+(?:generated|created|displayed|shown|opened)\s+(?:(?:the|your|a)\s+)?(?:(?:role[ -]?fit|fit)\s+)?(?:report|review))\b/i;
  const falseConfirmation = !hasRoleDraft && /\bwould you like me to\s+(?:generate|create|prepare)\s+(?:(?:the|your|a)\s+)?(?:(?:role[ -]?fit|fit)\s+)?(?:report|review)\b/i.test(answer);
  const hebrewClaim = /(?:אני|אנחנו)\s+(?:מייצרת|מכינה|מפיקות|מפיקים|מייצרים|מציגה)\s+(?:את\s+)?(?:הדוח|דוח)|(?:הדוח|דוח)\s+(?:מופק|מוכן|מוצג|נוצר|מופיע)|(?:מיד|עכשיו)\s+יוצג\s+(?:הדוח|דוח)/u;
  if (!operationClaim.test(answer) && !completedClaim.test(answer) && !falseConfirmation && !hebrewClaim.test(answer)) return answer;

  if (language === "he" || language === "mixed") {
    return hasRoleDraft
      ? "אפשר להפיק דוח אחרי אישור פרטי המשרה."
      : "כדי להפיק דוח, צריך קודם לשלוח את תיאור המשרה ולאשר את הפרטים.";
  }
  return hasRoleDraft
    ? "I can generate the report once the role details are confirmed."
    : "Please send the job description and confirm the role details before I can generate a report.";
}
