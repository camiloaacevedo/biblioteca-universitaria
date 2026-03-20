export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { registrarDevolucionAction } from '../actions'

export default async function DetallePrestamoPage({ params }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: prestamo } = await supabase
    .from('prestamos')
    .select(`
      *,
      usuarios!prestamos_usuario_id_fkey(nombres, codigo, correo),
      ejemplares(codigo_barras, ubicacion, libros(titulo, isbn))
    `)
    .eq('id', id)
    .single()

  if (!prestamo) notFound()

  // Obtener rol del usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuarioActual } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('auth_id', user.id)
    .single()

  const esAdmin = usuarioActual?.rol === 'bibliotecario'

  const ahora = new Date()
  const vencimiento = prestamo.fecha_vencimiento ? new Date(prestamo.fecha_vencimiento) : null
  const estaVencido = vencimiento && ahora > vencimiento
  const diasRetraso = estaVencido
    ? Math.ceil((ahora - vencimiento) / (1000 * 60 * 60 * 24))
    : 0

  const { data: config } = await supabase
    .from('configuracion')
    .select('tarifa_multa_dia')
    .single()

  const multaEstimada = diasRetraso * (config?.tarifa_multa_dia || 500)

  const coloresEstado = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobado: 'bg-blue-100 text-blue-700',
    devuelto: 'bg-green-100 text-green-700',
    vencido: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/prestamos" className="text-gray-500 hover:text-gray-700">← Volver</Link>
        <h1 className="text-2xl font-bold text-gray-800">Préstamo #{prestamo.id}</h1>
      </div>

      {/* Info del préstamo */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4 mb-6">
        <div className="flex justify-between items-center border-b pb-3">
          <span className="text-gray-500 text-sm">Estado</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${coloresEstado[prestamo.estado]}`}>
            {prestamo.estado}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">Usuario</p>
            <p className="font-medium">{prestamo.usuarios?.nombres}</p>
            <p className="text-gray-400 font-mono text-xs">{prestamo.usuarios?.codigo}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Correo</p>
            <p>{prestamo.usuarios?.correo}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Libro</p>
            <p className="font-medium">{prestamo.ejemplares?.libros?.titulo}</p>
            <p className="text-gray-400 font-mono text-xs">{prestamo.ejemplares?.libros?.isbn}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Ejemplar</p>
            <p className="font-mono">{prestamo.ejemplares?.codigo_barras}</p>
            <p className="text-gray-400 text-xs">{prestamo.ejemplares?.ubicacion || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Fecha solicitud</p>
            <p>{new Date(prestamo.created_at).toLocaleDateString('es-CO')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Fecha préstamo</p>
            <p>{prestamo.fecha_prestamo
              ? new Date(prestamo.fecha_prestamo).toLocaleDateString('es-CO')
              : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Fecha vencimiento</p>
            <p className={estaVencido ? 'text-red-600 font-bold' : ''}>
              {vencimiento ? vencimiento.toLocaleDateString('es-CO') : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Fecha devolución</p>
            <p>{prestamo.fecha_devolucion
              ? new Date(prestamo.fecha_devolucion).toLocaleDateString('es-CO')
              : '—'}</p>
          </div>
        </div>

        {prestamo.multa > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-bold">
              Multa: ${prestamo.multa.toLocaleString('es-CO')}
            </p>
          </div>
        )}

        {prestamo.observaciones && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Observaciones</p>
            <p className="text-yellow-800">{prestamo.observaciones}</p>
          </div>
        )}
      </div>

      {/* Formulario de devolución — solo si es admin y está aprobado */}
      {esAdmin && prestamo.estado === 'aprobado' && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4">📦 Registrar Devolución</h2>

          {estaVencido && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 font-medium text-sm">
                ⚠️ Préstamo vencido — {diasRetraso} día(s) de retraso
              </p>
              <p className="text-red-600 text-lg font-bold mt-1">
                Multa estimada: ${multaEstimada.toLocaleString('es-CO')}
              </p>
              <p className="text-red-500 text-xs mt-1">
                Tarifa: ${config?.tarifa_multa_dia?.toLocaleString('es-CO')} por día
              </p>
            </div>
          )}

          <form action={registrarDevolucionAction} className="space-y-4">
            <input type="hidden" name="id" value={prestamo.id} />
            <input type="hidden" name="ejemplar_id" value={prestamo.ejemplar_id} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones del ejemplar
              </label>
              <select name="observaciones"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Buen estado</option>
                <option value="dañado">Dañado</option>
                <option value="páginas faltantes">Páginas faltantes</option>
                <option value="manchas">Manchas</option>
                <option value="cubierta deteriorada">Cubierta deteriorada</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                ✅ Confirmar Devolución
              </button>
              <Link href="/prestamos"
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition">
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}