import { requireRole } from '@/lib/auth-utils'
import BlankPrescriptionPad from '@/components/prescription-pad/blank-prescription-pad'

export default async function BlankPrescriptionPadPage() {
  const user = await requireRole(['DOCTOR', 'ADMIN'])
  
  return <BlankPrescriptionPad doctor={user} />
}
