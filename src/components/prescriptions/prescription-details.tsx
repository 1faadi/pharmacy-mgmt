interface PrescriptionDetailsProps {
  prescription: {
    id: string
    diagnosis: string
    recommendation: string
    notes: string | null
    issuedOn: Date
    status: string
    dispensedAt: Date | null
    patient: {
      patientCode: string
      ageBand: string | null
      pii: {
        fullName: string
        phone: string
        address: string
        cnic: string
      } | null
    }
    items: {
      id: string
      dosage: string
      frequency: string
      duration: string
      remarks: string | null
      medicine: {
        name: string
        strength: string
        form: string
      }
    }[]
    doctor: {
      displayName: string
      email: string
    }
  }
}

export default function PrescriptionDetails({ prescription }: PrescriptionDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div className="flex items-center space-x-4">
        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
          prescription.status === 'FINAL' 
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {prescription.status}
        </span>
        {prescription.dispensedAt && (
          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
            Dispensed on {prescription.dispensedAt.toLocaleDateString()}
          </span>
        )}
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
              <dt className="text-sm font-medium text-gray-500">Patient Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{prescription.patient.pii?.fullName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Patient Code</dt>
              <dd className="mt-1 text-sm text-gray-900">{prescription.patient.patientCode}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Age Group</dt>
              <dd className="mt-1 text-sm text-gray-900">{prescription.patient.ageBand}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{prescription.patient.pii?.phone}</dd>
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
            Issued on {prescription.issuedOn.toLocaleDateString()}
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="space-y-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Diagnosis</dt>
              <dd className="mt-1 text-sm text-gray-900">{prescription.diagnosis}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Recommendation</dt>
              <dd className="mt-1 text-sm text-gray-900">{prescription.recommendation}</dd>
            </div>
            {prescription.notes && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Additional Notes</dt>
                <dd className="mt-1 text-sm text-gray-900">{prescription.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Prescribed Medicines */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Prescribed Medicines ({prescription.items.length})
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="space-y-4 p-4">
            {prescription.items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">
                      {item.medicine.name} - {item.medicine.strength}
                    </h4>
                    <p className="text-sm text-gray-500">{item.medicine.form}</p>
                  </div>
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                </div>
                
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</dt>
                    <dd className="mt-1 text-sm text-gray-900">{item.dosage}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</dt>
                    <dd className="mt-1 text-sm text-gray-900">{item.frequency}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</dt>
                    <dd className="mt-1 text-sm text-gray-900">{item.duration}</dd>
                  </div>
                </div>

                {item.remarks && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Special Instructions</dt>
                    <dd className="mt-1 text-sm text-gray-700">{item.remarks}</dd>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Doctor Information */}
      <div className="bg-gray-50 shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Prescribed By
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {prescription.doctor.displayName}
          </p>
        </div>
      </div>
    </div>
  )
}
