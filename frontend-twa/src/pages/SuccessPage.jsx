import { tg } from '../lib/telegram'

export default function SuccessPage({ orderId, onBack }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-4xl text-white">✓</div>
      <h1 className="text-2xl font-bold">Buyurtma qabul qilindi!</h1>
      <p className="text-tg-hint">
        Buyurtma raqami: <span className="font-bold text-tg-text">#{orderId}</span>
        <br />
        Tez orada operatorimiz siz bilan bog'lanadi.
      </p>
      <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
        <button className="h-12 rounded-xl bg-tg-button font-semibold text-tg-button-text" onClick={onBack}>
          Menyuga qaytish
        </button>
        {tg?.initData && (
          <button className="h-12 rounded-xl bg-tg-secondary font-semibold" onClick={() => tg.close()}>
            Yopish
          </button>
        )}
      </div>
    </div>
  )
}
