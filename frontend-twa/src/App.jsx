import { useEffect, useState } from 'react'
import { tg, initTelegram } from './lib/telegram'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import SuccessPage from './pages/SuccessPage'
import OrdersPage from './pages/OrdersPage' // Qo'shildi

function App() {
  const [page, setPage] = useState({ name: 'menu' })

  useEffect(() => { initTelegram() }, [])

  useEffect(() => {
    const back = tg?.BackButton
    if (!back) return
    const goMenu = () => setPage({ name: 'menu' })
    if (page.name === 'cart' || page.name === 'orders') { back.show(); back.onClick(goMenu) } else back.hide()
    return () => back.offClick(goMenu)
  }, [page.name])

  useEffect(() => { window.scrollTo(0, 0) }, [page.name])

  if (page.name === 'cart')
    return <CartPage onBack={() => setPage({ name: 'menu' })} onSuccess={(id) => setPage({ name: 'success', orderId: id })} />
  if (page.name === 'success')
    return <SuccessPage orderId={page.orderId} onBack={() => setPage({ name: 'orders' })} />
  if (page.name === 'orders')
    return <OrdersPage onBack={() => setPage({ name: 'menu' })} />
  
  return <MenuPage onOpenCart={() => setPage({ name: 'cart' })} onOpenOrders={() => setPage({ name: 'orders' })} />
}

export default App
