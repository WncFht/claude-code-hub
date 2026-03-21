"use server";

import { getKeyQuotaUsage, type KeyQuotaUsageResult } from "@/actions/key-quota";
import { getMyQuota, type MyUsageQuota } from "@/actions/my-usage";
import { getProviderLimitUsageBatch, getProviders } from "@/actions/providers";
import { getUserLimitUsage, getUsers } from "@/actions/users";
import type { UserQuotaWithUsage } from "@/app/[locale]/dashboard/quotas/users/_components/types";
import { getSession } from "@/lib/auth";
import { resolveKeyCostResetAt } from "@/lib/rate-limit/cost-reset-utils";
import type { CurrencyCode } from "@/lib/utils/currency";
import { resolveSystemTimezone } from "@/lib/utils/timezone";
import { sumKeyTotalCostBatchByIds, sumUserTotalCostBatch } from "@/repository/statistics";
import { getSystemSettings } from "@/repository/system-config";
import { findUserById } from "@/repository/user";
import type { ProviderType } from "@/types/provider";
import type { BillingModelSource } from "@/types/system-config";
import type { User } from "@/types/user";

export interface ConsoleDashboardContext {
  currentUser: User;
  systemSettings: {
    allowGlobalUsageView: boolean;
    billingModelSource: BillingModelSource;
    currencyDisplay: CurrencyCode;
  };
  serverTimeZone: string;
}

export interface ConsoleLeaderboardUserContext {
  userId: number;
  userName: string;
}

interface ProviderQuotaSnapshot {
  cost5h: { current: number; limit: number | null; resetInfo: string };
  costDaily: { current: number; limit: number | null; resetAt?: Date };
  costWeekly: { current: number; limit: number | null; resetAt: Date };
  costMonthly: { current: number; limit: number | null; resetAt: Date };
  concurrentSessions: { current: number; limit: number };
}

export interface ConsoleProviderWithQuota {
  id: number;
  name: string;
  providerType: ProviderType;
  isEnabled: boolean;
  priority: number;
  weight: number;
  quota: ProviderQuotaSnapshot | null;
}

export type ConsoleTrafficQuotaData =
  | {
      mode: "admin";
      currencyCode: CurrencyCode;
      users: UserQuotaWithUsage[];
      providers: ConsoleProviderWithQuota[];
    }
  | {
      mode: "self";
      currencyCode: CurrencyCode;
      quota: MyUsageQuota;
    };

interface ConsoleKeyQuotaSnapshot {
  cost5h: { current: number; limit: number | null; resetAt?: Date };
  costDaily: { current: number; limit: number | null; resetAt?: Date };
  costWeekly: { current: number; limit: number | null; resetAt?: Date };
  costMonthly: { current: number; limit: number | null; resetAt?: Date };
  concurrentSessions: { current: number; limit: number };
}

interface ConsoleTrafficKeyQuotaUser {
  id: number;
  name: string;
  role: UserQuotaWithUsage["role"];
  userQuota: UserQuotaWithUsage["quota"];
  keys: Array<{
    id: number;
    name: string;
    isEnabled: boolean;
    expiresAt: string | null;
    quota: ConsoleKeyQuotaSnapshot | null;
    limitDailyUsd: number | null;
    dailyResetTime: string;
    dailyResetMode: "fixed" | "rolling";
  }>;
}

export interface ConsoleTrafficKeyQuotaData {
  currencyCode: CurrencyCode;
  users: ConsoleTrafficKeyQuotaUser[];
}

export async function getConsoleDashboardContext(): Promise<ConsoleDashboardContext> {
  const session = await getSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  const [systemSettings, serverTimeZone] = await Promise.all([
    getSystemSettings(),
    resolveSystemTimezone(),
  ]);

  return {
    currentUser: session.user,
    systemSettings: {
      allowGlobalUsageView: systemSettings.allowGlobalUsageView,
      billingModelSource: systemSettings.billingModelSource,
      currencyDisplay: systemSettings.currencyDisplay,
    },
    serverTimeZone,
  };
}

