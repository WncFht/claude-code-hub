import { useTranslations } from "next-intl";
import { VersionUpdateNotifier } from "@/components/customs/version-update-notifier";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Link } from "@/i18n/routing";
import type { AuthSession } from "@/lib/auth";
import { DashboardNav, type DashboardNavItem } from "./dashboard-nav";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

interface DashboardHeaderProps {
  session: AuthSession | null;
}

export function DashboardHeader({ session }: DashboardHeaderProps) {
  const t = useTranslations("dashboard.nav");
  const isAdmin = session?.user.role === "admin";

  const NAV_ITEMS: (DashboardNavItem & { adminOnly?: boolean })[] = [
    { href: "/dashboard", label: t("dashboard") },
    { href: "/dashboard/logs", label: t("usageLogs") },
    { href: "/dashboard/leaderboard", label: t("leaderboard") },
    { href: "/dashboard/availability", label: t("availability"), adminOnly: true },
    { href: "/dashboard/providers", label: t("providers"), adminOnly: true },
    ...(isAdmin
      ? [{ href: "/dashboard/quotas", label: t("quotasManagement") }]
      : [{ href: "/dashboard/my-quota", label: t("myQuota") }]),
    { href: "/dashboard/users", label: t("userManagement") },
    { href: "/usage-doc", label: t("documentation") },
    { href: "/settings", label: t("systemSettings"), adminOnly: true },
  ];

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 md:px-6 xl:px-8">
        <div className="flex min-h-14 items-center justify-between rounded-[1.45rem] border border-border/65 bg-card/80 px-4 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.32)] backdrop-blur-xl md:px-5">
          <div className="flex items-center gap-4">
            <MobileNav items={items} />
            <DashboardNav items={items} />
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher size="sm" />
            {session && <VersionUpdateNotifier />}
            {session ? (
              <UserMenu user={session.user} />
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href="/login">{t("login")}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
