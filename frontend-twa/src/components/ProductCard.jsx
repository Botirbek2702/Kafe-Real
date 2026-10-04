import { useState } from 'react'
import { formatNumber } from '../lib/format'
import { haptic } from '../lib/telegram'
import QtyControl from './QtyControl'
import ProductSheet from './ProductSheet'
import { useProductCart } from './useProductCart'

export default function ProductCard({ product, now }) {
  const [open, setOpen] = useState(false)
  const pc = useProductCart(product, now)
  const { totalQty, qtyOf, inc, dec, blocked, blockedLabel, notReady, canAddMore } = pc
  const hasAddons = Array.isArray(product.addons) && product.addons.length > 0
  const lowStock = product.stock !== null && product.stock !== undefined && product.stock > 0 && product.stock <= 5

  const openSheet = () => { haptic(); setOpen(true) }

  return (
    <>
      <article
        className={`flex flex-col overflow-hidden rounded-xl border bg-obsidian-850 transition ${
          totalQty > 0 ? 'border-gold-500/60 shadow-[0_0_24px_-10px_rgba(212,175,55,0.5)]' : 'border-gold-600/20'
        } ${blocked ? 'opacity-70' : ''}`}
      >
        <button type="button" onClick={openSheet} className="relative block aspect-square overflow-hidden bg-obsidian-900 text-left">
          <ProductImage product={product} className={blocked ? 'grayscale' : ''} />

          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            {product.promo_text && (
              <span className="rounded bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">🎁 {product.promo_text}</span>
            )}
            {lowStock && !blocked && (
              <span className="rounded bg-orange-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">Faqat {product.stock} ta qoldi</span>
            )}
          </div>

          {totalQty > 0 && (
            <span className="bg-gold-gradient absolute top-2 right-2 flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold text-obsidian-950 shadow-lg">
              {totalQty}
            </span>
          )}
          {blocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55">
              <span className="rounded-full border border-gold-500/40 bg-obsidian-950/80 px-3 py-1 font-cinzel text-[11px] tracking-[0.12em] text-gold-400 uppercase">
                {notReady ? `🕒 ${blockedLabel}` : 'Tugadi'}
              </span>
              {notReady && <span className="text-[10px] text-stone-300">chiqadi</span>}
            </div>
          )}
        </button>

        <div className="flex flex-1 flex-col p-3">
          <button type="button" onClick={openSheet} className="text-left">
            <h3 className="font-serif text-[15px] leading-snug font-semibold text-white">{product.name}</h3>
            {product.description && (
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed font-light text-stone-400">{product.description}</p>
            )}
          </button>
          <div className="flex-1" />

          <div className="mt-2.5 border-t border-gold-600/10 pt-2.5">
            {product.variants && !hasAddons ? (
              <div className="flex flex-col gap-2">
                {product.variants.map((v) => {
                  const vQty = qtyOf(v.name)
                  return (
                    <div key={v.name} className="flex items-center justify-between rounded border border-gold-600/20 bg-obsidian-950 px-2 py-1.5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-stone-300">{v.name}</span>
                        <span className="text-[11px] font-bold text-gold-400">{formatNumber(v.price)}</span>
                      </div>
                      <div className="w-[84px] shrink-0">
                        {blocked ? (
                          <span className="block text-right text-[10px] text-stone-500">{blockedLabel}</span>
                        ) : vQty === 0 ? (
                          <button
                            type="button"
                            disabled={!canAddMore}
                            onClick={() => { haptic(); inc(v.name) }}
                            className="h-7 w-full rounded-full border border-gold-500/30 bg-gold-500/10 text-xs font-bold text-gold-500 disabled:opacity-40"
                          >
                            +
                          </button>
                        ) : (
                          <QtyControl size="xs" qty={vQty} canAdd={canAddMore} onAdd={() => inc(v.name)} onRemove={() => dec(v.name)} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <>
                <p className="mb-2.5 font-cinzel text-[15px] font-semibold tracking-wide text-gold-400">
                  {product.variants ? `${formatNumber(Math.min(...product.variants.map((v) => v.price)))} dan` : formatNumber(product.price)}{' '}
                  <span className="font-sans text-[10px] font-normal text-stone-500">UZS</span>
                </p>

                {blocked ? (
                  <button disabled className="h-10 w-full rounded-full border border-stone-700 text-xs text-stone-500">
                    {notReady ? `${blockedLabel} chiqadi` : 'Mavjud emas'}
                  </button>
                ) : hasAddons ? (
                  <button
                    type="button"
                    onClick={openSheet}
                    className="h-10 w-full rounded-full border border-gold-500/40 font-cinzel text-[11px] font-semibold tracking-[0.12em] text-gold-300 uppercase transition active:scale-95"
                  >
                    {totalQty > 0 ? `Yana qo'shish` : 'Tanlash'}
                  </button>
                ) : totalQty === 0 ? (
                  <button
                    type="button"
                    className="h-10 w-full rounded-full border border-gold-500/40 font-cinzel text-[11px] font-semibold tracking-[0.12em] text-gold-300 uppercase transition active:scale-95 active:bg-gold-500 active:text-obsidian-950"
                    onClick={() => { haptic(); inc() }}
                  >
                    + Qo'shish
                  </button>
                ) : (
                  <QtyControl qty={totalQty} canAdd={canAddMore} onAdd={() => inc()} onRemove={() => dec()} />
                )}
              </>
            )}
          </div>
        </div>
      </article>

      {open && <ProductSheet product={product} pc={pc} onClose={() => setOpen(false)} />}
    </>
  )
}

export function ProductImage({ product, className = '' }) {
  const [failed, setFailed] = useState(false)
  if (!product.image_url || failed)
    return (
      <div className="flex h-full w-full items-center justify-center bg-obsidian-900">
        <img src="/logo.webp" alt="" className="h-1/3 w-1/3 rounded-full object-cover opacity-30" />
      </div>
    )
  return (
    <img
      src={product.image_url}
      alt={product.name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`h-full w-full scale-[1.35] object-cover ${className}`}
    />
  )
}
