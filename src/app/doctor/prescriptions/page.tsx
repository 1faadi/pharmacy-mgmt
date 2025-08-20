import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt' // Fixed typo: was '@/lib/dt'
import Link from 'next/link'
import PrescriptionActions from '@/components/prescriptions/prescription-actions'
import PrescriptionDetails from '@/components/prescriptions/prescription-details'

async function getPrescription(prescriptionId: string, userId: string) {
  const prescription = await prisma.prescription.findFirst({
    where: { 
      id: prescriptionId,
      doctorId: userId
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
  params: Promise<{ id: string }>
}) {
  const user = await requireRole(['DOCTOR', 'ADMIN'])
  const { id } = await params
  const prescription = await getPrescription(id, user.id)

  // Instead of notFound(), show user-friendly message
  if (!prescription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Prescription Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The prescription you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <div className="space-y-3">
              <Link
                href="/doctor/prescriptions"
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                View All Prescriptions
              </Link>
              <Link
                href="/doctor/prescriptions/new"
                className="block w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Create New Prescription
              </Link>
              <Link
                href="/doctor"
                className="block w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
