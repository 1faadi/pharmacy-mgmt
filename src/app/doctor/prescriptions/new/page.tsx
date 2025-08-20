'use client'
import { useSearchParams } from 'next/navigation'
import PrescriptionForm from '@/components/forms/prescription-form'

export default function NewPrescriptionPage() {
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patientId') || undefined

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">New Prescription</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <PrescriptionForm initialPatientId={patientId} />
        </div>
      </div>
    </div>
  )
}
