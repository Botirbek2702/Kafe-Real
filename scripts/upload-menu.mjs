// Rasmlarni WebP ga siqib, Supabase Storage'ga yuklaydi va menyuni bazaga yozadi.
// Ishga tushirish:  node upload-menu.mjs
// Kassir akkaunti orqali kiradi (secret key ishlatilmaydi).
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { CATEGORIES, MENU } from './menu-data.mjs'

const { SUPABASE_URL, SUPABASE_ANON_KEY, CASHIER_EMAIL, CASHIER_PASSWORD, MENU_DIR = '../../menu' } = process.env

for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_ANON_KEY, CASHIER_EMAIL, CASHIER_PASSWORD })) {
  if (!v) { console.error(`❌ .env faylida ${k} yo'q`); process.exit(1) }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const check = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.message}`); return data }

// Fayl nomidan xavfsiz kalit: "Saryog'a tovuq.png" -> "saryoga-tovuq.webp"
const slug = (name) =>
  name.replace(/\.[^.]+$/, '').toLowerCase().replace(/['‘’`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function syncCategories() {
  const existing = check(await supabase.from('categories').select('id, name'), 'Kategoriyalar')
  const ids = {}
  for (const [i, name] of CATEGORIES.entries()) {
    const found = existing.find((c) => c.name === name)
    if (found) {
      check(await supabase.from('categories').update({ sort_order: i + 1 }).eq('id', found.id), name)
      ids[name] = found.id
    } else {
      ids[name] = check(await supabase.from('categories').insert({ name, sort_order: i + 1 }).select('id').single(), name).id
    }
  }
  return { ids, stale: existing.filter((c) => !CATEGORIES.includes(c.name)) }
}

async function main() {
  check(await supabase.auth.signInWithPassword({ email: CASHIER_EMAIL, password: CASHIER_PASSWORD }), 'Kassir sifatida kirish')
  console.log('✅ Kassir sifatida kirildi')

  const { ids: catId, stale } = await syncCategories()

  for (const item of MENU) {
    const src = path.resolve(MENU_DIR, item.file)
    const webp = await sharp(await fs.readFile(src)).resize({ width: 600, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer()
    const key = `${slug(item.file)}.webp`
    check(await supabase.storage.from('menu').upload(key, webp, { contentType: 'image/webp', upsert: true }), item.file)
    const { data: { publicUrl } } = supabase.storage.from('menu').getPublicUrl(key)

    const row = { name: item.name, description: item.desc, category_id: catId[item.category], price: item.price, image_url: publicUrl }

    // Shu rasmga ega mahsulot bor bo'lsa — yangilaymiz (nomi o'zgargan bo'lsa ham)
    const existing = check(await supabase.from('products').select('id').eq('image_url', publicUrl).maybeSingle(), item.name)
    if (existing) check(await supabase.from('products').update(row).eq('id', existing.id), item.name)
    else check(await supabase.from('products').upsert(row, { onConflict: 'name' }), item.name)

    console.log(`  ✔ ${item.name.padEnd(20)} ${String(Math.round(webp.length / 1024)).padStart(3)} KB  ${item.category}`)
  }

  // Bo'sh qolgan eski kategoriyalarni o'chiramiz
  for (const c of stale) {
    const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('category_id', c.id)
    if (!count) { check(await supabase.from('categories').delete().eq('id', c.id), c.name); console.log(`  🗑  Eski kategoriya o'chirildi: ${c.name}`) }
  }

  console.log(`\n🎉 ${MENU.length} ta ovqat yangilandi`)
}

main().catch((e) => { console.error('❌', e.message); process.exit(1) })
