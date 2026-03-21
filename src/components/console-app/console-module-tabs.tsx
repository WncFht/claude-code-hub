"use client";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useScreenPreload } from "./hooks/use-screen-preload";

export interface ConsoleModuleTabItem {
  id: string;
  href: string;
  label: string;
  active: boolean;
}

function ConsoleModuleTabLink({ item }: { item: ConsoleModuleTabItem }) {
  const preload = useScreenPreload(item.href);

  return (
    <Link
      href={item.href}
      data-tab-id={item.id}
      data-active={item.active ? "true" : "false"}
      aria-current={item.active ? "page" : undefined}
      onMouseOver={preload}
      onFocus={preload}
      className={cn(
        "inline-flex min-h-10 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        item.active
          ? "border-primary/30 bg-primary/10 text-foreground"
          : "border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-card hover:text-foreground"
      )}
    >
      {item.label}
    </Link>
  );
}

interface ConsoleModuleTabsProps {
  items: ConsoleModuleTabItem[];
}

export function ConsoleModuleTabs({ items }: ConsoleModuleTabsProps) {
  if (items.length <= 1) {
    return null;
  }

  return (
    <nav
      data-slot="console-module-tabs"
      className="flex flex-wrap items-center gap-2 rounded-[24px] border border-border/70 bg-card/70 p-3"
    >
      {items.map((item) => (
        <ConsoleModuleTabLink key={item.id} item={item} />
      ))}
    </nav>
  );
}
