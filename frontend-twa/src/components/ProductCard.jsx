import { useState } from 'react'
import { useCart } from '../store/cart'
import { formatNumber } from '../lib/format'
import { haptic } from '../lib/telegram'
import QtyControl from './QtyControl'

export default function ProductCard({ product }) {
  const [selectedAddons, setSelectedAddons] = useState([])
  const cartItems = useCart((s) => s.items)
  const add = useCart((s) => s.add)
  const remove = useCart((s) => s.remove)
  const soldOut = !product.is_available

  // Sum total qty of this product across all variants/addons
  const totalQty = Object.entries(cartItems).reduce((sum, [key, q]) => {
    const id = key.includes('|') ? key.split('|')[0] : key.split('_')[0]
    return id === product.id.toString() ? sum + q : sum
  }, 0)

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => 
      prev.some(a => a.name === addon.name) 
        ? prev.filter(a => a.name !== addon.name)
        : [...prev, addon]
    )
    haptic()
  }

  // To check qty of a specific configuration
  const getQty = (variantName = null) => {
    const addonsStr = selectedAddons.length ? selectedAddons.map(a => a.name).sort().join(',') : ''
    const key = [product.id, variantName || '', addonsStr].join('|')
    return cartItems[key] || 0
  }

  const handleAdd = (variantName = null) => {
    haptic()
    add(product.id, variantName, selectedAddons)
  }

  const handleRemove = (variantName = null) => {
    haptic()
    const addonsStr = selectedAddons.length ? selectedAddons.map(a => a.name).sort().join(',') : ''
    const key = [product.id, variantName || '', addonsStr].join('|')
    remove(key)
  }

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-xl border bg-obsidian-850 transition ${
        totalQty > 0 ? 'border-gold-500/60 shadow-[0_0_24px_-10px_rgba(212,175,55,0.5)]' : 'border-gold-600/20'
      } ${soldOut ? 'opacity-60' : ''}`}
    >
      <div className="relative aspect-square overflow-hidden bg-obsidian-900">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={`h-full w-full scale-[1.35] object-cover ${soldOut ? 'grayscale' : ''}`}
          />
        )}
        
        {/* Promo and Ready Time Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {product.promo_text && (
            <span className="bg-red-500/90 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-md">
              🎁 {product.promo_text}
            </span>
          )}
          {product.ready_time && (
            <span className="bg-purple-600/90 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-md">
              🕒 {product.ready_time}
            </span>
          )}
        </div>

        {totalQty > 0 && (
          <span className="bg-gold-gradient absolute top-2 right-2 flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold text-obsidian-950 shadow-lg">
            {totalQty}
          </span>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <span className="rounded-full border border-gold-500/40 bg-obsidian-950/80 px-3 py-1 font-cinzel text-[11px] tracking-[0.15em] text-gold-400">
              TUGADI
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-serif text-[15px] leading-snug font-semibold text-white">{product.name}</h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 flex-1 text-[11px] leading-relaxed font-light text-stone-400">{product.description}</p>
        )}

        {/* Addons Selection */}
        {product.addons && product.addons.length > 0 && !soldOut && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {product.addons.map((a) => {
              const isSelected = selectedAddons.some(x => x.name === a.name)
              return (
                <button 
                  key={a.name}
                  onClick={() => toggleAddon(a)}
                  className={`text-[9px] px-2 py-1 rounded-full border transition-colors ${
                    isSelected 
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' 
                      : 'bg-obsidian-900 border-gray-700 text-gray-400'
                  }`}
                >
                  {a.name} (+{formatNumber(a.price)})
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-2.5 border-t border-gold-600/10 pt-2.5">
          {product.variants ? (
            <div className="flex flex-col gap-2">
              {product.variants.map((v) => {
                const vQty = getQty(v.name)
                return (
                  <div key={v.name} className="flex justify-between items-center rounded bg-obsidian-950 px-2 py-1.5 border border-gold-600/20">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-stone-300">{v.name}</span>
                      <span className="text-[11px] font-bold text-gold-400">{formatNumber(v.price)} <span className="font-sans text-[9px] font-normal text-stone-500">UZS</span></span>
                    </div>
                    
                    <div className="w-20 shrink-0">
                      {soldOut ? (
                        <button disabled className="h-7 w-full rounded-full border border-stone-700 text-[10px] text-stone-500">Tugadi</button>
                      ) : vQty === 0 ? (
                        <button onClick={() => handleAdd(v.name)} className="h-7 w-full rounded-full bg-gold-500/10 text-[10px] font-bold text-gold-500 border border-gold-500/30">+</button>
                      ) : (
                        <div className="scale-[0.8] origin-right"><QtyControl qty={vQty} onAdd={() => handleAdd(v.name)} onRemove={() => handleRemove(v.name)} /></div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <>
              <p className="mb-2.5 font-cinzel text-[15px] font-semibold tracking-wide text-gold-400">
                {formatNumber(product.price)} <span className="font-sans text-[10px] font-normal text-stone-500">UZS</span>
              </p>

              {soldOut ? (
                <button disabled className="h-10 w-full rounded-full border border-stone-700 text-xs text-stone-500">
                  Mavjud emas
                </button>
              ) : getQty() === 0 ? (
                <button
                  type="button"
                  className="h-10 w-full rounded-full border border-gold-500/40 font-cinzel text-[11px] font-semibold tracking-[0.12em] text-gold-300 uppercase transition active:scale-95 active:bg-gold-500 active:text-obsidian-950"
                  onClick={() => handleAdd()}
                >
                  + Qo'shish
                </button>
              ) : (
                <QtyControl qty={getQty()} onAdd={() => handleAdd()} onRemove={() => handleRemove()} />
              )}
            </>
          )}
        </div>
      </div>
    </article>
  )
}
