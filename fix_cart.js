const fs = require('fs');
const file = 'e:/KAFE/telegram-web/frontend-twa/src/pages/CartPage.jsx';
let code = fs.readFileSync(file, 'utf8');

// The bug is around line 78. Let's find it.
// Replace the entire try catch block.
const tryCatchMatch = code.match(/try \{[\s\S]*?catch \(err\) \{[\s\S]*?\} finally \{/);
if (tryCatchMatch) {
  const replacement = `try {
      const orderId = await createOrder({
        p_telegram_id: tgUser?.id ?? 0,
        p_customer_name: form.name.trim(),
        p_phone: '+' + normalizePhone(form.phone),
        p_address: form.orderType === 'delivery' ? form.address.trim() : null,
        p_comment: form.comment.trim() || null,
        p_order_type: form.orderType,
        p_items: lines.map((l) => ({ 
          product_id: l.product.id, 
          quantity: l.qty, 
          variant: l.variantName || null,
          addons: l.addons && l.addons.length > 0 ? l.addons : null 
        })),
      })
      localStorage.setItem(SAVED_KEY, JSON.stringify({ name: form.name, phone: form.phone, orderType: form.orderType, address: form.address }))
      clear()
      hapticSuccess()
      onSuccess(orderId)
    } catch (err) {
      setError(err.message?.includes('qolgan') || err.message?.includes('tugagan') ? err.message : 'Buyurtma yuborilmadi. Qayta urinib ko\\'ring.')
    } finally {`;
  code = code.replace(tryCatchMatch[0], replacement);
  fs.writeFileSync(file, code);
  console.log('Fixed try-catch block!');
} else {
  console.log('Could not find try-catch block');
}
