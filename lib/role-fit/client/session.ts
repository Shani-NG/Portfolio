"use client";

import { reportUIPayloadSchema, roleDraftSchema, type ReportUIPayload, type RoleValidationResult } from "../contracts/index.ts";

export type RoleFitMessage = {
  id: string;
  role: "user" | "agent";
  content: string;
};

export type RoleFitReportAttemptState = {
  reportId: string;
  attempts: number;
};

export type RoleFitPendingField = "company" | "title" | "responsibilities" | "requirements";

export type RoleFitLiveState =
  | "initial"
  | "general-qa"
  | "awaiting-role-completion"
  | "awaiting-report-confirmation"
  | "generating-report"
  | "report-ready"
  | "recoverable-error";

export type RoleFitLiveSession = {
  sessionId: string;
  conversationId: string;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  state: RoleFitLiveState;
  messages: RoleFitMessage[];
  draftInput: string;
  activeRoleDraft: RoleValidationResult["roleDraft"] | null;
  pendingRoleField: RoleFitPendingField | null;
  clarificationAttempts: number;
  activeLanguage: "he" | "en";
  reportPayload: unknown | null;
  reportProvider: string;
  reportModel: string;
  completedReportCount: 0 | 1 | 2;
  pendingReportId: string | null;
  pendingReportConfirmation: boolean;
  expandedEvidenceItemIds: string[] | null;
  reportAttemptState: RoleFitReportAttemptState | null;
};

export const sessionLifetimeMs = 24 * 60 * 60 * 1000;
const storageKey = "role-fit-report-session-v2";
const legacyStorageKey = "role-fit-report-session-v1";
let activeSession: RoleFitLiveSession | null = null;
let pendingHomeInput: { text: string; fileName?: string; fileText?: string } | null = null;

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function now() {
  return Date.now();
}

function createSession(): RoleFitLiveSession {
  const timestamp = now();

  return {
    sessionId: createId("session"),
    conversationId: createId("conv"),
    createdAt: timestamp,
    lastActivityAt: timestamp,
    expiresAt: fixedExpiresAt(timestamp),
    state: "initial",
    messages: [],
    draftInput: "",
    activeRoleDraft: null,
    pendingRoleField: null,
    clarificationAttempts: 0,
    activeLanguage: "en",
    reportPayload: null,
    reportProvider: "",
    reportModel: "",
    completedReportCount: 0,
    pendingReportId: null,
    pendingReportConfirmation: false,
    expandedEvidenceItemIds: null,
    reportAttemptState: null,
  };
}

function fixedExpiresAt(createdAt: number) {
  return createdAt + sessionLifetimeMs;
}

function isLiveState(value: unknown): value is RoleFitLiveState {
  return typeof value === "string" && [
    "initial",
    "general-qa",
    "awaiting-role-completion",
    "awaiting-report-confirmation",
    "generating-report",
    "report-ready",
    "recoverable-error",
  ].includes(value);
}

function isPendingField(value: unknown): value is RoleFitPendingField {
  return value === "company" || value === "title" || value === "responsibilities" || value === "requirements";
}

function sanitizeMessages(value: unknown): RoleFitMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((message): message is RoleFitMessage => (
      typeof message === "object"
      && message !== null
      && typeof (message as RoleFitMessage).id === "string"
      && ((message as RoleFitMessage).role === "user" || (message as RoleFitMessage).role === "agent")
      && typeof (message as RoleFitMessage).content === "string"
    ))
    .slice(-40);
}

function sanitizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((item): item is string => typeof item === "string");
}

function sanitizeClarificationAttempts(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10 ? value : 0;
}

function sanitizeReportAttemptState(value: unknown): RoleFitReportAttemptState | null {
  if (
    typeof value !== "object"
    || value === null
    || typeof (value as RoleFitReportAttemptState).reportId !== "string"
    || typeof (value as RoleFitReportAttemptState).attempts !== "number"
  ) {
    return null;
  }

  const attempts = Math.max(0, Math.min(2, Math.trunc((value as RoleFitReportAttemptState).attempts)));
  return { reportId: (value as RoleFitReportAttemptState).reportId, attempts };
}

