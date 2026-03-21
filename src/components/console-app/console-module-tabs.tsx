"use client";

import { motion } from "framer-motion";
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
        "relative inline-flex min-h-11 items-center overflow-hidden rounded-full border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-[color,border-color,transform,box-shadow] duration-200",
        item.active
          ? "border-primary/20 text-foreground shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
          : "border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-background/80 hover:text-foreground"
      )}
    >
      {item.active ? (
        <motion.span
          layoutId="console-module-tab-indicator"
          data-slot="console-module-tab-indicator"
          data-active-tab-id={item.id}
          className="absolute inset-0 rounded-full border border-primary/20 bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
          transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
        />
      ) : null}
      <span className="relative z-10">{item.label}</span>
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
      className="flex flex-wrap items-center gap-2 overflow-x-auto rounded-[28px] border border-border/70 bg-card/75 p-2.5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm"
    >
      {items.map((item) => (
        <ConsoleModuleTabLink key={item.id} item={item} />
      ))}
    </nav>
  );
}
