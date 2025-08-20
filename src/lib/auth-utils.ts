import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './dt'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  
  const hasRole = user.roles.some(role => allowedRoles.includes(role))
  if (!hasRole) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
  }
  
  return user
}

export async function logAudit(
  actorUserId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: any = {}
) {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action,
      resourceType,
      resourceId,
      details
    }
  })
}
