import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    totalCustomers: 0,
    weeklyChart: [],
    topProducts: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)

    const todayStart = startOfDay(new Date()).toISOString()
    const todayEnd = endOfDay(new Date()).toISOString()
    const weekStart = subDays(new Date(), 7).toISOString()

    // Bugungi buyurtmalar (faqat bekor qilinmagan)
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('total_price')
      .neq('status', 'cancelled')
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd)

    const todayRev = todayOrders?.reduce((acc, o) => acc + (o.total_price || 0), 0) || 0
    const todayCount = todayOrders?.length || 0

    // Jami mijozlar
    const { count: totalCust } = await supabase
      .from('customers')
      .select('telegram_id', { count: 'exact', head: true })

    // Oxirgi 7 kunlik daromad grafigi
    const { data: weekOrders } = await supabase
      .from('orders')
      .select('total_price, created_at')
      .neq('status', 'cancelled')
      .gte('created_at', weekStart)
      
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i)
      const dayStr = format(d, 'dd.MM')
      const ds = startOfDay(d)
      const de = endOfDay(d)
      
      const dayTotal = weekOrders
        ?.filter(o => {
          const od = new Date(o.created_at)
          return od >= ds && od <= de
        })
        .reduce((sum, o) => sum + (o.total_price || 0), 0) || 0
        
      chartData.push({ name: dayStr, Summa: dayTotal })
    }

    // Top 5 eng ko'p sotilgan taomlar
    const { data: allItems } = await supabase
      .from('order_items')
      .select('name, price, quantity')
      
    const productStats = {}
    allItems?.forEach(item => {
      if (!productStats[item.name]) {
        productStats[item.name] = { name: item.name, 'Sotilgan soni': 0, 'Umumiy summa': 0 }
      }
      productStats[item.name]['Sotilgan soni'] += item.quantity
      productStats[item.name]['Umumiy summa'] += (item.quantity * item.price)
    })
    
    const topProd = Object.values(productStats)
      .sort((a, b) => b['Sotilgan soni'] - a['Sotilgan soni'])
      .slice(0, 5)

    setStats({
      todayRevenue: todayRev,
      todayOrders: todayCount,
      totalCustomers: totalCust || 0,
      weeklyChart: chartData,
      topProducts: topProd
    })
    
    setLoading(false)
  }

  if (loading) return <div className="text-gray-500">Yuklanmoqda...</div>

  return (
    <div className="pb-12">
      <h2 className="text-3xl font-cinzel text-gold-500 mb-8">Statistika va Analitika</h2>

      {/* TOP KARTALAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-obsidian-900 border border-gray-800 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-1">Bugungi Savdo</p>
            <h3 className="text-2xl font-bold text-white">{stats.todayRevenue.toLocaleString()} <span className="text-sm font-normal text-gray-500">UZS</span></h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <DollarSign className="text-green-500 w-6 h-6" />
          </div>
        </div>

        <div className="bg-obsidian-900 border border-gray-800 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-1">Bugungi Buyurtmalar</p>
            <h3 className="text-2xl font-bold text-white">{stats.todayOrders} <span className="text-sm font-normal text-gray-500">ta</span></h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <ShoppingBag className="text-blue-500 w-6 h-6" />
          </div>
        </div>

        <div className="bg-obsidian-900 border border-gray-800 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-1">Jami Mijozlar Bazasida</p>
            <h3 className="text-2xl font-bold text-white">{stats.totalCustomers} <span className="text-sm font-normal text-gray-500">kishi</span></h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
            <Users className="text-gold-500 w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* HAFTALIK GRAFIK */}
        <div className="bg-obsidian-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-gold-500 w-5 h-5" />
            <h3 className="text-lg font-medium text-white">Oxirgi 7 kunlik daromad</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weeklyChart} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => (v / 1000) + 'k'} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141b21', border: '1px solid #1f2937', borderRadius: '8px' }}
                  itemStyle={{ color: '#d4af37' }}
                />
                <Line type="monotone" dataKey="Summa" stroke="#d4af37" strokeWidth={3} dot={{ r: 4, fill: '#d4af37', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP TAOMLAR */}
        <div className="bg-obsidian-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-6">Top-5 Eng ko'p sotilgan taomlar</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topProducts} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  cursor={{ fill: '#1f2937' }}
                  contentStyle={{ backgroundColor: '#141b21', border: '1px solid #1f2937', borderRadius: '8px' }}
                />
                <Bar dataKey="Sotilgan soni" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
