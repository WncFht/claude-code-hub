import "server-only";

import path from "node:path";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { logger } from "@/lib/logger";

const MIGRATION_ADVISORY_LOCK_NAME = "claude-code-hub:migrations";
const DRIZZLE_BASELINE_REQUIRED_TABLES = [
  "keys",
  "message_request",
  "model_prices",
  "providers",
  "system_settings",
  "users",
] as const;
const LEGACY_SCHEMA_REPAIR_CODEX_PRIORITY_BILLING_SOURCE =
  "system_settings.codex_priority_billing_source";

type MigrationFile = ReturnType<typeof readMigrationFiles>[number];

type MigrationBootstrapState = {
  migrationRowCount: number;
  presentRequiredTables: string[];
  hasProvisionedPublicSchema: boolean;
  hasSystemSettingsTable: boolean;
  hasCodexPriorityBillingSource: boolean;
};

export function shouldBaselineLegacyDrizzleMigrations(
  state: Pick<MigrationBootstrapState, "migrationRowCount" | "hasProvisionedPublicSchema">
): boolean {
  return state.migrationRowCount === 0 && state.hasProvisionedPublicSchema;
}

export function getPendingLegacySchemaRepairs(
  state: Pick<MigrationBootstrapState, "hasSystemSettingsTable" | "hasCodexPriorityBillingSource">
): string[] {
  const repairs: string[] = [];

  if (state.hasSystemSettingsTable && !state.hasCodexPriorityBillingSource) {
    repairs.push(LEGACY_SCHEMA_REPAIR_CODEX_PRIORITY_BILLING_SOURCE);
  }

  return repairs;
}

export async function withAdvisoryLock<T>(
  lockName: string,
  fn: () => Promise<T>,
  options?: { skipIfLocked?: boolean }
): Promise<{ ran: boolean; result?: T }> {
  if (!process.env.DSN) {
    logger.error("DSN environment variable is not set");
    process.exit(1);
  }

  const client = postgres(process.env.DSN, { max: 1 });
  let acquired = false;

  try {
    if (options?.skipIfLocked) {
      const [row] = await client`SELECT pg_try_advisory_lock(hashtext(${lockName})) as locked`;
      acquired = row?.locked === true;
      if (!acquired) {
        return { ran: false };
      }
    } else {
      await client`SELECT pg_advisory_lock(hashtext(${lockName}))`;
      acquired = true;
    }

    const result = await fn();
    return { ran: true, result };
  } finally {
    if (acquired) {
      try {
        await client`SELECT pg_advisory_unlock(hashtext(${lockName}))`;
      } catch (unlockError) {
        logger.error("Failed to release advisory lock", {
          lockName,
          error: unlockError instanceof Error ? unlockError.message : String(unlockError),
        });
      }
    }

    try {
      await client.end();
    } catch (endError) {
      logger.error("Failed to close advisory lock client", {
        lockName,
        error: endError instanceof Error ? endError.message : String(endError),
      });
    }
  }
}

async function ensureDrizzleMigrationsTableExists(
  client: ReturnType<typeof postgres>
): Promise<void> {
  await client`CREATE SCHEMA IF NOT EXISTS "drizzle"`;
  await client`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    )
  `;
}

