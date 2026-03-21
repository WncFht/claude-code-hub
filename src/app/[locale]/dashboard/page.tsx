import { hasPriceTable } from "@/actions/model-prices";
import { redirectLegacyConsoleRoute } from "@/lib/console/legacy-route-redirect";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const hasPrices = await hasPriceTable();
  if (!hasPrices) {
    return redirectLegacyConsoleRoute({
      locale,
      legacyPath: "/settings/prices",
      searchParams: { required: "true" },
    });
  }

  return redirectLegacyConsoleRoute({
    locale,
    legacyPath: "/dashboard",
  });
}
