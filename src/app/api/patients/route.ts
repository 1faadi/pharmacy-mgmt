import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
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

    // Only return patients that this doctor has created prescriptions for
    const patients = await prisma.patient.findMany({
      where: {
        prescriptions: {
          some: {
            doctorId: user.id // Only patients with prescriptions by this doctor
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
  
  // Get the count of patients created this year
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
