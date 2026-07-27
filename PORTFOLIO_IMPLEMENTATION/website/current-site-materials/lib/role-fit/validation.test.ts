import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { canRequestReport, checkJobCompleteness } from "./validation.ts";

const completeJob = {
  company: "North Star Systems",
  title: "Senior Product Strategist",
  description: "Lead product direction for a complex operational platform.",
  responsibilities: ["Align product, engineering, and leadership around priorities."],
  requirements: ["Experience leading strategy for complex products."],
  seniority: "Senior",
  yearsOfExperience: 8,
};

describe("Role Fit job completeness", () => {
  test("accepts a role with the minimum required context", () => {
    const result = checkJobCompleteness(completeJob);
    assert.equal(result.complete, true);
    assert.deepEqual(result.missing, []);
    assert.equal(canRequestReport(completeJob), true);
  });

  test("requires the five mandatory fields", () => {
    const result = checkJobCompleteness({
      ...completeJob,
      company: "",
      title: "  ",
      description: "",
      responsibilities: [],
      requirements: ["   "],
    });
    assert.equal(result.complete, false);
    assert.deepEqual(result.missing, ["company", "title", "description", "responsibilities", "requirements"]);
    assert.equal(canRequestReport({ ...completeJob, responsibilities: [] }), false);
  });

  test("treats seniority and years as optional when absent from the role", () => {
    const result = checkJobCompleteness({ ...completeJob, seniority: undefined, yearsOfExperience: undefined });
    assert.equal(result.complete, true);
    assert.deepEqual(result.optionalFieldsNotProvided, ["seniority", "yearsOfExperience"]);
  });

  test("accepts meaningful entries alongside blank list entries", () => {
    const result = checkJobCompleteness({
      ...completeJob,
      responsibilities: [" ", "Own cross-functional product decisions."],
      requirements: ["", "Experience with complex systems."],
    });
    assert.equal(result.complete, true);
  });
});
