import { create } from "zustand"

import type { TabKey } from "@/components/administration/types"

export type AdminViewMode = "list" | "form"
export type ReportsTabKey = "controle" | "dipova"

const DEFAULT_ADMIN_VIEW_MODE: Record<TabKey, AdminViewMode> = {
  clientes: "list",
  produtos: "list",
  usuarios: "list",
  veiculos: "list",
}

const createDefaultAdminViewMode = () => ({ ...DEFAULT_ADMIN_VIEW_MODE })

type NavigationState = {
  isSidebarOpen: boolean
  adminActiveTab: TabKey
  adminViewMode: Record<TabKey, AdminViewMode>
  reportsActiveTab: ReportsTabKey
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
  setAdminActiveTab: (tab: TabKey) => void
  setAdminViewMode: (tab: TabKey, mode: AdminViewMode) => void
  showAdminForm: (tab: TabKey) => void
  showAdminList: (tab: TabKey) => void
  resetAdminTabs: (tab?: TabKey) => void
  setReportsActiveTab: (tab: ReportsTabKey) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  isSidebarOpen: false,
  adminActiveTab: "clientes",
  adminViewMode: createDefaultAdminViewMode(),
  reportsActiveTab: "controle",
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setAdminActiveTab: (tab) => set({ adminActiveTab: tab }),
  setAdminViewMode: (tab, mode) =>
    set((state) => ({
      adminViewMode: { ...state.adminViewMode, [tab]: mode },
    })),
  showAdminForm: (tab) =>
    set((state) => ({
      adminActiveTab: tab,
      adminViewMode: { ...state.adminViewMode, [tab]: "form" },
    })),
  showAdminList: (tab) =>
    set((state) => ({
      adminViewMode: { ...state.adminViewMode, [tab]: "list" },
    })),
  resetAdminTabs: (tab) =>
    set((state) => ({
      adminActiveTab: tab ?? state.adminActiveTab,
      adminViewMode: tab
        ? { ...state.adminViewMode, [tab]: "list" }
        : createDefaultAdminViewMode(),
    })),
  setReportsActiveTab: (tab) => set({ reportsActiveTab: tab }),
}))
