import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Savatcha: { [productId]: quantity }. Telefon xotirasida saqlanadi —
// mijoz ilovani yopib qayta ochsa ham savatcha yo'qolmaydi.
export const useCart = create(
  persist(
    (set) => ({
      items: {},
      add: (id, variant = null) => set((s) => {
        const key = variant ? `${id}_${variant}` : id
        return { items: { ...s.items, [key]: Math.min((s.items[key] ?? 0) + 1, 50) } }
      }),
      remove: (key) =>
        set((s) => {
          const qty = (s.items[key] ?? 0) - 1
          const items = { ...s.items }
          if (qty <= 0) delete items[key]
          else items[key] = qty
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
    .map(([key, qty]) => {
      const parts = key.toString().split('_')
      const idStr = parts[0]
      const variantName = parts.length > 1 ? parts.slice(1).join('_') : null
      const product = byId.get(Number(idStr))
      
      if (!product || !product.is_available) return null
      
      let price = product.price
      let name = product.name
      
      if (variantName && product.variants) {
        const v = product.variants.find(x => x.name === variantName)
        if (v) {
          price = v.price
          name = `${product.name} (${variantName})`
        }
      }
      
      return { key, product, variantName, name, price, qty }
    })
    .filter(Boolean)
}

export const cartTotal = (lines) => lines.reduce((sum, l) => sum + l.price * l.qty, 0)
export const cartCount = (lines) => lines.reduce((sum, l) => sum + l.qty, 0)
