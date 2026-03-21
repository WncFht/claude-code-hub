import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/auth";
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

  const bootstrap = getConsoleBootstrap({
    locale,
    role: session.user.role,
    slug,
  });

  return (
    <div
      data-slot="console-entry"
      data-current-path={bootstrap.currentPath}
      data-requested-path={bootstrap.requestedPath}
      data-default-path={bootstrap.defaultPath}
      data-screen-id={bootstrap.activeRoute.screenId}
      data-module-id={bootstrap.activeRoute.moduleId}
    />
  );
}
