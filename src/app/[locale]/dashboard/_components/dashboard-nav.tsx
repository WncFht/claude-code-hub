"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { SETTINGS_NAV_ITEMS } from "@/app/[locale]/settings/_lib/nav-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const OPEN_DELAY_MS = 150;
const CLOSE_DELAY_MS = 200;

export interface DashboardNavItem {
  href: string;
  label: string;
  external?: boolean;
  type?: "dropdown";
}

interface DashboardNavProps {
  items: DashboardNavItem[];
}

const activePillTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export function DashboardNav({ items }: DashboardNavProps) {
  const pathname = usePathname();
  const t = useTranslations("settings");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  if (items.length === 0) {
    return null;
  }

  const getIsActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  };

  const handleMouseEnter = () => {
    // Clear any existing timeouts
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
    }
    // Delay opening to prevent accidental triggers when moving mouse quickly
    openTimeoutRef.current = setTimeout(() => {
      setSettingsOpen(true);
    }, OPEN_DELAY_MS);
  };

  const handleMouseLeave = () => {
    // Clear open timeout
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    // Delay closing to give user time to move to the menu
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setSettingsOpen(false);
    }, CLOSE_DELAY_MS);
  };

  const renderActiveIndicator = (isActive: boolean) => {
    return (
      <AnimatePresence initial={false}>
        {isActive ? (
          <motion.span
            data-slot="dashboard-nav-indicator"
            layoutId="dashboard-nav-indicator"
            className="absolute inset-0 rounded-full border border-primary/20 bg-primary/10 shadow-[0_10px_30px_-22px_rgba(69,115,92,0.45)]"
            transition={activePillTransition}
          />
        ) : null}
      </AnimatePresence>
    );
  };

  const renderSettingsDropdown = (item: DashboardNavItem, isActive: boolean) => {
    // Disable dropdown menu completely when on a settings page
    if (isActive) {
      return (
        <div
          className={cn(
            "relative inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-foreground transition-all"
          )}
        >
          {renderActiveIndicator(isActive)}
          <span className="relative z-10">{item.label}</span>
        </div>
      );
    }

    return (
      <div onPointerEnter={handleMouseEnter} onPointerLeave={handleMouseLeave}>
        <DropdownMenu modal={false} open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DropdownMenuTrigger asChild>
            <Link
              href="/settings/config"
              className={cn(
                "relative inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-all",
                "text-muted-foreground hover:bg-background/80 hover:text-foreground",
                isActive && "text-foreground"
              )}
            >
              {renderActiveIndicator(isActive)}
              <span className="relative z-10 inline-flex items-center gap-1">
                {item.label}
                <ChevronDown className="size-3 opacity-50" />
              </span>
            </Link>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="w-56 rounded-2xl border-border/70 bg-card/95 p-2 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)] backdrop-blur-xl"
            sideOffset={4}
            onPointerEnter={handleMouseEnter}
            onPointerLeave={handleMouseLeave}
          >
            {SETTINGS_NAV_ITEMS.map((subItem, index) => {
              const showSeparator = subItem.external && !SETTINGS_NAV_ITEMS[index - 1]?.external;

              return (
                <div key={subItem.href}>
                  {showSeparator && <DropdownMenuSeparator />}
                  <DropdownMenuItem asChild>
                    {subItem.external ? (
                      <a
                        href={subItem.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex cursor-pointer items-center justify-between"
                      >
                        <span>{t(subItem.labelKey || "")}</span>
                        <ExternalLink className="size-3 opacity-50" />
                      </a>
                    ) : (
                      <Link
                        href={subItem.href}
                        className="flex cursor-pointer items-center justify-between"
                      >
                        {t(subItem.labelKey || "")}
                      </Link>
                    )}
                  </DropdownMenuItem>
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <nav
      data-slot="dashboard-nav"
      className="hidden items-center gap-1 overflow-x-auto rounded-full border border-border/70 bg-background/75 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-xl scrollbar-hide supports-[backdrop-filter]:bg-background/60 md:flex"
    >
      {items.map((item) => {
        const isActive = getIsActive(item.href);

        if (item.href === "/settings") {
          return <div key={item.href}>{renderSettingsDropdown(item, isActive)}</div>;
        }

        const className = cn(
          "relative whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-all",
          isActive
            ? "text-foreground"
            : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
        );

        if (item.external) {
          return (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              {renderActiveIndicator(isActive)}
              <span className="relative z-10">{item.label}</span>
            </a>
          );
        }

        return (
          <Link key={item.href} href={item.href} className={className}>
            {renderActiveIndicator(isActive)}
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
