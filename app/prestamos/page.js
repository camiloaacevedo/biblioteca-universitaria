export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { aprobarPrestamoAction, rechazarPrestamoAction } from './actions';

export default async function PrestamosPage({ searchParams }) {
  const supabase = await createClient();
  const params = await searchParams;
  const filtroEstado = params?.estado || '';

  // Obtener usuario actual completo
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: usuarioActual } = await supabase
    .from('usuarios')
    .select('id, rol')
    .eq('auth_id', user.id)
    .single();

  const esAdmin = usuarioActual?.rol === 'bibliotecario';

  let query = supabase
    .from('prestamos')
    .select(
      `
    *,
    usuarios!prestamos_usuario_id_fkey(nombres, codigo),
    ejemplares(codigo_barras, libros(titulo))
  `,
    )
    .order('created_at', { ascending: false });

  if (filtroEstado) {
    query = query.eq('estado', filtroEstado);
  }

  // Estudiante solo ve sus propios préstamos
  if (!esAdmin) {
    query = query.eq('usuario_id', usuarioActual.id);
  }

  const { data: prestamos } = await query;

  const coloresEstado = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobado: 'bg-blue-100 text-blue-700',
    devuelto: 'bg-green-100 text-green-700',
    vencido: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🔄 Préstamos</h1>
        <Link
          href="/prestamos/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Solicitar Préstamo
        </Link>
      </div>

      {/* Filtros por estado */}
      <div className="flex gap-2 mb-6">
        {['', 'pendiente', 'aprobado', 'devuelto', 'vencido'].map((estado) => (
          <Link
            key={estado}
            href={estado ? `/prestamos?estado=${estado}` : '/prestamos'}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filtroEstado === estado
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {estado === ''
              ? 'Todos'
              : estado.charAt(0).toUpperCase() + estado.slice(1)}
          </Link>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Libro</th>
              <th className="px-4 py-3 text-left">Solicitud</th>
              <th className="px-4 py-3 text-left">Vencimiento</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Multa</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {prestamos?.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">
                  No hay préstamos registrados
                </td>
              </tr>
            )}
            {prestamos?.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 text-xs">#{p.id}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{p.usuarios?.nombres}</p>
                    <p className="text-xs text-gray-400">
                      {p.usuarios?.codigo}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">
                      {p.ejemplares?.libros?.titulo}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {p.ejemplares?.codigo_barras}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(p.created_at).toLocaleDateString('es-CO')}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {p.fecha_vencimiento
                    ? new Date(p.fecha_vencimiento).toLocaleDateString('es-CO')
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${coloresEstado[p.estado]}`}
                  >
                    {p.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {p.multa > 0 ? (
                    <span className="text-red-600 font-medium">
                      ${p.multa.toLocaleString('es-CO')}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {/* Aprobar / Rechazar — solo bibliotecario */}
                    {esAdmin && p.estado === 'pendiente' && (
                      <>
                        <form action={aprobarPrestamoAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <input
                            type="hidden"
                            name="ejemplar_id"
                            value={p.ejemplar_id}
                          />
                          <button
                            type="submit"
                            className="text-green-600 hover:underline font-medium"
                          >
                            Aprobar
                          </button>
                        </form>
                        <form action={rechazarPrestamoAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="text-red-600 hover:underline"
                          >
                            Rechazar
                          </button>
                        </form>
                      </>
                    )}
                    {/* Registrar devolución — solo bibliotecario */}
                    {esAdmin && p.estado === 'aprobado' && (
                      <Link
                        href={`/prestamos/${p.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        Devolver
                      </Link>
                    )}
                    {/* Ver detalle */}
                    <Link
                      href={`/prestamos/${p.id}`}
                      className="text-gray-500 hover:underline"
                    >
                      Ver
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
