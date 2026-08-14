import { createSign } from "node:crypto";

export type RuntimeEventName =
  | "intent.detected"
  | "role.classified"
  | "role.validation_failed"
  | "role.clarification_requested"
  | "report.limit_blocked"
  | "report.generation_started"
  | "report.validation_completed"
  | "report.completed"
  | "report.failed"
  | "error.occurred";

type RuntimeMode = "portfolio-qa" | "role-understanding" | "fit-analysis" | "report-follow-up";
type RuntimeOutcome = "success" | "failure" | "blocked" | "partial";
type SafeMetadata = Record<string, string | number | boolean | null | undefined>;

export type RoleFitRuntimeEvent = {
  eventName: RuntimeEventName;
  conversationId?: string;
  sessionId?: string;
  reportId?: string;
  traceId?: string;
  mode?: RuntimeMode;
  outcome: RuntimeOutcome;
  durationMs?: number;
  metadata?: SafeMetadata;
};

export type RoleFitSessionSummary = {
  conversationId: string;
  sessionId?: string;
  language: "he" | "en" | "mixed";
  executiveSummary: string;
  intentPath: "portfolio-qa" | "role-fit";
  lastMode: RuntimeMode;
  lastOutcome: RuntimeOutcome;
  roleStatus?: string;
  roleFamily?: string;
  companyName?: string;
  reportStatus?: string;
  reportId?: string;
};

export type RoleFitReportSummary = {
  conversationId?: string;
  sessionId?: string;
  reportId?: string;
  provider?: string;
  model?: string;
  fitMode?: string;
  fitLabel?: string;
  evidenceStatus?: string;
};

export type RoleFitReportPersistenceRow = {
  report_id: string;
  created_at: string;
  role_title: string;
  company: string;
  role_family: string;
  location_or_work_model: string;
  fit_result: string;
  evidence_projects_used: string;
  contact_cta_clicked: "N" | "Y";
  report_json_summary: string;
};

export type ContactLeadPersistenceRow = {
  lead_id: string;
  created_at: string;
  name: string;
  email: string;
  company: string;
  message: string;
  report_id: string;
  source_context: string;
};

const sheetsScope = "https://www.googleapis.com/auth/spreadsheets";
const prohibitedMetadataKey = /(message|roletext|raw|content|prompt|transcript|email|phone|address|person|name)/i;
let accessTokenCache: { token: string; expiresAt: number } | null = null;

function getConfig() {
  return {
    spreadsheetId: process.env.GOOGLE_SHEETS_RUNTIME_SPREADSHEET_ID,
    clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    sessionsSheet: process.env.GOOGLE_SHEETS_RUNTIME_SESSIONS_TAB ?? "sessions",
    eventsSheet: process.env.GOOGLE_SHEETS_RUNTIME_EVENTS_TAB ?? "events",
    reportsSheet: process.env.GOOGLE_SHEETS_RUNTIME_REPORTS_TAB ?? "reports",
  };
}

function isConfigured() {
  const config = getConfig();
  return Boolean(config.spreadsheetId && config.clientEmail && config.privateKey);
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function signJwt(header: object, payload: object, privateKey: string) {
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(privateKey);
  return `${unsigned}.${base64Url(signature)}`;
}

async function getAccessToken() {
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 60_000) {
    return accessTokenCache.token;
  }

  const config = getConfig();
  if (!config.clientEmail || !config.privateKey) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const assertion = signJwt(
    { alg: "RS256", typ: "JWT" },
    {
      iss: config.clientEmail,
      scope: sheetsScope,
      aud: "https://oauth2.googleapis.com/token",
      exp: nowSeconds + 3600,
      iat: nowSeconds,
    },
    config.privateKey,
  );

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(4_000),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;

  accessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  return data.access_token;
}

function safeValue(value: unknown) {
  if (typeof value === "string") return value.slice(0, 240);
  if (typeof value === "number" || typeof value === "boolean") return value;
  return "";
}

function safeMetadata(metadata: SafeMetadata | undefined) {
  if (!metadata) return "";

  const entries = Object.entries(metadata)
    .filter(([key]) => !prohibitedMetadataKey.test(key))
    .map(([key, value]) => [key, safeValue(value)]);

  return JSON.stringify(Object.fromEntries(entries)).slice(0, 1000);
}

async function appendRows(sheetName: string, values: unknown[][]) {
  const config = getConfig();
  if (!isConfigured() || !config.spreadsheetId) return false;

  const token = await getAccessToken();
  if (!token) return false;

  const range = encodeURIComponent(`${sheetName}!A:Z`);
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
    signal: AbortSignal.timeout(4_000),
  });

  return response.ok;
}

export async function logRoleFitEvent(event: RoleFitRuntimeEvent) {
  try {
    const config = getConfig();
    await appendRows(config.eventsSheet, [[
      new Date().toISOString(),
      event.eventName,
      event.outcome,
      event.mode ?? "",
      event.conversationId ?? "",
      event.sessionId ?? "",
      event.reportId ?? "",
      event.traceId ?? "",
      event.durationMs ?? "",
      safeMetadata(event.metadata),
    ]]);
  } catch {
    // Runtime logging is best-effort and must never affect the agent response.
  }
}

export async function logRoleFitSessionSummary(summary: RoleFitSessionSummary) {
  try {
    const config = getConfig();
    await appendRows(config.sessionsSheet, [[
      new Date().toISOString(),
      summary.conversationId,
      summary.sessionId ?? "",
      summary.language,
      summary.executiveSummary.slice(0, 240),
      summary.intentPath,
      summary.lastMode,
      summary.lastOutcome,
      summary.roleStatus ?? "",
      summary.roleFamily ?? "",
      summary.companyName?.slice(0, 150) ?? "",
      summary.reportStatus ?? "",
      summary.reportId ?? "",
    ]]);
  } catch {
    // Runtime logging is best-effort and must never affect the agent response.
  }
}

export async function logRoleFitReportSummary(summary: RoleFitReportSummary) {
  try {
    const config = getConfig();
    await appendRows(config.reportsSheet, [[
      new Date().toISOString(),
      summary.reportId ?? "",
      summary.conversationId ?? "",
      summary.sessionId ?? "",
      summary.provider ?? "",
      summary.model ?? "",
      summary.fitMode ?? "",
      summary.fitLabel?.slice(0, 120) ?? "",
      summary.evidenceStatus ?? "",
    ]]);
  } catch {
    // Runtime logging is best-effort and must never affect the agent response.
  }
}

export async function appendRoleFitReportPersistenceRow(row: RoleFitReportPersistenceRow) {
  return appendRows("role_fit_reports", [[
    row.report_id,
    row.created_at,
    row.role_title,
    row.company,
    row.role_family,
    row.location_or_work_model,
    row.fit_result,
    row.evidence_projects_used,
    row.contact_cta_clicked,
    row.report_json_summary,
  ]]);
}

export async function appendContactLeadPersistenceRow(row: ContactLeadPersistenceRow) {
  return appendRows("leads", [[
    row.lead_id,
    row.created_at,
    row.name,
    row.email,
    row.company,
    row.message,
    row.report_id,
    row.source_context,
  ]]);
}

export function isRoleFitRuntimeStoreConfigured() {
  return isConfigured();
}
