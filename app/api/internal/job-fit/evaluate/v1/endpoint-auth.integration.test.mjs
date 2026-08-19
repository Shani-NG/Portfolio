import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";

const port = 3117;
const baseUrl = `http://127.0.0.1:${port}`;

async function waitForServer(child) {
  const deadline = Date.now() + 20_000;
  let lastError;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Local evaluator server exited with ${child.exitCode}.`);
    try {
      const response = await fetch(`${baseUrl}/api/internal/job-fit/evaluate/v1`, { method: "POST", body: "{}" });
      if (response.status === 401) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw lastError ?? new Error("Timed out waiting for the local evaluator server.");
}

test("Central Job-Fit endpoint accepts the configured server-to-server secret before candidate validation", async (t) => {
  const secret = process.env.JOB_FIT_INTERNAL_API_KEY?.trim();
  assert.ok(secret && secret.length >= 32, "JOB_FIT_INTERNAL_API_KEY must be configured for this integration test");

  const server = spawn("pnpm", ["exec", "next", "dev", "--port", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, JOB_FIT_INTERNAL_API_KEY: secret },
    stdio: "ignore",
    detached: true,
  });
  t.after(() => {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
    }
  });
  await waitForServer(server);

  const response = await fetch(`${baseUrl}/api/internal/job-fit/evaluate/v1`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: "{}",
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { state: "validation-failed", reason: "invalid-normalized-candidate" });
});
