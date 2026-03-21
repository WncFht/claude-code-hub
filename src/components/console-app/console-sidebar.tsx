"use client";

import { Link } from "@/i18n/routing";
import type { ConsoleModuleId } from "@/lib/console/module-registry";
import { cn } from "@/lib/utils";
import { useScreenPreload } from "./hooks/use-screen-preload";

export interface ConsoleSidebarItem {
  id: ConsoleModuleId;
  href: string;
  label: string;
  active: boolean;
}

function ConsoleSidebarLink({ item }: { item: ConsoleSidebarItem }) {
  const preload = useScreenPreload(item.href);

  return (
    <Link
      href={item.href}
      data-module-id={item.id}
      data-active={item.active ? "true" : "false"}
      aria-current={item.active ? "page" : undefined}
      onMouseOver={preload}
      onFocus={preload}
      className={cn(
        "inline-flex min-h-11 items-center rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
        item.active
          ? "border-primary/30 bg-primary/10 text-foreground"
          : "border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-card hover:text-foreground"
      )}
    >
      {item.label}
    </Link>
  );
}

interface ConsoleSidebarProps {
  items: ConsoleSidebarItem[];
}

export function ConsoleSidebar({ items }: ConsoleSidebarProps) {
  return (
    <aside data-slot="console-sidebar" className="w-full lg:w-60 lg:flex-none">
      <nav className="grid gap-2 rounded-[28px] border border-border/70 bg-card/70 p-3 lg:sticky lg:top-6">
        {items.map((item) => (
          <ConsoleSidebarLink key={item.id} item={item} />
        ))}
      </nav>
    </aside>
  );
}
