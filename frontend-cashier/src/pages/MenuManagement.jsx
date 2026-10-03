import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Check, X, Edit2, Save } from 'lucide-react'

export default function MenuManagement() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editPrice, setEditPrice] = useState('')

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    setLoading(true)
    const [catsRes, prodsRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').order('created_at')
    ])

    if (!catsRes.error) setCategories(catsRes.data)
    if (!prodsRes.error) setProducts(prodsRes.data)
    setLoading(false)
  }

  const toggleAvailability = async (id, currentStatus) => {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !currentStatus })
      .eq('id', id)
      
    if (error) {
      toast.error("Holatni o'zgartirishda xatolik")
    } else {
      setProducts(current => current.map(p => p.id === id ? { ...p, is_available: !currentStatus } : p))
      toast.success("Holat o'zgardi")
    }
  }

  const startEdit = (product) => {
    setEditingId(product.id)
    setEditPrice(product.price)
  }

  const savePrice = async (id) => {
    const newPrice = Number(editPrice)
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error("Noto'g'ri narx")
      return
    }

    const { error } = await supabase
      .from('products')
      .update({ price: newPrice })
      .eq('id', id)
      
    if (error) {
      toast.error("Narxni saqlashda xatolik")
    } else {
      setProducts(current => current.map(p => p.id === id ? { ...p, price: newPrice } : p))
      setEditingId(null)
      toast.success("Narx yangilandi")
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <h2 className="text-3xl font-cinzel text-gold-500 mb-8">Menyu Boshqaruvi</h2>
      
      {loading ? (
        <p className="text-gray-500">Yuklanmoqda...</p>
      ) : (
        <div className="space-y-8">
          {categories.map(category => {
            const categoryProducts = products.filter(p => p.category_id === category.id)
            if (categoryProducts.length === 0) return null

            return (
              <div key={category.id} className="bg-obsidian-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-obsidian-950 border-b border-gray-800">
                  <h3 className="text-xl font-medium text-white">{category.name}</h3>
                </div>
                
                <div className="divide-y divide-gray-800">
                  {categoryProducts.map(product => (
                    <div key={product.id} className="p-4 flex items-center justify-between hover:bg-obsidian-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className={`w-16 h-16 object-cover rounded-lg border border-gray-700 transition-opacity ${!product.is_available && 'opacity-50 grayscale'}`} 
                        />
                        <div>
                          <p className={`font-medium text-lg ${!product.is_available && 'text-gray-500 line-through'}`}>
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-400 max-w-md truncate">{product.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {editingId === product.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-24 bg-obsidian-950 border border-gold-500 rounded px-2 py-1 text-white focus:outline-none"
                            />
                            <button onClick={() => savePrice(product.id)} className="p-1.5 bg-green-600 hover:bg-green-500 rounded text-white transition-colors">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gold-400 text-lg w-24 text-right">
                              {Number(product.price).toLocaleString()}
                            </span>
                            <button onClick={() => startEdit(product)} className="p-1.5 text-gray-400 hover:text-gold-500 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        <button 
                          onClick={() => toggleAvailability(product.id, product.is_available)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors w-28 text-center border ${
                            product.is_available 
                              ? 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20' 
                              : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20'
                          }`}
                        >
                          {product.is_available ? 'Mavjud' : 'Tugagan'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
