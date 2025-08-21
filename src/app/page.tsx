import { getCurrentUser } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Redirect based on user role
  if (user.roles.includes('DOCTOR')) {
    redirect('/doctor/welcome')
  } else if (user.roles.includes('DISPENSER')) {
    redirect('/dispenser')
  } else if (user.roles.includes('ADMIN')) {
    redirect('/admin')
  }
  
  // Fallback
  redirect('/login')
}
