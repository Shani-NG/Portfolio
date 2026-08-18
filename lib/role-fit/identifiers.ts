const idAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createShortId(prefix: "R" | "L") {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (byte) => idAlphabet[byte % idAlphabet.length]).join("");
  return `${prefix}${suffix}`;
}

export function createReportId() {
  return createShortId("R");
}

export function createLeadId() {
  return createShortId("L");
}
