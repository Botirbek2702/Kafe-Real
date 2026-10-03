const fs = require('fs');
const file = 'e:/KAFE/telegram-web/frontend-twa/src/api/menu.js';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/variants, addons, ready_time, promo_text/, 'variants, addons, ready_time, promo_text, stock');
fs.writeFileSync(file, code);
console.log('Done Menu API!');
