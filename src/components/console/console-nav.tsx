import { Link } from "@/i18n/routing";
import type { ConsoleModuleId } from "@/lib/console/module-registry";
import { cn } from "@/lib/utils";

export interface ConsoleNavItem {
  id: ConsoleModuleId;
  href: string;
  label: string;
  active: boolean;
}

interface ConsoleNavProps {
  items: ConsoleNavItem[];
}

function ConsoleNavLink({ item }: { item: ConsoleNavItem }) {
  return (
    <Link
      href={item.href}
      data-module-id={item.id}
      data-active={item.active ? "true" : "false"}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-2 text-sm font-medium transition-colors",
        item.active
          ? "border-primary/20 bg-primary/10 text-foreground"
          : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-background/80 hover:text-foreground"
      )}
    >
      {item.label}
    </Link>
  );
}

export function ConsoleNav({ items }: ConsoleNavProps) {
  const activeItem = items.find((item) => item.active);

  return (
    <div className="space-y-3">
      <nav
        data-slot="console-nav-desktop"
        className="hidden items-center gap-2 overflow-x-auto rounded-full border border-border/70 bg-background/75 p-1.5 md:flex"
      >
        {items.map((item) => (
          <ConsoleNavLink key={item.id} item={item} />
        ))}
      </nav>

      <nav
        data-slot="console-nav-mobile"
        className="rounded-3xl border border-border/70 bg-card/80 p-3 md:hidden"
      >
        <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Modules
        </div>
        <div className="mt-2 text-base font-semibold text-foreground">
          {activeItem?.label ?? items[0]?.label}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <ConsoleNavLink key={item.id} item={item} />
          ))}
        </div>
      </nav>
    </div>
  );
}
