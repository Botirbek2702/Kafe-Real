import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Send, Image as ImageIcon, MessageSquare, Clock } from 'lucide-react'

export default function Marketing() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [form, setForm] = useState({
    message: '',
    imageUrl: ''
  })

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('broadcast_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      
    if (data) setHistory(data)
    setLoading(false)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!form.message.trim()) return toast.error("Xabar matnini kiriting")
    
    if (!confirm("Barcha mijozlarga xabar yuborishni tasdiqlaysizmi?")) return

    setSending(true)
    const { error } = await supabase
      .from('broadcast_messages')
      .insert([
        { 
          message: form.message.trim(),
          image_url: form.imageUrl.trim() || null
        }
      ])

    if (error) {
      toast.error("Xatolik yuz berdi")
    } else {
      toast.success("Xabar jo'natish boshlandi!")
      setForm({ message: '', imageUrl: '' })
      fetchHistory()
    }
    setSending(false)
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 w-full">
      <div className="flex gap-8">
      {/* Send Form */}
      <div className="w-1/2">
        <h2 className="text-3xl font-cinzel text-gold-500 mb-8">Marketing va Xabarnomalar</h2>
        
        <div className="bg-obsidian-900 border border-gray-800 rounded-xl p-6">
          <form onSubmit={handleSend} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gold-500" />
                Xabar matni
              </label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-obsidian-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors resize-none"
                placeholder="Aksiya va chegirmalar haqida xabar yozing..."
              />
              <p className="text-xs text-gray-500 mt-2">Ushbu xabar botdan ro'yxatdan o'tgan barcha mijozlarga yuboriladi.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-gold-500" />
                Rasm havolasi (Ixtiyoriy)
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full bg-obsidian-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                placeholder="https://..."
              />
            </div>

            {form.imageUrl && (
              <div className="mt-4 rounded-lg overflow-hidden border border-gray-800">
                <img src={form.imageUrl} alt="Preview" className="w-full h-48 object-cover" onError={(e) => e.target.style.display='none'} />
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-gold-500 hover:bg-gold-400 text-obsidian-950 font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {sending ? (
                <>Yuborilmoqda...</>
              ) : (
                <><Send className="w-5 h-5" /> Barchaga yuborish</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* History */}
      <div className="w-1/2">
        <h3 className="text-xl font-cinzel text-gray-300 mb-8 mt-2">Yuborilganlar tarixi</h3>
        
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Yuklanmoqda...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500">Tarix bo'sh</p>
          ) : history.map(item => (
            <div key={item.id} className="bg-obsidian-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  {format(new Date(item.created_at), 'dd.MM.yyyy HH:mm')}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                  item.status === 'completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                  'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                }`}>
                  {item.status === 'completed' ? "Yuborildi" : "Jarayonda"}
                </span>
              </div>
              
              <div className="flex gap-4">
                {item.image_url && (
                  <img src={item.image_url} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-800" />
                )}
                <p className="text-gray-200 text-sm whitespace-pre-wrap">{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}
