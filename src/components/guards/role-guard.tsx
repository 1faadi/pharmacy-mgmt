'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
  fallbackUrl?: string
}

export default function RoleGuard({ 
  allowedRoles, 
  children, 
  fallbackUrl = '/login' 
}: RoleGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/login')
      return
    }

    const hasRole = session.user.roles.some(role => allowedRoles.includes(role))
    if (!hasRole) {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router, allowedRoles])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) return null

  const hasRole = session.user.roles.some(role => allowedRoles.includes(role))
  if (!hasRole) return null

  return <>{children}</>
}
