import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import { notFound } from 'next/navigation'
import DispenserPrescriptionActions from '@/components/dispenser/prescription-actions'

async function getPrescriptionForDispenser(prescriptionId: string) {
  // Get prescription with redacted patient info (no PII)
  const prescription = await prisma.prescription.findFirst({
    where: { 
      id: prescriptionId,
      status: 'FINAL' // Dispensers can only view finalized prescriptions
    },
    include: {
      patient: {
        select: {
          patientCode: true,
          ageBand: true
          // NO PII - no fullName, phone, address, cnic
        }
      },
      items: {
        include: { medicine: true }
      },
      doctor: {
        select: { displayName: true }
      }
    }
  })

  return prescription
}

export default async function DispenserPrescriptionDetailPage({
  params
}: {
  params: { id: string }
}) {
  const user = await requireRole(['DISPENSER', 'ADMIN'])
  const prescription = await getPrescriptionForDispenser(params.id)

  if (!prescription) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Prescription Details
        </h1>
        <DispenserPrescriptionActions 
          prescription={prescription}
          userId={user.id}
        />
      </div>

      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center space-x-4">
          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
            FINAL
          </span>
          {prescription.dispensedAt && (
            <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
              Dispensed on {prescription.dispensedAt.toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Patient Information (Redacted) */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Patient Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Limited information for privacy protection
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Patient Code</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">
                  {prescription.patient.patientCode}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Age Group</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {prescription.patient.ageBand || 'Not specified'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Privacy Note:</strong> Patient personal information is protected. 
                        Only patient code and age group are visible to dispensers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </dl>
          </div>
        </div>

        {/* Prescription Details */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Prescription Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Issued on {prescription.issuedOn.toLocaleDateString()} by {prescription.doctor.displayName}
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="space-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Diagnosis</dt>
                <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {prescription.diagnosis}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Doctor's Recommendation</dt>
                <dd className="mt-1 text-sm text-gray-900 bg-blue-50 p-3 rounded-md">
                  {prescription.recommendation}
                </dd>
              </div>
              {prescription.notes && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Additional Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {prescription.notes}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Medicines to Dispense */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Medicines to Dispense ({prescription.items.length})
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="space-y-4 p-4">
              {prescription.items.map((item, index) => (
                <div key={item.id} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {index + 1}. {item.medicine.name}
                    </h4>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {item.medicine.form}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-600">Strength: </span>
                    <span className="text-sm text-gray-900 font-mono">
                      {item.medicine.strength}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="bg-white p-3 rounded border">
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">{item.dosage}</dd>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">{item.frequency}</dd>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">{item.duration}</dd>
                    </div>
                  </div>

                  {item.remarks && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <dt className="text-xs font-medium text-yellow-800 uppercase tracking-wider">Special Instructions</dt>
                      <dd className="mt-1 text-sm text-yellow-900 font-medium">{item.remarks}</dd>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
