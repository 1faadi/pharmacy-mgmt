import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import DispenserPrescriptionList from '@/components/dispenser/prescription-list'

async function getFinalPrescriptions() {
  // Get only FINAL prescriptions with redacted patient info
  return await prisma.prescription.findMany({
    where: { 
      status: 'FINAL',
      dispensedAt: null // Not yet dispensed
    },
    include: {
      patient: {
        select: {
          patientCode: true,
          ageBand: true
          // NO PII - dispensers don't see patient names, phone, address, etc.
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

async function getDispenserStats() {
  const [totalFinal, totalDispensed, todayDispensed] = await Promise.all([
    prisma.prescription.count({
      where: { status: 'FINAL' }
    }),
    prisma.prescription.count({
      where: { dispensedAt: { not: null } }
    }),
    prisma.prescription.count({
      where: {
        dispensedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  ])

  return { totalFinal, totalDispensed, todayDispensed }
}

export default async function DispenserDashboard() {
  const user = await requireRole(['DISPENSER', 'ADMIN'])
  const prescriptions = await getFinalPrescriptions()
  const stats = await getDispenserStats()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Dispenser Dashboard
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Ready to Dispense</h3>
          <p className="text-3xl font-bold text-blue-600">{prescriptions.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Dispensed</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalDispensed}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Dispensed Today</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.todayDispensed}</p>
        </div>
      </div>

      {/* Prescriptions Ready for Dispensing */}
      <DispenserPrescriptionList 
        prescriptions={prescriptions}
        userId={user.id}
      />
    </div>
  )
}
