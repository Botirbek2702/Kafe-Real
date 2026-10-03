// "Ding-dong" ovozi — Web Audio orqali yaratiladi (alohida mp3 fayl kerak emas).
// Brauzer qoidasi: ovoz faqat foydalanuvchi sahifada biror marta bosgandan keyin chiqadi.
let ctx = null

export function unlockAudio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
}

export const isAudioReady = () => ctx?.state === 'running'

export function playDing() {
  if (!ctx || ctx.state !== 'running') return
  const now = ctx.currentTime
  ;[988, 1319, 1568].forEach((freq, i) => {
    const t = now + i * 0.16
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.5, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.65)
  })
}
