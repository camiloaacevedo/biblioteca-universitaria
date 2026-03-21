export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ReportesPage() {
  const supabase = await createClient()

  // Solo bibliotecario puede ver reportes
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuarioActual } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('auth_id', user.id)
    .single()

  if (usuarioActual?.rol !== 'bibliotecario') redirect('/dashboard')

  // 1. Inventario por estado
  const { count: totalDisponibles } = await supabase
    .from('ejemplares')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'disponible')

  const { count: totalPrestados } = await supabase
    .from('ejemplares')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'prestado')

  const { count: totalPerdidos } = await supabase
    .from('ejemplares')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'perdido')

  // 2. Préstamos activos
  const { data: prestamosActivos } = await supabase
    .from('prestamos')
    .select(`
      *,
      usuarios!prestamos_usuario_id_fkey(nombres, codigo),
      ejemplares(codigo_barras, libros(titulo))
    `)
    .eq('estado', 'aprobado')
    .order('fecha_vencimiento')

  // 3. Préstamos vencidos
  const ahora = new Date().toISOString()
  const { data: prestamosVencidos } = await supabase
    .from('prestamos')
    .select(`
      *,
      usuarios!prestamos_usuario_id_fkey(nombres, codigo),
      ejemplares(codigo_barras, libros(titulo))
    `)
    .eq('estado', 'aprobado')
    .lt('fecha_vencimiento', ahora)
    .order('fecha_vencimiento')

  // 4. Libros más prestados
  const { data: todosPrestamos } = await supabase
    .from('prestamos')
    .select(`ejemplares(libros(titulo))`)
    .not('estado', 'eq', 'pendiente')

  const conteoLibros = {}
  todosPrestamos?.forEach(p => {
    const titulo = p.ejemplares?.libros?.titulo
    if (titulo) conteoLibros[titulo] = (conteoLibros[titulo] || 0) + 1
  })
  const topLibros = Object.entries(conteoLibros)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // 5. Usuarios con más préstamos
  const conteoUsuarios = {}
  todosPrestamos?.forEach(p => {
    const nombre = p.usuarios?.nombres
    const codigo = p.usuarios?.codigo
    if (nombre) {
      const key = `${nombre} (${codigo})`
      conteoUsuarios[key] = (conteoUsuarios[key] || 0) + 1
    }
  })

  // necesitamos los usuarios también
  const { data: prestamosConUsuarios } = await supabase
    .from('prestamos')
    .select(`usuarios!prestamos_usuario_id_fkey(nombres, codigo)`)
    .not('estado', 'eq', 'pendiente')

  const conteoUsuarios2 = {}
  prestamosConUsuarios?.forEach(p => {
    const nombre = p.usuarios?.nombres
    const codigo = p.usuarios?.codigo
    if (nombre) {
      const key = `${nombre} (${codigo})`
      conteoUsuarios2[key] = (conteoUsuarios2[key] || 0) + 1
    }
  })
  const topUsuarios = Object.entries(conteoUsuarios2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-8">📊 Reportes</h1>

      {/* Inventario */}
      <h2 className="text-lg font-bold text-gray-700 mb-4">Inventario por Estado</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-green-700">{totalDisponibles ?? 0}</p>
          <p className="text-sm text-green-600 mt-1">Disponibles</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-yellow-700">{totalPrestados ?? 0}</p>
          <p className="text-sm text-yellow-600 mt-1">Prestados</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-red-700">{totalPerdidos ?? 0}</p>
          <p className="text-sm text-red-600 mt-1">Perdidos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Libros más prestados */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4">📚 Libros más prestados</h2>
          {topLibros.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Sin datos</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Libro</th>
                  <th className="px-3 py-2 text-right">Préstamos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topLibros.map(([titulo, count]) => (
                  <tr key={titulo} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{titulo}</td>
                    <td className="px-3 py-2 text-right font-bold text-blue-600">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Usuarios con más préstamos */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4">👥 Usuarios con más préstamos</h2>
          {topUsuarios.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Sin datos</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Usuario</th>
                  <th className="px-3 py-2 text-right">Préstamos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topUsuarios.map(([nombre, count]) => (
                  <tr key={nombre} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{nombre}</td>
                    <td className="px-3 py-2 text-right font-bold text-blue-600">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Préstamos activos */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="font-bold text-gray-700 mb-4">
          🔄 Préstamos Activos
          <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
            {prestamosActivos?.length ?? 0}
          </span>
        </h2>
        {prestamosActivos?.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No hay préstamos activos</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-3 py-2 text-left">Usuario</th>
                <th className="px-3 py-2 text-left">Libro</th>
                <th className="px-3 py-2 text-left">Vencimiento</th>
                <th className="px-3 py-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prestamosActivos?.map(p => {
                const vencido = new Date(p.fecha_vencimiento) < new Date()
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <p className="font-medium">{p.usuarios?.nombres}</p>
                      <p className="text-xs text-gray-400">{p.usuarios?.codigo}</p>
                    </td>
                    <td className="px-3 py-2">{p.ejemplares?.libros?.titulo}</td>
                    <td className={`px-3 py-2 ${vencido ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                      {new Date(p.fecha_vencimiento).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vencido ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {vencido ? 'Vencido' : 'Al día'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Préstamos vencidos */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-bold text-gray-700 mb-4">
          ⚠️ Préstamos Vencidos
          <span className="ml-2 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
            {prestamosVencidos?.length ?? 0}
          </span>
        </h2>
        {prestamosVencidos?.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No hay préstamos vencidos</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-3 py-2 text-left">Usuario</th>
                <th className="px-3 py-2 text-left">Libro</th>
                <th className="px-3 py-2 text-left">Venció</th>
                <th className="px-3 py-2 text-right">Días retraso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prestamosVencidos?.map(p => {
                const diasRetraso = Math.ceil(
                  (new Date() - new Date(p.fecha_vencimiento)) / (1000 * 60 * 60 * 24)
                )
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <p className="font-medium">{p.usuarios?.nombres}</p>
                      <p className="text-xs text-gray-400">{p.usuarios?.codigo}</p>
                    </td>
                    <td className="px-3 py-2">{p.ejemplares?.libros?.titulo}</td>
                    <td className="px-3 py-2 text-red-600">
                      {new Date(p.fecha_vencimiento).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                        {diasRetraso} días
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}