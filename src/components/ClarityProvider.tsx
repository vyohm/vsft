'use client'

import { useEffect } from 'react'
import clarity from '@microsoft/clarity'

export default function ClarityProvider() {
  useEffect(() => {
    // Initialize Clarity
    clarity.init('tzfucjjbq9')
  }, [])

  return null
}
