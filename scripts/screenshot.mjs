// Vizual test: telefon o'lchamida menyu, savatcha va formani skrinshot qiladi.
// Ishga tushirish: node screenshot.mjs [url] [outDir]
import puppeteer from 'puppeteer-core'

const url = process.argv[2] ?? 'http://localhost:4173'
const out = process.argv[3] ?? '.'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true })
const page = await browser.newPage()
await page.emulate({
  viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
})
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

await page.goto(url, { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle0' })
await page.waitForSelector('img')
await new Promise((r) => setTimeout(r, 800))
await page.screenshot({ path: `${out}/twa_1_menu.png` })

// 2 ta ovqat qo'shamiz, birini 2 marta
const addButtons = await page.$$('button ::-p-text(+ Qo\'shish)')
await addButtons[0].click()
await addButtons[1].click()
await new Promise((r) => setTimeout(r, 300))
await page.click('button[aria-label="Ko\'paytirish"]')
await new Promise((r) => setTimeout(r, 300))
await page.screenshot({ path: `${out}/twa_2_added.png` })

await page.click('button ::-p-text(Savatcha)')
await new Promise((r) => setTimeout(r, 600))
await page.screenshot({ path: `${out}/twa_3_cart.png`, fullPage: true })

console.log(errors.length ? `Xatolar:\n${errors.join('\n')}` : 'Konsolda xato yo\'q')
await browser.close()
