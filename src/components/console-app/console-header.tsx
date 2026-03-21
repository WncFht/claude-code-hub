import { AnimatePresence, motion } from "framer-motion";

interface ConsoleHeaderProps {
  siteTitle: string;
  activeModuleLabel: string;
  activeScreenLabel: string;
  currentPath: string;
  direction: number;
}

function getBrandMonogram(siteTitle: string) {
  const monogram = siteTitle
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

  return monogram || "CCH";
}

export function ConsoleHeader({
  siteTitle,
  activeModuleLabel,
  activeScreenLabel,
  currentPath,
  direction,
}: ConsoleHeaderProps) {
  const headerTextTransition = {
    duration: 0.3,
    ease: [0.16, 1, 0.3, 1],
  } as const;
  const brandMonogram = getBrandMonogram(siteTitle);

  return (
    <header
      data-slot="console-header"
      className="flex flex-col gap-5 px-1 py-1 md:flex-row md:items-center md:justify-between"
    >
      <div data-slot="console-brand-lockup" className="flex min-w-0 items-center gap-5">
        <div
          data-slot="console-brand-mark"
          className="flex h-14 w-14 flex-none items-center justify-center rounded-[22px] border border-primary/20 bg-card/80 text-primary shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
        >
          <span className="text-sm font-semibold tracking-[0.24em]">{brandMonogram}</span>
        </div>
        <div className="relative min-w-[15rem] flex-1 overflow-hidden">
          <div className="h-[5.35rem]" />
          <AnimatePresence initial={false} mode="wait" custom={direction}>
            <motion.div
              key={currentPath}
              data-slot="console-header-title-stack"
              data-current-path={currentPath}
              data-direction={String(direction)}
              initial={{
                opacity: 0,
                y: direction >= 0 ? 34 : -34,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: direction >= 0 ? -24 : 24,
              }}
              transition={headerTextTransition}
              className="absolute inset-0 flex min-w-0 w-full flex-col justify-center"
            >
              <div
                data-slot="console-brand-name"
                className="truncate text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground"
              >
                {siteTitle}
              </div>
              <div
                data-slot="console-module-label"
                className="mt-1 truncate text-[clamp(1.875rem,2.6vw,2.6rem)] font-semibold leading-[1.1] tracking-tight text-foreground"
              >
                {activeModuleLabel}
              </div>
              <div
                data-slot="console-route-caption"
                className="mt-1 truncate text-sm font-medium text-muted-foreground"
              >
                {activeScreenLabel}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="relative min-h-[3.25rem] min-w-0 md:min-w-[18rem]">
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={currentPath}
            data-slot="console-header-route-meta"
            data-current-path={currentPath}
            data-direction={String(direction)}
            initial={{
              opacity: 0,
              y: direction >= 0 ? 34 : -34,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: direction >= 0 ? -24 : 24,
            }}
            transition={headerTextTransition}
            className="absolute inset-0 flex min-w-0 flex-wrap items-center gap-2 md:justify-end"
          >
            <div
              data-slot="console-screen-label"
              className="rounded-full border border-border/70 bg-card/75 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
            >
              {activeScreenLabel}
            </div>
            <div className="rounded-full border border-border/70 bg-card/75 px-3 py-1.5 font-mono text-[11px] text-muted-foreground shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              {currentPath}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </header>
  );
}
