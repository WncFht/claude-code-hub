interface ConsoleHeaderProps {
  activeModuleLabel: string;
  currentPath: string;
}

export function ConsoleHeader({ activeModuleLabel, currentPath }: ConsoleHeaderProps) {
  return (
    <header
      data-slot="console-header"
      className="border-b border-border/60 bg-background/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Console
          </div>
          <div className="text-lg font-semibold text-foreground">{activeModuleLabel}</div>
        </div>
        <div className="hidden rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground md:block">
          {currentPath}
        </div>
      </div>
    </header>
  );
}
