import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt' // ✅ Fixed import
import Link from 'next/link'
import { Suspense } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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

// ✅ Responsive loading component
function PrescriptionsLoading() {
    return (
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
            {/* Header loading - responsive */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-40 sm:w-48 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-full sm:w-48 animate-pulse"></div>
            </div>
            
            <div className="bg-white shadow rounded-lg">
                <div className="p-4 sm:p-6">
                    {/* Desktop table loading */}
                    <div className="hidden md:block space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                    </div>
                    
                    {/* Mobile card loading */}
                    <div className="md:hidden space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ✅ Responsive prescriptions list
async function PrescriptionsList({ doctorId }: { doctorId: string }) {
    const prescriptions = await getRawPrescriptions(doctorId)

    if (prescriptions.length === 0) {
        return (
            <div className="text-center py-12 px-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No raw prescriptions yet
                </h3>
                <p className="text-gray-500 mb-4">Get started by creating your first prescription.</p>
                <Link
                    href="/doctor/prescription-pad"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors touch-manipulation"
                >
                    Create First Raw Prescription
                </Link>
            </div>
        )
    }

    return (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
                {prescriptions.map((prescription) => (
                    <div key={prescription.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="text-base font-medium text-gray-900">
                                    {prescription.patientName || 'Blank Prescription'}
                                </div>
                                {prescription.patientAge && (
                                    <div className="text-sm text-gray-500">
                                        Age: {prescription.patientAge}
                                    </div>
                                )}
                            </div>
                            <div className="text-sm text-gray-500 text-right">
                                {new Date(prescription.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 mb-3">
                            <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Medicines:</span>
                                <div className="text-sm text-gray-900 mt-1">
                                    {prescription.medicines.length} medicine{prescription.medicines.length !== 1 ? 's' : ''}
                                </div>
                                {prescription.medicines.length > 0 && (
                                    <div className="text-sm text-gray-500">
                                        {prescription.medicines.slice(0, 2).map(med => med.medicineName).join(', ')}
                                        {prescription.medicines.length > 2 && '...'}
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis:</span>
                                <div className="text-sm text-gray-900 mt-1">
                                    {prescription.diagnosis || 'No diagnosis'}
                                </div>
                            </div>
                        </div>
                        
                        <Link
                            href={`/doctor/raw-prescriptions/${prescription.id}`}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors touch-manipulation"
                        >
                            View Prescription
                        </Link>
                    </div>
                ))}
            </div>
        </>
    )
}

// ✅ Responsive main page component
export default async function RawPrescriptionsPage() {
    let user
    try {
        user = await requireRole(['DOCTOR', 'ADMIN'])
    } catch (error) {
        console.error('Authentication error:', error)
        throw error
    }

    return (
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Responsive Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Raw Prescriptions</h1>
                </div>
                <Link
                    href="/doctor/prescription-pad"
                    className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors touch-manipulation w-full sm:w-auto"
                >
                    <span className="sm:hidden">+ New Prescription</span>
                    <span className="hidden sm:inline">+ New Raw Prescription</span>
                </Link>
            </div>

            {/* Main Content Card */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200">
                    <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900">
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
