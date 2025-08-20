// src/app/api/prescriptions/[id]/dispense/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'

// (No type alias. No inline type. No destructuring in the signature.)
export async function POST(req: Request, context: any) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.roles?.includes('DISPENSER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id: prescriptionId } = (context?.params ?? {}) as { id: string }

    const prescription = await prisma.prescription.findFirst({
      where: { id: prescriptionId, status: 'FINAL', dispensedAt: null },
    })

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescription not found or already dispensed' },
        { status: 404 },
      )
    }

    const updatedPrescription = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { dispensedAt: new Date(), dispensedBy: user.id },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'DISPENSE_PRESCRIPTION',
        resourceType: 'PRESCRIPTION',
        resourceId: prescriptionId,
        details: {
          dispensedAt: new Date().toISOString(),
          dispenserName: user.name,
        },
      },
    })

    return NextResponse.json({ success: true, prescription: updatedPrescription })
  } catch (err) {
    console.error('Error dispensing prescription:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
