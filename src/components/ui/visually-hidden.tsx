import type { HTMLAttributes, ReactNode } from "react";

interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function VisuallyHidden({ children, className, ...props }: VisuallyHiddenProps) {
  return (
    <span className={className ? `sr-only ${className}`.trim() : "sr-only"} {...props}>
      {children}
    </span>
  );
}
