import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function getPatientWithPrescriptions(patientId: string, doctorId: string) {
  // Only allow access to patients this doctor has treated
  const patient = await prisma.patient.findFirst({
    where: { 
      id: patientId,
      prescriptions: {
        some: {
          doctorId: doctorId // Doctor must have created at least one prescription
        }
      }
    },
    include: {
      pii: true,
      prescriptions: {
        where: { doctorId }, // Only show prescriptions by this doctor
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

  return patient
}

export default async function PatientDetailPage({
  params
}: {
  params: { id: string }
}) {
  const user = await requireRole(['DOCTOR', 'ADMIN'])
  const patient = await getPatientWithPrescriptions(params.id, user.id)

  if (!patient) {
    notFound()
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
              <p className="text-gray-500">No prescriptions found for this patient.</p>
              <Link
                href={`/doctor/prescriptions/new?patientId=${patient.id}`}
                className="mt-2 inline-block text-blue-600 hover:text-blue-800"
              >
                Create the first prescription
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
