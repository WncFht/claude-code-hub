import { mkdir, open, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const LOCK_DIR_ENV = "CCH_RUNTIME_BOOTSTRAP_LOCK_DIR";
const DEFAULT_LOCK_DIR = "/tmp";
const LOCK_FILE_NAME = "cch-runtime-bootstrap.lock";

export interface RuntimeBootstrapLockResult {
  acquired: boolean;
  lockFilePath: string;
}

function getLockDir(): string {
  const configured = process.env[LOCK_DIR_ENV]?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_LOCK_DIR;
}

export function getRuntimeBootstrapLockPath(): string {
  return path.join(getLockDir(), LOCK_FILE_NAME);
}

async function isStaleLock(lockFilePath: string): Promise<boolean> {
  try {
    const raw = await readFile(lockFilePath, "utf8");
    const parsed = JSON.parse(raw) as { pid?: number };
    const pid = parsed.pid;

    if (typeof pid !== "number" || !Number.isInteger(pid) || pid <= 0) {
      return true;
    }

    try {
      process.kill(pid, 0);
      return false;
    } catch (error) {
      return (error as NodeJS.ErrnoException).code === "ESRCH";
    }
  } catch {
    return true;
  }
}

export async function acquireRuntimeBootstrapLock(): Promise<RuntimeBootstrapLockResult> {
  const lockFilePath = getRuntimeBootstrapLockPath();
  await mkdir(path.dirname(lockFilePath), { recursive: true });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const handle = await open(lockFilePath, "wx");
      try {
        await handle.writeFile(
          JSON.stringify(
            {
              pid: process.pid,
              hostname: process.env.HOSTNAME ?? os.hostname(),
              createdAt: new Date().toISOString(),
            },
            null,
            2
          ),
          "utf8"
        );
      } finally {
        await handle.close();
      }

      return {
        acquired: true,
        lockFilePath,
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") {
        throw error;
      }

      if (!(await isStaleLock(lockFilePath))) {
        return {
          acquired: false,
          lockFilePath,
        };
      }

      await rm(lockFilePath, { force: true });
    }
  }

  return {
    acquired: false,
    lockFilePath,
  };
}

export async function releaseRuntimeBootstrapLock(): Promise<void> {
  await rm(getRuntimeBootstrapLockPath(), { force: true });
}
