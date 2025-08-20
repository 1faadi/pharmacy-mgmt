import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import DispenserAllPrescriptions from '@/components/dispenser/all-prescriptions'

async function getAllFinalPrescriptions() {
  // Get all FINAL prescriptions (dispensed and not dispensed)
  return await prisma.prescription.findMany({
    where: { 
      status: 'FINAL'
    },
    include: {
      patient: {
        select: {
          patientCode: true,
          ageBand: true
          // NO PII access for dispensers
        }
      },
      items: {
        include: {
          medicine: true
        }
      },
      doctor: {
        select: {
          displayName: true
        }
      }
    },
    orderBy: { issuedOn: 'desc' }
  })
}

export default async function AllPrescriptionsPage() {
  const user = await requireRole(['DISPENSER', 'ADMIN'])
  const prescriptions = await getAllFinalPrescriptions()

  const pendingPrescriptions = prescriptions.filter(p => !p.dispensedAt)
  const dispensedPrescriptions = prescriptions.filter(p => p.dispensedAt)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          All Prescriptions
        </h1>
        <div className="text-sm text-gray-600">
          Total: {prescriptions.length} | Pending: {pendingPrescriptions.length} | Dispensed: {dispensedPrescriptions.length}
        </div>
      </div>

      <DispenserAllPrescriptions 
        prescriptions={prescriptions}
        userId={user.id}
      />
    </div>
  )
}
