'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PrescriptionForm from '@/components/forms/prescription-form'

function NewPrescriptionContent() {
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patientId')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Create New Prescription</h1>
      </div>

      {patientId && (
        <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Patient pre-selected for prescription
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <PrescriptionForm initialPatientId={patientId || undefined} />
        </div>
      </div>
    </div>
  )
}

export default function NewPrescriptionPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading prescription form...</div>}>
      <NewPrescriptionContent />
    </Suspense>
  )
}
