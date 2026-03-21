import { HydrationBoundary } from "@tanstack/react-query";
import { ConsoleApp } from "@/components/console-app/console-app";
import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/auth";
import { getConsoleRouteHydrationState } from "@/lib/console/console-route-hydration";
import { getConsoleBootstrap } from "../_lib/get-console-bootstrap";

interface ConsoleEntryPageProps {
  params: Promise<{
    locale: string;
    slug?: string[];
  }>;
}

export default async function ConsoleEntryPage({ params }: ConsoleEntryPageProps) {
  const { locale, slug } = await params;
  const session = await getSession();
  const requestedPath = slug?.length ? `/console/${slug.join("/")}` : "/console/overview";

  if (!session) {
    return redirect({
      href: `/login?from=${requestedPath}`,
      locale,
    });
  }

  if (session.user.role !== "admin" && !session.key.canLoginWebUi) {
    return redirect({
      href: "/my-usage",
      locale,
    });
  }

  const bootstrap = await getConsoleBootstrap({
    locale,
    role: session.user.role,
    slug,
  });

  const hydrationState = await getConsoleRouteHydrationState(bootstrap);

  if (!hydrationState) {
    return <ConsoleApp bootstrap={bootstrap} />;
  }

  return (
    <HydrationBoundary state={hydrationState}>
      <ConsoleApp bootstrap={bootstrap} />
    </HydrationBoundary>
  );
}
