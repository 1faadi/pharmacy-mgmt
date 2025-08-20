'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PrescriptionActionsProps {
  prescription: {
    id: string
    status: string
  }
}

export default function PrescriptionActions({ prescription }: PrescriptionActionsProps) {
  const [isFinalizing, setIsFinalizing] = useState(false) // Fixed variable name
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const router = useRouter()

  const handleFinalize = async () => {
    if (!confirm('Are you sure you want to finalize this prescription? This action cannot be undone.')) {
      return
    }

    setIsFinalizing(true)
    try {
      const response = await fetch(`/api/prescriptions/${prescription.id}/finalize`, {
        method: 'POST'
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to finalize prescription')
      }
    } catch (error) {
      console.error('Error finalizing prescription:', error)
      alert('Failed to finalize prescription')
    } finally {
      setIsFinalizing(false)
    }
  }

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const response = await fetch(`/api/prescriptions/${prescription.id}/pdf`, {
        method: 'GET'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `prescription-${prescription.id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to generate PDF')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="flex space-x-3">
      <Link
        href="/doctor/prescriptions"
        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
      >
        Back to Prescriptions
      </Link>
      
      {prescription.status === 'DRAFT' && (
        <>
          <Link
            href={`/doctor/prescriptions/${prescription.id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Edit
          </Link>
          <button
            onClick={handleFinalize}
            disabled={isFinalizing} // Fixed variable name
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isFinalizing ? 'Finalizing...' : 'Finalize'} 
          </button>
        </>
      )}

      {prescription.status === 'FINAL' && (
        <button
          onClick={handleGeneratePDF}
          disabled={isGeneratingPDF}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
        </button>
      )}
    </div>
  )
}
