import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCart } from '../store/cart'
import { formatNumber } from '../lib/format'
import { tgUser } from '../lib/telegram'
import { format } from 'date-fns'

const getStatusLabel = (status) => {
  switch (status) {
    case 'new': return { label: 'Yangi', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' }
    case 'accepted': return { label: 'Qabul qilindi', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' }
    case 'cooking': return { label: 'Tayyorlanmoqda', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' }
    case 'ready': return { label: 'Tayyor', color: 'text-green-400 bg-green-400/10 border-green-400/20' }
    case 'delivered': return { label: 'Yetkazildi', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' }
    case 'cancelled': return { label: 'Bekor qilindi', color: 'text-red-400 bg-red-400/10 border-red-400/20' }
    default: return { label: status, color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' }
  }
}

export default function OrdersPage({ onBack }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { add, clear } = useCart()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    const { data } = await supabase.rpc('get_my_orders', { p_telegram_id: tgUser?.id || 0 })
    if (data) setOrders(data)
    setLoading(false)
  }

  const handleCancel = async (orderId) => {
    if (!confirm("Buyurtmani haqiqatan ham bekor qilmoqchimisiz?")) return
    const { error } = await supabase.rpc('cancel_my_order', { p_order_id: orderId, p_telegram_id: tgUser?.id || 0 })
    if (error) alert(error.message)
    else fetchOrders()
  }

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gold-600/10 bg-obsidian-950/90 px-4 py-3 backdrop-blur-lg">
        <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-600/30 text-gold-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <h1 className="font-serif text-xl font-semibold text-white">Buyurtmalarim</h1>
      </header>

      <div className="p-4 space-y-4">
        {loading ? (
          <p className="text-center text-stone-500 py-8">Yuklanmoqda...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <svg className="mx-auto h-12 w-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p>Hali buyurtmalar yo'q</p>
          </div>
        ) : (
          orders.map((order) => {
            const status = getStatusLabel(order.status)
            return (
              <div key={order.id} className="rounded-xl border border-gold-600/20 bg-obsidian-850 p-4">
                <div className="flex items-center justify-between mb-3 border-b border-gold-600/10 pb-3">
                  <div>
                    <span className="font-bold text-lg text-white">#{order.id}</span>
                    <p className="text-xs text-stone-400 mt-0.5">{format(new Date(order.created_at), "dd.MM.yyyy HH:mm")}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border uppercase ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                
                <ul className="space-y-1.5 mb-3">
                  {order.order_items.map((item, i) => (
                    <li key={i} className="text-sm flex justify-between text-stone-300">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{formatNumber(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-3 border-t border-gold-600/10">
                  <span className="font-cinzel text-gold-400 font-bold">{formatNumber(order.total_price)} UZS</span>
                  
                  {order.status === 'new' && (
                    <div className="flex gap-2">
                      <button onClick={() => {
                        if(confirm("Buyurtmani tahrirlash uchun eski buyurtma bekor qilinib, barcha taomlar savatchaga qaytariladi. Rozimisiz?")) {
                          supabase.rpc('cancel_my_order', { p_order_id: order.id, p_telegram_id: tgUser?.id || 0 }).then(({ error }) => {
                            if (error) return alert(error.message)
                            clear(); // clear current cart
                            // Add all items back
                            order.order_items.forEach(item => {
                              for(let i = 0; i < item.quantity; i++) add(item.product_id)
                            });
                            alert("Taomlar savatchaga qo'shildi!");
                            onBack(); // Go back to menu so they can see cart
                          })
                        }
                      }} className="text-xs text-blue-400 border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 rounded-full font-medium">
                        Tahrirlash
                      </button>
                      <button onClick={() => handleCancel(order.id)} className="text-xs text-red-400 border border-red-400/30 bg-red-400/10 px-3 py-1.5 rounded-full font-medium">
                        Bekor qilish
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
