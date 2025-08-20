'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DispenserAllPrescriptionsProps {
  prescriptions: any[]
  userId: string
}

export default function DispenserAllPrescriptions({ 
  prescriptions, 
  userId 
}: DispenserAllPrescriptionsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'dispensed'>('all')
  const [dispensingId, setDispensingId] = useState<string | null>(null)
  const router = useRouter()

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = 
      prescription.patient.patientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.doctor.displayName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'pending' && !prescription.dispensedAt) ||
      (statusFilter === 'dispensed' && prescription.dispensedAt)

    return matchesSearch && matchesStatus
  })

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
      {/* Filters */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Prescriptions ({filteredPrescriptions.length})
            </h3>
            
            <div className="flex space-x-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'all'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pending ({prescriptions.filter(p => !p.dispensedAt).length})
              </button>
              <button
                onClick={() => setStatusFilter('dispensed')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'dispensed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Dispensed ({prescriptions.filter(p => p.dispensedAt).length})
              </button>
            </div>
          </div>
          
          <div className="max-w-sm w-full">
            <input
              type="text"
              placeholder="Search by Patient Code, Prescription ID, or Doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Prescriptions Table */}
      <div className="border-t border-gray-200">
        {filteredPrescriptions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'No prescriptions match your filters.' 
                : 'No prescriptions found.'}
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
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medicines
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issued Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPrescriptions.map((prescription) => (
                  <tr key={prescription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {prescription.patient.patientCode}
                      </div>
                      <div className="text-sm text-gray-500">
                        Age: {prescription.patient.ageBand || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        ID: {prescription.id.slice(0, 8)}
                      </div>
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
                            • {item.medicine.name}
                          </div>
                        ))}
                        {prescription.items.length > 2 && (
                          <div className="text-gray-400">
                            +{prescription.items.length - 2} more
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prescription.issuedOn.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {prescription.dispensedAt ? (
                        <div>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Dispensed
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {prescription.dispensedAt.toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/dispenser/prescriptions/${prescription.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      {!prescription.dispensedAt && (
                        <button
                          onClick={() => handleDispense(prescription.id)}
                          disabled={dispensingId === prescription.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {dispensingId === prescription.id ? 'Dispensing...' : 'Dispense'}
                        </button>
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
  )
}
