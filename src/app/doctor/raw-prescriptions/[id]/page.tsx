import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import { notFound } from 'next/navigation'
import RawPrescriptionViewer from '@/components/prescription-pad/raw-prescription-viewer'

async function getRawPrescription(prescriptionId: string, doctorId: string) {
    const prescription = await prisma.rawPrescription.findFirst({
        where: {
            id: prescriptionId,
            doctorId: doctorId
        },
        include: {
            medicines: {
                orderBy: { medicineOrder: 'asc' }
            },
            doctor: {
                select: {
                    displayName: true,
                    email: true
                }
            }
        }
    })
    return prescription
}

export default async function RawPrescriptionViewPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const user = await requireRole(['DOCTOR', 'ADMIN'])
    const { id } = await params
    const prescription = await getRawPrescription(id, user.id)

    if (!prescription) {
        notFound()
    }

    return <RawPrescriptionViewer prescription={prescription} />
}
