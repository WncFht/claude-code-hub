"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from "react";

const CONSOLE_PREFERENCES_STORAGE_KEY = "cch.console.preferences";

type ConsoleToolbarRegistry = Record<string, ReactNode>;
type ConsolePreferencesRegistry = Record<string, Record<string, unknown>>;

interface ConsoleToolbarStore {
  getPreference: (screenId: string, key: string) => unknown;
  getToolbar: (screenId: string) => ReactNode | null;
  setPreference: (screenId: string, key: string, value: unknown) => void;
  setToolbar: (screenId: string, toolbar: ReactNode | null) => void;
  subscribe: (listener: () => void) => () => void;
}

const ConsoleToolbarContext = createContext<ConsoleToolbarStore | null>(null);

function readStoredPreferences(): ConsolePreferencesRegistry {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(CONSOLE_PREFERENCES_STORAGE_KEY);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as ConsolePreferencesRegistry) : {};
  } catch {
    return {};
  }
}

export function useConsoleToolbarContext() {
  const store = useContext(ConsoleToolbarContext);

  if (!store) {
    throw new Error("Console toolbar hooks must be used within ConsoleToolbarProvider");
  }

  return store;
}

interface ConsoleToolbarProviderProps {
  children: ReactNode;
}

export function ConsoleToolbarProvider({ children }: ConsoleToolbarProviderProps) {
  const toolbarRegistryRef = useRef<ConsoleToolbarRegistry>({});
  const preferencesRef = useRef<ConsolePreferencesRegistry>(readStoredPreferences());
  const listenersRef = useRef(new Set<() => void>());
  const storeRef = useRef<ConsoleToolbarStore | null>(null);

  if (!storeRef.current) {
    const notify = () => {
      for (const listener of listenersRef.current) {
        listener();
      }
    };

    storeRef.current = {
      getPreference: (screenId, key) => preferencesRef.current[screenId]?.[key],
      getToolbar: (screenId) => toolbarRegistryRef.current[screenId] ?? null,
      setPreference: (screenId, key, value) => {
        const currentValue = preferencesRef.current[screenId]?.[key];

        if (Object.is(currentValue, value)) {
          return;
        }

        preferencesRef.current = {
          ...preferencesRef.current,
          [screenId]: {
            ...(preferencesRef.current[screenId] ?? {}),
            [key]: value,
          },
        };

        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            CONSOLE_PREFERENCES_STORAGE_KEY,
            JSON.stringify(preferencesRef.current)
          );
        }

        notify();
      },
      setToolbar: (screenId, toolbar) => {
        if (!toolbar) {
          if (!(screenId in toolbarRegistryRef.current)) {
            return;
          }

          const nextRegistry = { ...toolbarRegistryRef.current };
          delete nextRegistry[screenId];
          toolbarRegistryRef.current = nextRegistry;
          notify();
          return;
        }

        toolbarRegistryRef.current = {
          ...toolbarRegistryRef.current,
          [screenId]: toolbar,
        };
        notify();
      },
      subscribe: (listener) => {
        listenersRef.current.add(listener);

        return () => {
          listenersRef.current.delete(listener);
        };
      },
    };
  }

  useEffect(() => {
    const hydratedPreferences = readStoredPreferences();
    preferencesRef.current = hydratedPreferences;

    for (const listener of listenersRef.current) {
      listener();
    }
  }, []);

  return (
    <ConsoleToolbarContext.Provider value={storeRef.current}>
      {children}
    </ConsoleToolbarContext.Provider>
  );
}

interface ConsoleToolbarHostProps {
  activeScreenId: string;
}

export function ConsoleToolbarHost({ activeScreenId }: ConsoleToolbarHostProps) {
  const store = useConsoleToolbarContext();
  const toolbar = useSyncExternalStore(
    store.subscribe,
    () => store.getToolbar(activeScreenId),
    () => null
  );

  return (
    <div
      data-slot="console-toolbar-host"
      data-active-screen-id={activeScreenId}
      className="min-h-0"
    >
      {toolbar ? (
        <div
          data-slot="console-toolbar-content"
          className="rounded-[24px] border border-border/70 bg-card/70 p-3 shadow-sm"
        >
          {toolbar}
        </div>
      ) : null}
    </div>
  );
}
