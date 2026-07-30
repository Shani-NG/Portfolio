"use client";

export type RoleFitMessage = {
  id: string;
  role: "user" | "agent";
  content: string;
};

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
  reportPayload: unknown | null;
  reportProvider: string;
  reportModel: string;
  completedReportCount: 0 | 1 | 2;
  pendingReportConfirmation: boolean;
};

const idleExpiryMs = 24 * 60 * 60 * 1000;
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
    reportPayload: null,
    reportProvider: "",
    reportModel: "",
    completedReportCount: 0,
    pendingReportConfirmation: false,
  };
}

export function getRoleFitLiveSession() {
  if (!activeSession || activeSession.expiresAt <= now()) {
    activeSession = createSession();
  }

  return activeSession;
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
