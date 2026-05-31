export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  const esAdmin = usuario?.rol === 'bibliotecario';

  // Stats comunes
  const { count: totalLibros } = await supabase
    .from('libros')
    .select('*', { count: 'exact', head: true });

  const { count: totalEjemplares } = await supabase
    .from('ejemplares')
    .select('*', { count: 'exact', head: true });

  // Préstamos activos
  let queryPrestamos = supabase
    .from('prestamos')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'aprobado');

  if (!esAdmin) {
    queryPrestamos = queryPrestamos.eq('usuario_id', usuario.id);
  }

  const { count: prestamosActivos } = await queryPrestamos;

  // Total usuarios — solo admin
  let totalUsuarios = null;
  if (esAdmin) {
    const { count } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true });
    totalUsuarios = count;
  }

  // Alertas de vencimiento — préstamos que vencen en 2 días o ya vencidos
  const hoy = new Date();
  const en2dias = new Date();
  en2dias.setDate(en2dias.getDate() + 2);

  let queryAlertas = supabase
    .from('prestamos')
    .select(
      `
      *,
      ejemplares(codigo_barras, libros(titulo))
    `,
    )
    .eq('estado', 'aprobado')
    .lte('fecha_vencimiento', en2dias.toISOString())
    .order('fecha_vencimiento');

  if (!esAdmin) {
    queryAlertas = queryAlertas.eq('usuario_id', usuario.id);
  }

  const { data: alertas } = await queryAlertas;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Bienvenido, {usuario?.nombres} 👋
      </h1>
      <p className="text-gray-500 mb-6">
        Panel de control — Biblioteca Universitaria
      </p>

      {/* Alertas de vencimiento */}
      {alertas && alertas.length > 0 && (
        <div className="mb-6 space-y-2">
          {alertas.map((p) => {
            const vencido = new Date(p.fecha_vencimiento) < hoy;
            return (
              <div
                key={p.id}
                className={`rounded-xl p-4 flex justify-between items-center ${
                  vencido
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <div>
                  <p
                    className={`font-medium text-sm ${vencido ? 'text-red-700' : 'text-yellow-700'}`}
                  >
                    {vencido ? '🚨 Préstamo vencido' : '⚠️ Préstamo por vencer'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {p.ejemplares?.libros?.titulo} — vence el{' '}
                    {new Date(p.fecha_vencimiento).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <Link
                  href={`/prestamos/${p.id}`}
                  className={`text-xs font-medium px-3 py-1 rounded-lg ${
                    vencido
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  } transition`}
                >
                  Ver préstamo
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Tarjetas de stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TarjetaStat
          titulo="Total Libros"
          valor={totalLibros ?? 0}
          icono="📚"
          color="blue"
        />
        <TarjetaStat
          titulo="Ejemplares"
          valor={totalEjemplares ?? 0}
          icono="📖"
          color="green"
        />
        <TarjetaStat
          titulo={esAdmin ? 'Préstamos Activos' : 'Mis Préstamos Activos'}
          valor={prestamosActivos ?? 0}
          icono="🔄"
          color="yellow"
        />
        {esAdmin && (
          <TarjetaStat
            titulo="Usuarios"
            valor={totalUsuarios ?? 0}
            icono="👥"
            color="purple"
          />
        )}
      </div>
    </div>
  );
}

function TarjetaStat({ titulo, valor, icono, color }) {
  const colores = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };
  return (
    <div className={`rounded-xl border p-6 ${colores[color]}`}>
      <div className="text-3xl mb-2">{icono}</div>
      <div className="text-3xl font-bold">{valor}</div>
      <div className="text-sm font-medium mt-1">{titulo}</div>
    </div>
  );
}
