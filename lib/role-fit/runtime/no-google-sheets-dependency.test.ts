import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { test } from "node:test";

const root = process.cwd();
const prohibitedMarkers = [
  ["GOOGLE", "_SHEETS_"].join(""),
  ["google", "-sheets-store"].join(""),
  ["sheets", ".googleapis.com"].join(""),
  ["oauth2", ".googleapis.com"].join(""),
  ["appendContact", "LeadPersistenceRow"].join(""),
  ["appendRoleFit", "ReportPersistenceRow"].join(""),
  ["isRoleFit", "RuntimeStoreConfigured"].join(""),
];

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(path);
    return [path];
  }));
  return nested.flat();
}

test("RoleFit runtime has no active Google Sheets dependency", async () => {
  const sourceFiles = [
    ...(await collectFiles(join(root, "app"))),
    ...(await collectFiles(join(root, "lib", "role-fit"))),
    join(root, ".env.example"),
    join(root, "package.json"),
  ].filter((path) => /\.(ts|tsx|json)$|\.env\.example$/.test(path));

  for (const path of sourceFiles) {
    const source = await readFile(path, "utf8");
    for (const marker of prohibitedMarkers) {
      assert.equal(source.includes(marker), false, `${relative(root, path)} retains obsolete dependency marker ${marker}`);
    }
  }
});
