"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useMemo } from "react";
import { KeysQuotaManager } from "@/app/[locale]/dashboard/quotas/keys/_components/keys-quota-manager";
import { ProvidersQuotaManager } from "@/app/[locale]/dashboard/quotas/providers/_components/providers-quota-manager";
import { UsersQuotaClient } from "@/app/[locale]/dashboard/quotas/users/_components/users-quota-client";
import { QuotaCards } from "@/app/[locale]/my-usage/_components/quota-cards";
import { ConsoleScreenStage } from "@/components/console-app/console-screen-stage";
import { Section } from "@/components/section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, usePathname } from "@/i18n/routing";
import type { ConsoleRuntimeScreenProps } from "@/lib/console/lazy-screen";
import { resolveConsoleQuotaSubview } from "../../console-screen-paths";
import {
  getConsoleTrafficKeyQuotaQueryOptions,
  getConsoleTrafficQuotaQueryOptions,
} from "../../console-screen-query-options";

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
  const quotaSubview = useMemo(() => resolveConsoleQuotaSubview(pathname), [pathname]);
  const { data, isLoading } = useQuery({
    ...getConsoleTrafficQuotaQueryOptions(route.screenId),
    enabled: route.screenId === "traffic-my-quota" || quotaSubview !== "keys",
    refetchOnWindowFocus: false,
  });
  const { data: keyQuotaData, isLoading: isKeyQuotaLoading } = useQuery({
    ...getConsoleTrafficKeyQuotaQueryOptions(quotaSubview),
    enabled: route.screenId !== "traffic-my-quota" && quotaSubview === "keys",
    refetchOnWindowFocus: false,
  });

  if (route.screenId === "traffic-my-quota") {
    return (
      <div data-slot="console-screen" data-screen-id="traffic-my-quota">
        <ConsoleScreenStage
          screenId="traffic-my-quota"
          data-slot="traffic-quota-screen"
          data-quota-mode="self"
          data-quota-subview="self"
        >
          {isLoading || !data ? (
            <TrafficQuotaSkeleton />
          ) : data.mode === "self" ? (
            <QuotaCards quota={data.quota} currencyCode={data.currencyCode} />
          ) : (
            <AdminQuotaPermissionState />
          )}
        </ConsoleScreenStage>
      </div>
    );
  }

  return (
    <div data-slot="console-screen" data-screen-id="traffic-quotas">
      <ConsoleScreenStage
        screenId="traffic-quotas"
        data-slot="traffic-quota-screen"
        data-quota-mode="admin"
        data-quota-subview={quotaSubview}
        className="space-y-4"
      >
        {(quotaSubview === "keys" ? isKeyQuotaLoading : isLoading) ? (
          <TrafficQuotaSkeleton />
        ) : quotaSubview !== "keys" && (!data || data.mode !== "admin") ? (
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
                <Link href="/console/traffic/quotas/keys" data-tab-id="keys">
                  <TabsTrigger value="keys">quota.layout.tabs.keys</TabsTrigger>
                </Link>
              </TabsList>
            </Tabs>

            {quotaSubview === "providers" && data?.mode === "admin" ? (
              <ProvidersQuotaManager providers={data.providers} currencyCode={data.currencyCode} />
            ) : quotaSubview === "keys" && keyQuotaData ? (
              <KeysQuotaManager
                users={keyQuotaData.users}
                currencyCode={keyQuotaData.currencyCode}
              />
            ) : data?.mode === "admin" ? (
              <UsersQuotaClient users={data.users} currencyCode={data.currencyCode} />
            ) : (
              <TrafficQuotaSkeleton />
            )}
          </>
        )}
      </ConsoleScreenStage>
    </div>
  );
}
