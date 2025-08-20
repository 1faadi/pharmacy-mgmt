import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roles: z.array(z.enum(['ADMIN', 'DOCTOR', 'DISPENSER'])).min(1, 'At least one role is required')
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Email already exists' 
      }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Create user with roles
    const newUser = await prisma.user.create({
      data: {
        displayName: validatedData.displayName,
        email: validatedData.email,
        passwordHash: hashedPassword,
        roles: {
          create: validatedData.roles.map(roleName => ({
            roleName
          }))
        }
      },
      include: {
        roles: {
          include: { role: true }
        }
      }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'CREATE_USER',
        resourceType: 'USER',
        resourceId: newUser.id,
        details: {
          displayName: newUser.displayName,
          email: newUser.email,
          roles: validatedData.roles,
          createdBy: user.name
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      user: {
        id: newUser.id,
        displayName: newUser.displayName,
        email: newUser.email,
        roles: newUser.roles.map(r => r.roleName)
      }
    })

  } catch (error) {
    console.error('Error creating user:', error)
    
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
