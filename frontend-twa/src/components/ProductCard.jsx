import { useCart } from '../store/cart'
import { formatPrice } from '../lib/format'
import { haptic } from '../lib/telegram'
import QtyControl from './QtyControl'

export default function ProductCard({ product }) {
  const qty = useCart((s) => s.items[product.id] ?? 0)
  const add = useCart((s) => s.add)
  const remove = useCart((s) => s.remove)
  const soldOut = !product.is_available

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl bg-tg-secondary ${soldOut ? 'opacity-60' : ''}`}>
      <div className="relative aspect-[5/4] bg-tg-bg">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover ${soldOut ? 'grayscale' : ''}`}
          />
        )}
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-xs font-semibold text-white">
            Tugadi
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <div className="flex-1">
          <h3 className="text-sm font-semibold leading-tight">{product.name}</h3>
          {product.description && <p className="mt-0.5 text-xs text-tg-hint line-clamp-2">{product.description}</p>}
        </div>
        <p className="text-sm font-bold">{formatPrice(product.price)}</p>

        {soldOut ? (
          <button disabled className="h-11 rounded-xl bg-tg-bg text-sm text-tg-hint">Mavjud emas</button>
        ) : qty === 0 ? (
          <button
            type="button"
            className="h-11 rounded-xl bg-tg-button text-sm font-semibold text-tg-button-text active:scale-95 transition"
            onClick={() => { haptic(); add(product.id) }}
          >
            + Qo'shish
          </button>
        ) : (
          <QtyControl qty={qty} onAdd={() => add(product.id)} onRemove={() => remove(product.id)} />
        )}
      </div>
    </div>
  )
}
