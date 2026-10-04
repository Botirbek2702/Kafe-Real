import { tg } from '../lib/telegram'

export default function SuccessPage({ orderId, onBack }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-center">
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />

      <div className="bg-gold-gradient relative flex h-20 w-20 items-center justify-center rounded-full shadow-[0_0_40px_-5px_rgba(212,175,55,0.6)]">
        <svg className="h-10 w-10 text-obsidian-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <p className="relative mt-6 font-cinzel text-[10px] tracking-[0.3em] text-gold-400 uppercase">Rahmat!</p>
      <h1 className="text-gold-gradient relative mt-2 font-serif text-3xl font-semibold">Buyurtma qabul qilindi</h1>
      <div className="gold-divider relative mx-auto mt-4 w-24" />

      <div className="relative mt-6 rounded-xl border border-gold-600/25 bg-obsidian-850 px-8 py-4">
        <p className="text-xs text-stone-400">Buyurtma raqami</p>
        <p className="mt-1 font-cinzel text-3xl font-bold text-gold-400">#{orderId}</p>
      </div>

      <p className="relative mt-5 max-w-xs text-sm leading-relaxed text-stone-400">
        Tez orada operatorimiz siz bilan bog'lanadi. Savollar bo'lsa:{' '}
        <a href="tel:+998556016868" className="text-gold-400">55 601 68 68</a>
      </p>

      <div className="relative mt-8 flex w-full max-w-xs flex-col gap-3">
        <button className="bg-gold-gradient h-12 rounded-full font-cinzel text-xs font-bold tracking-[0.15em] text-obsidian-950 uppercase" onClick={onBack}>
          Buyurtmalarim
        </button>
        {tg?.initData && (
          <button className="h-12 rounded-full border border-gold-500/40 font-cinzel text-xs tracking-[0.15em] text-gold-300 uppercase" onClick={() => tg.close()}>
            Yopish
          </button>
        )}
      </div>
    </div>
  )
}
