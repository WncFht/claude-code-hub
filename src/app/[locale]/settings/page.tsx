import { redirectLegacyConsoleRoute } from "@/lib/console/legacy-route-redirect";

export default async function SettingsIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return redirectLegacyConsoleRoute({
    locale,
    legacyPath: "/settings",
  });
}
