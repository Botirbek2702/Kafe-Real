import { useEffect, useRef, useState } from 'react'
import { useMenu } from '../api/menu'
import { useCart, cartLines, cartTotal, cartCount } from '../store/cart'
import { formatPrice } from '../lib/format'
import { tgUser } from '../lib/telegram'
import ProductCard from '../components/ProductCard'

export default function MenuPage({ onOpenCart }) {
  const { data, isLoading, isError, refetch } = useMenu()
  const items = useCart((s) => s.items)
  const [active, setActive] = useState(null)
  const tabsRef = useRef(null)

  const categories = (data?.categories ?? []).filter((c) => data.products.some((p) => p.category_id === c.id))
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
      { rootMargin: '-80px 0px -60% 0px' },
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
    const el = document.getElementById(`cat-${id}`)
    if (el) window.scrollTo({ top: el.offsetTop - 56, behavior: 'smooth' })
  }

  if (isLoading) return <MenuSkeleton />

  if (isError)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-4xl">😕</p>
        <p>Menyuni yuklab bo'lmadi. Internetni tekshiring.</p>
        <button className="rounded-xl bg-tg-button px-5 py-2.5 text-tg-button-text" onClick={() => refetch()}>
          Qayta urinish
        </button>
      </div>
    )

  return (
    <div className="pb-28">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold">Abdulaziz Kafe 🍢</h1>
        <p className="text-sm text-tg-hint">{tgUser ? `Xush kelibsiz, ${tgUser.first_name}!` : 'Mazali taomlar — tez yetkazib beramiz'}</p>
      </header>

      <nav ref={tabsRef} className="sticky top-0 z-10 flex gap-2 overflow-x-auto bg-tg-bg px-4 py-2 [scrollbar-width:none]">
        {categories.map((c) => (
          <button
            key={c.id}
            data-tab={c.id}
            onClick={() => scrollTo(c.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              active === c.id ? 'bg-tg-button text-tg-button-text' : 'bg-tg-secondary'
            }`}
          >
            {c.name}
          </button>
        ))}
      </nav>

      {categories.map((c) => (
        <section key={c.id} id={`cat-${c.id}`} data-cat={c.id} className="px-4 pt-4">
          <h2 className="mb-3 text-lg font-bold">{c.name}</h2>
          <div className="grid grid-cols-2 gap-3">
            {data.products.filter((p) => p.category_id === c.id).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-tg-bg/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur">
          <button
            onClick={onOpenCart}
            className="flex h-14 w-full items-center justify-between rounded-2xl bg-tg-button px-5 font-semibold text-tg-button-text active:scale-[0.98] transition"
          >
            <span className="rounded-lg bg-white/20 px-2 py-0.5 text-sm">{count}</span>
            <span>Savatcha</span>
            <span>{formatPrice(cartTotal(lines))}</span>
          </button>
        </div>
      )}
    </div>
  )
}

function MenuSkeleton() {
  return (
    <div className="animate-pulse p-4">
      <div className="h-7 w-48 rounded bg-tg-secondary" />
      <div className="mt-4 flex gap-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-9 w-28 rounded-full bg-tg-secondary" />)}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-60 rounded-2xl bg-tg-secondary" />)}
      </div>
    </div>
  )
}
