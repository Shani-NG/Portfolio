import { z } from "zod";

const schemaVersion = z.literal("1.0");
const isoDateTimeSchema = z.string();
const uuidSchema = z.string();

export const languageSchema = z.enum(["he", "en", "mixed"]);
export const reportLanguageSchema = z.enum(["he", "en"]);
export const confidenceLevelSchema = z.enum(["high", "medium", "low", "insufficient"]);
export const reliabilityLevelSchema = z.enum(["high", "medium", "low"]);
export const roleImportanceSchema = z.enum(["must-have", "core", "supporting"]);

export const matchTypeSchema = z.enum([
  "direct",
  "semantic",
  "transferable",
  "partial",
  "insufficient-evidence",
  "real-gap",
]);

export const claimKindSchema = z.enum([
  "documented-fact",
  "interpretive-conclusion",
  "unverified-assumption",
]);

export const reportRoleFamilySchema = z.enum([
  "ux-product-design",
  "product-management",
  "innovation-ai-strategy",
  "ai-implementation",
  "systems-engineering",
  "software-engineering",
  "research",
  "other",
]);

export const persistedRoleFamilySchema = z.enum([
  "ux-design",
  "product-design",
  "ux-strategy",
  "innovation",
  "product",
  "ai-product",
  "ai-implementation",
  "research",
  "management",
  "systems-engineering",
  "other",
]);

export const careerTransitionTypeSchema = z.enum([
  "same-role",
  "adjacent-role",
  "role-expansion",
  "domain-transition",
  "profession-transition",
  "unrelated-role",
]);

export const seniorityAlignmentSchema = z.enum([
  "underqualified",
  "slightly-below",
  "aligned",
  "above",
  "potentially-overqualified",
]);

export const careerDirectionAlignmentSchema = z.enum([
  "aligned",
  "plausible-transition",
  "unclear",
  "misaligned",
]);

export const constraintTypeSchema = z.enum([
  "capability",
  "domain",
  "platform",
  "tool",
  "methodology",
  "credential",
  "legal",
  "logistical",
  "seniority",
  "leadership-scope",
]);

export const domainDependencySchema = z.enum(["low", "medium", "high", "critical"]);
export const bridgeabilitySchema = z.enum(["high", "medium", "low", "non-bridgeable"]);
export const capabilityFitSchema = z.enum(["strong", "moderate", "weak", "absent", "unknown"]);
export const contextFitSchema = z.enum(["strong", "partial", "low", "not-applicable", "unknown"]);
export const outcomeEvidenceLevelSchema = z.enum([
  "verified-quantitative",
  "verified-qualitative",
  "measurement-capability-only",
  "not-required",
  "insufficient",
]);

export const fitQualifierSchema = z.enum([
  "domain-transition",
  "role-expansion",
  "profession-transition",
  "evidence-limited",
  "potentially-overqualified",
  "hard-constraint",
]);

export const taskModeSchema = z.enum([
  "portfolio-qa",
  "role-understanding",
  "fit-analysis",
  "report-follow-up",
]);

export const reportIdentifiersSchema = z
  .object({
    conversationId: z.string(),
    conversationSnapshotId: z.string(),
    roleSnapshotId: z.string(),
    sourceSnapshotId: z.string(),
    reportId: z.string(),
    traceId: z.string(),
  })
  .strict();

export const roleSourceRefSchema = z
  .object({
    sourceId: z.string(),
    kind: z.enum(["user-text", "uploaded-file", "clarification"]),
    label: z.string().optional(),
    locator: z.string().optional(),
    contentHash: z.string().optional(),
  })
  .strict();

export const roleFieldSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z
    .object({
      originalValue: valueSchema,
      normalizedValue: valueSchema.optional(),
      sourceRef: roleSourceRefSchema,
      confidence: z.enum(["high", "medium", "low"]),
      confirmed: z.boolean(),
    })
    .strict();

export const roleConceptSourceSchema = z
  .object({
    conceptId: z.string(),
    originalText: z.string(),
    normalizedText: z.string().optional(),
    importance: roleImportanceSchema,
    sourceRef: roleSourceRefSchema,
    confidence: z.enum(["high", "medium", "low"]),
  })
  .strict();

