"use client";

import type { RoleFitClientBoundaryEventName, RoleFitBoundarySnapshot } from "../runtime/boundary-events.ts";

export function createRoleFitBoundaryCorrelationId() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function emitRoleFitClientBoundaryEvent(input: {
  eventName: RoleFitClientBoundaryEventName;
  sessionId: string;
  correlationId: string;
  reportId?: string;
  snapshot: RoleFitBoundarySnapshot;
}) {
  const event = {
    eventName: input.eventName,
    sessionId: input.sessionId,
    correlationId: input.correlationId,
    ...(input.reportId ? { reportId: input.reportId } : {}),
    clientTimestamp: new Date().toISOString(),
    snapshot: {
      roleDraftPresent: input.snapshot.roleDraftPresent,
      roleDraftValidationStatus: input.snapshot.roleDraftValidationStatus,
      pendingReportConfirmation: input.snapshot.pendingReportConfirmation,
      reportPayloadPresent: input.snapshot.reportPayloadPresent,
      clientState: input.snapshot.clientState,
      ...(input.snapshot.revalidationAttempted !== undefined ? { revalidationAttempted: input.snapshot.revalidationAttempted } : {}),
      ...(input.snapshot.routingDecision ? { routingDecision: input.snapshot.routingDecision } : {}),
      ...(input.snapshot.httpStatus !== undefined ? { httpStatus: input.snapshot.httpStatus } : {}),
    },
  };

  // The browser console is a capture fallback if the optional telemetry POST is lost.
  try {
    console.info("[rolefit-boundary]", event);
    void fetch("/api/role-fit/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    }).then((response) => {
      if (!response.ok) console.warn("[rolefit-boundary-persist-failed]", {
        eventName: event.eventName,
        correlationId: event.correlationId,
        status: response.status,
      });
    }).catch(() => undefined);
  } catch {
    // Observability must never block the Role Fit flow.
  }
}
