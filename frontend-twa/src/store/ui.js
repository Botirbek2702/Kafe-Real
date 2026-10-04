import { create } from 'zustand'

// Batafsil oyna ochiq bo'lsa, Telegram'ning pastki "Savatcha" tugmasi yashiriladi
export const useUi = create((set) => ({
  sheetOpen: false,
  setSheetOpen: (v) => set({ sheetOpen: v }),
}))
