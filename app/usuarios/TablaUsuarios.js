'use client'

import Link from 'next/link'
import { toggleEstadoAction } from './actions'

export default function TablaUsuarios({ usuarios }) {
  return (
    <tbody className="divide-y divide-gray-100">
      {usuarios?.length === 0 && (
        <tr>
          <td colSpan={7} className="text-center py-8 text-gray-400">
            No hay usuarios registrados
          </td>
        </tr>
      )}
      {usuarios?.map((usuario) => (
        <tr key={usuario.id} className="hover:bg-gray-50">
          <td className="px-4 py-3 font-mono text-xs">{usuario.codigo}</td>
          <td className="px-4 py-3 font-medium">{usuario.nombres}</td>
          <td className="px-4 py-3 text-gray-600">{usuario.correo}</td>
          <td className="px-4 py-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              usuario.rol === 'bibliotecario' ? 'bg-purple-100 text-purple-700' :
              usuario.rol === 'docente' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {usuario.rol}
            </span>
          </td>
          <td className="px-4 py-3 text-gray-600">{usuario.carrera || '—'}</td>
          <td className="px-4 py-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              usuario.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {usuario.estado}
            </span>
          </td>
          <td className="px-4 py-3">
            <div className="flex gap-2">
              <Link href={`/usuarios/${usuario.id}`}
                className="text-blue-600 hover:underline">Ver</Link>
              <Link href={`/usuarios/${usuario.id}/editar`}
                className="text-yellow-600 hover:underline">Editar</Link>
              <button
                onClick={async () => {
                  const accion = usuario.estado === 'activo' ? 'bloquear' : 'activar'
                  if (!confirm(`¿${accion} este usuario?`)) return
                  const formData = new FormData()
                  formData.append('id', usuario.id)
                  formData.append('estado', usuario.estado)
                  await toggleEstadoAction(formData)
                }}
                className={`hover:underline cursor-pointer ${
                  usuario.estado === 'activo' ? 'text-red-600' : 'text-green-600'
                }`}>
                {usuario.estado === 'activo' ? 'Bloquear' : 'Activar'}
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  )
}