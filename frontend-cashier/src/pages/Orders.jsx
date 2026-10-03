import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { playBeep } from '../lib/audio'
import { Printer, CheckCircle, XCircle } from 'lucide-react'

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
        setOrders(current => current.map(o => o.id === payload.new.id ? { ...o, status: payload.new.status } : o))
        setSelectedOrder(current => current?.id === payload.new.id ? { ...current, status: payload.new.status } : current)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

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
    const { error } = await supabase
      .from('orders')
      .update({ status })
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
    <div className="flex h-full gap-6">
      {/* Orders List */}
      <div className="w-1/3 flex flex-col bg-obsidian-900 border border-gray-800 rounded-xl overflow-hidden no-print">
        <div className="p-4 border-b border-gray-800 bg-obsidian-950">
          <h2 className="text-xl font-cinzel text-gold-500">Buyurtmalar</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && orders.length === 0 ? (
            <p className="text-center text-gray-500">Yuklanmoqda...</p>
          ) : orders.map(order => (
            <div 
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                selectedOrder?.id === order.id 
                  ? 'bg-gold-500/10 border-gold-500/50' 
                  : 'bg-obsidian-950 border-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-lg">#{order.id}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                  {translateStatus(order.status)}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {format(new Date(order.created_at), 'HH:mm')} • {order.order_type === 'delivery' ? 'Yetkazib berish' : 'Olib ketish'}
              </div>
              <div className="mt-2 font-medium text-gold-400">
                {Number(order.total_price).toLocaleString()} so'm
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details & Receipt Print Area */}
      <div className="flex-1 bg-obsidian-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
        {selectedOrder ? (
          <>
            <div className="p-6 border-b border-gray-800 flex justify-between items-center no-print">
              <h2 className="text-2xl font-cinzel text-gold-500">Buyurtma #{selectedOrder.id}</h2>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="p-2 bg-obsidian-800 hover:bg-obsidian-700 rounded-lg text-white transition-colors">
                  <Printer className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-6 no-print">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-obsidian-950 p-4 rounded-lg border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">Mijoz ma'lumotlari</p>
                  <p className="font-medium text-lg">{selectedOrder.customer_name || 'Noma\'lum'}</p>
                  <p className="text-gray-300">{selectedOrder.phone || selectedOrder.customer_phone}</p>
                </div>
                <div className="bg-obsidian-950 p-4 rounded-lg border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">Buyurtma turi</p>
                  <p className="font-medium text-lg">{selectedOrder.order_type === 'delivery' ? 'Yetkazib berish' : 'Olib ketish'}</p>
                  {selectedOrder.address && (
                    <p className="text-gray-300 text-sm mt-1">{selectedOrder.address}</p>
                  )}
                </div>
              </div>

              <div className="bg-obsidian-950 rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-obsidian-800 text-gray-400 text-sm">
                    <tr>
                      <th className="p-4 font-medium">Mahsulot</th>
                      <th className="p-4 font-medium text-center">Soni</th>
                      <th className="p-4 font-medium text-right">Narx</th>
                      <th className="p-4 font-medium text-right">Jami</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {selectedOrder.order_items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-4">{item.name || item.products?.name}</td>
                        <td className="p-4 text-center">{item.quantity}</td>
                        <td className="p-4 text-right">{Number(item.price || item.unit_price).toLocaleString()}</td>
                        <td className="p-4 text-right font-medium">{Number(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {selectedOrder.comment && (
                <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                  <p className="text-yellow-500 text-sm font-medium mb-1">Izoh:</p>
                  <p className="text-yellow-100">{selectedOrder.comment}</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-gray-800 bg-obsidian-950 flex justify-between items-center no-print">
              <div className="flex gap-3">
                {selectedOrder.status === 'new' && (
                  <button onClick={() => updateOrderStatus(selectedOrder.id, 'accepted')} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Qabul qilish
                  </button>
                )}
                {selectedOrder.status === 'accepted' && (
                  <button onClick={() => updateOrderStatus(selectedOrder.id, 'cooking')} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Pishirish
                  </button>
                )}
                {selectedOrder.status === 'cooking' && (
                  <button onClick={() => updateOrderStatus(selectedOrder.id, 'ready')} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Tayyor
                  </button>
                )}
                {selectedOrder.status === 'ready' && selectedOrder.order_type === 'delivery' && (
                  <button onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')} className="px-6 py-2 bg-green-700 hover:bg-green-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Yetkazildi
                  </button>
                )}
                {['new', 'accepted'].includes(selectedOrder.status) && (
                  <button onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')} className="px-6 py-2 bg-obsidian-800 hover:bg-red-500/20 text-red-500 font-medium rounded-lg transition-colors flex items-center gap-2">
                    <XCircle className="w-5 h-5" /> Bekor qilish
                  </button>
                )}
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Umumiy summa</p>
                <p className="text-3xl font-bold text-gold-500">{Number(selectedOrder.total_price).toLocaleString()} so'm</p>
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
