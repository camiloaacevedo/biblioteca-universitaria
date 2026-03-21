'use client';

import Link from 'next/link';
import { eliminarEjemplarAction } from './actions';

export default function TablaEjemplares({ ejemplares, esAdmin }) {
  return (
    <tbody className="divide-y divide-gray-100">
      {ejemplares?.length === 0 && (
        <tr>
          <td colSpan={6} className="text-center py-8 text-gray-400">
            No hay ejemplares registrados
          </td>
        </tr>
      )}
      {ejemplares?.map((ej) => (
        <tr key={ej.id} className="hover:bg-gray-50">
          <td className="px-4 py-3 text-gray-400 text-xs">#{ej.id}</td>
          <td className="px-4 py-3 font-mono text-xs">{ej.codigo_barras}</td>
          <td className="px-4 py-3">
            <div>
              <p className="font-medium">{ej.libros?.titulo}</p>
              <p className="text-xs text-gray-400 font-mono">
                {ej.libros?.isbn}
              </p>
            </div>
          </td>
          <td className="px-4 py-3 text-gray-600">{ej.ubicacion || '—'}</td>
          <td className="px-4 py-3">
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
          {esAdmin && (
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <Link
                  href={`/ejemplares/${ej.id}/editar`}
                  className="text-yellow-600 hover:underline"
                >
                  Editar
                </Link>
                <button
                  onClick={async () => {
                    if (!confirm('¿Eliminar este ejemplar?')) return;
                    const formData = new FormData();
                    formData.append('id', ej.id);
                    const result = await eliminarEjemplarAction(formData);
                    if (result?.error) alert(result.error);
                  }}
                  className="text-red-600 hover:underline cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </td>
          )}
        </tr>
      ))}
    </tbody>
  );
}
