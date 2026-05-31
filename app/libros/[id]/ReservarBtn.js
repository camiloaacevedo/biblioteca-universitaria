'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearReservaAction } from '@/app/reservas/actions';

export default function ReservarBtn({ usuarioId, ejemplares }) {
  const [ejemplarId, setEjemplarId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);
  const router = useRouter();

  const prestados = ejemplares?.filter((e) => e.estado === 'prestado') || [];

  if (prestados.length === 0) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ejemplarId) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('usuario_id', usuarioId);
    formData.append('ejemplar_id', ejemplarId);
    const result = await crearReservaAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setExito(true);
      setTimeout(() => router.push('/reservas'), 1500);
    }
  }

  if (exito) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700 text-center">
        ✅ Reserva creada correctamente. Redirigiendo...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-4 border-t pt-4">
      <h3 className="font-medium text-gray-700">🔖 Reservar ejemplar</h3>
      <p className="text-xs text-gray-400">
        Todos los ejemplares están prestados. Puedes reservar uno para cuando
        esté disponible.
      </p>

      <select
        value={ejemplarId}
        onChange={(e) => setEjemplarId(e.target.value)}
        required
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      >
        <option value="">Selecciona un ejemplar...</option>
        {prestados.map((e) => (
          <option key={e.id} value={e.id}>
            {e.codigo_barras} {e.ubicacion ? `— ${e.ubicacion}` : ''}
          </option>
        ))}
      </select>

      {error && (
        <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm">
          ⚠️ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !ejemplarId}
        className="w-full bg-yellow-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {loading ? 'Reservando...' : '🔖 Confirmar reserva'}
      </button>
      <p className="text-xs text-gray-400 text-center">
        La reserva expira en 48 horas
      </p>
    </form>
  );
}
