import RoleGuard from '@/components/guards/role-guard'
import Navigation from '@/components/layout/navigation'

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['DOCTOR', 'ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 px-4">
          {children}
        </main>
      </div>
    </RoleGuard>
  )
}
