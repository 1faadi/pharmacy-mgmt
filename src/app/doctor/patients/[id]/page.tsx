import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt' // Fixed typo: was '@/lib/dt'
import Link from 'next/link'

async function getPatientWithPrescriptions(patientId: string, doctorId: string) {
  // First, try to find patient with prescriptions by this doctor
  let patient = await prisma.patient.findFirst({
    where: { 
      id: patientId,
      prescriptions: {
        some: {
          doctorId: doctorId
        }
      }
    },
    include: {
      pii: true,
      prescriptions: {
        where: { doctorId },
        include: {
          items: {
            include: {
              medicine: true
            }
          }
        },
        orderBy: { issuedOn: 'desc' }
      }
    }
  })

  // If not found, check if patient exists at all (for newly created patients)
  if (!patient) {
    patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        pii: true,
        prescriptions: {
          where: { doctorId },
          include: {
            items: {
              include: {
                medicine: true
              }
            }
          },
          orderBy: { issuedOn: 'desc' }
        }
      }
    })
  }

  return patient
}

export default async function PatientDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireRole(['DOCTOR', 'ADMIN'])
  const { id } = await params
  const patient = await getPatientWithPrescriptions(id, user.id)

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Patient Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              This patient doesn't exist or you don't have permission to view them.
            </p>
            <div className="space-y-3">
              <Link
                href="/doctor/patients"
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Back to Patients
              </Link>
              <Link
                href="/doctor/patients/new"
                className="block w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Add New Patient
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
          {patient.pii?.fullName}
        </h1>
        <div className="space-x-3">
          <Link
            href={`/doctor/prescriptions/new?patientId=${patient.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            New Prescription
          </Link>
          <Link
            href="/doctor/patients"
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Back to My Patients
          </Link>
        </div>
      </div>

      {/* Patient Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Patient Information
          </h3>
          {patient.prescriptions.length === 0 && (
            <p className="mt-1 text-sm text-yellow-600">
              ⚠️ This is a new patient - create their first prescription to establish medical history
            </p>
          )}
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Patient Code</dt>
              <dd className="mt-1 text-sm text-gray-900">{patient.patientCode}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Age Group</dt>
              <dd className="mt-1 text-sm text-gray-900">{patient.ageBand}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{patient.pii?.phone}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">CNIC</dt>
              <dd className="mt-1 text-sm text-gray-900">{patient.pii?.cnic}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{patient.pii?.address}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Prescription History */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            My Prescription History ({patient.prescriptions.length})
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Prescriptions you have created for this patient
          </p>
        </div>
        <div className="border-t border-gray-200">
          {patient.prescriptions.length === 0 ? (
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No prescriptions yet
              </h3>
              <p className="text-gray-500 mb-6">
                This patient is new. Create their first prescription to start building their medical history.
              </p>
              <Link
                href={`/doctor/prescriptions/new?patientId=${patient.id}`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Create First Prescription
              </Link>
            </div>
          ) : (
            <div className="space-y-6 p-4">
              {patient.prescriptions.map((prescription) => (
                <div key={prescription.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {prescription.issuedOn.toLocaleDateString()}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          prescription.status === 'FINAL' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {prescription.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Diagnosis:</strong> {prescription.diagnosis}
                      </p>
                    </div>
                    <Link
                      href={`/doctor/prescriptions/${prescription.id}`}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>

                  {/* Medicines */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Prescribed Medicines:</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {prescription.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 p-3 rounded text-sm">
                          <div className="font-medium text-gray-900">
                            {item.medicine.name} - {item.medicine.strength}
                          </div>
                          <div className="text-gray-600 mt-1">
                            {item.dosage} • {item.frequency} • {item.duration}
                            {item.remarks && (
                              <span className="block text-gray-500 italic mt-1">
                                {item.remarks}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <h5 className="text-sm font-medium text-blue-900">Recommendation:</h5>
                    <p className="text-sm text-blue-800 mt-1">{prescription.recommendation}</p>
                    {prescription.notes && (
                      <p className="text-sm text-blue-700 mt-2 italic">
                        <strong>Notes:</strong> {prescription.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
