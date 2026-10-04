import { useEffect, useState } from 'react'

// Ish vaqti (bazadagi kafe_is_open() bilan bir xil bo'lishi kerak)
export const OPEN_FROM = '10:00'
export const OPEN_TO = '23:00'

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// Toshkent vaqti bo'yicha hozirgi daqiqa (telefon soat mintaqasidan qat'i nazar)
export function nowTashkentMin(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date)
  const h = Number(parts.find((p) => p.type === 'hour').value) % 24
  const m = Number(parts.find((p) => p.type === 'minute').value)
  return h * 60 + m
}

export function isOpenNow(now = nowTashkentMin()) {
  return now >= toMin(OPEN_FROM) && now <= toMin(OPEN_TO)
}

// "18:00", "13:00 da", "11.30" -> daqiqa. Vaqt topilmasa null.
export function parseReadyTime(text) {
  const m = text?.match(/(\d{1,2})[:.](\d{2})/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

// Taom hali tayyor emasmi? (vaqt yetib kelsa avtomatik ochiladi)
export function isNotReadyYet(product, now = nowTashkentMin()) {
  const t = parseReadyTime(product.ready_time)
  return t !== null && now < t
}

// Har daqiqada qayta chizish uchun: hozirgi Toshkent daqiqasini qaytaradi
export function useNowMinute() {
  const [now, setNow] = useState(nowTashkentMin)
  useEffect(() => {
    const id = setInterval(() => setNow(nowTashkentMin()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}
