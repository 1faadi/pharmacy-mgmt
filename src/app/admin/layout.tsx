import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import Navigation from '@/components/layout/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  
  // Redirect if not authenticated
  if (!user) {
    redirect('/login')
  }
  
  // Check if user has admin role
  const hasRole = user.roles.includes('ADMIN')
  if (!hasRole) {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  )
}
