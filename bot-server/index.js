require('dotenv').config()
const { Telegraf, Markup, session } = require('telegraf')
const { createClient } = require('@supabase/supabase-js')

const http = require('http')

const { BOT_TOKEN, WEBAPP_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, PORT = 3000 } = process.env
if (!BOT_TOKEN || !WEBAPP_URL || !SUPABASE_URL || (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('.env faylida kerakli kalitlar bo\'lishi shart')
  process.exit(1)
}

const bot = new Telegraf(BOT_TOKEN)
// Server uchun xavfsiz Admin kalit (Service Role), agar kiritilmagan bo'lsa anon kalit
const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
const supabase = createClient(SUPABASE_URL, supabaseKey, {
  auth: { persistSession: false }
})

const crypto = require('crypto')

// Telegram WebApp initData hash tekshirish (Telegram rasmiy algoritmi)
function verifyTelegramInitData(initDataRaw, botToken) {
  try {
    const urlParams = new URLSearchParams(initDataRaw)
    const hash = urlParams.get('hash')
    if (!hash) return null

    urlParams.delete('hash')
    const params = Array.from(urlParams.entries())
    params.sort(([a], [b]) => a.localeCompare(b))

    const dataCheckString = params.map(([k, v]) => `${k}=${v}`).join('\n')
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

    if (calculatedHash !== hash) return null

    const userRaw = urlParams.get('user')
    return userRaw ? JSON.parse(userRaw) : null
  } catch (err) {
    console.error('InitData verify error:', err)
    return null
  }
}

// Render.com Web Service port va API
const server = http.createServer((req, res) => {
  // CORS ruxsatlari
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  // Telegram WebApp tekshirish endpointi
  if (req.method === 'POST' && req.url === '/api/validate-user') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const { initData } = JSON.parse(body || '{}')
        const verifiedUser = verifyTelegramInitData(initData, BOT_TOKEN)
        if (!verifiedUser) {
          res.writeHead(401, { 'Content-Type': 'application/json' })
          return res.end(JSON.stringify({ ok: false, error: 'Xavfsizlik tekshiruvidan o\'tmadi (Invalid initData)' }))
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ ok: true, user: verifiedUser }))
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ ok: false, error: 'Bad request' }))
      }
    })
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Kafe Bot Server is running!')
})
server.listen(PORT, () => {
  console.log(`🌐 Web server portda tinglamoqda: ${PORT}`)
})

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
function getStatusMessage(order) {
  switch (order.status) {
    case 'accepted': return `✅ Buyurtmangiz (#${order.id}) qabul qilindi.`;
    case 'cooking': return `👨‍🍳 Buyurtmangiz (#${order.id}) tayyorlanmoqda.`;
    case 'ready': return `🥡 Buyurtmangiz (#${order.id}) tayyor!`;
    case 'delivered': return `🚀 Buyurtmangiz (#${order.id}) yetkazib berildi. Yoqimli ishtaha!`;
    case 'cancelled': 
      if (order.cancel_reason) {
        return `❌ Buyurtmangiz (#${order.id}) bekor qilindi.\nSabab: ${order.cancel_reason}`;
      }
      return `❌ Buyurtmangiz (#${order.id}) bekor qilindi.`;
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
        const msg = getStatusMessage(newOrder)
        if (msg) {
          bot.telegram.sendMessage(newOrder.telegram_id, msg).catch(console.error)
        }
      }
    }
  )
  .subscribe()

// ==========================================
// PROFESSIONAL MARKETING XABAR TARQATISH
// ==========================================
let isBroadcasting = false

async function sendBroadcastMessage(broadcast) {
  if (!broadcast || !broadcast.id) return

  // Statusni darhol "processing" ga o'tkazamiz
  await supabase
    .from('broadcast_messages')
    .update({ status: 'processing' })
    .eq('id', broadcast.id)

  const { data: customers, error } = await supabase
    .from('customers')
    .select('telegram_id')

  if (error || !customers || customers.length === 0) {
    console.log('Xabar yuborish uchun mijozlar topilmadi.')
    await supabase.from('broadcast_messages').update({ status: 'completed' }).eq('id', broadcast.id)
    return
  }

  console.log(`📢 Xabar tarqatish boshlandi (ID: ${broadcast.id}). Jami mijozlar: ${customers.length}`)
  let successCount = 0
  let failCount = 0

  for (const customer of customers) {
    const chatId = customer.telegram_id
    if (!chatId) continue

    try {
      if (broadcast.image_url) {
        try {
          await bot.telegram.sendPhoto(chatId, broadcast.image_url, { 
            caption: broadcast.message,
            parse_mode: 'HTML'
          })
          successCount++
        } catch (imgErr) {
          // Rasm ochilmasa yoki xato bersa, matnning o'zini yetkazamiz!
          await bot.telegram.sendMessage(chatId, broadcast.message, { parse_mode: 'HTML' })
          successCount++
        }
      } else {
        await bot.telegram.sendMessage(chatId, broadcast.message, { parse_mode: 'HTML' })
        successCount++
      }

      // Telegram API cheklovlaridan o'tish uchun xavfsiz oraliq (35ms = ~28 msg/sec)
      await new Promise(r => setTimeout(r, 40))
    } catch (err) {
      failCount++
      // Agar foydalanuvchi botni bloklagan bo'lsa (403 Forbidden)
      if (err.response?.error_code === 403) {
        console.log(`Mijoz botni bloklagan: ${chatId}`)
      } else if (err.response?.error_code === 429) {
        // Agar Telegram "kut" desa (Too Many Requests), ko'rsatilgan soniya kutamiz
        const retryAfter = (err.response.parameters?.retry_after || 2) * 1000
        console.log(`Telegram Flood Wait: ${retryAfter}ms kutilmoqda...`)
        await new Promise(r => setTimeout(r, retryAfter))
      } else {
        console.error(`Xabar yetkazilmadi (${chatId}):`, err.message)
      }
    }
  }

  await supabase
    .from('broadcast_messages')
    .update({ status: 'completed' })
    .eq('id', broadcast.id)

  console.log(`✅ Xabar tarqatish yakunlandi. Yetkazildi: ${successCount}, Yetib bormadi: ${failCount}`)
}

// Baza orqali yangi broadcast tushganda eshitish
supabase
  .channel('bot-marketing')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'broadcast_messages' },
    async (payload) => {
      const broadcast = payload.new
      if (isBroadcasting) return
      isBroadcasting = true
      try {
        await sendBroadcastMessage(broadcast)
      } finally {
        isBroadcasting = false
      }
    }
  )
  .subscribe()

// Server qayta yoqilganda qolib ketgan "pending" xabarlarni yuborish
async function checkPendingBroadcasts() {
  const { data: pending } = await supabase
    .from('broadcast_messages')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)

  if (pending && pending.length > 0 && !isBroadcasting) {
    isBroadcasting = true
    try {
      await sendBroadcastMessage(pending[0])
    } finally {
      isBroadcasting = false
    }
  }
}
setTimeout(checkPendingBroadcasts, 3000)
