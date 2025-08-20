import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import { notFound, redirect } from 'next/navigation'
import EditPrescriptionForm from '@/components/forms/edit-prescription-form'

async function getPrescriptionForEdit(prescriptionId: string, userId: string) {
  const prescription = await prisma.prescription.findFirst({
    where: { 
      id: prescriptionId,
      doctorId: userId, // Ensure doctor can only edit their own prescriptions
      status: 'DRAFT' // Only allow editing of draft prescriptions
    },
    include: {
      patient: {
        include: { pii: true }
      },
      items: {
        include: { medicine: true }
      }
    }
  })

  return prescription
}

export default async function EditPrescriptionPage({
  params
}: {
  params: { id: string }
}) {
  const user = await requireRole(['DOCTOR', 'ADMIN'])
  const prescription = await getPrescriptionForEdit(params.id, user.id)

  if (!prescription) {
    notFound()
  }

  // If prescription is already finalized, redirect to view page
  if (prescription.status === 'FINAL') {
    redirect(`/doctor/prescriptions/${params.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Prescription
        </h1>
        <div className="text-sm text-gray-500">
          Status: <span className="font-medium text-yellow-600">DRAFT</span>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <EditPrescriptionForm prescription={prescription} />
        </div>
      </div>
    </div>
  )
}
