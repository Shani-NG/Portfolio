import assert from "node:assert/strict";
import test from "node:test";
import { getJobFitModel } from "./model.ts";

const modelEnvNames = [
  "GOOGLE_AI_STUDIO_JOB_FIT_MODEL",
  "GOOGLE_AI_STUDIO_CHAT_MODEL",
  "GOOGLE_AI_STUDIO_REPORT_MODEL",
  "GOOGLE_AI_STUDIO_ANALYSIS_MODEL",
  "GOOGLE_AI_STUDIO_MODEL",
] as const;

const originalValues = Object.fromEntries(modelEnvNames.map((name) => [name, process.env[name]]));

function restoreModelEnv() {
  for (const name of modelEnvNames) {
    const value = originalValues[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

test.afterEach(restoreModelEnv);

test("Job Fit prefers its dedicated model configuration", () => {
  process.env.GOOGLE_AI_STUDIO_JOB_FIT_MODEL = "job-fit-model";
  process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "analysis-model";
  assert.equal(getJobFitModel(), "job-fit-model");
});

test("Chat model configuration does not affect Job Fit routing", () => {
  delete process.env.GOOGLE_AI_STUDIO_JOB_FIT_MODEL;
  process.env.GOOGLE_AI_STUDIO_CHAT_MODEL = "chat-model";
  process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "analysis-model";
  assert.equal(getJobFitModel(), "analysis-model");
});

test("Report model configuration does not affect Job Fit routing", () => {
  delete process.env.GOOGLE_AI_STUDIO_JOB_FIT_MODEL;
  process.env.GOOGLE_AI_STUDIO_REPORT_MODEL = "report-model";
  process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "analysis-model";
  assert.equal(getJobFitModel(), "analysis-model");
});

test("Job Fit falls back to the existing analysis model when unset", () => {
  delete process.env.GOOGLE_AI_STUDIO_JOB_FIT_MODEL;
  process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL = "analysis-model";
  process.env.GOOGLE_AI_STUDIO_MODEL = "legacy-model";
  assert.equal(getJobFitModel(), "analysis-model");

  delete process.env.GOOGLE_AI_STUDIO_ANALYSIS_MODEL;
  assert.equal(getJobFitModel(), "legacy-model");
});