async function repairDrizzleMigrationsCreatedAt(input: {
  client: ReturnType<typeof postgres>;
  migrations: MigrationFile[];
}): Promise<void> {
  const { client, migrations } = input;

  // drizzle-orm migrator 仅比较 `created_at(folderMillis)` 来决定是否执行迁移。
  // 若历史 journal 的 `when` 被修正（或曾出现非单调），旧实例可能会因为 `created_at` 偏大而永久跳过后续迁移。
  // 这里用 hash 对齐并修复 created_at，让升级对用户无感（Docker 拉新镜像重启即可）。
  const expectedCreatedAtByHash = new Map<string, number>();
  for (const migration of migrations) {
    expectedCreatedAtByHash.set(migration.hash, migration.folderMillis);
  }

  const rows = (await client`
    SELECT id, hash, created_at
    FROM "drizzle"."__drizzle_migrations"
  `) as Array<{
    id: number;
    hash: string;
    created_at: string | number | null;
  }>;

  const pendingFixes: Array<{ id: number; hash: string; from: number | null; to: number }> = [];

  for (const row of rows) {
    const expected = expectedCreatedAtByHash.get(row.hash);
    if (expected == null) {
      continue;
    }

    const currentRaw = row.created_at;
    const current =
      typeof currentRaw === "number"
        ? currentRaw
        : typeof currentRaw === "string"
          ? Number(currentRaw)
          : null;

    if (current == null || !Number.isFinite(current) || current !== expected) {
      pendingFixes.push({
        id: row.id,
        hash: row.hash,
        from: current,
        to: expected,
      });
    }
  }

  if (pendingFixes.length === 0) {
    return;
  }

  for (const fix of pendingFixes) {
    await client`
      UPDATE "drizzle"."__drizzle_migrations"
      SET created_at = ${fix.to}
      WHERE id = ${fix.id}
    `;
  }

  logger.info("Repaired drizzle.__drizzle_migrations created_at", {
    repaired: pendingFixes.length,
  });
}

async function inspectMigrationBootstrapState(
  client: ReturnType<typeof postgres>
): Promise<MigrationBootstrapState> {
  const [row] = (await client`
    SELECT
      COALESCE((SELECT COUNT(*)::int FROM "drizzle"."__drizzle_migrations"), 0) AS migration_row_count,
      EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'keys'
      ) AS has_keys_table,
      EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'message_request'
      ) AS has_message_request_table,
      EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'model_prices'
      ) AS has_model_prices_table,
      EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'providers'
      ) AS has_providers_table,
      EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'system_settings'
      ) AS has_system_settings_table,
      EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      ) AS has_users_table,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'system_settings'
          AND column_name = 'codex_priority_billing_source'
      ) AS has_codex_priority_billing_source
  `) as Array<{
    migration_row_count: number | string | null;
    has_keys_table: boolean;
    has_message_request_table: boolean;
    has_model_prices_table: boolean;
    has_providers_table: boolean;
    has_system_settings_table: boolean;
    has_users_table: boolean;
    has_codex_priority_billing_source: boolean;
  }>;

  const presentRequiredTables = DRIZZLE_BASELINE_REQUIRED_TABLES.filter((tableName) => {
    switch (tableName) {
      case "keys":
        return row?.has_keys_table === true;
      case "message_request":
        return row?.has_message_request_table === true;
      case "model_prices":
        return row?.has_model_prices_table === true;
      case "providers":
        return row?.has_providers_table === true;
      case "system_settings":
        return row?.has_system_settings_table === true;
      case "users":
        return row?.has_users_table === true;
      default:
        return false;
    }
  });

  const migrationRowCountRaw = row?.migration_row_count;
  const migrationRowCount =
    typeof migrationRowCountRaw === "number"
      ? migrationRowCountRaw
      : typeof migrationRowCountRaw === "string"
        ? Number(migrationRowCountRaw)
        : 0;

  return {
    migrationRowCount: Number.isFinite(migrationRowCount) ? migrationRowCount : 0,
    presentRequiredTables,
    hasProvisionedPublicSchema:
      presentRequiredTables.length === DRIZZLE_BASELINE_REQUIRED_TABLES.length,
    hasSystemSettingsTable: row?.has_system_settings_table === true,
    hasCodexPriorityBillingSource: row?.has_codex_priority_billing_source === true,
  };
}

