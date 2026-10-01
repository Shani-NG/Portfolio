export function guardUnstartedReportClaim(
  answer: string,
  language: "he" | "en" | "mixed",
  hasRoleDraft: boolean,
): string {
  const operationalClaim = /\b(?:(?:i(?:'m| am)|we(?:'re| are))\s+(?:generating|creating|preparing|showing|displaying)\s+(?:the|your|a)\s+report|(?:the|your)\s+report\s+(?:is\s+)?(?:being\s+generated|being\s+prepared|ready|complete|completed|displayed|shown)|(?:i(?:'ve| have)|we(?:'ve| have))\s+(?:generated|created|displayed|shown)\s+(?:the|your|a)\s+report)\b|(?:אני|אנחנו)\s+(?:מייצרת|מכינה|מפיקות|מפיקים|מייצרים|מציגה)\s+(?:את\s+)?(?:הדוח|דוח)|(?:הדוח|דוח)\s+(?:מופק|מוכן|מוצג|נוצר|מופיע)|(?:מיד|עכשיו)\s+יוצג\s+(?:הדוח|דוח)/iu;
  if (!operationalClaim.test(answer)) return answer;

  if (language === "he" || language === "mixed") {
    return hasRoleDraft
      ? "אפשר להפיק דוח אחרי אישור פרטי המשרה."
      : "כדי להפיק דוח, צריך קודם לשלוח את תיאור המשרה ולאשר את הפרטים.";
  }
  return hasRoleDraft
    ? "I can generate the report once the role details are confirmed."
    : "Please send the job description and confirm the role details before I can generate a report.";
}
