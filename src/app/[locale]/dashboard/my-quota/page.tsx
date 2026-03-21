import { redirectLegacyConsoleRoute } from "@/lib/console/legacy-route-redirect";

export const dynamic = "force-dynamic";

export default async function MyQuotaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return redirectLegacyConsoleRoute({
    locale,
    legacyPath: "/dashboard/my-quota",
  });
}