export async function getConsoleLeaderboardUserContext(
  userId: number
): Promise<ConsoleLeaderboardUserContext> {
  const session = await getSession();

  if (!session || session.user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("INVALID_USER_ID");
  }

  const user = await findUserById(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return {
    userId,
    userName: user.name,
  };
}

async function getUsersWithQuotas(): Promise<UserQuotaWithUsage[]> {
  const users = await getUsers();
  const allUserIds = users.map((user) => user.id);
  const allKeyIds = users.flatMap((user) => user.keys.map((key) => key.id));

  const userResetAtMap = new Map<number, Date>();
  const keyResetAtMap = new Map<number, Date>();

  for (const user of users) {
    if (user.costResetAt instanceof Date) {
      userResetAtMap.set(user.id, user.costResetAt);
    }

    for (const key of user.keys) {
      const resolvedResetAt = resolveKeyCostResetAt(
        key.costResetAt ? new Date(key.costResetAt) : null,
        user.costResetAt instanceof Date ? user.costResetAt : null
      );

      if (resolvedResetAt) {
        keyResetAtMap.set(key.id, resolvedResetAt);
      }
    }
  }

  const [quotaResults, userCostMap, keyCostMap] = await Promise.all([
    Promise.all(users.map((user) => getUserLimitUsage(user.id))),
    sumUserTotalCostBatch(
      allUserIds,
      Infinity,
      userResetAtMap.size > 0 ? userResetAtMap : undefined
    ),
    sumKeyTotalCostBatchByIds(
      allKeyIds,
      Infinity,
      keyResetAtMap.size > 0 ? keyResetAtMap : undefined
    ),
  ]);

  return users.map((user, index) => {
    const quotaResult = quotaResults[index];

    return {
      id: user.id,
      name: user.name,
      note: user.note,
      role: user.role,
      isEnabled: user.isEnabled,
      expiresAt: user.expiresAt ?? null,
      providerGroup: user.providerGroup,
      tags: user.tags,
      quota: quotaResult.ok ? quotaResult.data : null,
      limit5hUsd: user.limit5hUsd ?? null,
      limitWeeklyUsd: user.limitWeeklyUsd ?? null,
      limitMonthlyUsd: user.limitMonthlyUsd ?? null,
      limitTotalUsd: user.limitTotalUsd ?? null,
      limitConcurrentSessions: user.limitConcurrentSessions ?? null,
      totalUsage: userCostMap.get(user.id) ?? 0,
      keys: user.keys.map((key) => ({
        id: key.id,
        name: key.name,
        status: key.status,
        todayUsage: key.todayUsage,
        totalUsage: keyCostMap.get(key.id) ?? 0,
        limit5hUsd: key.limit5hUsd,
        limitDailyUsd: key.limitDailyUsd,
        limitWeeklyUsd: key.limitWeeklyUsd,
        limitMonthlyUsd: key.limitMonthlyUsd,
        limitTotalUsd: key.limitTotalUsd ?? null,
        limitConcurrentSessions: key.limitConcurrentSessions,
        dailyResetMode: key.dailyResetMode,
        dailyResetTime: key.dailyResetTime,
      })),
    };
  });
}

async function getProvidersWithQuotas(): Promise<ConsoleProviderWithQuota[]> {
  const providers = await getProviders();
  const quotaMap = await getProviderLimitUsageBatch(
    providers.map((provider) => ({
      id: provider.id,
      dailyResetMode: provider.dailyResetMode,
      dailyResetTime: provider.dailyResetTime,
      limit5hUsd: provider.limit5hUsd,
      limitDailyUsd: provider.limitDailyUsd,
      limitWeeklyUsd: provider.limitWeeklyUsd,
      limitMonthlyUsd: provider.limitMonthlyUsd,
      limitConcurrentSessions: provider.limitConcurrentSessions,
    }))
  );

  return providers.map((provider) => ({
    id: provider.id,
    name: provider.name,
    providerType: provider.providerType,
    isEnabled: provider.isEnabled,
    priority: provider.priority,
    weight: provider.weight,
    quota: quotaMap.get(provider.id) ?? null,
  }));
}

export async function getConsoleTrafficQuotaData(): Promise<ConsoleTrafficQuotaData> {
  const [session, systemSettings] = await Promise.all([getSession(), getSystemSettings()]);

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (session.user.role !== "admin") {
    const quotaResult = await getMyQuota();

    if (!quotaResult.ok) {
      throw new Error(quotaResult.error || "FETCH_MY_QUOTA_FAILED");
    }

    return {
      mode: "self",
      currencyCode: systemSettings.currencyDisplay,
      quota: quotaResult.data,
    };
  }

  const [users, providers] = await Promise.all([getUsersWithQuotas(), getProvidersWithQuotas()]);

  return {
    mode: "admin",
    currencyCode: systemSettings.currencyDisplay,
    users,
    providers,
  };
}

function hasIndependentKeyQuota(key: UserQuotaWithUsage["keys"][number]) {
  return Boolean(
    key.limit5hUsd ||
      key.limitDailyUsd ||
      key.limitWeeklyUsd ||
      key.limitMonthlyUsd ||
      key.limitTotalUsd ||
      key.limitConcurrentSessions > 0
  );
}

function getKeyQuotaItem(
  items: KeyQuotaUsageResult["items"],
  type: KeyQuotaUsageResult["items"][number]["type"]
) {
  return items.find((item) => item.type === type) ?? null;
}

function toConsoleKeyQuotaSnapshot(
  items: KeyQuotaUsageResult["items"]
): ConsoleKeyQuotaSnapshot | null {
  const cost5h = getKeyQuotaItem(items, "limit5h");
  const costDaily = getKeyQuotaItem(items, "limitDaily");
  const costWeekly = getKeyQuotaItem(items, "limitWeekly");
  const costMonthly = getKeyQuotaItem(items, "limitMonthly");
  const concurrentSessions = getKeyQuotaItem(items, "limitSessions");

  if (!cost5h || !costDaily || !costWeekly || !costMonthly || !concurrentSessions) {
    return null;
  }

  if (
    cost5h.limit === null &&
    costDaily.limit === null &&
    costWeekly.limit === null &&
    costMonthly.limit === null &&
    concurrentSessions.limit === null
  ) {
    return null;
  }

  return {
    cost5h: {
      current: cost5h.current,
      limit: cost5h.limit,
    },
    costDaily: {
      current: costDaily.current,
      limit: costDaily.limit,
    },
    costWeekly: {
      current: costWeekly.current,
      limit: costWeekly.limit,
    },
    costMonthly: {
      current: costMonthly.current,
      limit: costMonthly.limit,
    },
    concurrentSessions: {
      current: concurrentSessions.current,
      limit: concurrentSessions.limit ?? 0,
    },
  };
}

export async function getConsoleTrafficKeyQuotaData(): Promise<ConsoleTrafficKeyQuotaData> {
  const [session, systemSettings] = await Promise.all([getSession(), getSystemSettings()]);

  if (!session || session.user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }

  const users = await getUsersWithQuotas();
  const keyQuotaEntries = await Promise.all(
    users.flatMap((user) =>
      user.keys.map(async (key) => {
        if (!hasIndependentKeyQuota(key)) {
          return [key.id, null] as const;
        }

        const quotaUsage = await getKeyQuotaUsage(key.id);
        return [
          key.id,
          quotaUsage.ok ? toConsoleKeyQuotaSnapshot(quotaUsage.data.items) : null,
        ] as const;
      })
    )
  );

  const keyQuotaMap = new Map<number, ConsoleKeyQuotaSnapshot | null>(keyQuotaEntries);

  return {
    currencyCode: systemSettings.currencyDisplay,
    users: users
      .map((user) => ({
        id: user.id,
        name: user.name,
        role: user.role,
        userQuota: user.quota,
        keys: user.keys.map((key) => ({
          id: key.id,
          name: key.name,
          isEnabled: key.status === "enabled",
          expiresAt: key.expiresAt ?? null,
          quota: keyQuotaMap.get(key.id) ?? null,
          limitDailyUsd: key.limitDailyUsd,
          dailyResetTime: key.dailyResetTime,
          dailyResetMode: key.dailyResetMode,
        })),
      }))
      .filter((user) => user.keys.length > 0),
  };
}
