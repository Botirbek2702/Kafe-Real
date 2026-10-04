import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LayoutDashboard, ShoppingBag, Utensils, LogOut, Users, Send } from 'lucide-react'

export default function Layout() {
  const navigate = useNavigate()
  const [newOrdersCount, setNewOrdersCount] = useState(0)

  useEffect(() => {
    fetchNewOrdersCount()

    const channel = supabase.channel('layout-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchNewOrdersCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchNewOrdersCount = async () => {
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')
      
    setNewOrdersCount(count || 0)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Boshqaruv' },
    { to: '/orders', icon: ShoppingBag, label: 'Buyurtmalar', count: newOrdersCount },
    { to: '/menu', icon: Utensils, label: 'Menyu' },
    { to: '/customers', icon: Users, label: 'Mijozlar' },
    { to: '/marketing', icon: Send, label: 'Marketing' },
  ]

  return (
    <div className="flex h-screen bg-obsidian-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-obsidian-900 border-r border-gray-800 flex flex-col no-print">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl text-gold-500 flex items-center gap-2">
            <Utensils className="w-6 h-6" />
            <span>KAFE</span>
          </h1>
          <p className="text-gray-400 text-xs mt-1">Kassir Paneli</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20'
                    : 'text-gray-400 hover:bg-obsidian-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.count > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-obsidian-950 flex flex-col relative print:bg-white">
        <Outlet />
      </main>
    </div>
  )
}
