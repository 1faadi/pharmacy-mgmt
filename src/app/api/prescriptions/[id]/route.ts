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

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.roles.includes('DOCTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const prescriptionId = context.params.id
    const body = await request.json()
    const validatedData = updatePrescriptionSchema.parse(body)

    // ... rest of your existing logic
    
  } catch (error) {
    console.error('Error updating prescription:', error)
    
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
