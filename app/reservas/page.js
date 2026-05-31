export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { cancelarReservaAction } from './actions';

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
      ejemplares(codigo_barras, libros(titulo))
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

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              {esAdmin && <th className="px-4 py-3 text-left">Usuario</th>}
              <th className="px-4 py-3 text-left">Libro</th>
              <th className="px-4 py-3 text-left">Ejemplar</th>
              <th className="px-4 py-3 text-left">Fecha reserva</th>
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
            {reservas?.map((r) => (
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
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(r.fecha_expiracion).toLocaleDateString('es-CO')}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${coloresEstado[r.estado]}`}
                  >
                    {r.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
