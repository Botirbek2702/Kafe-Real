const fs = require('fs');
const file = 'e:/KAFE/telegram-web/frontend-cashier/src/components/ProductModal.jsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/ready_time: '',\s+promo_text: ''/, "ready_time: '',\n    promo_text: '',\n    stock: ''");
code = code.replace(/ready_time: product\.ready_time \|\| '',\s+promo_text: product\.promo_text \|\| ''/, "ready_time: product.ready_time || '',\n        promo_text: product.promo_text || '',\n        stock: product.stock !== null && product.stock !== undefined ? String(product.stock) : ''");
code = code.replace(/promo_text: form\.promo_text\.trim\(\) \|\| null/, "promo_text: form.promo_text.trim() || null,\n      stock: form.stock !== '' ? Number(form.stock) : null");

code = code.replace(/<div className="mt-4 flex items-center gap-3 border-t border-gray-800 pt-4">/, `<div className="flex gap-4 mt-4 border-t border-gray-800 pt-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">Ombordagi soni (Bo'sh = cheksiz)</label>
                <input type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full bg-obsidian-950 border border-gray-700 rounded px-3 py-2 text-white focus:border-gold-500 outline-none" placeholder="Masalan: 10" />
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-3 border-t border-gray-800 pt-4">`);

fs.writeFileSync(file, code);
console.log('Done ProductModal!');
