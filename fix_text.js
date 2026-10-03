const fs = require('fs');
const file = 'e:/KAFE/telegram-web/frontend-twa/src/components/ProductCard.jsx';
let code = fs.readFileSync(file, 'utf8');

// Change "TUGADI" overlay
code = code.replace(/\{soldOut && \([\s\S]*?TUGADI[\s\S]*?\)\}/, `{soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <span className="rounded-full border border-gold-500/40 bg-obsidian-950/80 px-3 py-1 font-cinzel text-[11px] tracking-[0.15em] text-gold-400">
              {product.ready_time ? 'KUTILMOQDA' : 'TUGADI'}
            </span>
          </div>
        )}`);

// Change "Tugadi" variant button
code = code.replace(/<button disabled className="h-7 w-full rounded-full border border-stone-700 text-\[10px\] text-stone-500">Tugadi<\/button>/, `<button disabled className="h-7 w-full rounded-full border border-stone-700 text-[10px] text-stone-500">{product.ready_time ? 'Kutilmoqda' : 'Tugadi'}</button>`);

// Change "Mavjud emas" main button
code = code.replace(/<button disabled className="h-10 w-full rounded-full border border-stone-700 text-xs text-stone-500">\s*Mavjud emas\s*<\/button>/, `<button disabled className="h-10 w-full rounded-full border border-stone-700 text-xs text-stone-500">
                  {product.ready_time ? 'Hali tayyor emas' : 'Mavjud emas'}
                </button>`);

fs.writeFileSync(file, code);
console.log('Done fixing text');
