export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { solicitarPrestamoAction } from '../actions'
import Link from 'next/link'

export default async function NuevoPrestamoPage() {
  const supabase = await createClient()

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nombres, codigo')
    .eq('estado', 'activo')
    .order('nombres')

  const { data: ejemplares } = await supabase
    .from('ejemplares')
    .select('id, codigo_barras, ubicacion, libros(titulo)')
    .eq('estado', 'disponible')
    .order('codigo_barras')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/prestamos" className="text-gray-500 hover:text-gray-700">← Volver</Link>
        <h1 className="text-2xl font-bold text-gray-800">Solicitar Préstamo</h1>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <form action={solicitarPrestamoAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario *
            </label>
            <select name="usuario_id" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecciona un usuario</option>
              {usuarios?.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nombres} — {u.codigo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ejemplar disponible *
            </label>
            <select name="ejemplar_id" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecciona un ejemplar</option>
              {ejemplares?.map(e => (
                <option key={e.id} value={e.id}>
                  {e.libros?.titulo} — {e.codigo_barras} ({e.ubicacion || 'Sin ubicación'})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
            ℹ️ La solicitud quedará en estado <strong>pendiente</strong> hasta que un bibliotecario la apruebe.
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Enviar Solicitud
            </button>
            <Link href="/prestamos"
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}