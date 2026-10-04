import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LayoutDashboard, ShoppingBag, Utensils, LogOut, Users, Send, Menu as MenuIcon, X } from 'lucide-react'

export default function Layout() {
  const navigate = useNavigate()
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <div className="flex h-screen bg-obsidian-950 overflow-hidden flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-obsidian-900 border-b border-gray-800 z-30 no-print">
        <div className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-gold-500" />
          <span className="font-serif text-lg font-bold text-gold-500">KAFE</span>
          <span className="text-[11px] text-gray-400 bg-obsidian-950 px-2 py-0.5 rounded border border-gray-800">Kassa</span>
        </div>
        <div className="flex items-center gap-2">
          {newOrdersCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              {newOrdersCount} yangi
            </span>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-300 hover:text-white rounded-lg bg-obsidian-800 border border-gray-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden no-print"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop permanent, Mobile drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-obsidian-900 border-r border-gray-800 flex flex-col no-print transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl text-gold-500 flex items-center gap-2 font-serif font-bold">
              <Utensils className="w-6 h-6" />
              <span>KAFE</span>
            </h1>
            <p className="text-gray-400 text-xs mt-1">Kassir Paneli</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20 font-semibold'
                    : 'text-gray-400 hover:bg-obsidian-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.count > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3.5 py-2.5 w-full text-left text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-obsidian-950 flex flex-col relative print:bg-white overflow-hidden pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (Quick switch for cashier on phone) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-obsidian-900 border-t border-gray-800 flex justify-around py-1.5 z-30 no-print">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-[10px] relative transition-colors ${
                isActive ? 'text-gold-500 font-semibold' : 'text-gray-400'
              }`
            }
          >
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.count > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full">
                  {item.count}
                </span>
              )}
            </div>
            <span className="mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
