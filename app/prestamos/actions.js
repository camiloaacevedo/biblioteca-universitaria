'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function solicitarPrestamoAction(formData) {
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

  // Verificar si tiene multas pendientes
  const { data: multasPendientes } = await supabase
    .from('prestamos')
    .select('id, multa')
    .eq('usuario_id', usuario_id)
    .eq('estado', 'devuelto')
    .gt('multa', 0);

  if (multasPendientes?.length > 0) {
    const totalMulta = multasPendientes.reduce((acc, p) => acc + p.multa, 0);
    return {
      error: `El usuario tiene multas pendientes por $${totalMulta.toLocaleString('es-CO')}. Debe pagarlas antes de solicitar un nuevo préstamo.`,
    };
  }

  // Validar que el ejemplar esté disponible
  const { data: ejemplar } = await supabase
    .from('ejemplares')
    .select('estado')
    .eq('id', ejemplar_id)
    .single();

  if (!ejemplar || ejemplar.estado !== 'disponible') {
    return { error: 'El ejemplar no está disponible' };
  }

  // Verificar que no tenga ya una solicitud pendiente del mismo ejemplar
  const { data: prestamoPendiente } = await supabase
    .from('prestamos')
    .select('id')
    .eq('usuario_id', usuario_id)
    .eq('ejemplar_id', ejemplar_id)
    .eq('estado', 'pendiente')
    .single();

  if (prestamoPendiente) {
    return { error: 'Ya tienes una solicitud pendiente para este ejemplar' };
  }

  // Crear el préstamo en estado pendiente
  const { error } = await supabase.from('prestamos').insert({
    usuario_id,
    ejemplar_id,
    estado: 'pendiente',
  });

  if (error) return { error: error.message };

  // Verificar si el ejemplar tiene reservas activas de otros usuarios
  const { data: reservaAjena } = await supabase
    .from('reservas')
    .select('id, usuario_id')
    .eq('ejemplar_id', ejemplar_id)
    .eq('estado', 'activa')
    .neq('usuario_id', usuario_id)
    .limit(1);

  if (reservaAjena?.length > 0) {
    return {
      error:
        'Este ejemplar tiene una reserva activa de otro usuario. Puedes reservarlo para la siguiente disponibilidad.',
    };
  }
  redirect('/prestamos');
}

export async function aprobarPrestamoAction(formData) {
  const supabase = await createClient();
  const id = formData.get('id');
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

  // Verificar reservas activas de otros usuarios
  const { data: prestamo } = await supabase
    .from('prestamos')
    .select('usuario_id')
    .eq('id', id)
    .single();

  const { data: reservaAjena } = await supabase
    .from('reservas')
    .select('id')
    .eq('ejemplar_id', ejemplar_id)
    .eq('estado', 'activa')
    .neq('usuario_id', prestamo.usuario_id)
    .limit(1);

  if (reservaAjena?.length > 0) {
    return {
      error:
        'Este ejemplar tiene una reserva activa. Convierta la reserva en préstamo desde la sección de Reservas.',
    };
  }

  await supabase
    .from('prestamos')
    .update({
      estado: 'aprobado',
      fecha_prestamo: fechaPrestamo.toISOString(),
      fecha_vencimiento: fechaVencimiento.toISOString(),
      bibliotecario_id: bibliotecario.id,
    })
    .eq('id', id);

  await supabase
    .from('ejemplares')
    .update({ estado: 'prestado' })
    .eq('id', ejemplar_id);

  redirect('/prestamos');
}

export async function registrarDevolucionAction(formData) {
  const supabase = await createClient();
  const id = formData.get('id');
  const ejemplar_id = formData.get('ejemplar_id');
  const observaciones = formData.get('observaciones');

  const { data: prestamo } = await supabase
    .from('prestamos')
    .select('fecha_vencimiento')
    .eq('id', id)
    .single();

  const { data: config } = await supabase
    .from('configuracion')
    .select('tarifa_multa_dia')
    .single();

  const ahora = new Date();
  const vencimiento = new Date(prestamo.fecha_vencimiento);
  let multa = 0;

  if (ahora > vencimiento) {
    const diasRetraso = Math.ceil(
      (ahora - vencimiento) / (1000 * 60 * 60 * 24),
    );
    multa = diasRetraso * (config?.tarifa_multa_dia || 500);
  }

  await supabase
    .from('prestamos')
    .update({
      estado: 'devuelto',
      fecha_devolucion: ahora.toISOString(),
      multa,
      observaciones: observaciones || null,
    })
    .eq('id', id);

  // Verificar si hay reservas activas para este ejemplar
  const { data: reservasActivas } = await supabase
    .from('reservas')
    .select('id, usuario_id, usuarios(nombres, correo)')
    .eq('ejemplar_id', ejemplar_id)
    .eq('estado', 'activa')
    .order('created_at')
    .limit(1);

  if (reservasActivas?.length > 0) {
    // Marcar el ejemplar como reservado en vez de disponible
    await supabase
      .from('ejemplares')
      .update({ estado: 'disponible' })
      .eq('id', ejemplar_id);
  } else {
    await supabase
      .from('ejemplares')
      .update({ estado: 'disponible' })
      .eq('id', ejemplar_id);
  }

  redirect('/prestamos');
}

export async function rechazarPrestamoAction(formData) {
  const supabase = await createClient();
  const id = formData.get('id');

  await supabase
    .from('prestamos')
    .update({
      estado: 'devuelto',
      observaciones: 'Solicitud rechazada por el bibliotecario',
    })
    .eq('id', id);

  redirect('/prestamos');
}

export async function ampliarPrestamoAction(formData) {
  const supabase = await createClient();
  const id = formData.get('id');
  const ejemplar_id = formData.get('ejemplar_id');

  // Verificar que no haya reservas activas para este ejemplar
  const { data: reservasActivas } = await supabase
    .from('reservas')
    .select('id')
    .eq('ejemplar_id', ejemplar_id)
    .eq('estado', 'activa');

  if (reservasActivas?.length > 0) {
    return {
      error:
        'No se puede ampliar el préstamo porque el ejemplar tiene reservas activas',
    };
  }

  // Verificar que no haya sido ampliado ya
  const { data: prestamo } = await supabase
    .from('prestamos')
    .select('ampliado, fecha_vencimiento, ejemplares(libros(dias_prestamo))')
    .eq('id', id)
    .single();

  if (prestamo?.ampliado) {
    return { error: 'Este préstamo ya fue ampliado anteriormente' };
  }

  const diasExtra = prestamo?.ejemplares?.libros?.dias_prestamo || 8;
  const nuevaFecha = new Date(prestamo.fecha_vencimiento);
  nuevaFecha.setDate(nuevaFecha.getDate() + diasExtra);

  await supabase
    .from('prestamos')
    .update({
      fecha_vencimiento: nuevaFecha.toISOString(),
      ampliado: true,
      fecha_ampliacion: new Date().toISOString(),
    })
    .eq('id', id);

  redirect('/prestamos');
}
