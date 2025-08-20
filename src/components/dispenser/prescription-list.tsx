'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DispenserPrescriptionListProps {
  prescriptions: any[]
  userId: string
}

export default function DispenserPrescriptionList({ 
  prescriptions, 
  userId 
}: DispenserPrescriptionListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [dispensingId, setDispensingId] = useState<string | null>(null)
  const router = useRouter()

  const filteredPrescriptions = prescriptions.filter(prescription =>
    prescription.patient.patientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDispense = async (prescriptionId: string) => {
    if (!confirm('Mark this prescription as dispensed?')) {
      return
    }

    setDispensingId(prescriptionId)
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/dispense`, {
        method: 'POST'
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to dispense prescription')
      }
    } catch (error) {
      console.error('Error dispensing prescription:', error)
      alert('Failed to dispense prescription')
    } finally {
      setDispensingId(null)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Prescriptions Ready for Dispensing ({filteredPrescriptions.length})
          </h3>
          <div className="max-w-xs">
            <input
              type="text"
              placeholder="Search by Patient Code or Prescription ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200">
        {filteredPrescriptions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm ? 'No prescriptions match your search.' : 'No prescriptions ready for dispensing.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medicines
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
                {filteredPrescriptions.map((prescription) => (
                  <tr key={prescription.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {prescription.patient.patientCode}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {prescription.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {prescription.patient.ageBand || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {prescription.doctor.displayName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {prescription.items.length} medicine{prescription.items.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500 max-w-xs">
                        {prescription.items.slice(0, 2).map((item: any, index: number) => (
                          <div key={index}>
                            {item.medicine.name} - {item.medicine.strength}
                          </div>
                        ))}
                        {prescription.items.length > 2 && (
                          <div className="text-gray-400">
                            +{prescription.items.length - 2} more...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prescription.issuedOn.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => router.push(`/dispenser/prescriptions/${prescription.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDispense(prescription.id)}
                        disabled={dispensingId === prescription.id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        {dispensingId === prescription.id ? 'Dispensing...' : 'Dispense'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
