"use client";

import { createContext, useContext } from "react";
import type { DropDTO, NoticeDTO, UserDTO } from "@/lib/types";

export type ShellValue = {
  user: UserDTO | null;
  online: number;
  drops: DropDTO[];
  notifications: NoticeDTO[];
  unread: number;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  sound: boolean;
  setSound: (value: boolean) => void;
  depositOpen: boolean;
  setDepositOpen: (value: boolean) => void;
  chatOpen: boolean;
  setChatOpen: (value: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  refresh: () => Promise<void>;
};

const ShellContext = createContext<ShellValue | null>(null);

export function ShellProvider({ value, children }: { value: ShellValue; children: React.ReactNode }) {
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const value = useContext(ShellContext);
  if (!value) throw new Error("Shell context missing");
  return value;
}
