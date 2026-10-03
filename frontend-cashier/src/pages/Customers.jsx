import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { Users } from 'lucide-react'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    
    // Fetch customers and their total spent
    const { data: custData, error: custError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (custData) {
      // Fetch orders to calculate total spent per customer
      const { data: orders } = await supabase
        .from('orders')
        .select('telegram_id, total_price, status')
        .neq('status', 'cancelled')

      const orderStats = (orders || []).reduce((acc, order) => {
        if (!acc[order.telegram_id]) {
          acc[order.telegram_id] = { totalSpent: 0, orderCount: 0 }
        }
        acc[order.telegram_id].totalSpent += Number(order.total_price)
        acc[order.telegram_id].orderCount += 1
        return acc
      }, {})

      const merged = custData.map(c => ({
        ...c,
        totalSpent: orderStats[c.telegram_id]?.totalSpent || 0,
        orderCount: orderStats[c.telegram_id]?.orderCount || 0
      }))

      setCustomers(merged)
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-cinzel text-gold-500">Mijozlar Bazasi</h2>
        <div className="bg-obsidian-900 border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-gold-500" />
          <span className="text-white font-medium">Jami: {customers.length}</span>
        </div>
      </div>

      <div className="bg-obsidian-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-obsidian-950 border-b border-gray-800 text-gray-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Mijoz</th>
                <th className="px-6 py-4 font-medium">Telefon</th>
                <th className="px-6 py-4 font-medium text-center">Buyurtmalar soni</th>
                <th className="px-6 py-4 font-medium text-right">Jami sarfladi</th>
                <th className="px-6 py-4 font-medium text-right">Ro'yxatdan o'tgan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Yuklanmoqda...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Hali mijozlar yo'q</td>
                </tr>
              ) : (
                customers.map(customer => (
                  <tr key={customer.telegram_id} className="hover:bg-obsidian-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 font-bold">
                          {customer.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{customer.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{customer.phone}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-full text-xs font-bold">
                        {customer.orderCount} ta
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gold-400">
                      {customer.totalSpent.toLocaleString()} so'm
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-400">
                      {format(new Date(customer.created_at), 'dd.MM.yyyy')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