export const roleDraftSchema = z
  .object({
    company: roleFieldSchema(z.string()).optional(),
    title: roleFieldSchema(z.string()).optional(),
    description: roleFieldSchema(z.string()).optional(),
    responsibilities: z.array(roleFieldSchema(z.string())),
    requirements: z.array(roleFieldSchema(z.string())),
    seniority: roleFieldSchema(z.string()).optional(),
    yearsOfExperience: roleFieldSchema(z.number()).optional(),
    location: roleFieldSchema(z.string()).optional(),
    workModel: roleFieldSchema(z.string()).optional(),
    employmentType: roleFieldSchema(z.string()).optional(),
    preferredQualifications: z.array(roleFieldSchema(z.string())),
  })
  .strict();

export const validatedRoleSnapshotSchema = z
  .object({
    roleSnapshotId: z.string(),
    version: z.number(),
    company: z.string(),
    title: z.string(),
    description: z.string(),
    responsibilities: z.array(roleConceptSourceSchema),
    requirements: z.array(roleConceptSourceSchema),
    preferredQualifications: z.array(roleConceptSourceSchema),
    roleFamily: reportRoleFamilySchema,
    careerTransitionType: careerTransitionTypeSchema,
    seniorityAlignment: seniorityAlignmentSchema,
    careerDirectionAlignment: careerDirectionAlignmentSchema,
    seniority: z.string().optional(),
    yearsOfExperience: z.number().optional(),
    location: z.string().optional(),
    workModel: z.string().optional(),
    employmentType: z.string().optional(),
    detectedLanguage: languageSchema,
    sourceRefs: z.array(roleSourceRefSchema),
    validatedAt: isoDateTimeSchema,
    confirmedAt: isoDateTimeSchema,
  })
  .strict();

export const roleValidationResultSchema = z
  .object({
    identifiers: z
      .object({
        conversationId: z.string(),
        traceId: z.string(),
      })
      .strict(),
    parseStatus: z.enum([
      "valid-complete",
      "valid-incomplete",
      "not-a-job-description",
      "unreadable",
      "contradictory",
    ]),
    roleDraft: roleDraftSchema,
    missingFields: z.array(z.enum(["company", "title", "responsibilities", "requirements"])),
    detectedLanguage: languageSchema,
    recommendedNextAction: z.enum([
      "ask-for-missing-field",
      "request-new-input",
      "request-source-choice",
      "role-ready",
    ]),
    nextQuestionKey: z.string().optional(),
  })
  .strict();

