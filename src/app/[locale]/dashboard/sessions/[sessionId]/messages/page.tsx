import { redirectLegacyConsoleRoute } from "@/lib/console/legacy-route-redirect";

export const dynamic = "force-dynamic";

export default async function SessionMessagesPage({
  params,
}: {
  params: Promise<{ locale: string; sessionId: string }>;
}) {
  const { locale, sessionId } = await params;

  return redirectLegacyConsoleRoute({
    locale,
    legacyPath: `/dashboard/sessions/${sessionId}/messages`,
  });
}
