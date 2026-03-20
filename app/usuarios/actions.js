'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function crearUsuarioAction(formData) {
  const supabase = await createClient()

  const correo = formData.get('correo')
  const password = formData.get('password')
  const nombres = formData.get('nombres')
  const codigo = formData.get('codigo')
  const identificacion = formData.get('identificacion')
  const rol = formData.get('rol')
  const carrera = formData.get('carrera')

  // 1. Crear en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: correo,
    password: password,
  })

  if (authError) return { error: authError.message }

  // 2. Insertar en tabla usuarios
  const { error: dbError } = await supabase.from('usuarios').insert({
    auth_id: authData.user.id,
    codigo,
    identificacion,
    nombres,
    correo,
    rol,
    carrera: carrera || null,
  })

  if (dbError) return { error: dbError.message }

  redirect('/usuarios')
}

export async function editarUsuarioAction(formData) {
  const supabase = await createClient()
  const id = formData.get('id')

  const { error } = await supabase
    .from('usuarios')
    .update({
      nombres: formData.get('nombres'),
      codigo: formData.get('codigo'),
      identificacion: formData.get('identificacion'),
      rol: formData.get('rol'),
      carrera: formData.get('carrera') || null,
      estado: formData.get('estado'),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  redirect('/usuarios')
}

export async function toggleEstadoAction(formData) {
  const supabase = await createClient()
  const id = formData.get('id')
  const estadoActual = formData.get('estado')
  const nuevoEstado = estadoActual === 'activo' ? 'bloqueado' : 'activo'

  await supabase.from('usuarios').update({ estado: nuevoEstado }).eq('id', id)
  redirect('/usuarios')
}