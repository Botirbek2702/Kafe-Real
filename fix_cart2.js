const fs = require('fs');
const file = 'e:/KAFE/telegram-web/frontend-twa/src/pages/CartPage.jsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/setError\(err\.message\?\.includes\('tugagan'\) \? 'Savatchadagi ba\\'zi taomlar tugab qoldi\. Savatchani tekshiring\.' : 'Buyurtma yuborilmadi\. Qayta urinib ko\\'ring\.'\)/, "setError(err.message?.includes('qolgan') || err.message?.includes('tugagan') ? err.message : 'Buyurtma yuborilmadi. Qayta urinib ko\\'ring.')");

fs.writeFileSync(file, code);
console.log('Done gentle CartPage replace');
