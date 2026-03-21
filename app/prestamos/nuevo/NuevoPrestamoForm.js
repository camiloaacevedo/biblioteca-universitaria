'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { solicitarPrestamoAction } from '../actions'
import Link from 'next/link'

export default function NuevoPrestamoForm({ usuarios, libros, usuarioActual, esAdmin }) {
  const [libroSeleccionado, setLibroSeleccionado] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const ejemplaresDisponibles = libros
    ?.find(l => l.id === parseInt(libroSeleccionado))
    ?.ejemplares?.filter(e => e.estado === 'disponible') || []

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.target)
    await solicitarPrestamoAction(formData)
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Usuario */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Usuario *</label>
          {esAdmin ? (
            <select name="usuario_id" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecciona un usuario</option>
              {usuarios?.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nombres} — {u.codigo}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input type="hidden" name="usuario_id" value={usuarioActual.id} />
              <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-gray-700">
                {usuarioActual.nombres} — {usuarioActual.codigo}
              </div>
            </>
          )}
        </div>

        {/* Libro */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Libro *</label>
          <select
            value={libroSeleccionado}
            onChange={e => setLibroSeleccionado(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Selecciona un libro</option>
            {libros?.map(l => {
              const disponibles = l.ejemplares?.filter(e => e.estado === 'disponible').length ?? 0
              return (
                <option key={l.id} value={l.id} disabled={disponibles === 0}>
                  {l.titulo} {disponibles === 0 ? '(sin ejemplares disponibles)' : `(${disponibles} disponible${disponibles > 1 ? 's' : ''})`}
                </option>
              )
            })}
          </select>
        </div>

        {/* Ejemplar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ejemplar *</label>
          {!libroSeleccionado ? (
            <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-gray-400 text-sm">
              Primero selecciona un libro
            </div>
          ) : ejemplaresDisponibles.length === 0 ? (
            <div className="w-full border border-red-200 bg-red-50 rounded-lg px-3 py-2 text-red-500 text-sm">
              No hay ejemplares disponibles para este libro
            </div>
          ) : (
            <select name="ejemplar_id" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecciona un ejemplar</option>
              {ejemplaresDisponibles.map(e => (
                <option key={e.id} value={e.id}>
                  {e.codigo_barras} {e.ubicacion ? `— ${e.ubicacion}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          ℹ️ La solicitud quedará en estado <strong>pendiente</strong> hasta que un bibliotecario la apruebe.
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !libroSeleccionado || ejemplaresDisponibles.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {loading && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {loading ? 'Enviando solicitud...' : 'Enviar Solicitud'}
          </button>
          <Link href="/prestamos"
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}