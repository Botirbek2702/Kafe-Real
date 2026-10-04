import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Savat kaliti: "id|variant|addon1,addon2" (qo'shimchalar alifbo tartibida)
export const makeKey = (id, variant = null, addons = []) => {
  const addonsStr = addons.length ? addons.map((a) => (typeof a === 'string' ? a : a.name)).sort().join(',') : ''
  return [id, variant || '', addonsStr].join('|')
}

export const parseKey = (key) => {
  if (key.includes('|')) {
    const [id, variant, addons] = key.split('|')
    return { id: Number(id), variant: variant || null, addons: addons ? addons.split(',') : [] }
  }
  // eski format: "id_variant"
  const parts = key.toString().split('_')
  return { id: Number(parts[0]), variant: parts.length > 1 ? parts.slice(1).join('_') : null, addons: [] }
}

// Bitta taomning savatdagi umumiy soni (barcha variant/qo'shimchalar bo'yicha)
export const productQty = (items, productId, variant) =>
  Object.entries(items).reduce((sum, [key, q]) => {
    const k = parseKey(key)
    if (k.id !== productId) return sum
    if (variant !== undefined && (k.variant || null) !== (variant || null)) return sum
    return sum + q
  }, 0)

const MAX_PER_LINE = 50

export const useCart = create(
  persist(
    (set) => ({
      items: {},
      addByKey: (key) => set((s) => ({ items: { ...s.items, [key]: Math.min((s.items[key] ?? 0) + 1, MAX_PER_LINE) } })),
      add: (id, variant = null, addons = []) => set((s) => {
        const key = makeKey(id, variant, addons)
        return { items: { ...s.items, [key]: Math.min((s.items[key] ?? 0) + 1, MAX_PER_LINE) } }
      }),
      remove: (key) =>
        set((s) => {
          const qty = (s.items[key] ?? 0) - 1
          const items = { ...s.items }
          if (qty <= 0) delete items[key]
          else items[key] = qty
          return { items }
        }),
      // Avval aynan shu tanlovdagi qatorni, bo'lmasa shu taomning oxirgi qatorini kamaytiradi
      removeOne: (id, variant = null, addons = []) =>
        set((s) => {
          let key = makeKey(id, variant, addons)
          if (!s.items[key]) {
            const keys = Object.keys(s.items).filter((k) => {
              const p = parseKey(k)
              return p.id === id && (p.variant || null) === (variant || null)
            })
            key = keys[keys.length - 1]
          }
          if (!key) return s
          const items = { ...s.items }
          const qty = (items[key] ?? 0) - 1
          if (qty <= 0) delete items[key]
          else items[key] = qty
          return { items }
        }),
      setItems: (items) => set({ items }),
      clear: () => set({ items: {} }),
    }),
    { name: 'kafe-cart' },
  ),
)

export function cartLines(items, products) {
  const byId = new Map(products.map((p) => [p.id, p]))
  return Object.entries(items)
    .map(([key, qty]) => {
      const { id, variant: variantName, addons: addonNames } = parseKey(key)
      const product = byId.get(id)
      if (!product) return null

      let price = product.price
      let name = product.name
      const appliedAddons = []

      if (variantName && product.variants) {
        const v = product.variants.find((x) => x.name === variantName)
        if (v) {
          price = v.price
          name = `${product.name} (${variantName})`
        }
      }

      if (addonNames.length > 0 && product.addons) {
        addonNames.forEach((aname) => {
          const a = product.addons.find((x) => x.name === aname)
          if (a) {
            price += Number(a.price)
            appliedAddons.push(a.name)
          }
        })
      }

      const unavailable = !product.is_available || product.stock === 0
      return { key, product, variantName, addons: appliedAddons, name, price, qty, unavailable }
    })
    .filter(Boolean)
}

// Mavjud bo'lmagan taomlar summaga qo'shilmaydi
export const cartTotal = (lines) => lines.reduce((sum, l) => (l.unavailable ? sum : sum + l.price * l.qty), 0)
export const cartCount = (lines) => lines.reduce((sum, l) => (l.unavailable ? sum : sum + l.qty), 0)
