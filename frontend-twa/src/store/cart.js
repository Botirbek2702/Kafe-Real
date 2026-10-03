import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Savatcha: { [productId]: quantity }. Telefon xotirasida saqlanadi —
// mijoz ilovani yopib qayta ochsa ham savatcha yo'qolmaydi.
export const useCart = create(
  persist(
    (set) => ({
      items: {},
      add: (id) => set((s) => ({ items: { ...s.items, [id]: Math.min((s.items[id] ?? 0) + 1, 50) } })),
      remove: (id) =>
        set((s) => {
          const qty = (s.items[id] ?? 0) - 1
          const items = { ...s.items }
          if (qty <= 0) delete items[id]
          else items[id] = qty
          return { items }
        }),
      clear: () => set({ items: {} }),
    }),
    { name: 'kafe-cart' },
  ),
)

// Savatchadagi narsalarni menyu bilan birlashtiradi.
// Tugagan yoki menyudan o'chirilgan ovqatlar hisobga olinmaydi.
export function cartLines(items, products) {
  const byId = new Map(products.map((p) => [p.id, p]))
  return Object.entries(items)
    .map(([id, qty]) => ({ product: byId.get(Number(id)), qty }))
    .filter((l) => l.product && l.product.is_available)
}

export const cartTotal = (lines) => lines.reduce((sum, l) => sum + l.product.price * l.qty, 0)
export const cartCount = (lines) => lines.reduce((sum, l) => sum + l.qty, 0)
