// Menyu ma'lumotlari (abdulaziz-kafe.vercel.app saytidagi nom va tavsiflar asosida).
// Narxlarni shu yerda o'zgartirib, `node upload-menu.mjs` ni qayta ishga tushirsangiz yangilanadi.
// ⚠️ Narxlar DEMO — haqiqiy narxlar bilan almashtiriladi.

export const CATEGORIES = ['Shashlik va Grill', 'Xorazm Milliy', 'Tovuq va Baliq']

export const MENU = [
  // Shashlik va Grill
  { file: 'Dumba shashlik.png',    name: 'Dumba shashlik',     category: 'Shashlik va Grill', price: 18000,  desc: "Maxsus marinadlangan dumba shashlik, ko'mir olovida pishirilgan." },
  { file: 'Gijduvon shashlik.png', name: "G'ijduvon shashlik", category: 'Shashlik va Grill', price: 20000,  desc: "Haqiqiy G'ijduvon uslubida tayyorlangan sersuv qiyma shashlik." },
  { file: 'Ijjan shashlik.png',    name: 'Ijjan shashlik',     category: 'Shashlik va Grill', price: 17000,  desc: 'Xorazmning mashhur ijjan shashligi.' },
  { file: 'Jigar shashlik.png',    name: 'Jigar shashlik',     category: 'Shashlik va Grill', price: 15000,  desc: 'Yumshoq pishgan jigar shashlik dumba bilan.' },
  { file: 'Kareyka.png',           name: 'Kareyka',            category: 'Shashlik va Grill', price: 65000,  desc: "Yumshoq qo'y go'shtidan tayyorlangan kareyka kabobi." },
  { file: 'Mangal assorti.png',    name: 'Mangal assorti',     category: 'Shashlik va Grill', price: 120000, desc: 'Turli xil shashliklar jamlanmasi, katta davralar uchun.' },
  { file: 'Qazon kabob.png',       name: 'Qozon kabob',        category: 'Shashlik va Grill', price: 55000,  desc: "Qozonda qovurilgan lahm go'sht va kartoshka." },

  // Xorazm Milliy
  { file: 'Kadi barak.png',        name: 'Kadi barak',         category: 'Xorazm Milliy',     price: 28000,  desc: 'Qovoqli maxsus xorazmcha barak.' },
  { file: 'Tuxum barak.png',       name: 'Tuxum barak',        category: 'Xorazm Milliy',     price: 25000,  desc: "Xorazmning o'ziga xos tuxum baragi." },
  { file: 'Unashi.png',            name: 'Un oshi',            category: 'Xorazm Milliy',     price: 35000,  desc: "Xorazmcha an'anaviy un oshi." },
  { file: 'Qarin tuyoq.png',       name: 'Qorin tuyoq',        category: 'Xorazm Milliy',     price: 40000,  desc: 'Qorin va tuyoqdan tayyorlangan maxsus taom.' },
  { file: 'Qoy qusqavoy.png',      name: "Qo'y qusqavoy",      category: 'Xorazm Milliy',     price: 50000,  desc: "Qo'y go'shtidan lazzatli an'anaviy taom." },
  { file: 'Tushonka.png',          name: 'Tushonka',           category: 'Xorazm Milliy',     price: 45000,  desc: "Uzoq vaqt dimlab pishirilgan yumshoq go'sht." },

  // Tovuq va Baliq
  { file: "Saryog'a tovuq.png",    name: "Sariyog'da tovuq",   category: 'Tovuq va Baliq',    price: 70000,  desc: "Sariyog'da qizartirib pishirilgan tovuq go'shti." },
  { file: 'Tandira tovuq.png',     name: 'Tandirda tovuq',     category: 'Tovuq va Baliq',    price: 75000,  desc: "Tandirda o'z bug'ida pishgan tovuq." },
  { file: 'Setka baliq.png',       name: 'Setka baliq',        category: 'Tovuq va Baliq',    price: 60000,  desc: "Maxsus to'rda ko'mir olovida pishirilgan baliq." },
]
