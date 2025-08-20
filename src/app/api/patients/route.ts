import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createPatientSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(1, 'Address is required'),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, 'Invalid CNIC format'),
  ageBand: z.string().min(1, 'Age band is required')
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.roles.includes('DOCTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Always return only patients this doctor has treated (consistent behavior)
    const patients = await prisma.patient.findMany({
      where: {
        prescriptions: {
          some: {
            doctorId: user.id
          }
        }
      },
      include: {
        pii: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ patients })

  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.roles.includes('DOCTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createPatientSchema.parse(body)

    // Generate unique patient code
    const patientCode = await generatePatientCode()

    // Create patient with PII
    const patient = await prisma.patient.create({
      data: {
        patientCode,
        ageBand: validatedData.ageBand,
        pii: {
          create: {
            fullName: validatedData.fullName,
            phone: validatedData.phone,
            address: validatedData.address,
            cnic: validatedData.cnic
          }
        }
      },
      include: {
        pii: true
      }
    })

    // Create initial empty prescription to link patient to doctor
    await prisma.prescription.create({
      data: {
        patientId: patient.id,
        doctorId: user.id,
        diagnosis: 'Initial consultation',
        recommendation: 'Follow up as needed',
        status: 'DRAFT',
        issuedOn: new Date(),
        items: {
          create: []
        }
      }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'CREATE_PATIENT',
        resourceType: 'PATIENT',
        resourceId: patient.id,
        details: {
          patientCode: patient.patientCode,
          fullName: validatedData.fullName,
          createdBy: user.name
        }
      }
    })

    // Revalidate caches
    revalidatePath('/doctor/patients')
    revalidatePath('/doctor/prescriptions/new')
    revalidatePath('/api/patients')

    return NextResponse.json({ 
      success: true, 
      patient: {
        id: patient.id,
        patientCode: patient.patientCode,
        ageBand: patient.ageBand,
        fullName: patient.pii?.fullName
      }
    })

  } catch (error) {
    console.error('Error creating patient:', error)
    
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

async function generatePatientCode(): Promise<string> {
  const prefix = 'P'
  const year = new Date().getFullYear().toString().slice(-2)
  
  const startOfYear = new Date(new Date().getFullYear(), 0, 1)
  const patientCount = await prisma.patient.count({
    where: {
      createdAt: {
        gte: startOfYear
      }
    }
  })
  
  const sequence = (patientCount + 1).toString().padStart(4, '0')
  return `${prefix}${year}${sequence}`
}
