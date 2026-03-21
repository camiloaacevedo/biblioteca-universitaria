export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { eliminarEjemplarAction } from './actions';
import TablaEjemplares from './TablaEjemplares';

export default async function EjemplaresPage({ searchParams }) {
  const supabase = await createClient();
  const params = await searchParams;
  const filtroEstado = params?.estado || '';

  // Verificar rol
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: usuarioActual } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('auth_id', user.id)
    .single();

  const esAdmin = usuarioActual?.rol === 'bibliotecario';

  let query = supabase
    .from('ejemplares')
    .select(`*, libros(titulo, isbn)`)
    .order('id');

  if (filtroEstado) {
    query = query.eq('estado', filtroEstado);
  }

  const { data: ejemplares } = await query;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📖 Ejemplares</h1>
        {esAdmin && (
          <Link
            href="/ejemplares/nuevo"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Nuevo Ejemplar
          </Link>
        )}
      </div>

      {/* Filtros por estado */}
      <div className="flex gap-2 mb-6">
        {['', 'disponible', 'prestado', 'perdido'].map((estado) => (
          <Link
            key={estado}
            href={estado ? `/ejemplares?estado=${estado}` : '/ejemplares'}
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

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Código de barras</th>
              <th className="px-4 py-3 text-left">Libro</th>
              <th className="px-4 py-3 text-left">Ubicación</th>
              <th className="px-4 py-3 text-left">Estado</th>
              {esAdmin && <th className="px-4 py-3 text-left">Acciones</th>}
            </tr>
          </thead>
          <TablaEjemplares ejemplares={ejemplares} esAdmin={esAdmin} />
        </table>
      </div>
    </div>
  );
}
