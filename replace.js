const fs = require('fs');
const file = 'e:/KAFE/telegram-web/bot-server/index.js';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/function getStatusMessage\(status, orderId\) \{[\s\S]*?\n\}/, `function getStatusMessage(order) {
  switch (order.status) {
    case 'accepted': return \`✅ Buyurtmangiz (#\${order.id}) qabul qilindi.\`;
    case 'cooking': return \`👨‍🍳 Buyurtmangiz (#\${order.id}) tayyorlanmoqda.\`;
    case 'ready': return \`🥡 Buyurtmangiz (#\${order.id}) tayyor!\`;
    case 'delivered': return \`🚀 Buyurtmangiz (#\${order.id}) yetkazib berildi. Yoqimli ishtaha!\`;
    case 'cancelled': 
      if (order.cancel_reason) {
        return \`❌ Buyurtmangiz (#\${order.id}) bekor qilindi.\\nSabab: \${order.cancel_reason}\`;
      }
      return \`❌ Buyurtmangiz (#\${order.id}) bekor qilindi.\`;
    default: return null;
  }
}`);

code = code.replace(/getStatusMessage\(newOrder\.status, newOrder\.id\)/g, 'getStatusMessage(newOrder)');

fs.writeFileSync(file, code);
console.log('Done!');
