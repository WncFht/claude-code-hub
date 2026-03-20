import { AlertCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Section } from "@/components/section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { OverviewModulePage } from "../_components/overview-module-page";
import { AvailabilityDashboard } from "./_components/availability-dashboard";
import { AvailabilityDashboardSkeleton } from "./_components/availability-skeleton";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const t = await getTranslations("dashboard");
  const session = await getSession();

  // Only admin can access availability monitoring
  const isAdmin = session?.user.role === "admin";
  const role = isAdmin ? "admin" : "user";

  if (!isAdmin) {
    return (
      <OverviewModulePage
        role={role}
        activeTab="availability"
        title={t("availability.title")}
        description={t("availability.description")}
      >
        <Section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                {t("leaderboard.permission.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("leaderboard.permission.restricted")}</AlertTitle>
                <AlertDescription>{t("leaderboard.permission.userAction")}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </Section>
      </OverviewModulePage>
    );
  }

  return (
    <OverviewModulePage
      role={role}
      activeTab="availability"
      title={t("availability.title")}
      description={t("availability.description")}
    >
      <Section>
        <Suspense fallback={<AvailabilityDashboardSkeleton />}>
          <AvailabilityDashboard />
        </Suspense>
      </Section>
    </OverviewModulePage>
  );
}
