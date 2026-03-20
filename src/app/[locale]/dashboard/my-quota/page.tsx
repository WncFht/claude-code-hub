import { AlertCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getMyQuota } from "@/actions/my-usage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSession } from "@/lib/auth";
import { getSystemSettings } from "@/repository/system-config";
import { QuotaCards } from "../../my-usage/_components/quota-cards";
import { TrafficModulePage } from "../_components/traffic-module-page";

export const dynamic = "force-dynamic";

export default async function MyQuotaPage({ params }: { params: Promise<{ locale: string }> }) {
  // Await params to ensure locale is available in the async context
  await params;

  const [quotaResult, systemSettings, tNav, tCommon, tDashboard, session] = await Promise.all([
    getMyQuota(),
    getSystemSettings(),
    getTranslations("dashboard.nav"),
    getTranslations("common"),
    getTranslations("dashboard"),
    getSession(),
  ]);

  const role = session?.user.role === "admin" ? "admin" : "user";

  // Handle error state
  if (!quotaResult.ok) {
    return (
      <TrafficModulePage
        role={role}
        activeTab="my-quota"
        title={tNav("myQuota")}
        description={tDashboard("console.traffic.descriptions.myQuota")}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{tCommon("error")}</AlertTitle>
          <AlertDescription>{quotaResult.error}</AlertDescription>
        </Alert>
      </TrafficModulePage>
    );
  }

  return (
    <TrafficModulePage
      role={role}
      activeTab="my-quota"
      title={tNav("myQuota")}
      description={tDashboard("console.traffic.descriptions.myQuota")}
    >
      <QuotaCards quota={quotaResult.data} currencyCode={systemSettings.currencyDisplay} />
    </TrafficModulePage>
  );
}
