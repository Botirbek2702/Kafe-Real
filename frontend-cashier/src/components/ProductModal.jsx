import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { X, Plus, Trash2, Upload } from 'lucide-react'

export default function ProductModal({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category_id: categories[0]?.id || '',
    is_available: true,
    variants: [],
    addons: [],
    ready_time: '',
    promo_text: '',
    stock: ''
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        image_url: product.image_url || '',
        category_id: product.category_id || categories[0]?.id || '',
        is_available: product.is_available,
        variants: product.variants || [],
        addons: product.addons || [],
        ready_time: product.ready_time || '',
        promo_text: product.promo_text || '',
        stock: product.stock !== null && product.stock !== undefined ? String(product.stock) : ''
      })
    }
  }, [product, categories])

  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, { name: '', price: '' }] }))
  const updateVariant = (index, field, value) => {
    const newVars = [...form.variants]
    newVars[index][field] = value
    setForm(f => ({ ...f, variants: newVars }))
  }
  const removeVariant = (index) => setForm(f => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }))

  const addAddon = () => setForm(f => ({ ...f, addons: [...f.addons, { name: '', price: '' }] }))
  const updateAddon = (index, field, value) => {
    const newAddons = [...form.addons]
    newAddons[index][field] = value
    setForm(f => ({ ...f, addons: newAddons }))
  }
  const removeAddon = (index) => setForm(f => ({ ...f, addons: f.addons.filter((_, i) => i !== index) }))

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `images/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('menu')
      .upload(filePath, file)

    if (uploadError) {
      toast.error("Rasm yuklashda xatolik: " + uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('menu').getPublicUrl(filePath)
    setForm(f => ({ ...f, image_url: data.publicUrl }))
    setUploading(false)
    toast.success("Rasm yuklandi!")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const validVariants = form.variants.filter(v => v.name.trim() && v.price).map(v => ({ name: v.name.trim(), price: Number(v.price) }))
    const validAddons = form.addons.filter(a => a.name.trim() && a.price).map(a => ({ name: a.name.trim(), price: Number(a.price) }))

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      image_url: form.image_url.trim() || null,
      category_id: Number(form.category_id),
      is_available: form.is_available,
      variants: validVariants.length > 0 ? validVariants : null,
      addons: validAddons.length > 0 ? validAddons : null,
      ready_time: form.ready_time.trim() || null,
      promo_text: form.promo_text.trim() || null,
      stock: form.stock !== '' ? Number(form.stock) : null
    }

    let error
    if (product) {
      const res = await supabase.from('products').update(payload).eq('id', product.id)
      error = res.error
    } else {
      const res = await supabase.from('products').insert([payload])
      error = res.error
    }

    if (error) {
      toast.error("Xatolik: " + error.message)
      console.error(error)
    } else {
      toast.success("Muvaffaqiyatli saqlandi!")
      onSaved()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-obsidian-900 border border-gold-600/20 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h3 className="text-xl font-cinzel text-gold-500 font-bold">{product ? "Taomni tahrirlash" : "Yangi taom qo'shish"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="overflow-y-auto p-5">
          <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="flex-1 space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm text-gray-400 mb-1">Nomi</label>
                  <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-obsidian-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-gold-500 outline-none" />
                </div>
                
                <div>
                  <label className="block text-xs md:text-sm text-gray-400 mb-1">Kategoriya</label>
                  <select required value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="w-full bg-obsidian-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-gold-500 outline-none">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="w-full sm:w-28 h-24 sm:h-auto shrink-0 flex flex-col items-center justify-center border border-gray-700 rounded-lg bg-obsidian-950 overflow-hidden relative group">
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-500 text-center px-2">Rasm tanlang</span>
                )}
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-white mb-1" />
                  <span className="text-[10px] text-white">Yuklash</span>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                {uploading && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <span className="text-xs text-white">Yuklanmoqda...</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm text-gray-400 mb-1">Ta'rif (ixtiyoriy)</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-obsidian-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-gold-500 outline-none resize-none" rows="2" />
            </div>

            <div>
              <label className="block text-xs md:text-sm text-gray-400 mb-1">Rasm havolasi (URL)</label>
              <input type="url" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="w-full bg-obsidian-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-gold-500 outline-none" placeholder="https://... yoki kompyuterdan yuklang" />
            </div>

            <div>
              <label className="block text-xs md:text-sm text-gray-400 mb-1">Asosiy narxi (so'm)</label>
              <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-obsidian-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-gold-500 outline-none" />
            </div>

            {/* VARIANTS (PORTIONS) */}
            <div className="mt-4 md:mt-6 border-t border-gray-800 pt-3 md:pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs md:text-sm font-semibold text-gold-400 uppercase tracking-wider">Porsiyalar (Variantlar)</h4>
                <button type="button" onClick={addVariant} className="text-xs flex items-center gap-1 bg-gold-500/10 text-gold-500 px-2 py-1 rounded hover:bg-gold-500/20">
                  <Plus className="w-3 h-3" /> Qo'shish
                </button>
              </div>

              {form.variants.length === 0 ? (
                <p className="text-xs text-gray-500">Bu taomda porsiyalar tanlovi yo'q. Faqat asosiy narx ishlatiladi.</p>
              ) : (
                <div className="space-y-2">
                  {form.variants.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input required type="text" placeholder="Nomi (0.7)" value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} className="w-1/2 bg-obsidian-950 border border-gray-700 rounded-lg px-3 py-1.5 text-xs md:text-sm text-white focus:border-gold-500 outline-none" />
                      <input required type="number" placeholder="Narxi" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} className="w-1/2 bg-obsidian-950 border border-gray-700 rounded-lg px-3 py-1.5 text-xs md:text-sm text-white focus:border-gold-500 outline-none" />
                      <button type="button" onClick={() => removeVariant(i)} className="text-red-400 p-1.5 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="flex-1">
                <label className="block text-xs md:text-sm text-gray-400 mb-1">Qachon chiqadi? (Ixtiyoriy)</label>
                <input type="text" value={form.ready_time} onChange={e => setForm({...form, ready_time: e.target.value})} className="w-full bg-obsidian-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-gold-500 outline-none" placeholder="13:00 da" />
              </div>
              <div className="flex-1">
                <label className="block text-xs md:text-sm text-gray-400 mb-1">Aksiya / Bonus (Ixtiyoriy)</label>
                <input type="text" value={form.promo_text} onChange={e => setForm({...form, promo_text: e.target.value})} className="w-full bg-obsidian-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-gold-500 outline-none" placeholder="Cola tekin" />
              </div>
            </div>

            {/* ADDONS (QO'SHIMCHALAR) */}
            <div className="mt-6 border-t border-gray-800 pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gold-400 uppercase tracking-wider">Qo'shimchalar (Add-ons)</h4>
                <button type="button" onClick={addAddon} className="text-xs flex items-center gap-1 bg-gold-500/10 text-gold-500 px-2 py-1 rounded hover:bg-gold-500/20">
                  <Plus className="w-3 h-3" /> Qo'shish
                </button>
              </div>

              {form.addons.length === 0 ? (
                <p className="text-xs text-gray-500">Mijoz tanlashi mumkin bo'lgan qo'shimchalar (sous, qaymoq...).</p>
              ) : (
                <div className="space-y-2">
                  {form.addons.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input required type="text" placeholder="Nomi (Masalan: Sous)" value={v.name} onChange={e => updateAddon(i, 'name', e.target.value)} className="w-1/2 bg-obsidian-950 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:border-gold-500 outline-none" />
                      <input required type="number" placeholder="Narxi" value={v.price} onChange={e => updateAddon(i, 'price', e.target.value)} className="w-1/2 bg-obsidian-950 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:border-gold-500 outline-none" />
                      <button type="button" onClick={() => removeAddon(i)} className="text-red-400 p-1.5 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-4 border-t border-gray-800 pt-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">Ombordagi soni (Bo'sh = cheksiz)</label>
                <input type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full bg-obsidian-950 border border-gray-700 rounded px-3 py-2 text-white focus:border-gold-500 outline-none" placeholder="Masalan: 10" />
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-3 border-t border-gray-800 pt-4">
              <input type="checkbox" id="avail" checked={form.is_available} onChange={e => setForm({...form, is_available: e.target.checked})} className="w-4 h-4 accent-gold-500" />
              <label htmlFor="avail" className="text-sm text-gray-300">Menyuda ko'rsatish (Mavjud)</label>
            </div>
            
          </form>
        </div>
        
        <div className="p-4 border-t border-gray-800 bg-obsidian-950 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded font-medium text-gray-400 hover:text-white transition-colors">
            Bekor qilish
          </button>
          <button type="submit" form="productForm" disabled={saving} className="px-6 py-2 rounded bg-gold-500 hover:bg-gold-400 text-obsidian-950 font-bold transition-colors">
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  )
}
