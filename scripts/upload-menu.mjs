// Rasmlarni WebP ga siqib, Supabase Storage'ga yuklaydi va products jadvaliga yozadi.
// Ishga tushirish:  node upload-menu.mjs
// Kassir akkaunti orqali kiradi (secret key ishlatilmaydi).
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { MENU } from './menu-data.mjs'

const { SUPABASE_URL, SUPABASE_ANON_KEY, CASHIER_EMAIL, CASHIER_PASSWORD, MENU_DIR = '../../menu' } = process.env

for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_ANON_KEY, CASHIER_EMAIL, CASHIER_PASSWORD })) {
  if (!v) { console.error(`❌ .env faylida ${k} yo'q`); process.exit(1) }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Fayl nomidan xavfsiz kalit: "Saryog'a tovuq.png" -> "saryoga-tovuq.webp"
const slug = (name) =>
  name.replace(/\.[^.]+$/, '').toLowerCase().replace(/['‘’`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function main() {
  const { error: authError } = await supabase.auth.signInWithPassword({ email: CASHIER_EMAIL, password: CASHIER_PASSWORD })
  if (authError) throw new Error(`Kassir sifatida kirib bo'lmadi: ${authError.message}`)
  console.log('✅ Kassir sifatida kirildi')

  const { data: categories, error: catError } = await supabase.from('categories').select('id, name')
  if (catError) throw catError
  const catId = Object.fromEntries(categories.map((c) => [c.name, c.id]))

  for (const item of MENU) {
    const name = item.file.replace(/\.[^.]+$/, '')
    const src = path.resolve(MENU_DIR, item.file)

    // 600px kenglik, WebP — Telegram ichida tez yuklanishi uchun
    const webp = await sharp(await fs.readFile(src)).resize({ width: 600, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer()
    const key = `${slug(item.file)}.webp`

    const { error: upError } = await supabase.storage.from('menu').upload(key, webp, { contentType: 'image/webp', upsert: true })
    if (upError) throw new Error(`${item.file}: ${upError.message}`)

    const { data: { publicUrl } } = supabase.storage.from('menu').getPublicUrl(key)

    if (!catId[item.category]) throw new Error(`Kategoriya topilmadi: ${item.category}`)

    const { error: dbError } = await supabase.from('products').upsert(
      { name, category_id: catId[item.category], price: item.price, image_url: publicUrl },
      { onConflict: 'name' },
    )
    if (dbError) throw new Error(`${name}: ${dbError.message}`)

    console.log(`  ✔ ${name.padEnd(20)} ${String(Math.round(webp.length / 1024)).padStart(3)} KB  ${item.price} so'm`)
  }

  console.log(`\n🎉 ${MENU.length} ta ovqat yuklandi`)
}

main().catch((e) => { console.error('❌', e.message); process.exit(1) })
