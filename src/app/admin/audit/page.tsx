import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'

async function getAuditLogs() {
  return await prisma.auditLog.findMany({
    include: {
      actor: {
        select: {
          displayName: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100 // Limit to last 100 logs
  })
}

export default async function AuditLogsPage() {
  const user = await requireRole(['ADMIN'])
  const auditLogs = await getAuditLogs()

  const actionColors = {
    'CREATE_PATIENT': 'bg-green-100 text-green-800',
    'CREATE_PRESCRIPTION': 'bg-blue-100 text-blue-800',
    'UPDATE_PRESCRIPTION': 'bg-yellow-100 text-yellow-800',
    'FINALIZE_PRESCRIPTION': 'bg-purple-100 text-purple-800',
    'DISPENSE_PRESCRIPTION': 'bg-indigo-100 text-indigo-800',
    'GENERATE_PDF': 'bg-gray-100 text-gray-800',
    'CREATE_USER': 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Audit Logs
        </h1>
        <div className="text-sm text-gray-500">
          Showing last 100 activities
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            System Activity ({auditLogs.length})
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        actionColors[log.action as keyof typeof actionColors] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.actor.displayName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.actor.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.resourceType}
                      </div>
                      <div className="text-sm text-gray-500 font-mono">
                        {log.resourceId.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {typeof log.details === 'object' && log.details && (
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.createdAt.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {auditLogs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No audit logs found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
