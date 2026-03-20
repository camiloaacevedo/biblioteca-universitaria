import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_id', (await supabase.auth.getUser()).data.user.id)
    .single()

  const { count: totalLibros } = await supabase
    .from('libros')
    .select('*', { count: 'exact', head: true })

  const { count: totalEjemplares } = await supabase
    .from('ejemplares')
    .select('*', { count: 'exact', head: true })

  const { count: prestamosActivos } = await supabase
    .from('prestamos')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'aprobado')

  const { count: totalUsuarios } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact', head: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Bienvenido, {usuario?.nombres} 👋
      </h1>
      <p className="text-gray-500 mb-8">Panel de control — Biblioteca Universitaria</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TarjetaStat titulo="Total Libros" valor={totalLibros ?? 0} icono="📚" color="blue" />
        <TarjetaStat titulo="Ejemplares" valor={totalEjemplares ?? 0} icono="📖" color="green" />
        <TarjetaStat titulo="Préstamos Activos" valor={prestamosActivos ?? 0} icono="🔄" color="yellow" />
        <TarjetaStat titulo="Usuarios" valor={totalUsuarios ?? 0} icono="👥" color="purple" />
      </div>
    </div>
  )
}

function TarjetaStat({ titulo, valor, icono, color }) {
  const colores = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  }
  return (
    <div className={`rounded-xl border p-6 ${colores[color]}`}>
      <div className="text-3xl mb-2">{icono}</div>
      <div className="text-3xl font-bold">{valor}</div>
      <div className="text-sm font-medium mt-1">{titulo}</div>
    </div>
  )
}