export const evidenceCardSchema = z
  .object({
    evidenceId: z.string(),
    conceptIds: z.array(z.string()),
    claim: z.string(),
    claimKind: claimKindSchema,
    context: z.string(),
    action: z.string().optional(),
    result: z.string().optional(),
    project: z
      .object({
        slug: z.string(),
        title: z.string(),
      })
      .strict()
      .optional(),
    source: z
      .object({
        type: z.enum(["case-study", "cv", "homepage", "agent-guidance"]),
        label: z.string(),
        locator: z.string(),
        anchorId: z.string().optional(),
      })
      .strict(),
    visibility: z.enum(["public", "internal"]),
    reliability: reliabilityLevelSchema,
    approvalStatus: z.enum(["approved", "needs-review", "blocked"]),
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const evidenceReferenceSchema = z
  .object({
    evidenceId: z.string(),
    knowledgeFileId: z.string(),
    knowledgeFileVersion: z.string(),
    caseStudyId: z.string().optional(),
    sectionId: z.string().optional(),
    anchorId: z.string().optional(),
    clusterId: z.string().optional(),
    claimIds: z.array(z.string()),
  })
  .strict();

export const analysisItemSchema = z
  .object({
    itemId: z.string(),
    roleItemId: z.string(),
    originalText: z.string(),
    normalizedConceptId: z.string().optional(),
    displayLabel: z.string().optional(),
    source: z.enum(["skill", "requirement", "responsibility", "professional-context"]),
    importance: roleImportanceSchema,
    matchType: matchTypeSchema,
    claimKind: claimKindSchema,
    evidenceConfidence: confidenceLevelSchema,
    capabilityFit: capabilityFitSchema,
    contextFit: contextFitSchema,
    bridgeability: bridgeabilitySchema,
    domainDependency: domainDependencySchema,
    constraintType: constraintTypeSchema,
    outcomeEvidenceLevel: outcomeEvidenceLevelSchema,
    shortRationale: z.string(),
    evidenceIds: z.array(z.string()),
    internal: z
      .object({
        selectedForMapping: z.boolean(),
        selectionRank: z.number().optional(),
        strengthRank: z.number().optional(),
        gapRank: z.number().optional(),
        exclusionReasons: z.array(z.string()).optional(),
      })
      .strict(),
  })
  .strict();

export const fitAnalysisResultSchema = z
  .object({
    identifiers: reportIdentifiersSchema,
    overallFit: z.union([
      z
        .object({
          mode: z.literal("fit"),
          level: z.enum(["strong", "good", "partial"]),
          fitVisualValue: z.number(),
          label: z.string(),
          rationale: z.string(),
        })
        .strict(),
      z
        .object({
          mode: z.literal("insufficient"),
          label: z.string(),
          rationale: z.string(),
        })
        .strict(),
      z
        .object({
          mode: z.literal("out-of-scope"),
          label: z.string(),
          rationale: z.string(),
        })
        .strict(),
    ]),
    evidenceConfidence: z
      .object({
        level: confidenceLevelSchema,
        rationale: z.string(),
      })
      .strict(),
    sections: z
      .object({
        skills: z.array(analysisItemSchema),
        requirements: z.array(analysisItemSchema),
        responsibilities: z.array(analysisItemSchema),
        professionalContext: z.array(analysisItemSchema),
      })
      .strict(),
    topStrengthItemIds: z.array(z.string()),
    keyGapItemIds: z.array(z.string()),
    internalDiagnostics: z
      .object({
        coveredCoreRequirementCount: z.number(),
        totalCoreRequirementCount: z.number(),
        coveredMustHaveCount: z.number(),
        totalMustHaveCount: z.number(),
        realGapCount: z.number(),
        insufficientEvidenceCount: z.number(),
        highConfidenceEvidenceCount: z.number(),
        evidenceCoverageRatio: z.number().optional(),
        fitComputationVersion: z.string(),
      })
      .strict(),
  })
  .strict();

export const evidenceClusterSchema = z
  .object({
    clusterId: z.string(),
    title: z.string(),
    summary: z.string(),
    supportedItemIds: z.array(z.string()),
    evidenceIds: z.array(z.string()),
    project: z
      .object({
        slug: z.string(),
        title: z.string(),
      })
      .strict()
      .optional(),
    destination: z.union([
      z
        .object({
          mode: z.literal("anchor"),
          href: z.string(),
          anchorId: z.string(),
          dedupeKey: z.string(),
        })
        .strict(),
      z
        .object({
          mode: z.literal("project-top"),
          href: z.string(),
          dedupeKey: z.string(),
        })
        .strict(),
      z
        .object({
          mode: z.literal("no-link"),
          dedupeKey: z.string(),
        })
        .strict(),
    ]),
    reliability: reliabilityLevelSchema,
  })
  .strict();

export const reportItemSchema = z
  .object({
    itemId: z.string(),
    originalText: z.string(),
    displayLabel: z.string().optional(),
    normalizedConcept: z.string().optional(),
    source: z.enum(["skill", "requirement", "responsibility", "professional-context"]),
    importance: roleImportanceSchema,
    matchType: matchTypeSchema,
    impact: z.enum(["strength", "gap", "neutral"]),
    evidenceConfidence: confidenceLevelSchema,
    shortRationale: z.string(),
    clusterIds: z.array(z.string()),
  })
  .strict();

export const roleSnapshotUISchema = z
  .object({
    company: z.string(),
    title: z.string(),
    seniority: z.string().optional(),
    yearsOfExperience: z.number().optional(),
    location: z.string().optional(),
    workModel: z.string().optional(),
    employmentType: z.string().optional(),
  })
  .strict();

export const overallFitVisualUISchema = z.union([
  z
    .object({
      mode: z.literal("fit"),
      level: z.enum(["strong", "good", "partial"]),
      fitVisualValue: z.number(),
      illustrationKey: z.enum(["fit-strong", "fit-good", "fit-partial"]),
      colorToken: z.enum(["fit.strong", "fit.good", "fit.partial"]),
      label: z.string(),
      rationale: z.string(),
      qualifiers: z.array(fitQualifierSchema).optional(),
    })
    .strict(),
  z
    .object({
      mode: z.literal("insufficient"),
      label: z.string(),
      rationale: z.string(),
    })
    .strict(),
  z
    .object({
      mode: z.literal("out-of-scope"),
      label: z.string(),
      rationale: z.string(),
    })
    .strict(),
]);

export const evidenceConfidenceUISchema = z
  .object({
    level: confidenceLevelSchema,
    rationale: z.string(),
  })
  .strict();

export const skillsMatchUISchema = z
  .object({
    items: z.array(reportItemSchema),
    visualCoverage: z.union([
      z
        .object({
          mode: z.literal("qualitative"),
          label: z.string(),
        })
        .strict(),
      z
        .object({
          mode: z.literal("hidden-continuum"),
          internalValue: z.number(),
        })
        .strict(),
      z
        .object({
          mode: z.literal("traceable-count"),
          matchedCount: z.number(),
          totalCount: z.number(),
        })
        .strict(),
    ]),
  })
  .strict();

export const requirementMappingUISchema = z
  .object({
    items: z.array(reportItemSchema),
    defaultSelectedItemId: z.string().optional(),
  })
  .strict();

export const evidencePanelUISchema = z
  .object({
    clusters: z.array(evidenceClusterSchema),
    defaultClusterId: z.string().optional(),
  })
  .strict();

export const reportUIPayloadSchema = z
  .object({
    schemaVersion,
    reportId: z.string(),
    createdAt: isoDateTimeSchema,
    language: reportLanguageSchema,
    state: z.literal("ready"),
    roleSnapshot: roleSnapshotUISchema,
    overallFitVisual: overallFitVisualUISchema,
    evidenceConfidence: evidenceConfidenceUISchema,
    skillsMatch: skillsMatchUISchema,
    requirementMapping: requirementMappingUISchema,
    evidencePanel: evidencePanelUISchema,
    topStrengths: z
      .object({
        items: z.array(reportItemSchema),
      })
      .strict(),
    keyGaps: z
      .object({
        items: z.array(reportItemSchema),
      })
      .strict(),
    disclaimer: z
      .object({
        copyKey: z.literal("report.disclaimer.v1"),
        text: z.string(),
      })
      .strict(),
    contactCta: z
      .object({
        variant: z.enum(["strong", "good", "partial", "insufficient", "out-of-scope"]),
        label: z.string(),
        href: z.string().optional(),
        enabled: z.boolean(),
      })
      .strict(),
  })
  .strict();

export const reportValidationResultSchema = z.union([
  z
    .object({
      valid: z.literal(true),
      schemaValid: z.literal(true),
      roleValid: z.literal(true),
      analysisValid: z.literal(true),
      evidenceValid: z.literal(true),
      privacyValid: z.literal(true),
      linkValidationComplete: z.literal(true),
      noDuplicateDestinations: z.literal(true),
      stateValid: z.literal(true),
      validatedAt: isoDateTimeSchema,
    })
    .strict(),
  z
    .object({
      valid: z.literal(false),
      reportId: z.string(),
      errorCategory: z.enum([
        "request",
        "role",
        "analysis",
        "evidence",
        "privacy",
        "link",
        "visual-band",
        "composition",
        "schema",
        "state",
      ]),
      safeMessageKey: z.string(),
      repairable: z.boolean(),
      internalIssues: z.array(
        z
          .object({
            code: z.string(),
            path: z.string().optional(),
            message: z.string(),
          })
          .strict(),
      ),
      validatedAt: isoDateTimeSchema,
    })
    .strict(),
]);

export const validatedReportPayloadSchema = z.union([
  z
    .object({
      valid: z.literal(true),
      report: reportUIPayloadSchema,
      validation: z
        .object({
          schemaValid: z.literal(true),
          evidenceValid: z.literal(true),
          privacyValid: z.literal(true),
          linkValidationComplete: z.literal(true),
          noDuplicateDestinations: z.literal(true),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      valid: z.literal(false),
      reportId: z.string(),
      errorCategory: z.enum([
        "request",
        "role",
        "analysis",
        "evidence",
        "privacy",
        "link",
        "visual-band",
        "composition",
        "schema",
        "state",
      ]),
      safeMessageKey: z.string(),
    })
    .strict(),
]);

export const eligibilityResultSchema = z.union([
  z
    .object({
      state: z.literal("ready"),
      report: reportUIPayloadSchema,
    })
    .strict(),
  z
    .object({
      state: z.literal("no-report"),
      reason: z.enum(["no-meaningful-fit", "insufficient-evidence"]),
      safeMessageKey: z.string(),
    })
    .strict(),
  z
    .object({
      state: z.literal("blocked"),
      reason: z.enum(["report-limit-reached", "approval-missing", "session-expired"]),
      safeMessageKey: z.string(),
    })
    .strict(),
]);

export const sessionRecordSchema = z
  .object({
    schemaVersion,
    sessionId: uuidSchema,
    conversationId: uuidSchema,
    status: z.enum(["active", "expired", "closed"]),
    language: languageSchema,
    activeMode: taskModeSchema,
    activeRoleSnapshotId: uuidSchema.optional(),
    activeReportId: uuidSchema.optional(),
    completedReportIds: z.array(uuidSchema),
    completedReportCount: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    reportAttemptCount: z.number(),
    lastActivityAt: isoDateTimeSchema,
    expiresAt: isoDateTimeSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const temporaryRoleSnapshotSchema = z
  .object({
    schemaVersion,
    roleSnapshotId: uuidSchema,
    sessionId: uuidSchema,
    sourceKind: z.enum(["pasted-text", "uploaded-file", "clarification", "combined"]),
    rawContent: z.string(),
    extractedFields: roleDraftSchema,
    parseStatus: z.enum([
      "valid-complete",
      "valid-incomplete",
      "not-a-job-description",
      "unreadable",
      "contradictory",
    ]),
    missingFieldKeys: z.array(z.string()),
    contradictionCodes: z.array(z.string()),
    personalDataDetected: z.boolean(),
    personalDataTypes: z.array(z.enum(["person-name", "email", "phone", "address", "other"])),
    attemptCount: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const normalizedRoleSummarySchema = z
  .object({
    schemaVersion,
    normalizedRoleSummaryId: uuidSchema,
    reportId: uuidSchema,
    companyName: z.string().optional(),
    roleTitleNormalized: z.string(),
    roleFamily: persistedRoleFamilySchema,
    seniority: z.enum(["junior", "mid", "senior", "lead", "manager", "head", "director", "unknown"]).optional(),
    workModel: z.enum(["on-site", "hybrid", "remote", "unknown"]).optional(),
    employmentType: z.enum(["full-time", "part-time", "contract", "temporary", "internship", "unknown"]).optional(),
    domainTags: z.array(z.string()),
    coreResponsibilityConcepts: z.array(z.string()),
    mustHaveConcepts: z.array(z.string()),
    preferredConcepts: z.array(z.string()),
    hardConstraintCodes: z.array(z.string()),
    sourceLanguage: languageSchema,
    extractionQuality: z.enum(["high", "medium", "low"]),
    piiRemoved: z.literal(true),
    createdAt: isoDateTimeSchema,
  })
  .strict();

export const storedReportRecordSchema = z
  .object({
    schemaVersion,
    reportId: uuidSchema,
    sessionId: uuidSchema,
    normalizedRoleSummaryId: uuidSchema,
    state: z.literal("ready"),
    language: reportLanguageSchema,
    outcome: z.enum(["strong", "good", "partial"]),
    evidenceSnapshot: z
      .object({
        sourceSnapshotId: z.string(),
        evidenceReferences: z.array(evidenceReferenceSchema),
        createdAt: isoDateTimeSchema,
      })
      .strict(),
    fitAnalysis: fitAnalysisResultSchema,
    reportPayload: reportUIPayloadSchema,
    validation: reportValidationResultSchema,
    generation: z
      .object({
        trigger: z.enum(["dedicated-button", "natural-language-request"]),
        approvedAt: isoDateTimeSchema,
        startedAt: isoDateTimeSchema,
        completedAt: isoDateTimeSchema,
        modelVersion: z.string().optional(),
        composerVersion: z.string(),
        fitComputationVersion: z.string(),
        attemptCount: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      })
      .strict(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const runtimeEventNameSchema = z.enum([
  "session.started",
  "session.activity",
  "session.expired",
  "intent.detected",
  "role.input_received",
  "role.classified",
  "role.validation_failed",
  "role.clarification_requested",
  "role.confirmed",
  "report.limit_blocked",
  "report.generation_started",
  "report.generation_retried",
  "report.validation_completed",
  "report.completed",
  "report.no_meaningful_fit",
  "report.insufficient_evidence",
  "report.failed",
  "report.followup_started",
  "evidence.opened",
  "contact.cta_impression",
  "contact.cta_clicked",
  "contact.submitted",
  "storage.degraded",
  "error.occurred",
]);

export const errorCategorySchema = z.enum([
  "invalid-input",
  "unsupported-file",
  "file-unreadable",
  "role-incomplete",
  "role-contradictory",
  "approval-missing",
  "report-limit-reached",
  "retrieval-empty",
  "retrieval-failed",
  "model-timeout",
  "model-invalid-output",
  "schema-validation-failed",
  "evidence-validation-failed",
  "privacy-validation-failed",
  "link-validation-failed",
  "storage-unavailable",
  "contact-validation-failed",
  "rate-limited",
  "unknown",
]);

export const runtimeEventSchema = z
  .object({
    schemaVersion,
    eventId: uuidSchema,
    eventName: runtimeEventNameSchema,
    occurredAt: isoDateTimeSchema,
    sessionId: uuidSchema.optional(),
    conversationId: uuidSchema.optional(),
    reportId: uuidSchema.optional(),
    roleSnapshotId: uuidSchema.optional(),
    traceId: uuidSchema,
    mode: taskModeSchema.optional(),
    outcome: z.enum(["success", "failure", "blocked", "partial"]),
    durationMs: z.number().optional(),
    attemptNumber: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    validationGate: z
      .enum(["request", "role", "analysis", "evidence", "composition", "privacy", "link", "ui-schema", "state-transition"])
      .optional(),
    errorCategory: errorCategorySchema.optional(),
    counts: z
      .object({
        roleItems: z.number().optional(),
        evidenceItems: z.number().optional(),
        clusters: z.number().optional(),
        reportsCompleted: z.number().optional(),
      })
      .strict()
      .optional(),
    versions: z
      .object({
        model: z.string().optional(),
        composer: z.string().optional(),
        schema: z.string().optional(),
        knowledgeSnapshot: z.string().optional(),
      })
      .strict()
      .optional(),
    metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  })
  .strict();

export const persistencePayloadSchema = z.union([normalizedRoleSummarySchema, storedReportRecordSchema]);

export type Language = z.infer<typeof languageSchema>;
export type ValidatedRoleSnapshot = z.infer<typeof validatedRoleSnapshotSchema>;
export type RoleValidationResult = z.infer<typeof roleValidationResultSchema>;
export type EligibilityResult = z.infer<typeof eligibilityResultSchema>;
export type EvidenceCard = z.infer<typeof evidenceCardSchema>;
export type EvidenceReference = z.infer<typeof evidenceReferenceSchema>;
export type ReportUIPayload = z.infer<typeof reportUIPayloadSchema>;
export type ReportValidationResult = z.infer<typeof reportValidationResultSchema>;
export type ValidatedReportPayload = z.infer<typeof validatedReportPayloadSchema>;
export type SessionRecord = z.infer<typeof sessionRecordSchema>;
export type TemporaryRoleSnapshot = z.infer<typeof temporaryRoleSnapshotSchema>;
export type NormalizedRoleSummary = z.infer<typeof normalizedRoleSummarySchema>;
export type StoredReportRecord = z.infer<typeof storedReportRecordSchema>;
export type RuntimeEvent = z.infer<typeof runtimeEventSchema>;
export type PersistencePayload = z.infer<typeof persistencePayloadSchema>;
