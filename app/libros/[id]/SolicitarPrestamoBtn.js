'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { solicitarPrestamoAction } from '@/app/prestamos/actions'

export default function SolicitarPrestamoBtn({ usuarioId, ejemplares }) {
  const [ejemplarId, setEjemplarId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(false)
  const router = useRouter()

  const disponibles = ejemplares?.filter(e => e.estado === 'disponible') || []

  if (disponibles.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600 text-center">
        No hay ejemplares disponibles para este libro
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!ejemplarId) return
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('usuario_id', usuarioId)
    formData.append('ejemplar_id', ejemplarId)
    const result = await solicitarPrestamoAction(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setExito(true)
      setTimeout(() => router.push('/prestamos'), 1500)
    }
  }

  if (exito) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700 text-center">
        ✅ Solicitud enviada correctamente. Redirigiendo...
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Selecciona un ejemplar
        </label>
        <select
          value={ejemplarId}
          onChange={e => setEjemplarId(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
          <option value="">Selecciona un ejemplar...</option>
          {disponibles.map(e => (
            <option key={e.id} value={e.id}>
              {e.codigo_barras} {e.ubicacion ? `— ${e.ubicacion}` : ''}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm">
          ⚠️ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !ejemplarId}
        className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {loading && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
        {loading ? 'Enviando...' : '📖 Solicitar préstamo'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        La solicitud quedará pendiente hasta que un bibliotecario la apruebe
      </p>
    </form>
  )
}