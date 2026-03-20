"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalRootProps {
  children: ReactNode;
  container?: Element | DocumentFragment | null;
}

export function PortalRoot({ children, container }: PortalRootProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const target = container ?? document.body;
  return createPortal(children, target);
}
