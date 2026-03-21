"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useConsoleToolbarContext } from "../console-toolbar-host";

export function useScreenToolbar(screenId: string, toolbar: ReactNode) {
  const { setToolbar } = useConsoleToolbarContext();

  useEffect(() => {
    setToolbar(screenId, toolbar);

    return () => {
      setToolbar(screenId, null);
    };
  }, [screenId, setToolbar, toolbar]);
}
