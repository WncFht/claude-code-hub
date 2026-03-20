import type { ProviderDisplay } from "@/types/provider";

export type ProviderHealthStatusMap = Record<
  number,
  {
    circuitState: "closed" | "open" | "half-open";
    failureCount: number;
    lastFailureTime: number | null;
    circuitOpenUntil: number | null;
    recoveryMinutes: number | null;
  }
>;

export type ProviderEndpointCircuitInfoMap = Record<
  number,
  Array<{
    endpointId: number;
    circuitState: "closed" | "open" | "half-open";
    failureCount: number;
    circuitOpenUntil: number | null;
  }>
>;

export interface ProviderOperatorOverview {
  total: number;
  active: number;
  inactive: number;
  groups: number;
  attention: number;
  scheduled: number;
}

function splitGroups(groupTag: string | null | undefined): string[] {
  if (!groupTag) return ["default"];
  const groups = groupTag
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return groups.length > 0 ? groups : ["default"];
}

export function summarizeProvidersForOperatorView(input: {
  providers: ProviderDisplay[];
  healthStatus?: ProviderHealthStatusMap;
  endpointCircuitInfo?: ProviderEndpointCircuitInfoMap;
}): ProviderOperatorOverview {
  const healthStatus = input.healthStatus ?? {};
  const endpointCircuitInfo = input.endpointCircuitInfo ?? {};
  const groups = new Set<string>();
  let active = 0;
  let inactive = 0;
  let attention = 0;
  let scheduled = 0;

  for (const provider of input.providers) {
    if (provider.isEnabled) active += 1;
    else inactive += 1;

    for (const group of splitGroups(provider.groupTag)) {
      groups.add(group);
    }

    if (provider.activeTimeStart && provider.activeTimeEnd) {
      scheduled += 1;
    }

    const hasKeyCircuitOpen = healthStatus[provider.id]?.circuitState === "open";
    const hasEndpointCircuitOpen =
      endpointCircuitInfo[provider.id]?.some((endpoint) => endpoint.circuitState === "open") ??
      false;

    if (hasKeyCircuitOpen || hasEndpointCircuitOpen) {
      attention += 1;
    }
  }

  return {
    total: input.providers.length,
    active,
    inactive,
    groups: groups.size,
    attention,
    scheduled,
  };
}
