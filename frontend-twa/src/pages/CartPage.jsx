import { useState, useEffect } from 'react'
import { useMenu, createOrder } from '../api/menu'
import { useCart, cartLines, cartTotal } from '../store/cart'
import { formatNumber } from '../lib/format'
import { tgUser, haptic, hapticSuccess } from '../lib/telegram'
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

  useEffect(() => {
    if (!saved.name && tgUser?.id) {
      import('../lib/supabase').then(({ supabase }) => {
        supabase.from('customers').select('full_name, phone').eq('telegram_id', tgUser.id).single().then(({ data }) => {
          if (data) {
            setForm(f => ({ ...f, name: data.full_name, phone: data.phone }))
          }
        })
      })
    }
  }, [])

  const lines = data ? cartLines(items, data.products) : []
  const total = cartTotal(lines)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Ismingizni kiriting')
    if (!isValidPhone(form.phone)) return setError('Telefon raqamni to\'liq kiriting: +998 XX XXX XX XX')
    if (form.orderType === 'delivery' && form.address.trim().length < 5) return setError('Yetkazib berish manzilini kiriting')

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
      setError(err.message?.includes('tugagan') ? 'Savatchadagi ba\'zi taomlar tugab qoldi. Savatchani tekshiring.' : 'Buyurtma yuborilmadi. Qayta urinib ko\'ring.')
    } finally {
      setSending(false)
    }
  }

  if (!lines.length)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gold-500/30 bg-obsidian-850">
          <BagIcon className="h-9 w-9 text-gold-500" />
        </div>
        <p className="font-serif text-2xl text-white">Savatcha bo'sh</p>
        <p className="text-sm text-stone-400">Menyudan sevimli taomlaringizni tanlang</p>
        <button className="bg-gold-gradient mt-2 rounded-full px-6 py-3 font-cinzel text-xs font-bold tracking-[0.15em] text-obsidian-950 uppercase" onClick={onBack}>
          Menyuga qaytish
        </button>
      </div>
    )

  return (
    <form onSubmit={submit} className="pb-32">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gold-600/10 bg-obsidian-950/90 px-4 py-3 backdrop-blur-lg">
        <button type="button" onClick={onBack} aria-label="Orqaga" className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-600/30 text-gold-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <h1 className="font-serif text-xl font-semibold text-white">Savatcha</h1>
        <button type="button" onClick={() => { haptic(); clear() }} className="ml-auto text-xs tracking-wide text-stone-500 uppercase">
          Tozalash
        </button>
      </header>

      {/* Taomlar */}
      <ul className="space-y-2.5 px-4 pt-4">
        {lines.map(({ product, qty }) => (
          <li key={product.id} className="flex items-center gap-3 rounded-xl border border-gold-600/15 bg-obsidian-850 p-2.5">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
              <img src={product.image_url} alt="" className="h-full w-full scale-[1.35] object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-[15px] font-semibold text-white">{product.name}</p>
              <p className="mt-0.5 font-cinzel text-sm font-semibold text-gold-400">
                {formatNumber(product.price * qty)} <span className="font-sans text-[10px] font-normal text-stone-500">UZS</span>
              </p>
            </div>
            <div className="w-[104px] shrink-0">
              <QtyControl size="sm" qty={qty} onAdd={() => add(product.id)} onRemove={() => remove(product.id)} />
            </div>
          </li>
        ))}
      </ul>

      {/* Buyurtma ma'lumotlari */}
      <section className="mt-6 px-4">
        <SectionTitle>Buyurtma turi</SectionTitle>
        <div className="grid grid-cols-2 gap-2 rounded-full border border-gold-600/20 bg-obsidian-850 p-1">
          {[['delivery', 'Yetkazib berish'], ['pickup', 'Olib ketish']].map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => { haptic(); setForm((f) => ({ ...f, orderType: v })) }}
              className={`rounded-full py-2.5 font-cinzel text-[11px] tracking-[0.08em] transition ${
                form.orderType === v ? 'bg-gold-gradient font-bold text-obsidian-950' : 'text-stone-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <SectionTitle className="mt-6">Ma'lumotlaringiz</SectionTitle>
        <div className="space-y-3">
          <input className="field" placeholder="Ismingiz" value={form.name} onChange={set('name')} autoComplete="name" />
          <input className="field" placeholder="+998 90 123 45 67" value={form.phone} onChange={set('phone')} type="tel" inputMode="tel" autoComplete="tel" />
          {form.orderType === 'delivery' && (
            <textarea className="field resize-none" rows={2} placeholder="Manzil (ko'cha, uy, mo'ljal)" value={form.address} onChange={set('address')} />
          )}
          <textarea className="field resize-none" rows={2} placeholder="Izoh (ixtiyoriy)" value={form.comment} onChange={set('comment')} />
        </div>

        {form.orderType === 'pickup' && (
          <p className="mt-3 rounded-xl border border-gold-600/15 bg-obsidian-850 px-4 py-3 text-xs leading-relaxed text-stone-400">
            📍 Yangiariq, Xorazm · Buyurtma tayyor bo'lganda sizga xabar beramiz.
          </p>
        )}

        {/* Jami */}
        <div className="mt-6 rounded-xl border border-gold-600/20 bg-obsidian-850 p-4">
          <div className="flex justify-between text-sm text-stone-400">
            <span>Taomlar</span>
            <span>{formatNumber(total)} so'm</span>
          </div>
          {form.orderType === 'delivery' && (
            <div className="mt-2 flex justify-between text-sm text-stone-400">
              <span>Yetkazib berish</span>
              <span>Operator aytadi</span>
            </div>
          )}
          <div className="gold-divider my-3" />
          <div className="flex items-baseline justify-between">
            <span className="font-cinzel text-xs tracking-[0.15em] text-stone-300 uppercase">Jami</span>
            <span className="font-cinzel text-xl font-bold text-gold-400">
              {formatNumber(total)} <span className="font-sans text-xs font-normal text-stone-500">UZS</span>
            </span>
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-obsidian-950 via-obsidian-950/95 to-transparent px-4 pt-6 pb-[max(14px,env(safe-area-inset-bottom))]">
        <button
          type="submit"
          disabled={sending}
          className="bg-gold-gradient flex h-14 w-full items-center justify-center gap-2 rounded-full font-cinzel text-[13px] font-bold tracking-[0.15em] text-obsidian-950 uppercase shadow-[0_8px_30px_-6px_rgba(212,175,55,0.5)] transition active:scale-[0.98] disabled:opacity-60"
        >
          {sending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-obsidian-950 border-t-transparent" /> Yuborilmoqda
            </>
          ) : (
            'Buyurtma berish'
          )}
        </button>
      </div>
    </form>
  )
}

function SectionTitle({ children, className = '' }) {
  return <h2 className={`mb-3 font-cinzel text-[11px] tracking-[0.25em] text-gold-400 uppercase ${className}`}>{children}</h2>
}

function BagIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 8h12l-1 12H7L6 8z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </svg>
  )
}
