export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { crearLibroAction } from '../actions';
import Link from 'next/link';
import BotonSubmit from '@/app/components/BotonSubmit'

export default async function NuevoLibroPage() {
  const supabase = await createClient();
  const { data: categorias } = await supabase
    .from('categorias')
    .select('*')
    .order('nombre');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/libros" className="text-gray-500 hover:text-gray-700">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Nuevo Libro</h1>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <form action={crearLibroAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ISBN *
              </label>
              <input
                type="text"
                name="isbn"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="978-3-16-148410-0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año *
              </label>
              <input
                type="number"
                name="anio"
                required
                min="1800"
                max="2100"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2024"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              name="titulo"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Título del libro"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Autores *{' '}
              <span className="text-gray-400 font-normal">
                (separados por coma)
              </span>
            </label>
            <input
              type="text"
              name="autores"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Juan García, María López"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Editorial *
              </label>
              <input
                type="text"
                name="editorial"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Editorial Norma"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                name="categoria_id"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona una categoría</option>
                {categorias?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción del libro..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <BotonSubmit
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              pendingText="Guardando libro..."
            >
              Guardar Libro
            </BotonSubmit>
            <Link
              href="/libros"
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
