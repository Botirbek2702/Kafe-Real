import { useState } from 'react'
import { useMenu, createOrder } from '../api/menu'
import { useCart, cartLines, cartTotal } from '../store/cart'
import { formatPrice } from '../lib/format'
import { tgUser, hapticSuccess } from '../lib/telegram'
import QtyControl from '../components/QtyControl'

const SAVED_KEY = 'kafe-customer'
const loadSaved = () => {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY)) ?? {} } catch { return {} }
}

// +998 90 123 45 67 formatidagi raqamni tekshirish
const normalizePhone = (v) => v.replace(/\D/g, '')
const isValidPhone = (v) => /^998\d{9}$/.test(normalizePhone(v))

export default function CartPage({ onBack, onSuccess }) {
  const { data } = useMenu()
  const { items, add, remove, clear } = useCart()
  const saved = loadSaved()

  const [form, setForm] = useState({
    name: saved.name ?? [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' '),
    phone: saved.phone ?? '+998 ',
    orderType: saved.orderType ?? 'delivery',
    address: saved.address ?? '',
    comment: '',
  })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const lines = data ? cartLines(items, data.products) : []
  const total = cartTotal(lines)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Ismingizni kiriting')
    if (!isValidPhone(form.phone)) return setError('Telefon raqamni to\'liq kiriting: +998 XX XXX XX XX')
    if (form.orderType === 'delivery' && form.address.trim().length < 5) return setError('Manzilni kiriting')

    setSending(true)
    try {
      const orderId = await createOrder({
        p_telegram_id: tgUser?.id ?? 0,
        p_customer_name: form.name.trim(),
        p_phone: '+' + normalizePhone(form.phone),
        p_address: form.orderType === 'delivery' ? form.address.trim() : null,
        p_comment: form.comment.trim() || null,
        p_order_type: form.orderType,
        p_items: lines.map((l) => ({ product_id: l.product.id, quantity: l.qty })),
      })
      localStorage.setItem(SAVED_KEY, JSON.stringify({ name: form.name, phone: form.phone, orderType: form.orderType, address: form.address }))
      clear()
      hapticSuccess()
      onSuccess(orderId)
    } catch (err) {
      setError(err.message?.includes('tugagan') ? 'Savatchadagi ba\'zi ovqatlar tugab qoldi. Savatchani tekshiring.' : 'Buyurtma yuborilmadi. Qayta urinib ko\'ring.')
    } finally {
      setSending(false)
    }
  }

  if (!lines.length)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-5xl">🛒</p>
        <p className="text-tg-hint">Savatcha bo'sh</p>
        <button className="rounded-xl bg-tg-button px-5 py-2.5 text-tg-button-text" onClick={onBack}>Menyuga qaytish</button>
      </div>
    )

  const input = 'w-full rounded-xl bg-tg-secondary px-4 py-3 outline-none focus:ring-2 focus:ring-tg-button'

  return (
    <form onSubmit={submit} className="pb-28">
      <header className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button type="button" onClick={onBack} className="text-2xl" aria-label="Orqaga">←</button>
        <h1 className="text-xl font-bold">Savatcha</h1>
        <button type="button" onClick={clear} className="ml-auto text-sm text-red-500">Tozalash</button>
      </header>

      <ul className="divide-y divide-tg-secondary px-4">
        {lines.map(({ product, qty }) => (
          <li key={product.id} className="flex items-center gap-3 py-3">
            <img src={product.image_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{product.name}</p>
              <p className="text-sm text-tg-hint">{formatPrice(product.price * qty)}</p>
            </div>
            <div className="w-28">
              <QtyControl size="sm" qty={qty} onAdd={() => add(product.id)} onRemove={() => remove(product.id)} />
            </div>
          </li>
        ))}
      </ul>

      <section className="mt-4 space-y-3 px-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-tg-secondary p-1">
          {[['delivery', '🚗 Yetkazib berish'], ['pickup', '🏃 Olib ketish']].map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setForm((f) => ({ ...f, orderType: v }))}
              className={`rounded-lg py-2.5 text-sm font-medium transition ${form.orderType === v ? 'bg-tg-bg shadow' : 'text-tg-hint'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <input className={input} placeholder="Ismingiz" value={form.name} onChange={set('name')} autoComplete="name" />
        <input className={input} placeholder="+998 90 123 45 67" value={form.phone} onChange={set('phone')} type="tel" inputMode="tel" autoComplete="tel" />
        {form.orderType === 'delivery' && (
          <textarea className={input} rows={2} placeholder="Manzil (ko'cha, uy, mo'ljal)" value={form.address} onChange={set('address')} />
        )}
        <textarea className={input} rows={2} placeholder="Izoh (ixtiyoriy)" value={form.comment} onChange={set('comment')} />

        {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</p>}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-tg-bg/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur">
        <button
          type="submit"
          disabled={sending}
          className="flex h-14 w-full items-center justify-between rounded-2xl bg-tg-button px-5 font-semibold text-tg-button-text active:scale-[0.98] transition disabled:opacity-60"
        >
          <span>{sending ? 'Yuborilmoqda...' : 'Buyurtma berish'}</span>
          <span>{formatPrice(total)}</span>
        </button>
      </div>
    </form>
  )
}
