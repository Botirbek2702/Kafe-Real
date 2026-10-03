export const formatNumber = (n) => new Intl.NumberFormat('ru-RU').format(n ?? 0).replace(/\u00a0/g, ' ')
export const formatPrice = (n) => `${formatNumber(n)} so'm`

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// "hozir", "5 daq", "1 soat 20 daq"
export function timeAgo(iso, now = Date.now()) {
  const min = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'hozir'
  if (min < 60) return `${min} daq`
  const h = Math.floor(min / 60)
  return `${h} soat ${min % 60} daq`
}

export const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}
