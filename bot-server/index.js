require('dotenv').config()
const { Telegraf, Markup, session } = require('telegraf')
const { createClient } = require('@supabase/supabase-js')

const { BOT_TOKEN, WEBAPP_URL, SUPABASE_URL, SUPABASE_ANON_KEY } = process.env
if (!BOT_TOKEN || !WEBAPP_URL || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('.env faylida BOT_TOKEN, WEBAPP_URL, SUPABASE_URL, SUPABASE_ANON_KEY bo\'lishi shart')
  process.exit(1)
}

const bot = new Telegraf(BOT_TOKEN)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Simple in-memory session (for production use redis or telegraf-session-local)
bot.use(session())

bot.start(async (ctx) => {
  const telegramId = ctx.from.id
  
  // Bazadan mijozni qidiramiz
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()

  if (customer) {
    // Agar mijoz topilsa, to'g'ridan-to'g'ri menyuni ko'rsatamiz
    return sendMenu(ctx, customer.full_name)
  } else {
    // Agar topilmasa, ro'yxatdan o'tkazamiz
    ctx.session = ctx.session || {}
    ctx.session.step = 'awaiting_name'
    return ctx.reply("Assalomu alaykum! Kafe botiga xush kelibsiz.\n\nIltimos, ism va familiyangizni kiriting:")
  }
})

bot.on('text', async (ctx, next) => {
  if (ctx.session?.step === 'awaiting_name') {
    ctx.session.full_name = ctx.message.text
    ctx.session.step = 'awaiting_phone'
    
    return ctx.reply("Rahmat! Endi telefon raqamingizni yuboring (yoki pastdagi tugmani bosing):", 
      Markup.keyboard([
        Markup.button.contactRequest("📱 Raqamni yuborish")
      ]).resize().oneTime()
    )
  }
  return next()
})

bot.on('contact', async (ctx, next) => {
  if (ctx.session?.step === 'awaiting_phone') {
    const contact = ctx.message.contact
    
    // Validate if the contact is the user's own contact
    if (contact.user_id !== ctx.from.id) {
      return ctx.reply("Iltimos, o'zingizning raqamingizni yuboring.")
    }

    const telegramId = ctx.from.id
    const fullName = ctx.session.full_name
    const phone = contact.phone_number

    // Bazaga saqlaymiz
    const { error } = await supabase
      .from('customers')
      .insert([
        { telegram_id: telegramId, full_name: fullName, phone: phone }
      ])

    if (error) {
      console.error(error)
      return ctx.reply("Xatolik yuz berdi. Iltimos keyinroq qayta urinib ko'ring.")
    }

    ctx.session.step = null
    await ctx.reply("Ro'yxatdan muvaffaqiyatli o'tdingiz! 🎉", Markup.removeKeyboard())
    return sendMenu(ctx, fullName)
  }
  return next()
})

function sendMenu(ctx, name) {
  ctx.reply(
    `Hurmatli ${name}, buyurtma berish uchun quyidagi tugmani bosing:`,
    Markup.inlineKeyboard([Markup.button.webApp('🍔 Menyuni ochish', WEBAPP_URL)]),
  )
  bot.telegram.setChatMenuButton({
    chatId: ctx.from.id,
    menuButton: { type: 'web_app', text: 'Menyu', web_app: { url: WEBAPP_URL } },
  })
}

bot.launch()
console.log('🤖 Bot ishga tushdi va mijoz ma\'lumotlarini kutyapti...')

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// ==========================================
// BUYURTMA HOLATI (STATUS) UCHUN REALTIME
// ==========================================
function getStatusMessage(status, orderId) {
  switch (status) {
    case 'accepted': return `✅ Buyurtmangiz (#${orderId}) qabul qilindi.`;
    case 'cooking': return `🧑‍🍳 Buyurtmangiz (#${orderId}) tayyorlanmoqda.`;
    case 'ready': return `🛍 Buyurtmangiz (#${orderId}) tayyor!`;
    case 'delivered': return `🚀 Buyurtmangiz (#${orderId}) yetkazib berildi. Yoqimli ishtaha!`;
    case 'cancelled': return `❌ Buyurtmangiz (#${orderId}) bekor qilindi.`;
    default: return null;
  }
}

supabase
  .channel('bot-orders')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'orders' },
    (payload) => {
      const newOrder = payload.new
      const oldOrder = payload.old
      
      // Status o'zgargandagina xabar yuboramiz
      if (newOrder.status !== oldOrder.status) {
        const msg = getStatusMessage(newOrder.status, newOrder.id)
        if (msg) {
          bot.telegram.sendMessage(newOrder.telegram_id, msg).catch(console.error)
        }
      }
    }
  )
  .subscribe()
