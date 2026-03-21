'use client'

import { Suspense } from 'react'
import LoadingBar from './LoadingBar'

export default function LoadingBarWrapper() {
  return (
    <Suspense fallback={null}>
      <LoadingBar />
    </Suspense>
  )
}