import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt' // ✅ Fixed import
import Link from 'next/link'
import { Suspense } from 'react'

// ✅ Add error handling and optimize query
async function getRawPrescriptions(doctorId: string) {
    try {
        const prescriptions = await prisma.rawPrescription.findMany({
            where: { doctorId },
            select: {
                id: true,
                patientName: true,
                patientAge: true,
                diagnosis: true,
                createdAt: true,
                medicines: {
                    select: {
                        medicineName: true,
                        medicineOrder: true
                    },
                    orderBy: { medicineOrder: 'asc' },
                    take: 3 // ✅ Only get first 3 medicines for display
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20 // ✅ Limit results
        })
        
        return prescriptions
    } catch (error) {
        console.error('Error fetching raw prescriptions:', error)
        return []
    }
}

// ✅ Loading component
function PrescriptionsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ✅ Separate data component
async function PrescriptionsList({ doctorId }: { doctorId: string }) {
    const prescriptions = await getRawPrescriptions(doctorId)

    if (prescriptions.length === 0) {
        return (
            <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No raw prescriptions yet
                </h3>
                <p className="text-gray-500 mb-4">Get started by creating your first prescription.</p>
                <Link
                    href="/doctor/prescription-pad"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                    Create First Raw Prescription
                </Link>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Patient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Medicines
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Diagnosis
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
                        <tr key={prescription.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                    {prescription.patientName || 'Blank Prescription'}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {prescription.patientAge && `Age: ${prescription.patientAge}`}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                    {prescription.medicines.length} medicine{prescription.medicines.length !== 1 ? 's' : ''}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {prescription.medicines.slice(0, 2).map(med => med.medicineName).join(', ')}
                                    {prescription.medicines.length > 2 && '...'}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                    {prescription.diagnosis || 'No diagnosis'}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(prescription.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <Link
                                    href={`/doctor/raw-prescriptions/${prescription.id}`}
                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                >
                                    View
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// ✅ Main page component with Suspense
export default async function RawPrescriptionsPage() {
    let user
    try {
        user = await requireRole(['DOCTOR', 'ADMIN'])
    } catch (error) {
        console.error('Authentication error:', error)
        // Handle auth error or redirect
        throw error
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Raw Prescriptions</h1>
                <Link
                    href="/doctor/prescription-pad"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                    + New Raw Prescription
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Saved Prescriptions
                    </h3>
                </div>
                
                <Suspense fallback={<PrescriptionsLoading />}>
                    <PrescriptionsList doctorId={user.id} />
                </Suspense>
            </div>
        </div>
    )
}
