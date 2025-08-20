import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import Link from 'next/link'

async function getDoctorPatients(doctorId: string) {
  // Only get patients that this doctor has treated
  return await prisma.patient.findMany({
    where: {
      prescriptions: {
        some: {
          doctorId: doctorId
        }
      }
    },
    include: {
      pii: true,
      prescriptions: {
        where: { doctorId: doctorId },
        orderBy: { issuedOn: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function PatientsPage() {
  const user = await requireRole(['DOCTOR', 'ADMIN'])
  const patients = await getDoctorPatients(user.id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
        <div className="space-x-3">
          <Link
            href="/doctor/prescriptions/new"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            New Prescription
          </Link>
          <Link
            href="/doctor/patients/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add New Patient
          </Link>
        </div>
      </div>

      {/* Info Banners */}
      <div className="space-y-3">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> This page shows patients you have treated. 
                To prescribe for any patient (including new ones), use "New Prescription" where all patients are available.
              </p>
            </div>
          </div>
        </div>
        
        {patients.length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Getting Started:</strong> You haven't treated any patients yet. 
                  Create your first prescription to start building your patient list.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            My Patients ({patients.length})
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Patients you have treated or created prescriptions for
          </p>
        </div>
        <div className="border-t border-gray-200">
          {patients.length === 0 ? (
            <div className="text-center py-12">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No patients yet
              </h3>
              <p className="text-gray-500 mb-6">
                Patients will appear here after you create their first prescription
              </p>
              <div className="space-x-3">
                <Link
                  href="/doctor/prescriptions/new"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                >
                  Create First Prescription
                </Link>
                <Link
                  href="/doctor/patients/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                  Add Patient
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
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Visit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.pii?.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.patientCode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {patient.pii?.phone}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.pii?.address.substring(0, 30)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.ageBand}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.prescriptions[0]?.issuedOn.toLocaleDateString() || 'No visits'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          href={`/doctor/patients/${patient.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/doctor/prescriptions/new?patientId=${patient.id}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          New Prescription
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
