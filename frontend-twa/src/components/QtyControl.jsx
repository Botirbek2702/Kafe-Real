import { haptic } from '../lib/telegram'

export default function QtyControl({ qty, onAdd, onRemove, size = 'md', canAdd = true }) {
  const btn = size === 'sm' ? 'h-8 w-8 text-base' : size === 'xs' ? 'h-7 w-7 text-sm' : 'h-9 w-9 text-lg'
  return (
    <div className="flex items-center justify-between gap-1 rounded-full border border-gold-500/30 bg-obsidian-900 p-1">
      <button
        type="button"
        aria-label="Kamaytirish"
        className={`${btn} flex items-center justify-center rounded-full text-gold-400 active:bg-gold-500/15 transition`}
        onClick={(e) => { e.stopPropagation(); haptic(); onRemove() }}
      >
        −
      </button>
      <span key={qty} className="animate-pop min-w-6 text-center font-semibold text-white">{qty}</span>
      <button
        type="button"
        aria-label="Ko'paytirish"
        disabled={qty >= 50 || !canAdd}
        className={`${btn} bg-gold-gradient flex items-center justify-center rounded-full font-bold text-obsidian-950 active:scale-90 transition disabled:opacity-40`}
        onClick={(e) => { e.stopPropagation(); haptic(); onAdd() }}
      >
        +
      </button>
    </div>
  )
}
