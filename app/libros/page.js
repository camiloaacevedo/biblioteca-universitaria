export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { eliminarLibroAction } from './actions';
import TablaLibros from './TablaLibros';

export default async function LibrosPage({ searchParams }) {
  const supabase = await createClient();
  const params = await searchParams;
  const busqueda = params?.q || '';

  // Obtener rol del usuario actual
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
    .from('libros')
    .select(
      `
      *,
      categorias(nombre),
      libro_autores(autores(nombre)),
      ejemplares(id, estado)
    `,
    )
    .order('titulo');

  if (busqueda) {
    query = query.or(`titulo.ilike.%${busqueda}%,isbn.ilike.%${busqueda}%`);
  }

  const { data: libros } = await query;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          📚 Catálogo de Libros
        </h1>
        {esAdmin && (
          <Link
            href="/libros/nuevo"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Nuevo Libro
          </Link>
        )}
      </div>

      {/* Buscador */}
      <form method="GET" className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={busqueda}
            placeholder="Buscar por título, ISBN..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">ISBN</th>
              <th className="px-4 py-3 text-left">Título</th>
              <th className="px-4 py-3 text-left">Autores</th>
              <th className="px-4 py-3 text-left">Categoría</th>
              <th className="px-4 py-3 text-left">Ejemplares</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <TablaLibros libros={libros} esAdmin={esAdmin} />
        </table>
      </div>
    </div>
  );
}
