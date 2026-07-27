import type { JobCompleteness, JobRequirements } from "./types.ts";

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function hasItems(value: string[]): boolean {
  return value.some((item) => Boolean(item.trim()));
}

export function checkJobCompleteness(job: Pick<JobRequirements, "company" | "title" | "description" | "responsibilities" | "requirements" | "seniority" | "yearsOfExperience">): JobCompleteness {
  const missing: JobCompleteness["missing"] = [];

  if (!hasText(job.company)) missing.push("company");
  if (!hasText(job.title)) missing.push("title");
  if (!hasText(job.description)) missing.push("description");
  if (!hasItems(job.responsibilities)) missing.push("responsibilities");
  if (!hasItems(job.requirements)) missing.push("requirements");

  const optionalFieldsNotProvided: JobCompleteness["optionalFieldsNotProvided"] = [];
  if (!hasText(job.seniority)) optionalFieldsNotProvided.push("seniority");
  if (job.yearsOfExperience === undefined) optionalFieldsNotProvided.push("yearsOfExperience");

  return {
    complete: missing.length === 0,
    missing,
    optionalFieldsNotProvided,
  };
}

export function canRequestReport(job: Pick<JobRequirements, "company" | "title" | "description" | "responsibilities" | "requirements" | "seniority" | "yearsOfExperience">): boolean {
  return checkJobCompleteness(job).complete;
}
