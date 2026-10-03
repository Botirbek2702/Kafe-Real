export const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    
    // Play 3 beeps
    for (let i = 0; i < 3; i++) {
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + (i * 0.4)) // A5 note
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + (i * 0.4))
      gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.05 + (i * 0.4))
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3 + (i * 0.4))
      
      oscillator.start(audioCtx.currentTime + (i * 0.4))
      oscillator.stop(audioCtx.currentTime + 0.3 + (i * 0.4))
    }
  } catch (e) {
    console.error("Audio beep failed", e)
  }
}
