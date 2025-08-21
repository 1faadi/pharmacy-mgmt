import { requireRole } from '@/lib/auth-utils'
import DoctorInteractiveLanding from '@/components/landing/doctor-interactive-landing'

export default async function DoctorWelcomePage() {
  const user = await requireRole(['DOCTOR', 'ADMIN'])
  
  return (
    <DoctorInteractiveLanding 
      doctor={{
        name: user.name,
        email: user.email
      }} 
    />
  )
}
