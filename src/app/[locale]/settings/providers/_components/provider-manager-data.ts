import { getProviderVendors } from "@/actions/provider-endpoints";
import {
  getProviderStatisticsAsync,
  getProviders,
  getProvidersHealthStatus,
} from "@/actions/providers";
import type { CurrencyCode } from "@/lib/utils/currency";
import type { ProviderDisplay, ProviderStatisticsMap } from "@/types/provider";

export type ProviderHealthStatus = Record<
  number,
  {
    circuitState: "closed" | "open" | "half-open";
    failureCount: number;
    lastFailureTime: number | null;
    circuitOpenUntil: number | null;
    recoveryMinutes: number | null;
  }
>;

export async function fetchProviderManagerSystemSettings(): Promise<{
  currencyDisplay: CurrencyCode;
}> {
  const response = await fetch("/api/system-settings");

  if (!response.ok) {
    throw new Error("FETCH_SETTINGS_FAILED");
  }

  return response.json() as Promise<{ currencyDisplay: CurrencyCode }>;
}

export function getProvidersQueryOptions() {
  return {
    queryKey: ["providers"],
    queryFn: getProviders,
    staleTime: 30_000,
  } as const satisfies {
    queryKey: readonly ["providers"];
    queryFn: () => Promise<ProviderDisplay[]>;
    staleTime: number;
  };
}

export function getProvidersHealthQueryOptions() {
  return {
    queryKey: ["providers-health"],
    queryFn: getProvidersHealthStatus,
    staleTime: 30_000,
  } as const satisfies {
    queryKey: readonly ["providers-health"];
    queryFn: () => Promise<ProviderHealthStatus>;
    staleTime: number;
  };
}

export function getProvidersStatisticsQueryOptions() {
  return {
    queryKey: ["providers-statistics"],
    queryFn: getProviderStatisticsAsync,
    staleTime: 30_000,
  } as const satisfies {
    queryKey: readonly ["providers-statistics"];
    queryFn: () => Promise<ProviderStatisticsMap>;
    staleTime: number;
  };
}

export function getProviderVendorsQueryOptions() {
  return {
    queryKey: ["provider-vendors"],
    queryFn: getProviderVendors,
    staleTime: 60_000,
  } as const;
}

export function getProviderManagerSystemSettingsQueryOptions() {
  return {
    queryKey: ["system-settings"],
    queryFn: fetchProviderManagerSystemSettings,
    staleTime: 30_000,
  } as const;
}
