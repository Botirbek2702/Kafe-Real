import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Edit2, Plus } from 'lucide-react'
import ProductModal from '../components/ProductModal'

export default function MenuManagement() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

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

  const openAddModal = () => {
    setEditingProduct(null)
    setModalOpen(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  const handleSaved = () => {
    setModalOpen(false)
    fetchMenu()
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-cinzel text-gold-500">Menyu Boshqaruvi</h2>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-gold-500 text-obsidian-950 px-4 py-2 rounded-lg font-bold hover:bg-gold-400 transition-colors">
          <Plus className="w-5 h-5" />
          Yangi Taom
        </button>
      </div>
      
      {loading ? (
        <p className="text-gray-500">Yuklanmoqda...</p>
      ) : (
        <div className="space-y-8">
          {categories.map(category => {
            const categoryProducts = products.filter(p => p.category_id === category.id)
            if (categoryProducts.length === 0) return null

            return (
              <div key={category.id} className="bg-obsidian-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-obsidian-950 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="text-xl font-medium text-white">{category.name}</h3>
                  <span className="text-xs text-gray-500">{categoryProducts.length} taom</span>
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
                          <div className="flex gap-2 items-center mt-1">
                            <p className="text-sm font-bold text-gold-400">{Number(product.price).toLocaleString()} so'm</p>
                            {product.variants && product.variants.length > 0 && (
                              <span className="text-[10px] bg-gold-500/10 text-gold-500 px-1.5 py-0.5 rounded border border-gold-500/20">
                                +{product.variants.length} porsiya
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button onClick={() => openEditModal(product)} className="p-2 text-gray-400 hover:text-gold-500 bg-obsidian-950 rounded-lg border border-gray-800 hover:border-gold-500/30 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>

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

      {modalOpen && (
        <ProductModal 
          product={editingProduct} 
          categories={categories} 
          onClose={() => setModalOpen(false)} 
          onSaved={handleSaved} 
        />
      )}
    </div>
  )
}
