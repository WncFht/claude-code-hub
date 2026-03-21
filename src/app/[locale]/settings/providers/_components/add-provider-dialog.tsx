"use client";
import { ServerCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormErrorBoundary } from "@/components/form-error-boundary";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { ProviderForm } from "./forms/provider-form";
import { ProviderDialogFrame } from "./provider-dialog-frame";
import { ProviderMorphDialog } from "./provider-morph-dialog";

interface AddProviderDialogProps {
  enableMultiProviderTypes: boolean;
}

export function AddProviderDialog({ enableMultiProviderTypes }: AddProviderDialogProps) {
  const t = useTranslations("settings.providers");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  return (
    <ProviderMorphDialog
      open={open}
      onOpenChange={setOpen}
      closeLabel={tCommon("close")}
      trigger={
        <Button className="rounded-full border border-primary/20 shadow-[0_20px_45px_-28px_rgba(69,115,92,0.95)]">
          <ServerCog className="h-4 w-4" /> {t("addProvider")}
        </Button>
      }
      contentClassName="max-w-full sm:max-w-5xl lg:max-w-6xl max-h-[var(--cch-viewport-height-90)] flex flex-col overflow-hidden border border-primary/12 bg-card/95 p-0 gap-0 shadow-[0_36px_110px_-46px_rgba(4,12,8,0.72)]"
    >
      <div className="max-h-[var(--cch-viewport-height-90)] flex min-h-0 flex-col overflow-hidden border-primary/12 bg-card/95 p-0 gap-0">
        <VisuallyHidden>
          <h2>{t("addProvider")}</h2>
        </VisuallyHidden>
        <ProviderDialogFrame onClose={() => setOpen(false)} closeLabel={tCommon("close")}>
          <FormErrorBoundary>
            <ProviderForm
              mode="create"
              enableMultiProviderTypes={enableMultiProviderTypes}
              onSuccess={() => {
                setOpen(false);
              }}
            />
          </FormErrorBoundary>
        </ProviderDialogFrame>
      </div>
    </ProviderMorphDialog>
  );
}
