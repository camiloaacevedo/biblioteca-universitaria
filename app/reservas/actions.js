'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function crearReservaAction(formData) {
  const supabase = await createClient();

  const usuario_id = formData.get('usuario_id');
  const ejemplar_id = formData.get('ejemplar_id');

  // Verificar que el usuario esté activo
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('estado')
    .eq('id', usuario_id)
    .single();

  if (!usuario || usuario.estado !== 'activo') {
    return { error: 'El usuario está bloqueado o no existe' };
  }

  // Verificar que el ejemplar esté prestado (solo se reservan ejemplares prestados)
  const { data: ejemplar } = await supabase
    .from('ejemplares')
    .select('estado')
    .eq('id', ejemplar_id)
    .single();

  if (!ejemplar || ejemplar.estado === 'disponible') {
    return {
      error: 'El ejemplar está disponible, puedes solicitarlo directamente',
    };
  }

  if (ejemplar.estado === 'perdido') {
    return { error: 'Este ejemplar está marcado como perdido' };
  }

  // Verificar multas pendientes
  const { data: multasPendientes } = await supabase
    .from('prestamos')
    .select('id, multa')
    .eq('usuario_id', usuario_id)
    .eq('estado', 'devuelto')
    .gt('multa', 0);

  if (multasPendientes?.length > 0) {
    const totalMulta = multasPendientes.reduce((acc, p) => acc + p.multa, 0);
    return {
      error: `Tienes multas pendientes por $${totalMulta.toLocaleString('es-CO')}`,
    };
  }

  // Verificar que no tenga ya una reserva activa del mismo ejemplar
  const { data: reservaExistente } = await supabase
    .from('reservas')
    .select('id')
    .eq('usuario_id', usuario_id)
    .eq('ejemplar_id', ejemplar_id)
    .eq('estado', 'activa')
    .single();

  if (reservaExistente) {
    return { error: 'Ya tienes una reserva activa para este ejemplar' };
  }

  // Crear reserva con expiración de 48 horas
  const fechaExpiracion = new Date();
  fechaExpiracion.setHours(fechaExpiracion.getHours() + 48);

  const { error } = await supabase.from('reservas').insert({
    usuario_id,
    ejemplar_id,
    fecha_expiracion: fechaExpiracion.toISOString(),
    estado: 'activa',
  });

  if (error) return { error: error.message };
  redirect('/reservas');
}

export async function cancelarReservaAction(formData) {
  const supabase = await createClient();
  const id = formData.get('id');

  await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', id);

  redirect('/reservas');
}

export async function convertirReservaEnPrestamoAction(formData) {
  const supabase = await createClient();
  const reserva_id = formData.get('reserva_id');
  const usuario_id = formData.get('usuario_id');
  const ejemplar_id = formData.get('ejemplar_id');

  // Obtener días de préstamo del libro
  const { data: ejemplar } = await supabase
    .from('ejemplares')
    .select('libro_id, libros(dias_prestamo)')
    .eq('id', ejemplar_id)
    .single();

  const diasPrestamo = ejemplar?.libros?.dias_prestamo || 8;
  const fechaPrestamo = new Date();
  const fechaVencimiento = new Date();
  fechaVencimiento.setDate(fechaVencimiento.getDate() + diasPrestamo);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: bibliotecario } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  // Crear préstamo directamente aprobado
  const { error } = await supabase.from('prestamos').insert({
    usuario_id,
    ejemplar_id,
    bibliotecario_id: bibliotecario.id,
    estado: 'aprobado',
    fecha_prestamo: fechaPrestamo.toISOString(),
    fecha_vencimiento: fechaVencimiento.toISOString(),
  });

  if (error) return { error: error.message };

  // Marcar ejemplar como prestado
  await supabase
    .from('ejemplares')
    .update({ estado: 'prestado' })
    .eq('id', ejemplar_id);

  // Marcar reserva como completada
  await supabase
    .from('reservas')
    .update({ estado: 'completada' })
    .eq('id', reserva_id);

  redirect('/prestamos');
}
