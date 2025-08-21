import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import { z } from 'zod'

const medicineSchema = z.object({
  id: z.string(),
  name: z.string(),
  frequencies: z.array(z.boolean()).length(3)
})

const rawPrescriptionSchema = z.object({
  patientName: z.string().optional(),
  patientAge: z.string().optional(),
  patientGender: z.string().optional(),
  patientCNIC: z.string().optional(),
  patientPhone: z.string().optional(),
  patientAddress: z.string().optional(),
  diagnosis: z.string().optional(),
  tests: z.string().optional(),
  recommendations: z.string().optional(),
  medicines: z.array(medicineSchema)
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.roles.includes('DOCTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = rawPrescriptionSchema.parse(body)

    // Create prescription with medicines
    const prescription = await prisma.rawPrescription.create({
      data: {
        doctorId: user.id,
        patientName: validatedData.patientName || null,
        patientAge: validatedData.patientAge || null,
        patientGender: validatedData.patientGender || null,
        patientCNIC: validatedData.patientCNIC || null,
        patientPhone: validatedData.patientPhone || null,
        patientAddress: validatedData.patientAddress || null,
        diagnosis: validatedData.diagnosis || null,
        tests: validatedData.tests || null,
        recommendations: validatedData.recommendations || null,
        medicines: {
          create: validatedData.medicines
            .filter(med => med.name.trim()) // Only save medicines with names
            .map((medicine, index) => ({
              medicineOrder: index + 1,
              medicineName: medicine.name.trim(),
              frequency1: medicine.frequencies[0],
              frequency2: medicine.frequencies[1],
              frequency3: medicine.frequencies[2]
            }))
        }
      },
      include: {
        medicines: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      prescription: {
        id: prescription.id,
        createdAt: prescription.createdAt
      }
    })

  } catch (error) {
    console.error('Error saving raw prescription:', error)
    
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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.roles.includes('DOCTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const prescriptions = await prisma.rawPrescription.findMany({
      where: { doctorId: user.id },
      include: {
        medicines: {
          orderBy: { medicineOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.rawPrescription.count({
      where: { doctorId: user.id }
    })

    return NextResponse.json({ 
      prescriptions,
      total,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error fetching raw prescriptions:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
