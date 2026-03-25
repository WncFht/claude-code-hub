"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClientAbortOutcome } from "@/lib/client-abort-observability";
import { useLazyStatusCodes } from "../../_hooks/use-lazy-filter-options";
import type { UsageLogFilters } from "./types";

// Common status codes (shown immediately without loading)
const COMMON_STATUS_CODES: number[] = [200, 400, 401, 429, 500];

interface StatusFiltersProps {
  filters: UsageLogFilters;
  onFiltersChange: (filters: UsageLogFilters) => void;
}

export function StatusFilters({ filters, onFiltersChange }: StatusFiltersProps) {
  const t = useTranslations("dashboard");

  const {
    data: dynamicStatusCodes,
    isLoading: isStatusCodesLoading,
    onOpenChange: onStatusCodesOpenChange,
  } = useLazyStatusCodes();

  // Merge hard-coded and dynamic status codes (deduplicated)
  const allStatusCodes = useMemo(() => {
    const dynamicOnly = dynamicStatusCodes.filter((code) => !COMMON_STATUS_CODES.includes(code));
    return dynamicOnly;
  }, [dynamicStatusCodes]);

  const handleStatusCodeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      statusCode:
        value && value !== "!200" && value !== "__all__" ? parseInt(value, 10) : undefined,
      excludeStatusCode200: value === "!200",
    });
  };

  const handleMinRetryCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      minRetryCount: e.target.value ? parseInt(e.target.value, 10) : undefined,
    });
  };

  const handleClientAbortOutcomeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      clientAbortOutcome: value === "__all__" ? undefined : (value as ClientAbortOutcome),
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Status code selector */}
      <div className="space-y-2">
        <Label>{t("logs.filters.statusCode")}</Label>
        <Select
          value={
            filters.excludeStatusCode200 ? "!200" : filters.statusCode?.toString() || "__all__"
          }
          onValueChange={handleStatusCodeChange}
          onOpenChange={onStatusCodesOpenChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("logs.filters.allStatusCodes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("logs.filters.allStatusCodes")}</SelectItem>
            <SelectItem value="!200">{t("logs.statusCodes.not200")}</SelectItem>
            <SelectItem value="200">{t("logs.statusCodes.200")}</SelectItem>
            <SelectItem value="400">{t("logs.statusCodes.400")}</SelectItem>
            <SelectItem value="401">{t("logs.statusCodes.401")}</SelectItem>
            <SelectItem value="429">{t("logs.statusCodes.429")}</SelectItem>
            <SelectItem value="500">{t("logs.statusCodes.500")}</SelectItem>
            {allStatusCodes.map((code) => (
              <SelectItem key={code} value={code.toString()}>
                {code}
              </SelectItem>
            ))}
            {isStatusCodesLoading && (
              <div className="p-2 text-center text-muted-foreground text-sm">
                {t("logs.stats.loading")}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Min retry count input */}
      <div className="space-y-2">
        <Label>{t("logs.filters.minRetryCount")}</Label>
        <Input
          type="number"
          min={0}
          inputMode="numeric"
          value={filters.minRetryCount?.toString() ?? ""}
          placeholder={t("logs.filters.minRetryCountPlaceholder")}
          onChange={handleMinRetryCountChange}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("logs.filters.clientAbortOutcome")}</Label>
        <Select
          value={filters.clientAbortOutcome ?? "__all__"}
          onValueChange={handleClientAbortOutcomeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("logs.filters.allClientAbortOutcomes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("logs.filters.allClientAbortOutcomes")}</SelectItem>
            <SelectItem value="session_continued">
              {t("logs.filters.clientAbortOutcomeValues.session_continued")}
            </SelectItem>
            <SelectItem value="after_stream_start">
              {t("logs.filters.clientAbortOutcomeValues.after_stream_start")}
            </SelectItem>
            <SelectItem value="before_stream_start">
              {t("logs.filters.clientAbortOutcomeValues.before_stream_start")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
