import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.roles.includes('DOCTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const prescriptionId = params.id

    // Check if prescription exists and belongs to the doctor
    const prescription = await prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        doctorId: user.id,
        status: 'DRAFT'
      }
    })

    if (!prescription) {
      return NextResponse.json({ 
        error: 'Prescription not found or already finalized' 
      }, { status: 404 })
    }

    // Update prescription status to FINAL
    const updatedPrescription = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status: 'FINAL' }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'FINALIZE_PRESCRIPTION',
        resourceType: 'PRESCRIPTION',
        resourceId: prescriptionId,
        details: {
          previousStatus: 'DRAFT',
          newStatus: 'FINAL'
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      prescription: updatedPrescription
    })

  } catch (error) {
    console.error('Error finalizing prescription:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
