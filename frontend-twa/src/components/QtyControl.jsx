import { haptic } from '../lib/telegram'

export default function QtyControl({ qty, onAdd, onRemove, size = 'md' }) {
  const btn = size === 'sm' ? 'h-7 w-7 text-base' : 'h-9 w-9 text-lg'
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-tg-secondary p-1">
      <button
        type="button"
        aria-label="Kamaytirish"
        className={`${btn} rounded-lg bg-tg-bg font-bold active:scale-90 transition`}
        onClick={() => { haptic(); onRemove() }}
      >
        −
      </button>
      <span className="min-w-6 text-center font-semibold">{qty}</span>
      <button
        type="button"
        aria-label="Ko'paytirish"
        disabled={qty >= 50}
        className={`${btn} rounded-lg bg-tg-button text-tg-button-text font-bold active:scale-90 transition disabled:opacity-40`}
        onClick={() => { haptic(); onAdd() }}
      >
        +
      </button>
    </div>
  )
}
