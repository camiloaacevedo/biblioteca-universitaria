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
  const id = formData.get('id')

  // Verificar si tiene préstamos activos
  const { data: prestamosActivos } = await supabase
    .from('prestamos')
    .select('id')
    .eq('ejemplar_id', id)
    .eq('estado', 'aprobado')

  if (prestamosActivos?.length > 0) {
    return { error: 'No se puede eliminar un ejemplar con préstamos activos' }
  }

  // Eliminar préstamos históricos asociados
  await supabase.from('prestamos').delete().eq('ejemplar_id', id)

  // Eliminar ejemplar
  await supabase.from('ejemplares').delete().eq('id', id)
  redirect('/ejemplares')
}