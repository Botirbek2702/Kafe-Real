import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// undefined = tekshirilmoqda, null = kirilmagan, object = kirilgan
export function useSession() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  return session
}

// Har N soniyada qayta render ("5 daq oldin" kabi yozuvlar yangilanib turishi uchun)
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