async function repairKnownLegacySchemaDrift(input: {
  client: ReturnType<typeof postgres>;
  state: MigrationBootstrapState;
}): Promise<MigrationBootstrapState> {
  const { client, state } = input;
  const pendingRepairs = getPendingLegacySchemaRepairs(state);

  if (pendingRepairs.length === 0) {
    return state;
  }

  if (pendingRepairs.includes(LEGACY_SCHEMA_REPAIR_CODEX_PRIORITY_BILLING_SOURCE)) {
    await client`
      ALTER TABLE "system_settings"
      ADD COLUMN IF NOT EXISTS "codex_priority_billing_source" varchar(20)
      DEFAULT 'requested' NOT NULL
    `;
  }

  logger.warn("Applied legacy schema repairs before migrations", {
    repairs: pendingRepairs,
  });

  return {
    ...state,
    hasCodexPriorityBillingSource: true,
  };
}

async function baselineLegacyDrizzleMigrations(input: {
  client: ReturnType<typeof postgres>;
  migrations: MigrationFile[];
}): Promise<void> {
  const { client, migrations } = input;

  for (const migration of migrations) {
    await client`
      INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
      VALUES (${migration.hash}, ${migration.folderMillis})
    `;
  }

  logger.warn("Baselined drizzle.__drizzle_migrations for a pre-existing schema", {
    inserted: migrations.length,
  });
}

/**
 * 自动执行数据库迁移
 * 在生产环境启动时自动运行
 */
export async function runMigrations() {
  if (!process.env.DSN) {
    logger.error("DSN environment variable is not set");
    process.exit(1);
  }

  logger.info("Starting database migrations...");

  const migrationClient = postgres(process.env.DSN, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    logger.info("Waiting for database migration lock...");
    await migrationClient`SELECT pg_advisory_lock(hashtext(${MIGRATION_ADVISORY_LOCK_NAME}))`;
    logger.info("Database migration lock acquired");

    // 获取迁移文件路径
    const migrationsFolder = path.join(process.cwd(), "drizzle");
    const migrations = readMigrationFiles({ migrationsFolder });

    await ensureDrizzleMigrationsTableExists(migrationClient);
    let bootstrapState = await inspectMigrationBootstrapState(migrationClient);

    bootstrapState = await repairKnownLegacySchemaDrift({
      client: migrationClient,
      state: bootstrapState,
    });

    if (shouldBaselineLegacyDrizzleMigrations(bootstrapState)) {
      await baselineLegacyDrizzleMigrations({
        client: migrationClient,
        migrations,
      });
    } else if (
      bootstrapState.migrationRowCount === 0 &&
      bootstrapState.presentRequiredTables.length > 0
    ) {
      logger.warn(
        "Skipping automatic drizzle baseline because the public schema is only partially provisioned",
        {
          presentRequiredTables: bootstrapState.presentRequiredTables,
          expectedRequiredTables: DRIZZLE_BASELINE_REQUIRED_TABLES,
        }
      );
    }

    await repairDrizzleMigrationsCreatedAt({ client: migrationClient, migrations });

    // 执行迁移
    await migrate(db, { migrationsFolder });

    logger.info("Database migrations completed successfully");
  } catch (error) {
    logger.error("Migration failed", error);
    process.exit(1);
  } finally {
    try {
      await migrationClient`SELECT pg_advisory_unlock(hashtext(${MIGRATION_ADVISORY_LOCK_NAME}))`;
    } catch (unlockError) {
      logger.error("Failed to release database migration lock", unlockError);
    }

    // 关闭连接
    await migrationClient.end();
  }
}

/**
 * 检查数据库连接
 */
export async function checkDatabaseConnection(retries = 30, delay = 2000): Promise<boolean> {
  if (!process.env.DSN) {
    logger.error("DSN environment variable is not set");
    return false;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const client = postgres(process.env.DSN, { max: 1 });
      await client`SELECT 1`;
      await client.end();
      logger.info("Database connection established");
      return true;
    } catch (error) {
      logger.error(`Waiting for database... (${i + 1}/${retries})`, error);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  logger.error("Failed to connect to database after retries", { attempts: retries });
  return false;
}
