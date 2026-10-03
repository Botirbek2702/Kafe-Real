// Telegram Web App yordamchi funksiyalari.
// Oddiy brauzerda ochilganda ham xato bermasligi uchun hammasi xavfsiz (?.) chaqiriladi.
export const tg = window.Telegram?.WebApp

export const isTelegram = Boolean(tg?.initData)

export const tgUser = tg?.initDataUnsafe?.user ?? null

export function haptic(type = 'light') {
  tg?.HapticFeedback?.impactOccurred(type)
}

export function hapticSuccess() {
  tg?.HapticFeedback?.notificationOccurred('success')
}

export function initTelegram() {
  if (!tg) return
  tg.ready()
  tg.expand()
  tg.setHeaderColor?.('bg_color')
}
