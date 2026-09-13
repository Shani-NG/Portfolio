import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveEnglishReportTitle } from "./role-understanding.ts";

describe("English report title resolution", () => {
  it("preserves strategic and audit context for a generic Hebrew lead title", () => {
    assert.equal(
      resolveEnglishReportTitle("מוביל.ה לתפקיד אסטרטגי באגף הביקורת"),
      "Strategic Audit Lead",
    );
  });

  it("applies the audit context rule without requiring a specific employer or title", () => {
    assert.equal(resolveEnglishReportTitle("מוביל.ת ביקורת תפעולית"), "Audit Lead");
  });

  it("leaves non-Hebrew titles unchanged", () => {
    assert.equal(resolveEnglishReportTitle("Senior UX Designer"), "Senior UX Designer");
  });
});
