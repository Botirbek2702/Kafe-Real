import { useCart } from '../store/cart'
import { formatNumber } from '../lib/format'
import { haptic } from '../lib/telegram'
import QtyControl from './QtyControl'

export default function ProductCard({ product }) {
  const qty = useCart((s) => s.items[product.id] ?? 0)
  const add = useCart((s) => s.add)
  const remove = useCart((s) => s.remove)
  const soldOut = !product.is_available

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-xl border bg-obsidian-850 transition ${
        qty > 0 ? 'border-gold-500/60 shadow-[0_0_24px_-10px_rgba(212,175,55,0.5)]' : 'border-gold-600/20'
      } ${soldOut ? 'opacity-60' : ''}`}
    >
      <div className="relative aspect-square overflow-hidden bg-obsidian-900">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            decoding="async"
            /* Rasmlar tepasidagi yozuvni yashirish uchun biroz kattalashtiriladi (saytdagidek) */
            className={`h-full w-full scale-[1.35] object-cover ${soldOut ? 'grayscale' : ''}`}
          />
        )}
        {qty > 0 && (
          <span className="bg-gold-gradient absolute top-2 right-2 flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold text-obsidian-950 shadow-lg">
            {qty}
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

        <div className="mt-2.5 border-t border-gold-600/10 pt-2.5">
          <p className="mb-2.5 font-cinzel text-[15px] font-semibold tracking-wide text-gold-400">
            {formatNumber(product.price)} <span className="font-sans text-[10px] font-normal text-stone-500">UZS</span>
          </p>

          {soldOut ? (
            <button disabled className="h-10 w-full rounded-full border border-stone-700 text-xs text-stone-500">
              Mavjud emas
            </button>
          ) : qty === 0 ? (
            <button
              type="button"
              className="h-10 w-full rounded-full border border-gold-500/40 font-cinzel text-[11px] font-semibold tracking-[0.12em] text-gold-300 uppercase transition active:scale-95 active:bg-gold-500 active:text-obsidian-950"
              onClick={() => { haptic(); add(product.id) }}
            >
              + Qo'shish
            </button>
          ) : (
            <QtyControl qty={qty} onAdd={() => add(product.id)} onRemove={() => remove(product.id)} />
          )}
        </div>
      </div>
    </article>
  )
}
