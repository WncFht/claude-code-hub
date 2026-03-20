export interface ProviderModelVisibility {
  discoveredModels: string[];
  allowedModels: string[];
  allowAllModels: boolean;
  hasDiscoveredSnapshot: boolean;
  matchedModels: string[];
  whitelistOnlyModels: string[];
  discoveredOnlyModels: string[];
}

export function normalizeProviderModelList(models?: string[] | null): string[] {
  const deduped = new Set<string>();

  for (const model of models ?? []) {
    const normalized = model.trim();
    if (!normalized) continue;
    deduped.add(normalized);
  }

  return Array.from(deduped).sort((left, right) => left.localeCompare(right));
}

export function buildProviderModelVisibility({
  discoveredModels,
  allowedModels,
}: {
  discoveredModels?: string[] | null;
  allowedModels?: string[] | null;
}): ProviderModelVisibility {
  const normalizedDiscoveredModels = normalizeProviderModelList(discoveredModels);
  const normalizedAllowedModels = normalizeProviderModelList(allowedModels);
  const allowAllModels = normalizedAllowedModels.length === 0;
  const hasDiscoveredSnapshot = discoveredModels != null;

  if (!hasDiscoveredSnapshot) {
    return {
      discoveredModels: normalizedDiscoveredModels,
      allowedModels: normalizedAllowedModels,
      allowAllModels,
      hasDiscoveredSnapshot: false,
      matchedModels: [],
      whitelistOnlyModels: [],
      discoveredOnlyModels: [],
    };
  }

  const discoveredSet = new Set(normalizedDiscoveredModels);
  const allowedSet = new Set(normalizedAllowedModels);

  return {
    discoveredModels: normalizedDiscoveredModels,
    allowedModels: normalizedAllowedModels,
    allowAllModels,
    hasDiscoveredSnapshot,
    matchedModels: allowAllModels
      ? []
      : normalizedAllowedModels.filter((model) => discoveredSet.has(model)),
    whitelistOnlyModels: allowAllModels
      ? []
      : normalizedAllowedModels.filter((model) => !discoveredSet.has(model)),
    discoveredOnlyModels: allowAllModels
      ? normalizedDiscoveredModels
      : normalizedDiscoveredModels.filter((model) => !allowedSet.has(model)),
  };
}
