"use client";

import { reportUIPayloadSchema, type ReportUIPayload } from "../contracts/index.ts";

export type RoleFitMessage = {
  id: string;
  role: "user" | "agent";
  content: string;
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
  activeRoleText: string;
  activeRoleTitle: string;
  activeRoleCompany: string;
  pendingRoleField: RoleFitPendingField | null;
  clarificationAttempts: number;
  activeLanguage: "he" | "en";
  reportPayload: unknown | null;
  reportProvider: string;
  reportModel: string;
  completedReportCount: 0 | 1 | 2;
  pendingReportConfirmation: boolean;
};

const idleExpiryMs = 24 * 60 * 60 * 1000;
const storageKey = "role-fit-report-session-v1";
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
    expiresAt: timestamp + idleExpiryMs,
    state: "initial",
    messages: [],
    draftInput: "",
    activeRoleText: "",
    activeRoleTitle: "",
    activeRoleCompany: "",
    pendingRoleField: null,
    clarificationAttempts: 0,
    activeLanguage: "en",
    reportPayload: null,
    reportProvider: "",
    reportModel: "",
    completedReportCount: 0,
    pendingReportConfirmation: false,
  };
}

type PersistedRoleFitSession = {
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
};

export function serializeRoleFitSession(session: RoleFitLiveSession): PersistedRoleFitSession {
  const parsedReport = session.reportPayload
    ? reportUIPayloadSchema.safeParse(session.reportPayload)
    : null;

  return {
    version: 1,
    sessionId: session.sessionId,
    conversationId: session.conversationId,
    createdAt: session.createdAt,
    lastActivityAt: session.lastActivityAt,
    expiresAt: session.expiresAt,
    state: session.state,
    activeLanguage: session.activeLanguage,
    reportPayload: parsedReport?.success ? parsedReport.data : null,
    reportProvider: session.reportProvider,
    reportModel: session.reportModel,
    completedReportCount: session.completedReportCount,
  };
}

function readPersistedSession(): RoleFitLiveSession | null {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.sessionStorage.getItem(storageKey);
    if (!rawValue) return null;

    const value = JSON.parse(rawValue) as Partial<PersistedRoleFitSession>;
    const reportResult = value.reportPayload
      ? reportUIPayloadSchema.safeParse(value.reportPayload)
      : null;
    const reportPayload = reportResult?.success ? reportResult.data : null;
    const validCount = value.completedReportCount === 0 || value.completedReportCount === 1 || value.completedReportCount === 2;
    const validLanguage = value.activeLanguage === "he" || value.activeLanguage === "en";
    const validState = typeof value.state === "string" && [
      "initial",
      "general-qa",
      "awaiting-role-completion",
      "awaiting-report-confirmation",
      "generating-report",
      "report-ready",
      "recoverable-error",
    ].includes(value.state);

    if (
      value.version !== 1 ||
      typeof value.sessionId !== "string" ||
      typeof value.conversationId !== "string" ||
      typeof value.createdAt !== "number" ||
      typeof value.lastActivityAt !== "number" ||
      typeof value.expiresAt !== "number" ||
      value.expiresAt <= now() ||
      !validCount ||
      !validLanguage ||
      !validState
    ) {
      window.sessionStorage.removeItem(storageKey);
      return null;
    }

    return {
      ...createSession(),
      sessionId: value.sessionId,
      conversationId: value.conversationId,
      createdAt: value.createdAt,
      lastActivityAt: value.lastActivityAt,
      expiresAt: value.expiresAt,
      state: reportPayload
        ? "report-ready"
        : "initial",
      activeLanguage: value.activeLanguage as "he" | "en",
      reportPayload,
      reportProvider: typeof value.reportProvider === "string" ? value.reportProvider : "",
      reportModel: typeof value.reportModel === "string" ? value.reportModel : "",
      completedReportCount: value.completedReportCount as 0 | 1 | 2,
    };
  } catch {
    return null;
  }
}

function persistSession(session: RoleFitLiveSession) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(serializeRoleFitSession(session)));
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
  if (persistedSession) activeSession = persistedSession;
  return getRoleFitLiveSession();
}

export function updateRoleFitLiveSession(update: Partial<RoleFitLiveSession>) {
  const session = getRoleFitLiveSession();
  const timestamp = now();

  activeSession = {
    ...session,
    ...update,
    lastActivityAt: timestamp,
    expiresAt: timestamp + idleExpiryMs,
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
    expiresAt: timestamp + idleExpiryMs,
    completedReportCount: session.completedReportCount,
    activeLanguage: session.activeLanguage,
  };
  persistSession(activeSession);
  return activeSession;
}
