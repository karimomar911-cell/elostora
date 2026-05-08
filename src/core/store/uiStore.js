import { create } from 'zustand'

/**
 * Global UI state store (Zustand).
 * Manages ephemeral UI state that does NOT belong in server state (TanStack Query).
 *
 * Rules:
 * - Server / async data → TanStack Query
 * - UI state (sidebar, modals, theme) → this store
 */
export const useUIStore = create((set) => ({
  // ── Sidebar ─────────────────────────────────────────────────────────────────
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // ── Global loading overlay ───────────────────────────────────────────────────
  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),

  // ── Active modal ─────────────────────────────────────────────────────────────
  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}))
