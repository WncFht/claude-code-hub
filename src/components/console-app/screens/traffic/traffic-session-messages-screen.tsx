"use client";

import { useMemo } from "react";
import { SessionMessagesClient } from "@/app/[locale]/dashboard/sessions/[sessionId]/messages/_components/session-messages-client";
import { usePathname } from "@/i18n/routing";

function resolveSessionId(pathname: string) {
  const normalizedPath = pathname.split("?")[0]?.split("#")[0] ?? "";
  const match = normalizedPath.match(/\/console\/traffic\/sessions\/([^/]+)\/messages$/);
  return match?.[1] ?? null;
}

export default function TrafficSessionMessagesScreen() {
  const pathname = usePathname() ?? "";
  const sessionId = useMemo(() => resolveSessionId(pathname), [pathname]);

  return (
    <div data-slot="console-screen" data-screen-id="traffic-session-messages">
      <div data-slot="traffic-session-messages-screen" className="h-full">
        {sessionId ? (
          <SessionMessagesClient sessionId={sessionId} backHref="/console/traffic/sessions" />
        ) : null}
      </div>
    </div>
  );
}
