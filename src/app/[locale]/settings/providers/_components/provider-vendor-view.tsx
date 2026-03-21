"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, InfoIcon, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { removeProviderVendor } from "@/actions/provider-endpoints";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { resolveProviderFaviconUrl } from "@/lib/providers/favicon";
import type { CurrencyCode } from "@/lib/utils/currency";
import { getErrorMessage } from "@/lib/utils/error-messages";
import type { ProviderDisplay, ProviderVendor } from "@/types/provider";
import type { User } from "@/types/user";
import { ProviderEndpointsSection } from "./provider-endpoints-table";
import { getProviderVendorsQueryOptions } from "./provider-manager-data";

import { VendorKeysCompactList } from "./vendor-keys-compact-list";

interface ProviderVendorViewProps {
  providers: ProviderDisplay[];
  currentUser?: User;
  enableMultiProviderTypes: boolean;
  healthStatus: Record<number, any>;
  statistics: Record<number, any>;
  statisticsLoading: boolean;
  currencyCode: CurrencyCode;
}

export function ProviderVendorView(props: ProviderVendorViewProps) {
  const {
    providers,
    currentUser,
    enableMultiProviderTypes,
    statistics,
    statisticsLoading,
    currencyCode,
  } = props;
  const tCommon = useTranslations("settings.common");

  const { data: vendors = [], isLoading: isVendorsLoading } = useQuery({
    ...getProviderVendorsQueryOptions(),
    refetchOnWindowFocus: false,
  });

  const vendorById = useMemo(() => {
    return new Map(vendors.map((vendor) => [vendor.id, vendor]));
  }, [vendors]);

  const providersByVendor = useMemo(() => {
    const grouped: Record<number, ProviderDisplay[]> = {};
    const orphaned: ProviderDisplay[] = [];

    providers.forEach((p) => {
      const vendorId = p.providerVendorId;
      if (!vendorId || vendorId <= 0) {
        orphaned.push(p);
      } else {
        if (!grouped[vendorId]) {
          grouped[vendorId] = [];
        }
        grouped[vendorId].push(p);
      }
    });

    if (orphaned.length > 0) {
      grouped[-1] = orphaned;
    }

    return grouped;
  }, [providers]);

  const allVendorIds = useMemo(() => {
    const ids = new Set<number>(vendors.map((v) => v.id));
    Object.keys(providersByVendor).forEach((id) => ids.add(Number(id)));
    return Array.from(ids).sort((a, b) => a - b);
  }, [vendors, providersByVendor]);

  if (isVendorsLoading) {
    return (
      <div className="rounded-[1.5rem] border border-border/65 bg-card/80 p-8 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{tCommon("loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {allVendorIds.map((vendorId) => {
        const vendor = vendorId > 0 ? vendorById.get(vendorId) : undefined;
        const vendorProviders = providersByVendor[vendorId] || [];

        if (vendorProviders.length === 0) return null;

        return (
          <VendorCard
            key={vendorId}
            vendor={vendor}
            vendorId={vendorId}
            providers={vendorProviders}
            currentUser={currentUser}
            enableMultiProviderTypes={enableMultiProviderTypes}
            statistics={statistics}
            statisticsLoading={statisticsLoading}
            currencyCode={currencyCode}
          />
        );
      })}
    </div>
  );
}

function VendorCard({
  vendor,
  vendorId,
  providers,
  currentUser,
  enableMultiProviderTypes,
  statistics,
  statisticsLoading,
  currencyCode,
}: {
  vendor?: ProviderVendor;
  vendorId: number;
  providers: ProviderDisplay[];
  currentUser?: User;
  enableMultiProviderTypes: boolean;
  statistics: Record<number, any>;
  statisticsLoading: boolean;
  currencyCode: CurrencyCode;
}) {
  const t = useTranslations("settings.providers");
  const canManageVendor = currentUser?.role === "admin";

  const displayName =
    vendorId === -1
      ? t("orphanedProviders")
      : vendor?.displayName || vendor?.websiteDomain || t("vendorFallbackName", { id: vendorId });
  const websiteUrl = vendor?.websiteUrl;
  const faviconUrl = resolveProviderFaviconUrl(vendor?.faviconUrl);

  return (
    <Card
      data-slot="provider-vendor-card"
      className="overflow-hidden rounded-[1.5rem] border border-border/65 bg-card/82 shadow-[0_26px_80px_-56px_rgba(15,23,42,0.28)]"
    >
      <CardHeader className="border-b border-border/50 bg-[linear-gradient(135deg,rgba(238,245,239,0.92),rgba(255,255,255,0.82))] pb-4 dark:bg-[linear-gradient(135deg,rgba(40,58,49,0.6),rgba(28,35,40,0.7))]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 border border-white/60 bg-background shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <AvatarImage src={faviconUrl ?? undefined} />
              <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/75">
                {vendorId === -1 ? t("orphanedProviders") : t("viewModeVendor")}
              </div>
              <CardTitle className="flex items-center gap-2 text-lg tracking-tight">
                {displayName}
                {vendorId > 0 && (
                  <TooltipProvider>
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <InfoIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t("vendorAggregationRule")}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                {providers.length} {t("vendorKeys")}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vendorId > 0 && canManageVendor ? (
              <DeleteVendorDialog vendor={vendor} vendorId={vendorId} />
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <VendorKeysCompactList
          vendorId={vendorId}
          vendorWebsiteDomain={vendor?.websiteDomain ?? ""}
          vendorWebsiteUrl={vendor?.websiteUrl ?? null}
          providers={providers}
          currentUser={currentUser}
          enableMultiProviderTypes={enableMultiProviderTypes}
          statistics={statistics}
          statisticsLoading={statisticsLoading}
          currencyCode={currencyCode}
        />

        {enableMultiProviderTypes && vendorId > 0 && (
          <ProviderEndpointsSection
            vendorId={vendorId}
            readOnly={!canManageVendor}
            deferUntilInView
          />
        )}
      </CardContent>
    </Card>
  );
}

function DeleteVendorDialog({ vendor, vendorId }: { vendor?: ProviderVendor; vendorId: number }) {
  const t = useTranslations("settings.providers");
  const tCommon = useTranslations("settings.common");
  const tErrors = useTranslations("errors");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "double-confirm">("confirm");
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await removeProviderVendor({ vendorId });

      if (res.ok) {
        toast.success(t("vendorDeleteSuccess"));
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["provider-vendors"] });
      } else {
        toast.error(
          res.errorCode ? getErrorMessage(tErrors, res.errorCode) : t("vendorDeleteFailed")
        );
      }
    } catch (_err) {
      toast.error(t("vendorDeleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  const displayName = vendor?.displayName || t("vendorFallbackName", { id: vendorId });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) setStep("confirm");
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {step === "confirm"
              ? t("deleteVendorConfirmTitle")
              : t("deleteVendorDoubleConfirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {step === "confirm"
              ? t("deleteVendorConfirmDesc", { name: displayName })
              : t("deleteVendorDoubleConfirmDesc", { name: displayName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{tCommon("cancel")}</AlertDialogCancel>
          {step === "confirm" ? (
            <Button variant="destructive" onClick={() => setStep("double-confirm")}>
              {t("deleteVendor")}
            </Button>
          ) : (
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon("confirm")}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
