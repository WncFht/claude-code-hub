"use server";

import { redirectLegacyConsoleRoute } from "@/lib/console/legacy-route-redirect";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return redirectLegacyConsoleRoute({
    locale,
    legacyPath: "/settings/notifications",
  });
}
