"use client";

import { AnimatePresence, motion, type HTMLMotionProps } from "framer-motion";
import { Children, isValidElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageStageProps extends HTMLMotionProps<"div"> {
  activeKey: string;
  children: ReactNode;
}

function getDiminishingDelay(index: number) {
  if (index === 0) return 0;
  return Math.min(0.08 * Math.log2(index + 1), 0.4);
}

export function PageStage({ activeKey, children, className, ...rest }: PageStageProps) {
  const childArray = Children.toArray(children);

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={activeKey}
        data-slot="page-stage"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={cn(className)}
        {...rest}
      >
        {childArray.map((child, index) => {
          const key =
            isValidElement(child) && child.key != null ? String(child.key) : `stage-item-${index}`;

          return (
            <motion.div
              key={key}
              data-slot="page-stage-item"
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.46,
                ease: [0.16, 1, 0.3, 1],
                delay: getDiminishingDelay(index),
              }}
            >
              {child}
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
