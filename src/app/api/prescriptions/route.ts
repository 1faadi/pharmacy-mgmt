import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import { z } from 'zod'

const createPrescriptionSchema = z.object({
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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.roles.includes('DOCTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createPrescriptionSchema.parse(body)

    // Create prescription with items (no need to link to existing medicines)
    const prescription = await prisma.prescription.create({
      data: {
        patientId: validatedData.patientId,
        doctorId: user.id,
        diagnosis: validatedData.diagnosis,
        recommendation: validatedData.recommendation,
        notes: validatedData.notes,
        status: 'DRAFT',
        items: {
          create: validatedData.items.map(item => {
            // First, find or create the medicine
            return {
              // We'll handle medicine creation separately
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
            }
          })
        }
      },
      include: {
        items: {
          include: {
            medicine: true
          }
        },
        patient: {
          include: {
            pii: true
          }
        }
      }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'CREATE_PRESCRIPTION',
        resourceType: 'PRESCRIPTION',
        resourceId: prescription.id,
        details: {
          patientId: prescription.patientId,
          diagnosis: prescription.diagnosis,
          itemCount: prescription.items.length,
          medicines: validatedData.items.map(item => item.medicineName)
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      prescription: {
        id: prescription.id,
        status: prescription.status,
        patientName: prescription.patient.pii?.fullName
      }
    })

  } catch (error) {
    console.error('Error creating prescription:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