function normalizeRestoredState(input: {
  state: RoleFitLiveState;
  reportPayload: ReportUIPayload | null;
  pendingReportId: string | null;
  pendingReportConfirmation: boolean;
  reportAttemptState: RoleFitReportAttemptState | null;
}): RoleFitLiveState {
  if (input.reportPayload) return "report-ready";
  if (input.state !== "generating-report") return input.state;
  if (input.pendingReportId && (input.reportAttemptState?.attempts ?? 0) < 2) return "recoverable-error";
  return "awaiting-report-confirmation";
}

type PersistedRoleFitSessionV1 = {
  version: 1;
  sessionId: string;
  conversationId: string;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  state: RoleFitLiveState;
  activeLanguage: "he" | "en";
  reportPayload: ReportUIPayload | null;
  reportProvider: string;
  reportModel: string;
  completedReportCount: 0 | 1 | 2;
  pendingReportId: string | null;
  expandedEvidenceItemIds: string[] | null;
};

type PersistedRoleFitSessionV2 = {
  version: 2;
  sessionId: string;
  conversationId: string;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  state: RoleFitLiveState;
  messages: RoleFitMessage[];
  activeRoleDraft: RoleValidationResult["roleDraft"] | null;
  pendingRoleField: RoleFitPendingField | null;
  clarificationAttempts: number;
  activeLanguage: "he" | "en";
  reportPayload: ReportUIPayload | null;
  reportProvider: string;
  reportModel: string;
  completedReportCount: 0 | 1 | 2;
  pendingReportId: string | null;
  pendingReportConfirmation: boolean;
  expandedEvidenceItemIds: string[] | null;
  reportAttemptState: RoleFitReportAttemptState | null;
};

type PersistedRoleFitSession = PersistedRoleFitSessionV1 | PersistedRoleFitSessionV2;

export function serializeRoleFitSession(session: RoleFitLiveSession): PersistedRoleFitSession {
  const parsedReport = session.reportPayload
    ? reportUIPayloadSchema.safeParse(session.reportPayload)
    : null;
  const parsedRoleDraft = session.activeRoleDraft
    ? roleDraftSchema.safeParse(session.activeRoleDraft)
    : null;

  return {
    version: 2,
    sessionId: session.sessionId,
    conversationId: session.conversationId,
    createdAt: session.createdAt,
    lastActivityAt: session.lastActivityAt,
    expiresAt: session.expiresAt,
    state: session.state,
    messages: sanitizeMessages(session.messages),
    activeRoleDraft: parsedRoleDraft?.success ? parsedRoleDraft.data : null,
    pendingRoleField: isPendingField(session.pendingRoleField) ? session.pendingRoleField : null,
    clarificationAttempts: sanitizeClarificationAttempts(session.clarificationAttempts),
    activeLanguage: session.activeLanguage,
    reportPayload: parsedReport?.success ? parsedReport.data : null,
    reportProvider: session.reportProvider,
    reportModel: session.reportModel,
    completedReportCount: session.completedReportCount,
    pendingReportId: session.pendingReportId,
    pendingReportConfirmation: session.pendingReportConfirmation,
    expandedEvidenceItemIds: session.expandedEvidenceItemIds,
    reportAttemptState: sanitizeReportAttemptState(session.reportAttemptState),
  };
}

