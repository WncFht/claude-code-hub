"use server";

import { fetchClientVersionStats } from "@/actions/client-versions";
import { getCacheStats as getErrorRulesCacheStats, listErrorRules } from "@/actions/error-rules";
import { listRequestFilters } from "@/actions/request-filters";
import {
  getCacheStats as getSensitiveWordsCacheStats,
  listSensitiveWords,
} from "@/actions/sensitive-words";
import { fetchSystemSettings } from "@/actions/system-config";
import type { ClientVersionStats } from "@/lib/client-version-checker";
import type { ErrorRule } from "@/repository/error-rules";
import { findAllProviders } from "@/repository/provider";
import type { RequestFilter } from "@/repository/request-filters";
import type { SensitiveWord } from "@/repository/sensitive-words";

type SensitiveWordsCacheStats = Awaited<ReturnType<typeof getSensitiveWordsCacheStats>>;
type ErrorRulesCacheStats = Awaited<ReturnType<typeof getErrorRulesCacheStats>>;

export interface ConsoleSensitiveWordsData {
  words: SensitiveWord[];
  cacheStats: SensitiveWordsCacheStats;
}

export interface ConsoleErrorRulesData {
  rules: ErrorRule[];
  cacheStats: ErrorRulesCacheStats;
}

export interface ConsoleRequestFilterProviderOption {
  id: number;
  name: string;
}

export interface ConsoleRequestFiltersData {
  filters: RequestFilter[];
  providers: ConsoleRequestFilterProviderOption[];
}

export interface ConsoleClientVersionsData {
  enableClientVersionCheck: boolean;
  stats: ClientVersionStats[];
}

export async function getConsoleSensitiveWordsData(): Promise<ConsoleSensitiveWordsData> {
  const [words, cacheStats] = await Promise.all([
    listSensitiveWords(),
    getSensitiveWordsCacheStats(),
  ]);

  return {
    words,
    cacheStats,
  };
}

export async function getConsoleErrorRulesData(): Promise<ConsoleErrorRulesData> {
  const [rules, cacheStats] = await Promise.all([listErrorRules(), getErrorRulesCacheStats()]);

  return {
    rules,
    cacheStats,
  };
}

export async function getConsoleRequestFiltersData(): Promise<ConsoleRequestFiltersData> {
  const [filters, providers] = await Promise.all([listRequestFilters(), findAllProviders()]);

  return {
    filters,
    providers: providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
    })),
  };
}

export async function getConsoleClientVersionsData(): Promise<ConsoleClientVersionsData> {
  const [settingsResult, statsResult] = await Promise.all([
    fetchSystemSettings(),
    fetchClientVersionStats(),
  ]);

  return {
    enableClientVersionCheck: settingsResult.ok
      ? settingsResult.data.enableClientVersionCheck
      : false,
    stats: statsResult.ok ? statsResult.data : [],
  };
}
