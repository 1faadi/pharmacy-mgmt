import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.roles.includes('DISPENSER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const prescriptionId = params.id

    // Check if prescription exists and is FINAL (not yet dispensed)
    const prescription = await prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        status: 'FINAL',
        dispensedAt: null
      }
    })

    if (!prescription) {
      return NextResponse.json({ 
        error: 'Prescription not found or already dispensed' 
      }, { status: 404 })
    }

    // Update prescription as dispensed
    const updatedPrescription = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { 
        dispensedAt: new Date(),
        dispensedBy: user.id
      }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'DISPENSE_PRESCRIPTION',
        resourceType: 'PRESCRIPTION',
        resourceId: prescriptionId,
        details: {
          dispensedAt: new Date().toISOString(),
          dispenserName: user.name
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      prescription: updatedPrescription
    })

  } catch (error) {
    console.error('Error dispensing prescription:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
