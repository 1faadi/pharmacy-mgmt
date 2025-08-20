import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import Link from 'next/link'

async function getDoctorStats(doctorId: string) {
  const [totalPrescriptions, draftPrescriptions, recentPrescriptions] = await Promise.all([
    prisma.prescription.count({
      where: { doctorId }
    }),
    prisma.prescription.count({
      where: { doctorId, status: 'DRAFT' }
    }),
    prisma.prescription.findMany({
      where: { doctorId },
      include: {
        patient: {
          include: { pii: true }
        }
      },
      orderBy: { issuedOn: 'desc' },
      take: 5
    })
  ])

  return { totalPrescriptions, draftPrescriptions, recentPrescriptions }
}

export default async function DoctorDashboard() {
  const user = await requireRole(['DOCTOR', 'ADMIN'])
  const stats = await getDoctorStats(user.id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, Dr. {user.name}
        </h1>
        <Link
          href="/doctor/prescriptions/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          New Prescription
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Prescriptions</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalPrescriptions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Draft Prescriptions</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.draftPrescriptions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Patients</h3>
          <p className="text-3xl font-bold text-green-600">
            {new Set(stats.recentPrescriptions.map(p => p.patientId)).size}
          </p>
        </div>
      </div>

      {/* Recent Prescriptions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Prescriptions
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diagnosis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentPrescriptions.map((prescription) => (
                  <tr key={prescription.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {prescription.patient.pii?.fullName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {prescription.patient.patientCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {prescription.diagnosis}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        prescription.status === 'FINAL' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {prescription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prescription.issuedOn.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/doctor/prescriptions/${prescription.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
