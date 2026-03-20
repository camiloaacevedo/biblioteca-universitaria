import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  const esAdmin = usuario?.rol === 'bibliotecario'

  // Stats comunes
  const { count: totalLibros } = await supabase
    .from('libros')
    .select('*', { count: 'exact', head: true })

  const { count: totalEjemplares } = await supabase
    .from('ejemplares')
    .select('*', { count: 'exact', head: true })

  // Préstamos activos — admin ve todos, estudiante solo los suyos
  let queryPrestamos = supabase
    .from('prestamos')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'aprobado')

  if (!esAdmin) {
    queryPrestamos = queryPrestamos.eq('usuario_id', usuario.id)
  }

  const { count: prestamosActivos } = await queryPrestamos

  // Total usuarios — solo admin
  let totalUsuarios = null
  if (esAdmin) {
    const { count } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
    totalUsuarios = count
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Bienvenido, {usuario?.nombres} 👋
      </h1>
      <p className="text-gray-500 mb-8">Panel de control — Biblioteca Universitaria</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TarjetaStat titulo="Total Libros" valor={totalLibros ?? 0} icono="📚" color="blue" />
        <TarjetaStat titulo="Ejemplares" valor={totalEjemplares ?? 0} icono="📖" color="green" />
        <TarjetaStat
          titulo={esAdmin ? 'Préstamos Activos' : 'Mis Préstamos Activos'}
          valor={prestamosActivos ?? 0}
          icono="🔄"
          color="yellow"
        />
        {esAdmin && (
          <TarjetaStat titulo="Usuarios" valor={totalUsuarios ?? 0} icono="👥" color="purple" />
        )}
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