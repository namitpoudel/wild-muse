"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PublicConfig } from "@/server/public-config";

const ConfigContext = createContext<PublicConfig | null>(null);

/** Admin-editable store settings made available to client components. */
export function ConfigProvider({ value, children }: { value: PublicConfig; children: ReactNode }) {
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const v = useContext(ConfigContext);
  if (!v) throw new Error("useConfig must be used inside <ConfigProvider>");
  return v;
}
