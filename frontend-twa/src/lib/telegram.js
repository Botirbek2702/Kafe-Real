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
  // Brend ranglari: Telegram'ning tepa va pastki paneli ham qora bo'ladi
  tg.setHeaderColor?.('#0e0e10')
  tg.setBackgroundColor?.('#09090b')
  tg.setBottomBarColor?.('#0e0e10')
  tg.disableVerticalSwipes?.()
}
