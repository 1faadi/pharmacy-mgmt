import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import Link from 'next/link'

async function getDoctorPrescriptions(doctorId: string) {
  return await prisma.prescription.findMany({
    where: { doctorId },
    include: {
      patient: {
        include: { pii: true }
      },
      items: {
        include: { medicine: true }
      }
    },
    orderBy: { issuedOn: 'desc' }
  })
}

export default async function DoctorPrescriptionsPage() {
  const user = await requireRole(['DOCTOR', 'ADMIN'])
  const prescriptions = await getDoctorPrescriptions(user.id)

  const draftPrescriptions = prescriptions.filter(p => p.status === 'DRAFT')
  const finalPrescriptions = prescriptions.filter(p => p.status === 'FINAL')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          My Prescriptions
        </h1>
        <Link
          href="/doctor/prescriptions/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          New Prescription
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total</h3>
          <p className="text-3xl font-bold text-blue-600">{prescriptions.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Draft</h3>
          <p className="text-3xl font-bold text-yellow-600">{draftPrescriptions.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Finalized</h3>
          <p className="text-3xl font-bold text-green-600">{finalPrescriptions.length}</p>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            All Prescriptions ({prescriptions.length})
          </h3>
        </div>
        <div className="border-t border-gray-200">
          {prescriptions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No prescriptions found.</p>
              <Link
                href="/doctor/prescriptions/new"
                className="mt-2 inline-block text-blue-600 hover:text-blue-800"
              >
                Create your first prescription
              </Link>
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
                      Medicines
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
                  {prescriptions.map((prescription) => (
                    <tr key={prescription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {prescription.patient.pii?.fullName}
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {prescription.items.length} medicine{prescription.items.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          {prescription.items.slice(0, 2).map((item, index) => (
                            <div key={index}>• {item.medicine.name}</div>
                          ))}
                          {prescription.items.length > 2 && (
                            <div className="text-gray-400">+{prescription.items.length - 2} more</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          prescription.status === 'FINAL' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {prescription.status}
                        </span>
                        {prescription.dispensedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Dispensed: {prescription.dispensedAt.toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {prescription.issuedOn.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          href={`/doctor/prescriptions/${prescription.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        {prescription.status === 'DRAFT' && (
                          <Link
                            href={`/doctor/prescriptions/${prescription.id}/edit`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Edit
                          </Link>
                        )}
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
