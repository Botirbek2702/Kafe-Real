import { useEffect } from 'react'

const tg = window.Telegram?.WebApp

function App() {
  useEffect(() => {
    tg?.ready()
    tg?.expand()
  }, [])

  const user = tg?.initDataUnsafe?.user

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold">🍽 Menyu</h1>
      <p className="mt-2 text-tg-hint">
        {user ? `Salom, ${user.first_name}!` : 'Telegram tashqarisida ochildi (test rejimi)'}
      </p>
    </div>
  )
}

export default App
