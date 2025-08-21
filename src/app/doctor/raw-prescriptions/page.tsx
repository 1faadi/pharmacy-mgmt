import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import Link from 'next/link'

async function getRawPrescriptions(doctorId: string) {
    return await prisma.rawPrescription.findMany({
        where: { doctorId },
        include: {
            medicines: {
                orderBy: { medicineOrder: 'asc' }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    })
}

export default async function RawPrescriptionsPage() {
    const user = await requireRole(['DOCTOR', 'ADMIN'])
    const prescriptions = await getRawPrescriptions(user.id)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Raw Prescriptions</h1>
                <Link
                    href="/doctor/prescription-pad"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                    + New Raw Prescription
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Saved Prescriptions ({prescriptions.length})
                    </h3>
                </div>
                <div className="border-t border-gray-200">
                    {prescriptions.length === 0 ? (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No raw prescriptions yet
                            </h3>
                            <Link
                                href="/doctor/raw-prescription"
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                Create First Raw Prescription
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
                                        <tr key={prescription.id} className="hover:bg-gray-50">
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
                                                {prescription.createdAt.toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <Link
                                                    href={`/doctor/raw-prescriptions/${prescription.id}`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    View
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
