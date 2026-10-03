import { useEffect, useRef, useState } from 'react'
import { useMenu } from '../api/menu'
import { useCart, cartLines, cartTotal, cartCount } from '../store/cart'
import { formatNumber } from '../lib/format'
import { tgUser, haptic } from '../lib/telegram'
import ProductCard from '../components/ProductCard'

export default function MenuPage({ onOpenCart, onOpenOrders }) {
  const { data, isLoading, isError, refetch } = useMenu()
  const items = useCart((s) => s.items)
  const [observedActive, setActive] = useState(null)
  const tabsRef = useRef(null)

  const categories = (data?.categories ?? []).filter((c) => data.products.some((p) => p.category_id === c.id))
  const active = observedActive ?? categories[0]?.id ?? null
  const lines = data ? cartLines(items, data.products) : []
  const count = cartCount(lines)

  // Qaysi bo'lim ekranda bo'lsa, o'sha tab belgilanadi
  useEffect(() => {
    if (!categories.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(Number(visible[0].target.dataset.cat))
      },
      { rootMargin: '-90px 0px -60% 0px' },
    )
    categories.forEach((c) => {
      const el = document.getElementById(`cat-${c.id}`)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [categories.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Belgilangan tab ko'rinadigan joyga suriladi
  useEffect(() => {
    tabsRef.current?.querySelector(`[data-tab="${active}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [active])

  const scrollTo = (id) => {
    haptic()
    const el = document.getElementById(`cat-${id}`)
    if (el) window.scrollTo({ top: el.offsetTop - 64, behavior: 'smooth' })
  }

  if (isLoading) return <MenuSkeleton />

  if (isError)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-serif text-2xl text-white">Menyuni yuklab bo'lmadi</p>
        <p className="text-sm text-stone-400">Internet aloqasini tekshirib, qayta urinib ko'ring.</p>
        <button className="bg-gold-gradient rounded-full px-6 py-3 font-cinzel text-xs font-bold tracking-[0.15em] text-obsidian-950 uppercase" onClick={() => refetch()}>
          Qayta urinish
        </button>
      </div>
    )

  return (
    <div className="pb-32">
      {/* Sarlavha */}
      <header className="relative overflow-hidden px-5 pt-6 pb-5 text-center flex flex-col items-center">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute top-4 right-4 z-10">
          <button onClick={onOpenOrders} className="text-[10px] font-cinzel font-bold text-gold-400 bg-gold-500/10 border border-gold-500/30 px-3 py-1.5 rounded-full tracking-wider uppercase">
            Buyurtmalarim
          </button>
        </div>
        <img src="/logo.webp" alt="Abdulaziz Kafe" className="relative mx-auto h-16 w-16 rounded-full border-2 border-gold-500/50 object-cover shadow-lg shadow-black/50" />
        <h1 className="text-gold-gradient relative mt-3 font-serif text-[32px] leading-tight font-semibold">Abdulaziz Kafe</h1>
        <p className="mt-1 font-cinzel text-[10px] tracking-[0.3em] text-gold-400 uppercase">
          {tgUser ? `Xush kelibsiz, ${tgUser.first_name}` : 'Premium taomlar'}
        </p>
        <div className="gold-divider mx-auto mt-4 w-24" />
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-stone-400">
          <span className="flex items-center gap-1.5">
            <ClockIcon /> 10:00 – 23:00
          </span>
          <span className="h-3 w-px bg-gold-600/30" />
          <span className="flex items-center gap-1.5">
            <PinIcon /> Yangiariq, Xorazm
          </span>
        </div>
      </header>

      {/* Kategoriyalar */}
      <nav ref={tabsRef} className="scrollbar-none sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-gold-600/10 bg-obsidian-950/90 px-4 py-3 backdrop-blur-lg">
        {categories.map((c) => (
          <button
            key={c.id}
            data-tab={c.id}
            onClick={() => scrollTo(c.id)}
            className={`shrink-0 rounded-full border px-4 py-2 font-cinzel text-[11px] tracking-[0.1em] whitespace-nowrap transition ${
              active === c.id
                ? 'border-gold-500 bg-gold-500 font-semibold text-obsidian-950 shadow-md shadow-gold-500/20'
                : 'border-gold-600/20 bg-obsidian-850 text-stone-300'
            }`}
          >
            {c.name}
          </button>
        ))}
      </nav>

      {categories.map((c) => (
        <section key={c.id} id={`cat-${c.id}`} data-cat={c.id} className="px-4 pt-6">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-serif text-xl font-semibold text-white">{c.name}</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-gold-600/40 to-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {data.products.filter((p) => p.category_id === c.id).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}

      {/* Savatcha tugmasi */}
      <div
        className={`fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-obsidian-950 via-obsidian-950/95 to-transparent px-4 pt-6 pb-[max(14px,env(safe-area-inset-bottom))] transition-transform duration-300 ${
          count > 0 ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <button
          onClick={() => { haptic('medium'); onOpenCart() }}
          className="bg-gold-gradient flex h-14 w-full items-center justify-between rounded-full px-2 pr-6 text-obsidian-950 shadow-[0_8px_30px_-6px_rgba(212,175,55,0.5)] transition active:scale-[0.98]"
        >
          <span key={count} className="animate-pop flex h-10 min-w-10 items-center justify-center rounded-full bg-obsidian-950 px-3 text-sm font-bold text-gold-400">
            {count}
          </span>
          <span className="font-cinzel text-[13px] font-bold tracking-[0.15em] uppercase">Savatcha</span>
          <span className="font-semibold">{formatNumber(cartTotal(lines))}</span>
        </button>
      </div>
    </div>
  )
}

function ClockIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-gold-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-gold-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  )
}

function MenuSkeleton() {
  return (
    <div className="animate-pulse px-4 pt-6">
      <div className="mx-auto h-16 w-16 rounded-full bg-obsidian-800" />
      <div className="mx-auto mt-3 h-8 w-52 rounded bg-obsidian-800" />
      <div className="mx-auto mt-2 h-3 w-32 rounded bg-obsidian-800" />
      <div className="mt-8 flex gap-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-9 w-32 rounded-full bg-obsidian-800" />)}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-72 rounded-xl bg-obsidian-850" />)}
      </div>
    </div>
  )
}
