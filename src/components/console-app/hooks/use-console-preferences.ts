"use client";

import type { Dispatch, SetStateAction } from "react";
import { useSyncExternalStore } from "react";
import { useConsoleToolbarContext } from "../console-toolbar-host";

export function useConsolePreferences<T>(
  screenId: string,
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const store = useConsoleToolbarContext();
  const currentValue = useSyncExternalStore(
    store.subscribe,
    () => {
      const storedValue = store.getPreference(screenId, key);
      return (storedValue as T | undefined) ?? initialValue;
    },
    () => initialValue
  );

  const setValue: Dispatch<SetStateAction<T>> = (nextValue) => {
    const resolvedValue =
      typeof nextValue === "function"
        ? (nextValue as (currentValue: T) => T)(currentValue)
        : nextValue;

    store.setPreference(screenId, key, resolvedValue);
  };

  return [currentValue, setValue];
}
