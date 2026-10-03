import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'

import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import MenuManagement from './pages/MenuManagement'
import Customers from './pages/Customers'
import Marketing from './pages/Marketing'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) return <div className="min-h-screen bg-obsidian-950 flex items-center justify-center text-gold-500">Yuklanmoqda...</div>
  
  if (!user) return <Navigate to="/login" />
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="customers" element={<Customers />} />
            <Route path="marketing" element={<Marketing />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#141b21',
            color: '#fff',
            border: '1px solid rgba(212, 175, 55, 0.2)',
          }
        }}
      />
    </AuthProvider>
  )
}

export default App
