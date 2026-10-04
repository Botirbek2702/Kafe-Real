// Telegram Web App yordamchi funksiyalari.
// Oddiy brauzerda ochilganda ham xato bermasligi uchun hammasi xavfsiz (?.) chaqiriladi.
import { useEffect, useRef } from 'react'

export const tg = window.Telegram?.WebApp

export const isTelegram = Boolean(tg?.initData)

export const tgUser = tg?.initDataUnsafe?.user ?? null

export function haptic(type = 'light') {
  tg?.HapticFeedback?.impactOccurred(type)
}

export function hapticSuccess() {
  tg?.HapticFeedback?.notificationOccurred('success')
}

export function hapticError() {
  tg?.HapticFeedback?.notificationOccurred('error')
}

export function initTelegram() {
  if (!tg) return
  tg.ready()
  tg.expand()
  // Brend ranglari: Telegram'ning tepa va pastki paneli ham qora bo'ladi
  tg.setHeaderColor?.('#0e0e10')
  tg.setBackgroundColor?.('#09090b')
  tg.setBottomBarColor?.('#0e0e10')
  tg.disableVerticalSwipes?.()
}

// Telegram'ning o'z pastki tugmasi (MainButton).
// Telegram ichida bo'lsa true qaytaradi — shunda sahifa o'zining HTML tugmasini yashiradi.
export const hasMainButton = isTelegram && Boolean(tg?.MainButton)

export function useMainButton({ text, onClick, visible = true, loading = false, disabled = false }) {
  const handler = useRef(onClick)
  handler.current = onClick

  useEffect(() => {
    if (!hasMainButton) return
    const mb = tg.MainButton
    const fn = () => handler.current?.()
    mb.onClick(fn)
    return () => { mb.offClick(fn); mb.hideProgress(); mb.hide() }
  }, [])

  useEffect(() => {
    if (!hasMainButton) return
    const mb = tg.MainButton
    mb.setParams({ text, color: '#d4af37', text_color: '#0e0e10', is_active: !disabled && !loading })
    if (loading) mb.showProgress(false); else mb.hideProgress()
    if (visible) mb.show(); else mb.hide()
  }, [text, visible, loading, disabled])
}
