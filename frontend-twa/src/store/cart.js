import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCart = create(
  persist(
    (set) => ({
      items: {},
      addByKey: (key) => set((s) => ({ items: { ...s.items, [key]: Math.min((s.items[key] ?? 0) + 1, 50) } })),
      add: (id, variant = null, addons = []) => set((s) => {
        const addonsStr = addons.length ? addons.map(a => a.name).sort().join(',') : ''
        const key = [id, variant || '', addonsStr].join('|')
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

export function cartLines(items, products) {
  const byId = new Map(products.map((p) => [p.id, p]))
  return Object.entries(items)
    .map(([key, qty]) => {
      let idStr, variantName, addonNamesStr
      if (key.includes('|')) {
        const parts = key.split('|')
        idStr = parts[0]
        variantName = parts[1] || null
        addonNamesStr = parts[2] || ''
      } else {
        const parts = key.toString().split('_')
        idStr = parts[0]
        variantName = parts.length > 1 ? parts.slice(1).join('_') : null
        addonNamesStr = ''
      }
      
      const addonNames = addonNamesStr ? addonNamesStr.split(',') : []
      const product = byId.get(Number(idStr))
      
      if (!product || !product.is_available) return null
      
      let price = product.price
      let name = product.name
      let appliedAddons = []
      
      if (variantName && product.variants) {
        const v = product.variants.find(x => x.name === variantName)
        if (v) {
          price = v.price
          name = `${product.name} (${variantName})`
        }
      }
      
      if (addonNames.length > 0 && product.addons) {
        addonNames.forEach(aname => {
          const a = product.addons.find(x => x.name === aname)
          if (a) {
            price += a.price
            appliedAddons.push(a.name)
          }
        })
      }
      
      return { key, product, variantName, addons: appliedAddons, name, price, qty }
    })
    .filter(Boolean)
}

export const cartTotal = (lines) => lines.reduce((sum, l) => sum + l.price * l.qty, 0)
export const cartCount = (lines) => lines.reduce((sum, l) => sum + l.qty, 0)
