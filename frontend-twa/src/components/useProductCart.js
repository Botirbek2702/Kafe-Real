import { useState } from 'react'
import { useCart, productQty } from '../store/cart'
import { haptic, hapticError } from '../lib/telegram'
import { isNotReadyYet } from '../lib/time'

// Taomni savatga qo'shish logikasi: kartochka va batafsil oyna bir xil holatni ishlatadi
export function useProductCart(product, now) {
  const [selectedAddons, setSelectedAddons] = useState([])
  const items = useCart((s) => s.items)
  const add = useCart((s) => s.add)
  const removeOne = useCart((s) => s.removeOne)

  const notReady = isNotReadyYet(product, now)
  const outOfStock = product.stock !== null && product.stock !== undefined && product.stock <= 0
  const blocked = !product.is_available || outOfStock || notReady
  const blockedLabel = notReady ? `${product.ready_time} da` : 'Tugadi'

  const totalQty = productQty(items, product.id)
  const qtyOf = (variant = null) => productQty(items, product.id, variant)
  const canAddMore = product.stock === null || product.stock === undefined || totalQty < product.stock

  const toggleAddon = (addon) => {
    haptic()
    setSelectedAddons((prev) =>
      prev.some((a) => a.name === addon.name) ? prev.filter((a) => a.name !== addon.name) : [...prev, addon],
    )
  }

  const inc = (variant = null) => {
    if (blocked) return false
    if (!canAddMore) {
      hapticError()
      return false
    }
    add(product.id, variant, selectedAddons)
    return true
  }

  const dec = (variant = null) => {
    removeOne(product.id, variant, selectedAddons)
  }

  const addonsTotal = selectedAddons.reduce((s, a) => s + Number(a.price), 0)

  return { selectedAddons, toggleAddon, totalQty, qtyOf, inc, dec, blocked, blockedLabel, notReady, canAddMore, addonsTotal }
}
