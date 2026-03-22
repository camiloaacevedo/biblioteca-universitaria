export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NuevoPrestamoForm from './NuevoPrestamoForm'
import Link from 'next/link'

export default async function NuevoPrestamoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: usuarioActual } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  const esAdmin = usuarioActual?.rol === 'bibliotecario';

  // Después de obtener usuarioActual
  if (usuarioActual?.rol === 'bibliotecario') {
    redirect('/prestamos');
  }

  const usuarios = esAdmin
    ? (
        await supabase
          .from('usuarios')
          .select('id, nombres, codigo')
          .eq('estado', 'activo')
          .order('nombres')
      ).data
    : [usuarioActual];

  const { data: libros } = await supabase
    .from('libros')
    .select(
      `
      id, titulo,
      ejemplares(id, codigo_barras, ubicacion, estado)
    `,
    )
    .order('titulo');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/prestamos" className="text-gray-500 hover:text-gray-700">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Solicitar Préstamo</h1>
      </div>
      <NuevoPrestamoForm
        usuarios={usuarios}
        libros={libros}
        usuarioActual={usuarioActual}
        esAdmin={esAdmin}
      />
    </div>
  );
}