function readPersistedSession(): RoleFitLiveSession | null {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.sessionStorage.getItem(storageKey) ?? window.sessionStorage.getItem(legacyStorageKey);
    if (!rawValue) return null;

    const value = JSON.parse(rawValue) as Partial<PersistedRoleFitSession>;
    const reportResult = value.reportPayload
      ? reportUIPayloadSchema.safeParse(value.reportPayload)
      : null;
    const reportPayload = reportResult?.success ? reportResult.data : null;
    const roleDraftResult = "activeRoleDraft" in value && value.activeRoleDraft
      ? roleDraftSchema.safeParse(value.activeRoleDraft)
      : null;
    const activeRoleDraft = roleDraftResult?.success ? roleDraftResult.data : null;
    const validCount = value.completedReportCount === 0 || value.completedReportCount === 1 || value.completedReportCount === 2;
    const validLanguage = value.activeLanguage === "he" || value.activeLanguage === "en";
    const validState = isLiveState(value.state);

    if (
      (value.version !== 1 && value.version !== 2) ||
      typeof value.sessionId !== "string" ||
      typeof value.conversationId !== "string" ||
      typeof value.createdAt !== "number" ||
      typeof value.lastActivityAt !== "number" ||
      !validCount ||
      !validLanguage ||
      !validState
    ) {
      window.sessionStorage.removeItem(storageKey);
      window.sessionStorage.removeItem(legacyStorageKey);
      return null;
    }

    const expiresAt = fixedExpiresAt(value.createdAt);
    if (expiresAt <= now()) {
      window.sessionStorage.removeItem(storageKey);
      window.sessionStorage.removeItem(legacyStorageKey);
      return null;
    }

    const pendingReportId = typeof value.pendingReportId === "string" ? value.pendingReportId : null;
    const reportAttemptState = value.version === 2 ? sanitizeReportAttemptState(value.reportAttemptState) : null;
    const pendingReportConfirmation = value.version === 2
      ? Boolean(value.pendingReportConfirmation)
      : Boolean(pendingReportId && !reportPayload);
    const state = normalizeRestoredState({
      state: value.state as RoleFitLiveState,
      reportPayload,
      pendingReportId,
      pendingReportConfirmation,
      reportAttemptState,
    });

    return {
      ...createSession(),
      sessionId: value.sessionId,
      conversationId: value.conversationId,
      createdAt: value.createdAt,
      lastActivityAt: value.lastActivityAt,
      expiresAt,
      state: value.version === 1 && !reportPayload ? "initial" : state,
      messages: value.version === 2 ? sanitizeMessages(value.messages) : [],
      activeRoleDraft: value.version === 2 ? activeRoleDraft : null,
      pendingRoleField: value.version === 2 && isPendingField(value.pendingRoleField) ? value.pendingRoleField : null,
      clarificationAttempts: value.version === 2 ? sanitizeClarificationAttempts(value.clarificationAttempts) : 0,
      activeLanguage: value.activeLanguage as "he" | "en",
      reportPayload,
      reportProvider: typeof value.reportProvider === "string" ? value.reportProvider : "",
      reportModel: typeof value.reportModel === "string" ? value.reportModel : "",
      completedReportCount: value.completedReportCount as 0 | 1 | 2,
      pendingReportId,
      pendingReportConfirmation: reportPayload ? false : pendingReportConfirmation,
      expandedEvidenceItemIds: sanitizeStringArray(value.expandedEvidenceItemIds),
      reportAttemptState,
    };
  } catch {
    return null;
  }
}

function persistSession(session: RoleFitLiveSession) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(serializeRoleFitSession(session)));
    window.sessionStorage.removeItem(legacyStorageKey);
  } catch {
    // The in-memory session remains usable when browser storage is unavailable.
  }
}

export function getRoleFitLiveSession() {
  if (!activeSession || activeSession.expiresAt <= now()) {
    activeSession = createSession();
  }

  return activeSession;
}

export function restoreRoleFitLiveSession() {
  if (activeSession && activeSession.expiresAt > now()) return activeSession;

  const persistedSession = readPersistedSession();
  if (persistedSession) {
    activeSession = persistedSession;
    persistSession(activeSession);
  }
  return getRoleFitLiveSession();
}

export function updateRoleFitLiveSession(update: Partial<RoleFitLiveSession>) {
  const session = getRoleFitLiveSession();
  const timestamp = now();
  const createdAt = update.createdAt ?? session.createdAt;

  activeSession = {
    ...session,
    ...update,
    createdAt,
    lastActivityAt: timestamp,
    expiresAt: fixedExpiresAt(createdAt),
  };

  persistSession(activeSession);

  return activeSession;
}

export function appendRoleFitMessage(message: Omit<RoleFitMessage, "id">) {
  const session = getRoleFitLiveSession();
  return updateRoleFitLiveSession({
    messages: [
      ...session.messages,
      {
        id: createId(message.role),
        ...message,
      },
    ],
  });
}

export function setPendingHomeRoleFitInput(input: { text: string; fileName?: string; fileText?: string }) {
  pendingHomeInput = input;
}

export function consumePendingHomeRoleFitInput() {
  const input = pendingHomeInput;
  pendingHomeInput = null;
  return input;
}

export function resetRoleFitAnalysis() {
  const session = getRoleFitLiveSession();
  const timestamp = now();

  activeSession = {
    ...createSession(),
    sessionId: session.sessionId,
    conversationId: session.conversationId,
    createdAt: session.createdAt,
    lastActivityAt: timestamp,
    expiresAt: fixedExpiresAt(session.createdAt),
    state: "awaiting-role-completion",
    completedReportCount: session.completedReportCount,
    activeLanguage: session.activeLanguage,
  };
  persistSession(activeSession);
  return activeSession;
}
