'use client'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session) return null

  const isDoctor = session.user.roles.includes('DOCTOR')
  const isDispenser = session.user.roles.includes('DISPENSER')
  const isAdmin = session.user.roles.includes('ADMIN')

  const navItems = []

  // In the navigation items section, update the doctor items:
  if (isDoctor) {
    navItems.push(
      { href: '/doctor/raw-prescriptions', label: 'Dashboard' },
      { href: '/doctor/prescription-pad', label: 'New Prescriptions' }, // Add this line
      // { href: '/doctor/prescriptions/new', label: 'New Prescription' },
      // { href: '/doctor/patients', label: 'Patients' }
    )
  }


  // In the navigation items section, update the dispenser items:
  if (isDispenser) {
    navItems.push(
      { href: '/dispenser', label: 'Dashboard' },
      { href: '/dispenser/prescriptions', label: 'All Prescriptions' } // Add this line
    )
  }


  // In the navigation items section, add admin items:
  if (isAdmin) {
    navItems.push(
      { href: '/admin', label: 'Dashboard' },
      { href: '/admin/users', label: 'Manage Users' },
      { href: '/admin/audit', label: 'Audit Logs' }
    )
  }


  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Pharmacy System
            </Link>

            <div className="flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {session.user.name} ({session.user.roles.join(', ')})
            </span>
            <button
              onClick={() => signOut()}
              className="bg-red-600 text-white px-3 py-2 text-sm rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
