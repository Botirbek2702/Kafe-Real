import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Utensils } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (lockoutSeconds > 0) return

    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)

      if (newAttempts >= 5) {
        setError("Juda ko'p xato urinishlar. Xavfsizlik uchun 30 soniyaga qulflandi.")
        setLockoutSeconds(30)
        const timer = setInterval(() => {
          setLockoutSeconds((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              setFailedAttempts(0)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(`Kirishda xatolik: Email yoki parol noto'g'ri (${5 - newAttempts} ta urinish qoldi)`)
      }
      setLoading(false)
    } else {
      setFailedAttempts(0)
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian-950 px-4">
      <div className="max-w-md w-full bg-obsidian-900 p-8 rounded-2xl border border-gold-500/20 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mb-4 border border-gold-500/30">
            <Utensils className="w-8 h-8 text-gold-500" />
          </div>
          <h1 className="text-3xl text-center">Kassir Paneli</h1>
          <p className="text-gray-400 mt-2 text-sm text-center">
            Tizimga kirish uchun ma'lumotlarni kiriting
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-obsidian-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
              placeholder="kassir@kafe.uz"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Parol</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-obsidian-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading || lockoutSeconds > 0}
            className={`w-full font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center ${
              lockoutSeconds > 0
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                : 'bg-gold-500 hover:bg-gold-400 text-obsidian-950'
            }`}
          >
            {loading ? 'Kirilmoqda...' : lockoutSeconds > 0 ? `Kuting: ${lockoutSeconds}s` : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  )
}
