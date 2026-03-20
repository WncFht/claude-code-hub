"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { DashboardNavItem } from "./dashboard-nav";

interface MobileNavProps {
  items: DashboardNavItem[];
}

export function MobileNav({ items }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useTranslations("dashboard.nav");

  const getIsActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-border/70 bg-background/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 border-border/70 bg-[linear-gradient(180deg,rgba(255,252,244,0.98),rgba(247,243,233,0.96))] px-4 dark:bg-[linear-gradient(180deg,rgba(24,31,35,0.98),rgba(20,25,30,0.98))]"
      >
        <VisuallyHidden>
          <SheetTitle>{t("mobileMenuTitle")}</SheetTitle>
        </VisuallyHidden>
        <nav className="flex flex-col gap-2 pt-12">
          {items.map((item) => {
            const isActive = getIsActive(item.href);

            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary/20 bg-primary/10 text-foreground shadow-[0_16px_34px_-24px_rgba(69,115,92,0.45)]"
                      : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-background/75 hover:text-foreground"
                  )}
                >
                  {item.label}
                </a>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary/20 bg-primary/10 text-foreground shadow-[0_16px_34px_-24px_rgba(69,115,92,0.45)]"
                    : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-background/75 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
