import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt' // Fixed typo: was '@/lib/dt'
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

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Link
            href="/doctor/prescriptions/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            New Prescription
          </Link>
          <Link
            href="/doctor/prescription-pad"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Blank Prescription Pad</span>
          </Link>
        </div>
      </div>

      {/* Quick Actions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link
          href="/doctor/prescriptions/new"
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg shadow-md transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <svg className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <div>
              <h3 className="font-semibold">New Prescription</h3>
              <p className="text-xs opacity-90">For existing patients</p>
            </div>
          </div>
        </Link>
        <Link
          href="/doctor/prescription-pad"
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg shadow-md transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <svg className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <div>
              <h3 className="font-semibold">Blank Prescription</h3>
              <p className="text-xs opacity-90">Write from scratch</p>
            </div>
          </div>
        </Link>
        <Link
          href="/doctor/raw-prescriptions"
          className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg shadow-md transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <svg className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h3 className="font-semibold">Raw Prescriptions</h3>
              <p className="text-xs opacity-90">View saved prescriptions</p>
            </div>
          </div>
        </Link>
        <Link
  href="/doctor/welcome"
  className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg shadow-md transition-colors group"
>
  <div className="flex items-center space-x-3">
    <svg className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
    </svg>
    <div>
      <h3 className="font-semibold">Back to Welcome</h3>
      <p className="text-xs opacity-90">Return to main options</p>
    </div>
  </div>
</Link>



        <Link
          href="/doctor/patients"
          className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg shadow-md transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <svg className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <div>
              <h3 className="font-semibold">My Patients</h3>
              <p className="text-xs opacity-90">View patient list</p>
            </div>
          </div>
        </Link>

        <Link
          href="/doctor/prescriptions"
          className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg shadow-md transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <svg className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h3 className="font-semibold">All Prescriptions</h3>
              <p className="text-xs opacity-90">View history</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Prescriptions</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalPrescriptions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Draft Prescriptions</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.draftPrescriptions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Patients</h3>
              <p className="text-3xl font-bold text-green-600">
                {new Set(stats.recentPrescriptions.map(p => p.patientId)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Prescriptions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Prescriptions
            </h3>
            <Link
              href="/doctor/prescriptions"
              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
        </div>
        <div className="overflow-hidden">
          {stats.recentPrescriptions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No prescriptions yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first prescription.</p>
              <div className="mt-6 flex justify-center space-x-3">
                <Link
                  href="/doctor/prescriptions/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  New Prescription
                </Link>
                <Link
                  href="/doctor/prescription-pad"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Blank Prescription Pad
                </Link>
              </div>
            </div>
          ) : (
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
                    <tr key={prescription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {prescription.patient.pii?.fullName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {prescription.patient.patientCode}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {prescription.diagnosis}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${prescription.status === 'FINAL'
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
          )}
        </div>
      </div>
    </div>
  )
}
