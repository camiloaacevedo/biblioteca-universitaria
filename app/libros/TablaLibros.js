'use client';

import Link from 'next/link';
import { eliminarLibroAction } from './actions';

export default function TablaLibros({ libros, esAdmin }) {
  return (
    <tbody className="divide-y divide-gray-100">
      {libros?.length === 0 && (
        <tr>
          <td colSpan={6} className="text-center py-8 text-gray-400">
            No hay libros registrados
          </td>
        </tr>
      )}
      {libros?.map((libro) => {
        const disponibles =
          libro.ejemplares?.filter((e) => e.estado === 'disponible').length ??
          0;
        const total = libro.ejemplares?.length ?? 0;
        const autores =
          libro.libro_autores?.map((la) => la.autores?.nombre).join(', ') ||
          '—';
        return (
          <tr key={libro.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-mono text-xs">{libro.isbn}</td>
            <td className="px-4 py-3 font-medium">{libro.titulo}</td>
            <td className="px-4 py-3 text-gray-600">{autores}</td>
            <td className="px-4 py-3 text-gray-600">
              {libro.categorias?.nombre || '—'}
            </td>
            <td className="px-4 py-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  disponibles > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {disponibles}/{total} disp.
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <Link
                  href={`/libros/${libro.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Ver
                </Link>
                {esAdmin && (
                  <>
                    <Link
                      href={`/libros/${libro.id}/editar`}
                      className="text-yellow-600 hover:underline"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={async () => {
                        if (!confirm('¿Eliminar este libro?')) return;
                        const formData = new FormData();
                        formData.append('id', libro.id);
                        const result = await eliminarLibroAction(formData);
                        if (result?.error) alert(result.error);
                      }}
                      className="text-red-600 hover:underline cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}
