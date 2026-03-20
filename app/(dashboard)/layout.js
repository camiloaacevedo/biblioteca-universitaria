import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logoutAction } from '@/app/(auth)/actions'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  const esAdmin = usuario?.rol === 'bibliotecario'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-blue-700 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="text-xl font-bold">
            📚 Biblioteca
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/libros" className="hover:text-blue-200 transition">Libros</Link>
            <Link href="/ejemplares" className="hover:text-blue-200 transition">Ejemplares</Link>
            <Link href="/usuarios" className="hover:text-blue-200 transition">Usuarios</Link>
            <Link href="/prestamos" className="hover:text-blue-200 transition">Préstamos</Link>
            {esAdmin && (
              <Link href="/reportes" className="hover:text-blue-200 transition">Reportes</Link>
            )}
            <span className="text-blue-200">|</span>
            <span className="text-blue-200">{usuario?.nombres} ({usuario?.rol})</span>
            <form action={logoutAction}>
              <button className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition">
                Salir
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}