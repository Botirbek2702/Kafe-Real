import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { playBeep } from '../lib/sound'
import { Printer, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
    
    // Subscribe to new orders
    const channel = supabase.channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
        const newOrder = payload.new
        toast.success(`Yangi buyurtma: #${newOrder.id}`)
        playBeep()
        fetchOrders() // Re-fetch to get items joined data
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (selectedOrder) {
      const fresh = orders.find(o => o.id === selectedOrder.id)
      if (fresh) setSelectedOrder(fresh)
    }
  }, [orders])

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products ( name, price )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      toast.error("Buyurtmalarni yuklashda xatolik")
    } else {
      setOrders(data)
    }
    setLoading(false)
  }

  const updateOrderStatus = async (id, status) => {
    let cancel_reason = null;
    if (status === 'cancelled') {
      const reason = window.prompt("Bekor qilish sababini yozing (mijozga boradi):", "Taom qolmagan");
      if (reason === null) return; // cancelled prompt
      cancel_reason = reason;
    }

    const payload = { status };
    if (cancel_reason) payload.cancel_reason = cancel_reason;

    const { error } = await supabase
      .from('orders')
      .update(payload)
      .eq('id', id)
      
    if (error) {
      toast.error("Holatni o'zgartirishda xatolik")
    } else {
      toast.success("Holat o'zgartirildi")
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'text-yellow-500 bg-yellow-500/10'
      case 'accepted': return 'text-blue-400 bg-blue-400/10'
      case 'cooking': return 'text-purple-500 bg-purple-500/10'
      case 'ready': return 'text-green-400 bg-green-400/10'
      case 'delivered': return 'text-green-600 bg-green-600/10'
      case 'cancelled': return 'text-red-500 bg-red-500/10'
      default: return 'text-gray-400 bg-gray-800'
    }
  }

  const translateStatus = (status) => {
    switch(status) {
      case 'new': return 'Yangi'
      case 'accepted': return 'Qabul qilingan'
      case 'cooking': return 'Tayyorlanmoqda'
      case 'ready': return 'Tayyor'
      case 'delivered': return 'Yetkazilgan'
      case 'cancelled': return 'Bekor qilingan'
      default: return status
    }
  }

  return (
    <div className="flex-1 flex gap-4 md:gap-6 p-3 md:p-8 overflow-hidden h-full relative">
      {/* Orders List */}
      <div className={`w-full md:w-1/3 flex flex-col bg-obsidian-900 border border-gray-800 rounded-xl overflow-hidden no-print ${
        selectedOrder ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-3.5 md:p-4 border-b border-gray-800 bg-obsidian-950 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-cinzel text-gold-500 font-semibold">Buyurtmalar</h2>
          <span className="text-xs text-gray-400 font-medium bg-obsidian-900 border border-gray-800 px-2 py-0.5 rounded-full">
            {orders.length} ta
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2.5 md:p-4 space-y-2.5 md:space-y-3">
          {loading && orders.length === 0 ? (
            <p className="text-center text-gray-500 py-6 text-sm">Yuklanmoqda...</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-gray-500 py-6 text-sm">Hozircha buyurtma yo'q</p>
          ) : orders.map(order => (
            <div 
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`p-3 md:p-4 rounded-xl cursor-pointer transition-all border ${
                selectedOrder?.id === order.id 
                  ? 'bg-gold-500/10 border-gold-500/50 shadow-md shadow-gold-500/5' 
                  : 'bg-obsidian-950 border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <span className="font-bold text-base md:text-lg text-white">#{order.id}</span>
                <span className={`text-[11px] md:text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.status)}`}>
                  {translateStatus(order.status)}
                </span>
              </div>
              <div className="text-xs md:text-sm text-gray-400">
                {format(new Date(order.created_at), 'HH:mm')} • {order.order_type === 'delivery' ? 'Yetkazib berish' : 'Olib ketish'}
              </div>
              <div className="mt-2 font-medium text-gold-400 text-sm md:text-base flex items-center justify-between">
                <span>{Number(order.total_price).toLocaleString()} so'm</span>
                <span className="text-xs text-gray-500">{order.customer_name || 'Mijoz'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details & Receipt Print Area */}
      <div className={`flex-1 bg-obsidian-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col ${
        !selectedOrder ? 'hidden md:flex' : 'flex'
      }`}>
        {selectedOrder ? (
          <>
            <div className="p-4 md:p-6 border-b border-gray-800 flex justify-between items-center no-print bg-obsidian-950">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="md:hidden p-2 bg-obsidian-900 hover:bg-obsidian-800 text-gray-300 rounded-lg border border-gray-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl md:text-2xl font-cinzel text-gold-500 font-bold">Buyurtma #{selectedOrder.id}</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="p-2 bg-obsidian-800 hover:bg-obsidian-700 rounded-lg text-white transition-colors border border-gray-700" title="Chop etish">
                  <Printer className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 no-print space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
                <div className="bg-obsidian-950 p-3.5 md:p-4 rounded-xl border border-gray-800">
                  <p className="text-gray-400 text-xs md:text-sm mb-1">Mijoz ma'lumotlari</p>
                  <p className="font-semibold text-base md:text-lg text-white">{selectedOrder.customer_name || 'Noma\'lum'}</p>
                  <p className="text-gray-300 text-sm mt-0.5">{selectedOrder.phone || selectedOrder.customer_phone}</p>
                </div>
                <div className="bg-obsidian-950 p-3.5 md:p-4 rounded-xl border border-gray-800">
                  <p className="text-gray-400 text-xs md:text-sm mb-1">Buyurtma turi</p>
                  <p className="font-semibold text-base md:text-lg text-white">{selectedOrder.order_type === 'delivery' ? 'Yetkazib berish' : 'Olib ketish'}</p>
                  {selectedOrder.address && (
                    <p className="text-gray-300 text-xs md:text-sm mt-1 break-words">{selectedOrder.address}</p>
                  )}
                </div>
              </div>

              <div className="bg-obsidian-950 rounded-xl border border-gray-800 overflow-x-auto">
                <table className="w-full text-left min-w-[320px]">
                  <thead className="bg-obsidian-800 text-gray-400 text-xs md:text-sm">
                    <tr>
                      <th className="p-3 md:p-4 font-medium">Mahsulot</th>
                      <th className="p-3 md:p-4 font-medium text-center">Soni</th>
                      <th className="p-3 md:p-4 font-medium text-right">Narx</th>
                      <th className="p-3 md:p-4 font-medium text-right">Jami</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-xs md:text-sm">
                    {selectedOrder.order_items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 md:p-4 text-stone-200">{item.name || item.products?.name}</td>
                        <td className="p-3 md:p-4 text-center font-medium">{item.quantity}</td>
                        <td className="p-3 md:p-4 text-right text-stone-400">{Number(item.price || item.unit_price).toLocaleString()}</td>
                        <td className="p-3 md:p-4 text-right font-semibold text-white">{Number(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {selectedOrder.comment && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3.5 md:p-4 rounded-xl">
                  <p className="text-yellow-500 text-xs md:text-sm font-medium mb-1">Izoh:</p>
                  <p className="text-yellow-100 text-xs md:text-sm">{selectedOrder.comment}</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-3.5 md:p-6 border-t border-gray-800 bg-obsidian-950 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 no-print">
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status === 'new' && (
                  <button onClick={() => updateOrderStatus(selectedOrder.id, 'accepted')} className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 text-xs md:text-sm">
                    <CheckCircle className="w-4 h-4" /> Qabul qilish
                  </button>
                )}
                {selectedOrder.status === 'accepted' && (
                  <button onClick={() => updateOrderStatus(selectedOrder.id, 'cooking')} className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 text-xs md:text-sm">
                    <CheckCircle className="w-4 h-4" /> Pishirish
                  </button>
                )}
                {selectedOrder.status === 'cooking' && (
                  <button onClick={() => updateOrderStatus(selectedOrder.id, 'ready')} className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 text-xs md:text-sm">
                    <CheckCircle className="w-4 h-4" /> Tayyor
                  </button>
                )}
                {selectedOrder.status === 'ready' && selectedOrder.order_type === 'delivery' && (
                  <button onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')} className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-green-700 hover:bg-green-600 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 text-xs md:text-sm">
                    <CheckCircle className="w-4 h-4" /> Yetkazildi
                  </button>
                )}
                {['new', 'accepted'].includes(selectedOrder.status) && (
                  <button onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')} className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-obsidian-800 hover:bg-red-500/20 text-red-500 font-medium rounded-lg transition-colors flex items-center gap-1.5 text-xs md:text-sm border border-red-500/20">
                    <XCircle className="w-4 h-4" /> Bekor qilish
                  </button>
                )}
              </div>
              <div className="text-left sm:text-right flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-0 border-gray-800 pt-2 sm:pt-0">
                <span className="text-gray-400 text-xs">Jami summa:</span>
                <span className="text-lg md:text-2xl font-bold text-gold-500">{Number(selectedOrder.total_price).toLocaleString()} so'm</span>
              </div>
            </div>

            {/* Print Only Receipt */}
            <div id="print-receipt" className="hidden print:block p-4 text-black bg-white">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold font-serif mb-1">KAFE</h1>
                <p className="text-sm border-b pb-2 border-black">Buyurtma #{selectedOrder.id}</p>
              </div>
              <p className="text-sm mb-1">Sana: {format(new Date(selectedOrder.created_at), 'dd.MM.yyyy HH:mm')}</p>
              <p className="text-sm mb-1">Mijoz: {selectedOrder.customer_name || 'Noma\'lum'}</p>
              <p className="text-sm mb-4">Tel: {selectedOrder.customer_phone}</p>
              
              <table className="w-full text-sm mb-4 border-t border-b border-black py-2 text-left">
                <thead>
                  <tr className="border-b border-black">
                    <th className="pb-1">Nomi</th>
                    <th className="pb-1 text-center">Soni</th>
                    <th className="text-right pb-1">Jami</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.order_items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{item.products?.name}</td>
                      <td className="py-1 text-center">{item.quantity} x {Number(item.price || item.unit_price).toLocaleString()}</td>
                      <td className="py-1 text-right">{Number((item.price || item.unit_price) * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right text-lg font-bold">
                Jami: {Number(selectedOrder.total_price).toLocaleString()} so'm
              </div>
              <div className="text-center mt-6 text-sm">
                Xaridingiz uchun rahmat!
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-4 no-print">
            <Printer className="w-16 h-16 opacity-20" />
            <p>Buyurtmani tanlang</p>
          </div>
        )}
      </div>
    </div>
  )
}
