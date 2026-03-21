"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useMemo } from "react";
import { ProvidersQuotaManager } from "@/app/[locale]/dashboard/quotas/providers/_components/providers-quota-manager";
import { UsersQuotaClient } from "@/app/[locale]/dashboard/quotas/users/_components/users-quota-client";
import { QuotaCards } from "@/app/[locale]/my-usage/_components/quota-cards";
import { Section } from "@/components/section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, usePathname } from "@/i18n/routing";
import type { ConsoleRuntimeScreenProps } from "@/lib/console/lazy-screen";
import { getConsoleTrafficQuotaData } from "../../adapters/dashboard-bootstrap";

function resolveQuotaSubview(pathname: string) {
  return pathname.endsWith("/providers") ? "providers" : "users";
}

function TrafficQuotaSkeleton() {
  return <div className="min-h-64 rounded-xl border border-dashed border-border/60 bg-card/40" />;
}

function AdminQuotaPermissionState() {
  return (
    <Section>
      <Card data-slot="traffic-quota-permission-state">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            dashboard.leaderboard.permission.title
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>dashboard.leaderboard.permission.restricted</AlertTitle>
            <AlertDescription>dashboard.leaderboard.permission.userAction</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  );
}

export default function TrafficQuotaScreen({ route }: ConsoleRuntimeScreenProps) {
  const pathname = usePathname() ?? route.consolePath;
  const quotaSubview = useMemo(() => resolveQuotaSubview(pathname), [pathname]);
  const { data, isLoading } = useQuery({
    queryKey: ["console-traffic-quota-data", route.screenId],
    queryFn: getConsoleTrafficQuotaData,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  if (route.screenId === "traffic-my-quota") {
    return (
      <div data-slot="console-screen" data-screen-id="traffic-my-quota">
        <div data-slot="traffic-quota-screen" data-quota-mode="self">
          {isLoading || !data ? (
            <TrafficQuotaSkeleton />
          ) : data.mode === "self" ? (
            <QuotaCards quota={data.quota} currencyCode={data.currencyCode} />
          ) : (
            <AdminQuotaPermissionState />
          )}
        </div>
      </div>
    );
  }

  return (
    <div data-slot="console-screen" data-screen-id="traffic-quotas">
      <div data-slot="traffic-quota-screen" data-quota-mode="admin" className="space-y-4">
        {isLoading || !data ? (
          <TrafficQuotaSkeleton />
        ) : data.mode !== "admin" ? (
          <AdminQuotaPermissionState />
        ) : (
          <>
            <Tabs value={quotaSubview} className="space-y-4">
              <TabsList>
                <Link href="/console/traffic/quotas/users" data-tab-id="users">
                  <TabsTrigger value="users">quota.layout.tabs.users</TabsTrigger>
                </Link>
                <Link href="/console/traffic/quotas/providers" data-tab-id="providers">
                  <TabsTrigger value="providers">quota.layout.tabs.providers</TabsTrigger>
                </Link>
              </TabsList>
            </Tabs>

            {quotaSubview === "providers" ? (
              <ProvidersQuotaManager providers={data.providers} currencyCode={data.currencyCode} />
            ) : (
              <UsersQuotaClient users={data.users} currencyCode={data.currencyCode} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
