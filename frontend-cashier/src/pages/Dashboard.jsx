import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, ShoppingBag, DollarSign } from 'lucide-react'
import { format, startOfDay, endOfDay } from 'date-fns'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const today = new Date()
    const start = startOfDay(today).toISOString()
    const end = endOfDay(today).toISOString()

    const { data: orders, error } = await supabase
      .from('orders')
      .select('status, total_price')
      .gte('created_at', start)
      .lte('created_at', end)

    if (!error && orders) {
      const totalOrders = orders.length
      const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total_price), 0)
      const pendingOrders = orders.filter(o => o.status === 'new').length

      setStats({
        totalOrders,
        totalRevenue,
        pendingOrders
      })
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-cinzel text-gold-500 mb-8">Boshqaruv Paneli</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-obsidian-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Bugungi tushum</h3>
            <div className="p-2 bg-gold-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-gold-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()} so'm</p>
        </div>

        <div className="bg-obsidian-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Bugungi buyurtmalar</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
        </div>

        <div className="bg-obsidian-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Kutilayotgan</h3>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">{stats.pendingOrders}</p>
        </div>
      </div>
    </div>
  )
}
