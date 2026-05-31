export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import {
  cancelarReservaAction,
  convertirReservaEnPrestamoAction,
} from './actions';

export default async function ReservasPage() {
  const supabase = await createClient();

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
    .from('reservas')
    .select(
      `
      *,
      usuarios!reservas_usuario_id_fkey(nombres, codigo),
      ejemplares(id, codigo_barras, estado, libros(titulo))
    `,
    )
    .order('created_at', { ascending: false });

  if (!esAdmin) {
    query = query.eq('usuario_id', usuarioActual.id);
  }

  const { data: reservas } = await query;

  const coloresEstado = {
    activa: 'bg-blue-100 text-blue-700',
    cancelada: 'bg-red-100 text-red-700',
    completada: 'bg-green-100 text-green-700',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🔖 Reservas</h1>
      </div>

      {/* Info para usuarios */}
      {!esAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
          ℹ️ Cuando el ejemplar esté disponible, el bibliotecario convertirá tu
          reserva en préstamo automáticamente. La reserva expira en{' '}
          <strong>48 horas</strong> desde su creación.
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              {esAdmin && <th className="px-4 py-3 text-left">Usuario</th>}
              <th className="px-4 py-3 text-left">Libro</th>
              <th className="px-4 py-3 text-left">Ejemplar</th>
              <th className="px-4 py-3 text-left">Reservado</th>
              <th className="px-4 py-3 text-left">Expira</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reservas?.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">
                  No hay reservas registradas
                </td>
              </tr>
            )}
            {reservas?.map((r) => {
              const expirada = new Date(r.fecha_expiracion) < new Date();
              const ejemplarDisponible = r.ejemplares?.estado === 'disponible';
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">#{r.id}</td>
                  {esAdmin && (
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.usuarios?.nombres}</p>
                      <p className="text-xs text-gray-400">
                        {r.usuarios?.codigo}
                      </p>
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium">
                    {r.ejemplares?.libros?.titulo}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.ejemplares?.codigo_barras}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(r.created_at).toLocaleDateString('es-CO')}
                  </td>
                  <td
                    className={`px-4 py-3 text-xs ${expirada && r.estado === 'activa' ? 'text-red-600 font-bold' : 'text-gray-500'}`}
                  >
                    {new Date(r.fecha_expiracion).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${coloresEstado[r.estado]}`}
                    >
                      {r.estado}
                    </span>
                    {ejemplarDisponible && r.estado === 'activa' && (
                      <span className="ml-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        ¡Disponible!
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {/* Admin puede convertir reserva en préstamo si el ejemplar está disponible */}
                      {esAdmin &&
                        r.estado === 'activa' &&
                        ejemplarDisponible && (
                          <form action={convertirReservaEnPrestamoAction}>
                            <input
                              type="hidden"
                              name="reserva_id"
                              value={r.id}
                            />
                            <input
                              type="hidden"
                              name="usuario_id"
                              value={r.usuario_id}
                            />
                            <input
                              type="hidden"
                              name="ejemplar_id"
                              value={r.ejemplares?.id}
                            />
                            <button
                              type="submit"
                              className="text-green-600 hover:underline text-xs font-medium"
                            >
                              ✅ Prestar
                            </button>
                          </form>
                        )}
                      {/* Cancelar reserva */}
                      {r.estado === 'activa' && (
                        <form action={cancelarReservaAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <button
                            type="submit"
                            className="text-red-600 hover:underline text-xs"
                          >
                            Cancelar
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
