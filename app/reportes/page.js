export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ReportesPage({ searchParams }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: usuarioActual } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('auth_id', user.id)
    .single();

  if (usuarioActual?.rol !== 'bibliotecario') redirect('/dashboard');

  const params = await searchParams;
  const periodo = params?.periodo || '30';

  // Fecha inicio según periodo
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() - parseInt(periodo));

  // 1. Usar vista de préstamos activos
  const { data: prestamosActivos } = await supabase
    .from('vista_prestamos_activos')
    .select('*')
    .order('dias_restantes');

  // 2. Usar vista de libros más prestados con window function
  const { data: librosMasPrestados } = await supabase
    .from('vista_libros_mas_prestados')
    .select('*')
    .limit(10);

  // 3. Usar vista de estadísticas de usuarios con window function
  const { data: estadisticasUsuarios } = await supabase
    .from('vista_estadisticas_usuarios')
    .select('*')
    .order('ranking_prestamos')
    .limit(10);

  // 4. Inventario por estado
  const { count: totalDisponibles } = await supabase
    .from('ejemplares')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'disponible');

  const { count: totalPrestados } = await supabase
    .from('ejemplares')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'prestado');

  const { count: totalPerdidos } = await supabase
    .from('ejemplares')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'perdido');

  // 5. Préstamos vencidos
  const { data: prestamosVencidos } = await supabase
    .from('vista_prestamos_activos')
    .select('*')
    .eq('alerta', 'vencido')
    .order('dias_restantes');

  // 6. Estadísticas generales del periodo
  const { count: totalPrestadosPeriodo } = await supabase
    .from('prestamos')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', fechaInicio.toISOString());

  const { count: totalMultasPeriodo } = await supabase
    .from('prestamos')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', fechaInicio.toISOString())
    .gt('multa', 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">📊 Reportes</h1>
        {/* Filtro de periodo */}
        <form method="GET" className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Periodo:</label>
          <select
            name="periodo"
            defaultValue={periodo}
            onChange="this.form.submit()"
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Stats del periodo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">
            {totalPrestadosPeriodo ?? 0}
          </p>
          <p className="text-xs text-blue-600 mt-1">Préstamos en periodo</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">
            {prestamosVencidos?.length ?? 0}
          </p>
          <p className="text-xs text-red-600 mt-1">Préstamos vencidos</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">
            {totalMultasPeriodo ?? 0}
          </p>
          <p className="text-xs text-yellow-600 mt-1">Multas generadas</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">
            {prestamosActivos?.length ?? 0}
          </p>
          <p className="text-xs text-purple-600 mt-1">Préstamos activos</p>
        </div>
      </div>

      {/* Inventario */}
      <h2 className="text-lg font-bold text-gray-700 mb-4">
        Inventario por Estado
      </h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-green-700">
            {totalDisponibles ?? 0}
          </p>
          <p className="text-sm text-green-600 mt-1">Disponibles</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-yellow-700">
            {totalPrestados ?? 0}
          </p>
          <p className="text-sm text-yellow-600 mt-1">Prestados</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-red-700">
            {totalPerdidos ?? 0}
          </p>
          <p className="text-sm text-red-600 mt-1">Perdidos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Libros más prestados con ranking */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4">
            📚 Libros más prestados
          </h2>
          {librosMasPrestados?.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Sin datos</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Ranking</th>
                  <th className="px-3 py-2 text-left">Libro</th>
                  <th className="px-3 py-2 text-right">Préstamos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {librosMasPrestados?.map((libro) => (
                  <tr key={libro.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          libro.ranking === 1
                            ? 'bg-yellow-100 text-yellow-700'
                            : libro.ranking === 2
                              ? 'bg-gray-100 text-gray-700'
                              : libro.ranking === 3
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        #{libro.ranking}
                      </span>
                    </td>
                    <td className="px-3 py-2">{libro.titulo}</td>
                    <td className="px-3 py-2 text-right font-bold text-blue-600">
                      {libro.total_prestamos}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Usuarios con más préstamos con ranking */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4">
            👥 Usuarios con más préstamos
          </h2>
          {estadisticasUsuarios?.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Sin datos</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Ranking</th>
                  <th className="px-3 py-2 text-left">Usuario</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">Multas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {estadisticasUsuarios?.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          u.ranking_prestamos === 1
                            ? 'bg-yellow-100 text-yellow-700'
                            : u.ranking_prestamos === 2
                              ? 'bg-gray-100 text-gray-700'
                              : u.ranking_prestamos === 3
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        #{u.ranking_prestamos}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium">{u.nombres}</p>
                      <p className="text-xs text-gray-400">{u.rol}</p>
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-blue-600">
                      {u.total_prestamos}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {u.total_multas > 0 ? (
                        <span className="text-red-600 font-medium">
                          ${u.total_multas.toLocaleString('es-CO')}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
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
          <p className="text-gray-400 text-center py-4">
            No hay préstamos activos
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-3 py-2 text-left">Usuario</th>
                <th className="px-3 py-2 text-left">Libro</th>
                <th className="px-3 py-2 text-left">Vencimiento</th>
                <th className="px-3 py-2 text-left">Días restantes</th>
                <th className="px-3 py-2 text-left">Alerta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prestamosActivos?.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <p className="font-medium">{p.usuario_nombre}</p>
                    <p className="text-xs text-gray-400">{p.usuario_codigo}</p>
                  </td>
                  <td className="px-3 py-2">{p.libro_titulo}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">
                    {new Date(p.fecha_vencimiento).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`font-medium ${
                        p.dias_restantes < 0
                          ? 'text-red-600'
                          : p.dias_restantes <= 2
                            ? 'text-yellow-600'
                            : 'text-green-600'
                      }`}
                    >
                      {p.dias_restantes < 0
                        ? `${Math.abs(Math.round(p.dias_restantes))} días vencido`
                        : `${Math.round(p.dias_restantes)} días`}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.alerta === 'vencido'
                          ? 'bg-red-100 text-red-700'
                          : p.alerta === 'por_vencer'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {p.alerta === 'vencido'
                        ? '🚨 Vencido'
                        : p.alerta === 'por_vencer'
                          ? '⚠️ Por vencer'
                          : '✅ Al día'}
                    </span>
                  </td>
                </tr>
              ))}
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
          <p className="text-gray-400 text-center py-4">
            No hay préstamos vencidos
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-3 py-2 text-left">Usuario</th>
                <th className="px-3 py-2 text-left">Correo</th>
                <th className="px-3 py-2 text-left">Libro</th>
                <th className="px-3 py-2 text-left">Venció</th>
                <th className="px-3 py-2 text-right">Días vencido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prestamosVencidos?.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <p className="font-medium">{p.usuario_nombre}</p>
                    <p className="text-xs text-gray-400">{p.usuario_codigo}</p>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {p.usuario_correo}
                  </td>
                  <td className="px-3 py-2">{p.libro_titulo}</td>
                  <td className="px-3 py-2 text-red-600 text-xs">
                    {new Date(p.fecha_vencimiento).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                      {Math.abs(Math.round(p.dias_restantes))} días
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
