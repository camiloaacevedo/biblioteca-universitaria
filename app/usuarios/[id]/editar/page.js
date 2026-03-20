export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { editarUsuarioAction } from '../../actions'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditarUsuarioPage({ params }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .single()

  if (!usuario) notFound()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/usuarios/${id}`} className="text-gray-500 hover:text-gray-700">← Volver</Link>
        <h1 className="text-2xl font-bold text-gray-800">Editar Usuario</h1>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <form action={editarUsuarioAction} className="space-y-4">
          <input type="hidden" name="id" value={usuario.id} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombres completos *</label>
            <input type="text" name="nombres" required defaultValue={usuario.nombres}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input type="text" name="codigo" required defaultValue={usuario.codigo}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identificación *</label>
              <input type="text" name="identificacion" required defaultValue={usuario.identificacion}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
              <select name="rol" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="estudiante" selected={usuario.rol === 'estudiante'}>Estudiante</option>
                <option value="docente" selected={usuario.rol === 'docente'}>Docente</option>
                <option value="bibliotecario" selected={usuario.rol === 'bibliotecario'}>Bibliotecario</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
              <select name="estado" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="activo" selected={usuario.estado === 'activo'}>Activo</option>
                <option value="bloqueado" selected={usuario.estado === 'bloqueado'}>Bloqueado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carrera (opcional)</label>
            <input type="text" name="carrera" defaultValue={usuario.carrera}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingeniería de Sistemas" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Guardar Cambios
            </button>
            <Link href={`/usuarios/${id}`}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}