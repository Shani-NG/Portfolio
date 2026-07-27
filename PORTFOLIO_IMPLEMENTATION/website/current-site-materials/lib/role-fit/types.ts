export type ApprovedSourceType = "case-study" | "cv" | "homepage" | "agent-guidance";

export type ClaimKind = "documented-fact" | "interpretive-conclusion" | "unverified-assumption";

export type EvidenceVisibility = "public" | "internal";

export type EvidenceReliability = "high" | "medium" | "low";

export type EvidenceCard = {
  evidenceId: string;
  claim: string;
  claimKind: ClaimKind;
  capability: string;
  context: string;
  action?: string;
  result?: string;
  project?: string;
  source: {
    type: ApprovedSourceType;
    label: string;
    locator: string;
    anchor?: string;
  };
  visibility: EvidenceVisibility;
  reliability: EvidenceReliability;
  updatedAt: string;
};

export type JobRequirements = {
  company: string;
  title: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  seniority?: string;
  yearsOfExperience?: number;
  source: {
    kind: "user-text" | "uploaded-file";
    label: string;
  };
};

export type JobCompleteness = {
  complete: boolean;
  missing: Array<"company" | "title" | "description" | "responsibilities" | "requirements">;
  optionalFieldsNotProvided: Array<"seniority" | "yearsOfExperience">;
};

export type RoleFitFlowState =
  | "conversation"
  | "collecting-role-details"
  | "awaiting-role-completion"
  | "awaiting-report-confirmation"
  | "generating-report"
  | "report-ready"
  | "error";

export type ReportApproval = {
  approved: boolean;
  approvedAt?: string;
};

export type ReportDraft = {
  reportId: string;
  role: JobRequirements;
  evidence: EvidenceCard[];
  approval: ReportApproval;
  state: "awaiting-confirmation" | "generating" | "ready" | "failed";
};
