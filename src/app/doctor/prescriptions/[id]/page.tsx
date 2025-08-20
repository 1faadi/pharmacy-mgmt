import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import { notFound } from 'next/navigation'
import PrescriptionActions from '@/components/prescriptions/prescription-actions'
import PrescriptionDetails from '@/components/prescriptions/prescription-details'

async function getPrescription(prescriptionId: string, userId: string) {
  const prescription = await prisma.prescription.findFirst({
    where: { 
      id: prescriptionId,
      doctorId: userId // Ensure doctor can only view their own prescriptions
    },
    include: {
      patient: {
        include: { pii: true }
      },
      items: {
        include: { medicine: true }
      },
      doctor: {
        select: { displayName: true, email: true }
      }
    }
  })

  return prescription
}

export default async function PrescriptionDetailPage({
  params
}: {
  params: { id: string }
}) {
  const user = await requireRole(['DOCTOR', 'ADMIN'])
  const prescription = await getPrescription(params.id, user.id)

  if (!prescription) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Prescription Details
        </h1>
        <PrescriptionActions prescription={prescription} />
      </div>

      <PrescriptionDetails prescription={prescription} />
    </div>
  )
}
