const fs = require('fs');
const file = 'e:/KAFE/telegram-web/frontend-cashier/src/pages/MenuManagement.jsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/\{product\.promo_text && \([\s\S]*?\n\s+\)\}/, `{product.promo_text && (
                                <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                                  🎁 {product.promo_text}
                                </span>
                              )}
                              {product.stock !== null && product.stock !== undefined && (
                                <span className="text-[10px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20">
                                  📦 Qoldiq: {product.stock} ta
                                </span>
                              )}`);

fs.writeFileSync(file, code);
console.log('Done MenuManagement!');
