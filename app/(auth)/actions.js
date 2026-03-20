'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('correo'),
    password: formData.get('password'),
  });

  if (error) {
    return { error: 'Correo o contraseña incorrectos' };
  }

  redirect('/dashboard');
}

export async function registroAction(formData) {
  const supabase = await createClient();

  const correo = formData.get('correo');
  const password = formData.get('password');
  const nombres = formData.get('nombres');
  const codigo = formData.get('codigo');
  const identificacion = formData.get('identificacion');
  const rol = formData.get('rol');
  const carrera = formData.get('carrera');

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: correo,
    password: password,
  });

  if (authError) {
    return { error: authError.message };
  }

  // 2. Insertar datos adicionales en nuestra tabla usuarios
  const { error: dbError } = await supabase.from('usuarios').insert({
    auth_id: authData.user.id,
    codigo,
    identificacion,
    nombres,
    correo,
    rol,
    carrera: carrera || null,
  });

  if (dbError) {
    return { error: dbError.message };
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
