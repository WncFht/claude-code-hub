import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { hasPriceTable } from "@/actions/model-prices";
import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/auth";
import { DashboardBentoSection } from "./_components/dashboard-bento-sections";
import { DashboardOverviewSkeleton } from "./_components/dashboard-skeletons";
import { OverviewModulePage } from "./_components/overview-module-page";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const hasPrices = await hasPriceTable();
  if (!hasPrices) {
    return redirect({ href: "/settings/prices?required=true", locale });
  }

  const t = await getTranslations("dashboard");
  const session = await getSession();
  const isAdmin = session?.user?.role === "admin";
  const role = isAdmin ? "admin" : "user";

  return (
    <OverviewModulePage
      role={role}
      activeTab="home"
      title={t("overview.title")}
      description={t("description.dashboard")}
    >
      <Suspense fallback={<DashboardOverviewSkeleton />}>
        <DashboardBentoSection isAdmin={isAdmin} embedded />
      </Suspense>
    </OverviewModulePage>
  );
}
