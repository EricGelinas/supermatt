import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("no SKILL.md holds a positional placeholder a host substitutes when it loads the skill with arguments", () => {
  const offenders = [];
  for (const skill of readdirSync(join(repo, "skills"))) {
    let text;
    try {
      text = readFileSync(join(repo, "skills", skill, "SKILL.md"), "utf8");
    } catch {
      continue;
    }
    text.split("\n").forEach((line, index) => {
      if (/\$[0-9]/.test(line)) offenders.push(`skills/${skill}/SKILL.md:${index + 1}: ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], "move shell that needs $N into a script under the skill's scripts/");
});

test("code-review's untracked-diff script appends every untracked file, names with spaces and quotes included", (t) => {
  const script = join(repo, "skills/code-review/scripts/untracked-diff.sh");
  const root = mkdtempSync(join(tmpdir(), "untracked-diff-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const work = join(root, "repo");
  const out = join(root, "out");
  execFileSync("git", ["init", "-q", work]);
  execFileSync("mkdir", [out]);
  writeFileSync(join(work, ".gitignore"), "ignored.txt\n");
  writeFileSync(join(work, "plain.txt"), "plain\n");
  writeFileSync(join(work, "with space 'quote'.txt"), "spaced\n");
  writeFileSync(join(work, "ignored.txt"), "ignored\n");
  writeFileSync(join(out, "diff.patch"), "tracked diff\n");

  const run = spawnSync("sh", [script, out], { cwd: work, encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  const diff = readFileSync(join(out, "diff.patch"), "utf8");
  assert.ok(diff.startsWith("tracked diff\n"), "keeps the tracked diff before it");
  assert.match(diff, /^\+plain$/m);
  assert.match(diff, /^\+spaced$/m);
  assert.doesNotMatch(diff, /^\+ignored$/m);
});
