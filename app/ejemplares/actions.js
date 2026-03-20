'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function crearEjemplarAction(formData) {
  const supabase = await createClient()

  const { error } = await supabase.from('ejemplares').insert({
    libro_id: formData.get('libro_id'),
    codigo_barras: formData.get('codigo_barras'),
    ubicacion: formData.get('ubicacion') || null,
    estado: formData.get('estado') || 'disponible',
  })

  if (error) return { error: error.message }

  const libro_id = formData.get('libro_id')
  redirect(`/libros/${libro_id}`)
}

export async function editarEjemplarAction(formData) {
  const supabase = await createClient()
  const id = formData.get('id')

  const { error } = await supabase
    .from('ejemplares')
    .update({
      codigo_barras: formData.get('codigo_barras'),
      ubicacion: formData.get('ubicacion') || null,
      estado: formData.get('estado'),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  redirect('/ejemplares')
}

export async function eliminarEjemplarAction(formData) {
  const supabase = await createClient()
  await supabase.from('ejemplares').delete().eq('id', formData.get('id'))
  redirect('/ejemplares')
}