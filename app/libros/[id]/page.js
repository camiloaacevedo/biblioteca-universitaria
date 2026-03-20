export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function DetalleLibroPage({ params }) {
  const supabase = await createClient();
  const { id } = await params;

  // Verificar rol del usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: usuarioActual } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('auth_id', user.id)
    .single();

  const esAdmin = usuarioActual?.rol === 'bibliotecario';

  const { data: libro } = await supabase
    .from('libros')
    .select(
      `
      *,
      categorias(nombre),
      libro_autores(autores(nombre)),
      ejemplares(*)
    `,
    )
    .eq('id', id)
    .single();

  if (!libro) notFound();

  const autores =
    libro.libro_autores?.map((la) => la.autores?.nombre).join(', ') || '—';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/libros" className="text-gray-500 hover:text-gray-700">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">{libro.titulo}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-xl shadow p-6 space-y-3">
          <h2 className="font-bold text-gray-700 border-b pb-2">Información</h2>
          <div>
            <p className="text-xs text-gray-400">ISBN</p>
            <p className="font-mono text-sm">{libro.isbn}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Autores</p>
            <p className="text-sm">{autores}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Editorial</p>
            <p className="text-sm">{libro.editorial || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Año</p>
            <p className="text-sm">{libro.anio || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Categoría</p>
            <p className="text-sm">{libro.categorias?.nombre || '—'}</p>
          </div>
          {libro.descripcion && (
            <div>
              <p className="text-xs text-gray-400">Descripción</p>
              <p className="text-sm text-gray-600">{libro.descripcion}</p>
            </div>
          )}
          {esAdmin && (
            <Link
              href={`/libros/${libro.id}/editar`}
              className="block text-center bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition mt-4"
            >
              ✏️ Editar libro
            </Link>
          )}
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700">Ejemplares físicos</h2>
            {esAdmin && (
              <Link
                href={`/ejemplares/nuevo?libro_id=${libro.id}`}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition"
              >
                + Agregar ejemplar
              </Link>
            )}
          </div>

          {libro.ejemplares?.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No hay ejemplares registrados
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Código</th>
                  <th className="px-3 py-2 text-left">Ubicación</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {libro.ejemplares?.map((ej) => (
                  <tr key={ej.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs">
                      {ej.codigo_barras}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {ej.ubicacion || '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ej.estado === 'disponible'
                            ? 'bg-green-100 text-green-700'
                            : ej.estado === 'prestado'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {ej.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
