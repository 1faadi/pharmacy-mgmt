import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import { z } from 'zod'

const updatePrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  recommendation: z.string().min(1, 'Recommendation is required'),
  notes: z.string().optional(),
  items: z.array(z.object({
    medicineName: z.string().min(1, 'Medicine name is required'),
    strength: z.string().min(1, 'Strength is required'),
    form: z.string().min(1, 'Form is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    frequency: z.string().min(1, 'Frequency is required'),
    duration: z.string().min(1, 'Duration is required'),
    remarks: z.string().optional()
  })).min(1, 'At least one medicine is required')
})

export async function PUT(request: NextRequest, context: any) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.roles?.includes('DOCTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id: prescriptionId } = (context?.params ?? {}) as { id: string }

    const body = await request.json()
    const validatedData = updatePrescriptionSchema.parse(body)

    // Must be the doctor's and still DRAFT
    const existingPrescription = await prisma.prescription.findFirst({
      where: { id: prescriptionId, doctorId: user.id, status: 'DRAFT' }
    })

    if (!existingPrescription) {
      return NextResponse.json(
        { error: 'Prescription not found or cannot be edited' },
        { status: 404 }
      )
    }

    // Replace items (delete then recreate)
    await prisma.prescriptionItem.deleteMany({ where: { prescriptionId } })

    const updatedPrescription = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        patientId: validatedData.patientId,
        diagnosis: validatedData.diagnosis,
        recommendation: validatedData.recommendation,
        notes: validatedData.notes,
        items: {
          create: validatedData.items.map(item => ({
            medicine: {
              connectOrCreate: {
                where: {
                  name_strength_form: {
                    name: item.medicineName,
                    strength: item.strength,
                    form: item.form
                  }
                },
                create: {
                  name: item.medicineName,
                  strength: item.strength,
                  form: item.form
                }
              }
            },
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            remarks: item.remarks
          }))
        }
      },
      include: {
        items: { include: { medicine: true } },
        patient: { include: { pii: true } }
      }
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'UPDATE_PRESCRIPTION',
        resourceType: 'PRESCRIPTION',
        resourceId: prescriptionId,
        details: {
          patientId: updatedPrescription.patientId,
          diagnosis: updatedPrescription.diagnosis,
          itemCount: updatedPrescription.items.length,
          medicines: validatedData.items.map(i => i.medicineName)
        }
      }
    })

    return NextResponse.json({
      success: true,
      prescription: {
        id: updatedPrescription.id,
        status: updatedPrescription.status,
        patientName: updatedPrescription.patient.pii?.fullName
      }
    })
  } catch (error) {
    console.error('Error updating prescription:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
