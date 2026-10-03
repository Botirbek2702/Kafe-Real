require('dotenv').config()
const { Telegraf, Markup } = require('telegraf')

const { BOT_TOKEN, WEBAPP_URL } = process.env
if (!BOT_TOKEN || !WEBAPP_URL) {
  console.error('.env faylida BOT_TOKEN va WEBAPP_URL bo\'lishi shart')
  process.exit(1)
}

const bot = new Telegraf(BOT_TOKEN)

bot.start((ctx) =>
  ctx.reply(
    `Assalomu alaykum, ${ctx.from.first_name}! 👋\nBuyurtma berish uchun quyidagi tugmani bosing:`,
    Markup.inlineKeyboard([Markup.button.webApp('🍽 Menyuni ochish', WEBAPP_URL)]),
  ),
)

// Chatning pastki chap burchagidagi doimiy "Menyu" tugmasi
bot.telegram.setChatMenuButton({
  menuButton: { type: 'web_app', text: 'Menyu', web_app: { url: WEBAPP_URL } },
})

bot.launch()
console.log('🤖 Bot ishga tushdi')

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
