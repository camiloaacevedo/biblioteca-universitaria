'use client'

import { useTransition } from 'react'

export default function BotonEliminar({ action, id }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return
    const formData = new FormData()
    formData.append('id', id)
    startTransition(() => action(formData))
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-red-600 hover:underline disabled:opacity-50 cursor-pointer">
      {isPending ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}