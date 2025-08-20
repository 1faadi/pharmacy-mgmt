import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import Link from 'next/link'

async function getAdminStats() {
  const [
    totalUsers,
    totalDoctors,
    totalDispensers,
    totalPatients,
    totalPrescriptions,
    finalPrescriptions,
    dispensedPrescriptions,
    todayPrescriptions
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { roles: { some: { roleName: 'DOCTOR' } } }
    }),
    prisma.user.count({
      where: { roles: { some: { roleName: 'DISPENSER' } } }
    }),
    prisma.patient.count(),
    prisma.prescription.count(),
    prisma.prescription.count({
      where: { status: 'FINAL' }
    }),
    prisma.prescription.count({
      where: { dispensedAt: { not: null } }
    }),
    prisma.prescription.count({
      where: {
        issuedOn: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  ])

  return {
    totalUsers,
    totalDoctors,
    totalDispensers,
    totalPatients,
    totalPrescriptions,
    finalPrescriptions,
    dispensedPrescriptions,
    todayPrescriptions
  }
}

async function getRecentActivity() {
  const recentPrescriptions = await prisma.prescription.findMany({
    take: 5,
    orderBy: { issuedOn: 'desc' },
    include: {
      patient: {
        include: { pii: true }
      },
      doctor: {
        select: { displayName: true }
      }
    }
  })

  const recentAudits = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      actor: {
        select: { displayName: true, email: true }
      }
    }
  })

  return { recentPrescriptions, recentAudits }
}

export default async function AdminDashboard() {
  const user = await requireRole(['ADMIN'])
  const stats = await getAdminStats()
  const activity = await getRecentActivity()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <div className="text-sm text-gray-500">
          Welcome, {user.name}
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
          <div className="text-sm text-gray-500 mt-1">
            {stats.totalDoctors} Doctors • {stats.totalDispensers} Dispensers
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Patients</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalPatients}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Prescriptions</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalPrescriptions}</p>
          <div className="text-sm text-gray-500 mt-1">
            {stats.finalPrescriptions} Final • {stats.dispensedPrescriptions} Dispensed
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Today</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.todayPrescriptions}</p>
          <div className="text-sm text-gray-500 mt-1">New prescriptions</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Quick Actions
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/admin/users/new"
              className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 text-center font-medium"
            >
              Add New User
            </Link>
            <Link
              href="/admin/users"
              className="bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 text-center font-medium"
            >
              Manage Users
            </Link>
            <Link
              href="/admin/audit"
              className="bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 text-center font-medium"
            >
              View Audit Logs
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Prescriptions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Prescriptions
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {activity.recentPrescriptions.map((prescription) => (
                <li key={prescription.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {prescription.patient.pii?.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        by {prescription.doctor.displayName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {prescription.issuedOn.toLocaleDateString()}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        prescription.status === 'FINAL' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {prescription.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recent Audit Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Activity
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {activity.recentAudits.slice(0, 5).map((audit) => (
                <li key={audit.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {audit.action.replace('_', ' ').toLowerCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        by {audit.actor.displayName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {audit.createdAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
