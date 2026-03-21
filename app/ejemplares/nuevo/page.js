export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { crearEjemplarAction } from '../actions';
import Link from 'next/link';
import BotonSubmit from '@/app/components/BotonSubmit'

export default async function NuevoEjemplarPage({ searchParams }) {
  const supabase = await createClient();
  const params = await searchParams;
  const libro_id = params?.libro_id || '';

  const { data: libros } = await supabase
    .from('libros')
    .select('id, titulo')
    .order('titulo');

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={libro_id ? `/libros/${libro_id}` : '/ejemplares'}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Nuevo Ejemplar</h1>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <form action={crearEjemplarAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Libro *
            </label>
            <select
              name="libro_id"
              required
              defaultValue={libro_id}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un libro</option>
              {libros?.map((lib) => (
                <option key={lib.id} value={lib.id}>
                  {lib.titulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de barras *
            </label>
            <input
              type="text"
              name="codigo_barras"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="EJ-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <input
              type="text"
              name="ubicacion"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Sala A, Estante 3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              name="estado"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="disponible">Disponible</option>
              <option value="prestado">Prestado</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <BotonSubmit
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              pendingText="Guardando..."
            >
              Guardar
            </BotonSubmit>
            <Link
              href={libro_id ? `/libros/${libro_id}` : '/ejemplares'}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
