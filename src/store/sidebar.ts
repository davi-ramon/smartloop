import { create } from "zustand"

interface SidebarStore {
  isPinned: boolean
  togglePin: () => void
  setPin: (value: boolean) => void
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isPinned: false,
  togglePin: () => set((state) => ({ isPinned: !state.isPinned })),
  setPin: (value) => set({ isPinned: value }),
}))
