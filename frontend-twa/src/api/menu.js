import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

async function fetchMenu() {
  const [cats, prods] = await Promise.all([
    supabase.from('categories').select('id, name, sort_order').order('sort_order'),
    supabase.from('products').select('id, category_id, name, description, price, image_url, is_available, variants, addons, ready_time, promo_text').order('id'),
  ])
  if (cats.error) throw cats.error
  if (prods.error) throw prods.error
  return { categories: cats.data, products: prods.data }
}

// Menyuni yuklaydi va kassir o'zgartirish kiritsa (masalan "Tugadi") darhol yangilaydi.
export function useMenu() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        queryClient.setQueryData(['menu'], (old) => {
          if (!old) return old
          let products = old.products
          if (payload.eventType === 'DELETE') {
            products = products.filter((p) => p.id !== payload.old.id)
          } else if (products.some((p) => p.id === payload.new.id)) {
            products = products.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
          } else {
            products = [...products, payload.new]
          }
          return { ...old, products }
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [queryClient])

  return useQuery({ queryKey: ['menu'], queryFn: fetchMenu })
}

export async function createOrder(payload) {
  const { data, error } = await supabase.rpc('create_order', payload)
  if (error) throw error
  return data // buyurtma raqami
}
