export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function DetalleUsuarioPage({ params }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .single()

  if (!usuario) notFound()

  const { data: prestamos } = await supabase
    .from('prestamos')
    .select(`
      *,
      ejemplares(codigo_barras, libros(titulo))
    `)
    .eq('usuario_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/usuarios" className="text-gray-500 hover:text-gray-700">← Volver</Link>
        <h1 className="text-2xl font-bold text-gray-800">{usuario.nombres}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-xl shadow p-6 space-y-3">
          <h2 className="font-bold text-gray-700 border-b pb-2">Información</h2>
          <div>
            <p className="text-xs text-gray-400">Código</p>
            <p className="font-mono text-sm">{usuario.codigo}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Identificación</p>
            <p className="text-sm">{usuario.identificacion}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Correo</p>
            <p className="text-sm">{usuario.correo}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Rol</p>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              usuario.rol === 'bibliotecario' ? 'bg-purple-100 text-purple-700' :
              usuario.rol === 'docente' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {usuario.rol}
            </span>
          </div>
          {usuario.carrera && (
            <div>
              <p className="text-xs text-gray-400">Carrera</p>
              <p className="text-sm">{usuario.carrera}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">Estado</p>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              usuario.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {usuario.estado}
            </span>
          </div>
          <Link href={`/usuarios/${usuario.id}/editar`}
            className="block text-center bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition mt-4">
            ✏️ Editar usuario
          </Link>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4">Historial de Préstamos</h2>
          {prestamos?.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Sin préstamos registrados</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Libro</th>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="px-3 py-2 text-left">Multa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prestamos?.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{p.ejemplares?.libros?.titulo || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">
                      {new Date(p.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.estado === 'aprobado' ? 'bg-blue-100 text-blue-700' :
                        p.estado === 'devuelto' ? 'bg-green-100 text-green-700' :
                        p.estado === 'vencido' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {p.multa > 0
                        ? <span className="text-red-600 font-medium">${p.multa.toLocaleString('es-CO')}</span>
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}