"use client";

import { motion } from "framer-motion";
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
        "relative inline-flex min-h-11 min-w-[9.75rem] items-center overflow-hidden rounded-[22px] border px-4 py-3 text-sm font-medium transition-[color,border-color,transform,box-shadow] duration-200",
        item.active
          ? "border-primary/20 text-foreground shadow-[0_14px_30px_rgba(15,23,42,0.05)]"
          : "border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-background/80 hover:text-foreground"
      )}
    >
      {item.active ? (
        <motion.span
          layoutId="console-sidebar-indicator"
          data-slot="console-sidebar-indicator"
          data-active-module-id={item.id}
          className="absolute inset-0 rounded-[22px] border border-primary/20 bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
          transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
        />
      ) : null}
      <span className="relative z-10">{item.label}</span>
    </Link>
  );
}

interface ConsoleSidebarProps {
  items: ConsoleSidebarItem[];
}

export function ConsoleSidebar({ items }: ConsoleSidebarProps) {
  return (
    <aside data-slot="console-sidebar" className="w-full lg:w-[17rem] lg:flex-none">
      <nav className="grid auto-cols-[minmax(9.75rem,1fr)] grid-flow-col gap-2 overflow-x-auto rounded-[32px] border border-border/70 bg-card/75 p-3 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur-sm lg:auto-cols-auto lg:grid-flow-row lg:overflow-visible lg:sticky lg:top-6">
        <div
          data-slot="console-sidebar-heading"
          className="hidden px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground lg:block"
        >
          Modules
        </div>
        {items.map((item) => (
          <ConsoleSidebarLink key={item.id} item={item} />
        ))}
      </nav>
    </aside>
  );
}
