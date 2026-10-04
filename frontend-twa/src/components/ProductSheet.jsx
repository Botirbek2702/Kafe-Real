import { useEffect, useState } from 'react'
import { formatNumber } from '../lib/format'
import { haptic, hapticSuccess, hapticError, tg } from '../lib/telegram'
import { useCart } from '../store/cart'
import { useUi } from '../store/ui'
import QtyControl from './QtyControl'
import { ProductImage } from './ProductCard'

// Taom haqida batafsil oyna (pastdan chiqadi)
export default function ProductSheet({ product, pc, onClose }) {
  const { selectedAddons, toggleAddon, totalQty, qtyOf, inc, dec, blocked, blockedLabel, notReady, canAddMore, addonsTotal } = pc
  const add = useCart((s) => s.add)
  const setSheetOpen = useUi((s) => s.setSheetOpen)
  const hasAddons = Array.isArray(product.addons) && product.addons.length > 0
  const variants = product.variants || null

  const [variant, setVariant] = useState(variants ? variants[0].name : null)
  const [count, setCount] = useState(1)
  const [closing, setClosing] = useState(false)

  const close = () => {
    setClosing(true)
    setTimeout(onClose, 180)
  }

  // Ochilganda fon aylanmasin, Telegram "Orqaga" tugmasi oynani yopsin
  useEffect(() => {
    setSheetOpen(true)
    document.body.style.overflow = 'hidden'
    const back = tg?.BackButton
    const wasVisible = back?.isVisible
    back?.show()
    back?.onClick(close)
    return () => {
      setSheetOpen(false)
      document.body.style.overflow = ''
      back?.offClick(close)
      if (!wasVisible) back?.hide()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const basePrice = variants ? variants.find((v) => v.name === variant)?.price ?? product.price : product.price
  const unitPrice = Number(basePrice) + addonsTotal
  const remaining = product.stock === null || product.stock === undefined ? Infinity : product.stock - totalQty
  const maxCount = Math.max(0, Math.min(50, remaining))

  // Qo'shimchali taom: tanlovni savatga qo'shish
  const addConfigured = () => {
    if (blocked) return
    const n = Math.min(count, maxCount)
    if (n <= 0) return hapticError()
    for (let i = 0; i < n; i++) add(product.id, variant, selectedAddons)
    hapticSuccess()
    close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${closing ? 'opacity-0' : 'opacity-100'}`}
        onClick={close}
      />
      <div
        className={`relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-gold-500/30 bg-obsidian-950 pb-[max(16px,env(safe-area-inset-bottom))] ${
          closing ? 'animate-sheet-out' : 'animate-sheet-in'
        }`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-obsidian-900">
          <ProductImage product={product} className={blocked ? 'grayscale' : ''} />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-obsidian-950 to-transparent" />
          <button
            type="button"
            onClick={close}
            aria-label="Yopish"
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur"
          >
            ✕
          </button>
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1">
            {product.promo_text && <span className="rounded bg-red-500/90 px-2 py-0.5 text-[11px] font-bold text-white">🎁 {product.promo_text}</span>}
            {product.ready_time && <span className="rounded bg-purple-600/90 px-2 py-0.5 text-[11px] font-bold text-white">🕒 {product.ready_time} da chiqadi</span>}
          </div>
        </div>

        <div className="px-5 pt-2">
          <h2 className="font-serif text-2xl font-semibold text-white">{product.name}</h2>
          {product.description && <p className="mt-2 text-sm leading-relaxed font-light text-stone-400">{product.description}</p>}
          {product.stock !== null && product.stock !== undefined && product.stock > 0 && (
            <p className="mt-2 text-xs text-orange-400">Omborda: {product.stock} ta</p>
          )}

          {blocked && (
            <div className="mt-4 rounded-xl border border-gold-600/20 bg-obsidian-850 px-4 py-3 text-center text-sm text-gold-300">
              {notReady ? `Bu taom soat ${blockedLabel.replace(' da', '')} da tayyor bo'ladi. Shu vaqtdan keyin buyurtma berishingiz mumkin.` : 'Afsuski, bu taom hozircha tugagan.'}
            </div>
          )}

          {!blocked && hasAddons && (
            <>
              {variants && (
                <>
                  <SheetTitle>Hajmi</SheetTitle>
                  <div className="grid grid-cols-2 gap-2">
                    {variants.map((v) => (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => { haptic(); setVariant(v.name) }}
                        className={`rounded-xl border px-3 py-2.5 text-left transition ${
                          variant === v.name ? 'border-gold-500 bg-gold-500/10' : 'border-gold-600/20 bg-obsidian-850'
                        }`}
                      >
                        <span className="block text-sm text-white">{v.name}</span>
                        <span className="text-xs font-semibold text-gold-400">{formatNumber(v.price)} so'm</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <SheetTitle>Qo'shimchalar</SheetTitle>
              <div className="space-y-2">
                {product.addons.map((a) => {
                  const on = selectedAddons.some((x) => x.name === a.name)
                  return (
                    <button
                      key={a.name}
                      type="button"
                      onClick={() => toggleAddon(a)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition ${
                        on ? 'border-gold-500 bg-gold-500/10' : 'border-gold-600/20 bg-obsidian-850'
                      }`}
                    >
                      <span className="flex items-center gap-3 text-sm text-white">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-md border text-[11px] ${on ? 'border-gold-500 bg-gold-500 text-obsidian-950' : 'border-stone-600'}`}>
                          {on && '✓'}
                        </span>
                        {a.name}
                      </span>
                      <span className="text-sm text-gold-400">+{formatNumber(a.price)}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="w-[120px] shrink-0">
                  <QtyControl qty={count} canAdd={count < maxCount} onAdd={() => setCount((c) => c + 1)} onRemove={() => setCount((c) => Math.max(1, c - 1))} />
                </div>
                <button
                  type="button"
                  disabled={maxCount <= 0}
                  onClick={addConfigured}
                  className="bg-gold-gradient flex h-12 flex-1 items-center justify-between rounded-full px-5 font-cinzel text-[12px] font-bold tracking-[0.08em] text-obsidian-950 uppercase disabled:opacity-50"
                >
                  <span>{maxCount <= 0 ? 'Qolmadi' : "Qo'shish"}</span>
                  <span>{formatNumber(unitPrice * count)}</span>
                </button>
              </div>
              {totalQty > 0 && <p className="mt-3 text-center text-xs text-stone-500">Savatda allaqachon {totalQty} ta bor</p>}
            </>
          )}

          {!blocked && !hasAddons && (
            <div className="mt-5">
              {variants ? (
                <div className="space-y-2">
                  {variants.map((v) => {
                    const q = qtyOf(v.name)
                    return (
                      <div key={v.name} className="flex items-center justify-between rounded-xl border border-gold-600/20 bg-obsidian-850 px-4 py-3">
                        <div>
                          <p className="text-sm text-white">{v.name}</p>
                          <p className="text-xs font-semibold text-gold-400">{formatNumber(v.price)} so'm</p>
                        </div>
                        <div className="w-[112px]">
                          {q === 0 ? (
                            <button type="button" disabled={!canAddMore} onClick={() => { haptic(); inc(v.name) }} className="h-9 w-full rounded-full border border-gold-500/40 text-sm font-bold text-gold-400 disabled:opacity-40">
                              + Qo'shish
                            </button>
                          ) : (
                            <QtyControl size="sm" qty={q} canAdd={canAddMore} onAdd={() => inc(v.name)} onRemove={() => dec(v.name)} />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-gold-600/20 bg-obsidian-850 px-4 py-3">
                  <p className="font-cinzel text-lg font-semibold text-gold-400">{formatNumber(product.price)} <span className="text-xs text-stone-500">UZS</span></p>
                  <div className="w-[120px]">
                    {totalQty === 0 ? (
                      <button type="button" disabled={!canAddMore} onClick={() => { haptic(); inc() }} className="bg-gold-gradient h-10 w-full rounded-full text-sm font-bold text-obsidian-950 disabled:opacity-40">
                        + Qo'shish
                      </button>
                    ) : (
                      <QtyControl qty={totalQty} canAdd={canAddMore} onAdd={() => inc()} onRemove={() => dec()} />
                    )}
                  </div>
                </div>
              )}
              {!canAddMore && <p className="mt-2 text-center text-xs text-orange-400">Omborda boshqa qolmadi</p>}
              <button type="button" onClick={close} className="mt-4 h-11 w-full rounded-full border border-gold-500/30 text-xs tracking-[0.15em] text-gold-300 uppercase">
                Tayyor
              </button>
            </div>
          )}
          <div className="h-2" />
        </div>
      </div>
    </div>
  )
}

function SheetTitle({ children }) {
  return <h3 className="mt-5 mb-2.5 font-cinzel text-[11px] tracking-[0.25em] text-gold-400 uppercase">{children}</h3>
}
