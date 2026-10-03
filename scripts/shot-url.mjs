// Istalgan sahifani telefon o'lchamida skrinshot qiladi.
// node shot-url.mjs <url> <out.png> [fullPage=1] [scrollToSelector]
import puppeteer from 'puppeteer-core'

const [url, out, full = '1', selector] = process.argv.slice(2)
const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true })
const page = await browser.newPage()
await page.emulate({ viewport: { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' })
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
if (selector) await page.$eval(selector, (el) => el.scrollIntoView())
await new Promise((r) => setTimeout(r, 1500))
await page.screenshot({ path: out, fullPage: full === '1' })
await browser.close()
