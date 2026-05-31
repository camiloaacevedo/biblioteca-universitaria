export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import TablaLibros from './TablaLibros';

export default async function LibrosPage({ searchParams }) {
  const supabase = await createClient();
  const params = await searchParams;
  const busqueda = params?.q || '';
  const filtroCategoria = params?.categoria || '';
  const filtroDisponibilidad = params?.disponibilidad || '';
  const filtroAutor = params?.autor || '';

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

  // Obtener categorías para el filtro
  const { data: categorias } = await supabase
    .from('categorias')
    .select('*')
    .order('nombre');

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

  // Filtro por texto — título, ISBN o palabras clave
  if (busqueda) {
    query = query.or(
      `titulo.ilike.%${busqueda}%,isbn.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%`,
    );
  }

  // Filtro por categoría
  if (filtroCategoria) {
    query = query.eq('categoria_id', filtroCategoria);
  }

  const { data: libros } = await query;

  // Filtro por autor (lo hacemos en JS porque es relación anidada)
  let librosFiltrados = libros || [];

  if (filtroAutor) {
    librosFiltrados = librosFiltrados.filter((libro) =>
      libro.libro_autores?.some((la) =>
        la.autores?.nombre?.toLowerCase().includes(filtroAutor.toLowerCase()),
      ),
    );
  }

  // Filtro por disponibilidad
  if (filtroDisponibilidad === 'disponible') {
    librosFiltrados = librosFiltrados.filter((libro) =>
      libro.ejemplares?.some((e) => e.estado === 'disponible'),
    );
  } else if (filtroDisponibilidad === 'no_disponible') {
    librosFiltrados = librosFiltrados.filter(
      (libro) => !libro.ejemplares?.some((e) => e.estado === 'disponible'),
    );
  }

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

      {/* Búsqueda avanzada */}
      <form
        method="GET"
        className="mb-6 bg-white rounded-xl shadow p-4 space-y-3"
      >
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={busqueda}
            placeholder="Buscar por título, ISBN o palabras clave..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            Buscar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Autor</label>
            <input
              type="text"
              name="autor"
              defaultValue={filtroAutor}
              placeholder="Nombre del autor..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Categoría
            </label>
            <select
              name="categoria"
              defaultValue={filtroCategoria}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Todas las categorías</option>
              {categorias?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Disponibilidad
            </label>
            <select
              name="disponibilidad"
              defaultValue={filtroDisponibilidad}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Todos</option>
              <option value="disponible">Con ejemplares disponibles</option>
              <option value="no_disponible">Sin ejemplares disponibles</option>
            </select>
          </div>
        </div>

        {/* Mostrar filtros activos */}
        {(busqueda ||
          filtroCategoria ||
          filtroDisponibilidad ||
          filtroAutor) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {librosFiltrados.length} resultado(s) encontrado(s)
            </span>
            <Link
              href="/libros"
              className="text-xs text-red-500 hover:underline"
            >
              Limpiar filtros
            </Link>
          </div>
        )}
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
              <th className="px-4 py-3 text-left">Días préstamo</th>
              <th className="px-4 py-3 text-left">Ejemplares</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <TablaLibros libros={librosFiltrados} esAdmin={esAdmin} />
        </table>
      </div>
    </div>
  );
}
