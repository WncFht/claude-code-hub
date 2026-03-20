import { execFileSync, execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "../../..");
const scriptPath = join(repoRoot, "scripts", "sync-upstream.sh");

const tempDirs: string[] = [];

function makeTempDir(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function run(command: string, cwd: string) {
  execSync(command, {
    cwd,
    stdio: "pipe",
  });
}

function runScript(args: string[], cwd: string, extraEnv?: Record<string, string>) {
  return execFileSync("bash", [scriptPath, ...args], {
    cwd,
    env: {
      ...process.env,
      ...extraEnv,
    },
    encoding: "utf8",
    stdio: "pipe",
  });
}

function initRepo(dir: string) {
  run("git init -b main", dir);
  run('git config user.name "Codex Test"', dir);
  run('git config user.email "codex@example.com"', dir);
}

describe("sync-upstream.sh", () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir) rmSync(dir, { force: true, recursive: true });
    }
  });

  test("setup adds upstream remote and sync creates a merge branch with upstream changes", () => {
    const seedRepo = makeTempDir("sync-upstream-seed-");
    const originBare = makeTempDir("sync-upstream-origin-");
    const upstreamBare = makeTempDir("sync-upstream-upstream-");
    const workRepo = makeTempDir("sync-upstream-work-");
    const upstreamWorkRepo = makeTempDir("sync-upstream-upstream-work-");

    initRepo(seedRepo);
    writeFileSync(join(seedRepo, "README.md"), "base\n");
    run("git add README.md", seedRepo);
    run('git commit -m "base commit"', seedRepo);

    run(`git init --bare "${originBare}"`, repoRoot);
    run(`git init --bare "${upstreamBare}"`, repoRoot);
    run(`git remote add origin "${originBare}"`, seedRepo);
    run(`git remote add upstream "${upstreamBare}"`, seedRepo);
    run("git push origin main", seedRepo);
    run("git push upstream main", seedRepo);

    run(`git clone --branch main "${originBare}" "${workRepo}"`, repoRoot);
    run('git config user.name "Codex Test"', workRepo);
    run('git config user.email "codex@example.com"', workRepo);

    const setupOutput = runScript(["setup"], workRepo, {
      SYNC_UPSTREAM_URL: upstreamBare,
    });
    expect(setupOutput).toContain("upstream");
    expect(
      execSync("git remote get-url upstream", { cwd: workRepo, encoding: "utf8" }).trim()
    ).toBe(upstreamBare);

    run(`git clone --branch main "${upstreamBare}" "${upstreamWorkRepo}"`, repoRoot);
    run('git config user.name "Codex Test"', upstreamWorkRepo);
    run('git config user.email "codex@example.com"', upstreamWorkRepo);
    writeFileSync(join(upstreamWorkRepo, "UPSTREAM_CHANGE.txt"), "upstream\n");
    run("git add UPSTREAM_CHANGE.txt", upstreamWorkRepo);
    run('git commit -m "upstream change"', upstreamWorkRepo);
    run("git push origin main", upstreamWorkRepo);

    const syncOutput = runScript(["sync", "sync/test-upstream"], workRepo, {
      SYNC_UPSTREAM_URL: upstreamBare,
    });

    expect(syncOutput).toContain("sync/test-upstream");
    expect(execSync("git branch --show-current", { cwd: workRepo, encoding: "utf8" }).trim()).toBe(
      "sync/test-upstream"
    );
    expect(
      execSync("git log --format=%s -1 upstream/main", { cwd: workRepo, encoding: "utf8" }).trim()
    ).toBe("upstream change");
    expect(
      execSync("git merge-base --is-ancestor upstream/main HEAD >/dev/null 2>&1; echo $?", {
        cwd: workRepo,
        encoding: "utf8",
        shell: "/bin/zsh",
      }).trim()
    ).toBe("0");
  });
});
