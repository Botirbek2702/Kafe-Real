# Loyiha Arxitekturasi va Rejasi: Telegram Onlayn Buyurtma Tizimi

Ushbu hujjat Telegram Web App orqali ishlaydigan tezkor, xavfsiz va zamonaviy restoran/oshxona buyurtma tizimining to'liq texnik rejasi hisoblanadi.

## 1. Texnologiyalar To'plami (Tech Stack)

*   **Ma'lumotlar Bazasi va Backend:** [Supabase](https://supabase.com/) (PostgreSQL, tayyor Auth, Realtime WebSockets, Storage).
*   **Mijozlar qismi (Telegram Web App):** React.js + Vite + Tailwind CSS.
*   **Kassir/Admin Paneli (POS):** React.js + Vite + Tailwind CSS.
*   **Kesh va API boshqaruvi:** React Query (tig'iz vaqtlarda serverni asrash uchun).
*   **Bot mantiqi:** Node.js (Telegraf) yoki Supabase Edge Functions.

## 2. Loyiha Strukturasi (Papka va Fayllar)

Loyiha quyidagi modullarga ajratiladi. Har bir qism o'z vazifasini bajaradi va bir-biriga xalaqit bermaydi:

```text
/telegram-restaurant-app
│
├── /supabase                 # Baza konfiguratsiyasi
│   ├── migrations/           # Jadvallar (products, orders) kodlari
│   └── seed.sql              # Boshlang'ich test ma'lumotlar (menyu)
│
├── /frontend-twa             # 📱 Mijozlar qismi (Telegram Web App)
│   ├── /src/components       # UI elementlar (tugmalar, rasmlar)
│   ├── /src/pages            # Menyu, Savatcha, Buyurtma holati
│   └── /src/store            # Zustand (savatcha holati uchun)
│
├── /frontend-cashier         # 💻 Kassir va Admin kompyuteri uchun POS
│   ├── /src/pages/Orders     # Jonli buyurtmalarni qabul qilish oynasi
│   ├── /src/pages/MenuAdmin  # Menyuga yangi ovqat qo'shish / o'chirish oynasi
│   └── /src/utils/printer.js # Chek chiqarish (print) funksiyalari
│
└── /bot-server               # 🤖 Bot sozlamalari
    └── index.js              # BotFather'dan olingan token orqali TWA ni ochish
```

## 3. Tizim Xavfsizligi va Mustahkamligi (High Availability)

> [!IMPORTANT]
> **Tig'iz vaqt (Busy Hour) himoyasi:** Mijozlar ilovani yuklab olishi xavfsiz CDN (Vercel/Cloudflare) orqali amalga oshadi. Baza so'rovlari **Connection Pooling** va **React Query (Keshlash)** yordamida himoyalanadi. Minglab odam kirganda ham tizim qotmaydi.

> [!CAUTION]
> **Xakerlardan himoya:** Telegram Web App `initData` orqali shaxsni tasdiqlaydi. Supabase **Row Level Security (RLS)** orqali faqatgina o'z buyurtmalarini ko'rish kafolatlanadi. Backend menyuni o'chirish va narxlarni soxtalashtirish so'rovlarini avtomatik bloklaydi.

---

## 4. Bosqichma-bosqich Reja (Qayerdan boshlaymiz?)

Loyihani to'g'ri va xatosiz yig'ish uchun ishlarni quyidagi ketma-ketlikda amalga oshiramiz:

### 1-bosqich: Supabase Bazasini Sozlash (Eng birinchi qilinadigan ish)
1. Supabase'da yangi loyiha ochish.
2. Jadvallarni yaratish (`products` - menyu uchun, `orders` - buyurtmalar uchun).
3. Ovqatlar rasmini saqlash uchun "Storage" (Ombor) yaratish.
4. Xavfsizlik qoidalarini (RLS) yozish.

### 2-bosqich: Telegram Botni yaratish
1. BotFather orqali yangi bot ochish va Token olish.
2. Botga "Menu" tugmasini biriktirish.

### 3-bosqich: TWA (Mijozlar ilovasi) ni yozish
1. React va Tailwind loyihasini yaratish.
2. Baza (Supabase) bilan ulab, menyuni ekranga chiqarish.
3. Savatcha (Cart) tizimini yozish va buyurtma jo'natish funksiyasi.

### 4-bosqich: Kassir Paneli (Realtime POS)
1. Kassir uchun alohida React loyiha ochish.
2. Supabase Realtime ulanishini sozlash (Yangi buyurtma tushganda "Ding" qilib chiqishi uchun).
3. Buyurtmalarni tasdiqlash va chek chiqarish oynasini yozish.
4. Menyu sozlamalari (Ovqat tugadi qilish, rasmini almashtirish) qismini kiritish.

### 5-bosqich: Tizimni internetga joylash (Deploy)
1. Ikkala Frontend qismini tekin serverlarga (Vercel) yuklash.
2. Barchasini real sharoitda test qilib ko'rish.
