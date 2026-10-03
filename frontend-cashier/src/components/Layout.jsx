import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LayoutDashboard, ShoppingBag, Utensils, LogOut, Printer } from 'lucide-react'

export default function Layout() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Boshqaruv' },
    { to: '/orders', icon: ShoppingBag, label: 'Buyurtmalar' },
    { to: '/menu', icon: Utensils, label: 'Menyu' },
  ]

  return (
    <div className="flex h-screen bg-obsidian-950 overflow-hidden no-print">
      {/* Sidebar */}
      <aside className="w-64 bg-obsidian-900 border-r border-gray-800 flex flex-col">
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
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20'
                    : 'text-gray-400 hover:bg-obsidian-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
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
      <main className="flex-1 overflow-auto bg-obsidian-950 p-8">
        <Outlet />
      </main>
    </div>
  )
}
