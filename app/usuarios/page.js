export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { toggleEstadoAction } from './actions'

export default async function UsuariosPage({ searchParams }) {
  const supabase = await createClient()
  const params = await searchParams
  const busqueda = params?.q || ''
  const filtroRol = params?.rol || ''

  let query = supabase
    .from('usuarios')
    .select('*')
    .order('nombres')

  if (busqueda) {
    query = query.or(`nombres.ilike.%${busqueda}%,correo.ilike.%${busqueda}%,codigo.ilike.%${busqueda}%`)
  }

  if (filtroRol) {
    query = query.eq('rol', filtroRol)
  }

  const { data: usuarios } = await query

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">👥 Usuarios</h1>
        <Link href="/usuarios/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Nuevo Usuario
        </Link>
      </div>

      {/* Filtros */}
      <form method="GET" className="mb-6 flex gap-3">
        <input
          type="text"
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por nombre, código, correo..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select name="rol"
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los roles</option>
          <option value="estudiante" selected={filtroRol === 'estudiante'}>Estudiante</option>
          <option value="docente" selected={filtroRol === 'docente'}>Docente</option>
          <option value="bibliotecario" selected={filtroRol === 'bibliotecario'}>Bibliotecario</option>
        </select>
        <button type="submit"
          className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
          Filtrar
        </button>
      </form>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Nombres</th>
              <th className="px-4 py-3 text-left">Correo</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Carrera</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios?.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
            {usuarios?.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{usuario.codigo}</td>
                <td className="px-4 py-3 font-medium">{usuario.nombres}</td>
                <td className="px-4 py-3 text-gray-600">{usuario.correo}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    usuario.rol === 'bibliotecario' ? 'bg-purple-100 text-purple-700' :
                    usuario.rol === 'docente' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {usuario.rol}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{usuario.carrera || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    usuario.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {usuario.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link href={`/usuarios/${usuario.id}`}
                      className="text-blue-600 hover:underline">Ver</Link>
                    <Link href={`/usuarios/${usuario.id}/editar`}
                      className="text-yellow-600 hover:underline">Editar</Link>
                    <form action={toggleEstadoAction}>
                      <input type="hidden" name="id" value={usuario.id} />
                      <input type="hidden" name="estado" value={usuario.estado} />
                      <button type="submit"
                        className={usuario.estado === 'activo' ? 'text-red-600 hover:underline' : 'text-green-600 hover:underline'}>
                        {usuario.estado === 'activo' ? 'Bloquear' : 'Activar'}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}