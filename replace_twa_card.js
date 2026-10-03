const fs = require('fs');
const file = 'e:/KAFE/telegram-web/frontend-twa/src/components/ProductCard.jsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/const soldOut = !product\.is_available/, 'const soldOut = !product.is_available || product.stock === 0');

code = code.replace(/\{product\.ready_time && \([\s\S]*?\n\s+\)\}/, `{product.ready_time && (
            <span className="bg-purple-600/90 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-md">
              🕒 {product.ready_time}
            </span>
          )}
          {product.stock !== null && product.stock > 0 && product.stock <= 5 && (
            <span className="bg-orange-600/90 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-md">
              ⚠️ Faqat {product.stock} ta qoldi
            </span>
          )}`);

fs.writeFileSync(file, code);
console.log('Done ProductCard!');
