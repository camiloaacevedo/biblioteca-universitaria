export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { editarLibroAction } from '../../actions'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditarLibroPage({ params }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: libro } = await supabase
    .from('libros')
    .select(`*, libro_autores(autores(nombre))`)
    .eq('id', id)
    .single()

  if (!libro) notFound()

  const { data: categorias } = await supabase.from('categorias').select('*').order('nombre')
  const autores = libro.libro_autores?.map(la => la.autores?.nombre).join(', ') || ''

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/libros/${id}`} className="text-gray-500 hover:text-gray-700">← Volver</Link>
        <h1 className="text-2xl font-bold text-gray-800">Editar Libro</h1>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <form action={editarLibroAction} className="space-y-4">
          <input type="hidden" name="id" value={libro.id} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ISBN *</label>
              <input type="text" name="isbn" required defaultValue={libro.isbn}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <input type="number" name="anio" defaultValue={libro.anio}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" name="titulo" required defaultValue={libro.titulo}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Autores <span className="text-gray-400 font-normal">(separados por coma)</span>
            </label>
            <input type="text" name="autores" defaultValue={autores}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Editorial</label>
              <input type="text" name="editorial" defaultValue={libro.editorial}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select name="categoria_id"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sin categoría</option>
                {categorias?.map(cat => (
                  <option key={cat.id} value={cat.id}
                    selected={cat.id === libro.categoria_id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea name="descripcion" rows={3} defaultValue={libro.descripcion}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Guardar Cambios
            </button>
            <Link href={`/libros/${id}`}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}