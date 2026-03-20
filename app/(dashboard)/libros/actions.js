'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function crearLibroAction(formData) {
  const supabase = await createClient()

  const titulo = formData.get('titulo')
  const isbn = formData.get('isbn')
  const editorial = formData.get('editorial')
  const anio = formData.get('anio')
  const categoria_id = formData.get('categoria_id')
  const descripcion = formData.get('descripcion')
  const autores = formData.get('autores') // separados por coma

  // 1. Insertar libro
  const { data: libro, error } = await supabase
    .from('libros')
    .insert({ titulo, isbn, editorial, anio: anio || null, categoria_id: categoria_id || null, descripcion })
    .select()
    .single()

  if (error) return { error: error.message }

  // 2. Insertar autores
  if (autores) {
    const nombresAutores = autores.split(',').map(a => a.trim()).filter(Boolean)
    for (const nombre of nombresAutores) {
      // Buscar o crear autor
      let { data: autor } = await supabase
        .from('autores')
        .select('id')
        .eq('nombre', nombre)
        .single()

      if (!autor) {
        const { data: nuevoAutor } = await supabase
          .from('autores')
          .insert({ nombre })
          .select()
          .single()
        autor = nuevoAutor
      }

      // Relacionar con libro
      await supabase.from('libro_autores').insert({
        libro_id: libro.id,
        autor_id: autor.id
      })
    }
  }

  redirect('/libros')
}

export async function editarLibroAction(formData) {
  const supabase = await createClient()
  const id = formData.get('id')

  const { error } = await supabase
    .from('libros')
    .update({
      titulo: formData.get('titulo'),
      isbn: formData.get('isbn'),
      editorial: formData.get('editorial'),
      anio: formData.get('anio') || null,
      categoria_id: formData.get('categoria_id') || null,
      descripcion: formData.get('descripcion'),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  redirect('/libros')
}

export async function eliminarLibroAction(formData) {
  const supabase = await createClient()
  const id = formData.get('id')
  await supabase.from('libros').delete().eq('id', id)
  redirect('/libros')
}