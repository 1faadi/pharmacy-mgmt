'use client'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useReactToPrint } from 'react-to-print'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface RawPrescriptionData {
    id: string
    createdAt: Date
    patientName: string | null
    patientAge: string | null
    patientGender: string | null
    patientCNIC: string | null
    patientPhone: string | null
    patientAddress: string | null
    diagnosis: string | null
    tests: string | null
    recommendations: string | null
    doctor: {
        displayName: string
        email: string
    }
    medicines: {
        id: string
        medicineOrder: number
        medicineName: string
        frequency1: boolean
        frequency2: boolean
        frequency3: boolean
    }[]
}

interface RawPrescriptionViewerProps {
    prescription: RawPrescriptionData
}

export default function RawPrescriptionViewer({ prescription }: RawPrescriptionViewerProps) {
    const componentRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // Format medicine for display - convert boolean frequencies to readable text
    const formatMedicineForDisplay = (medicine: any, index: number) => {
        const frequencies = []
        if (medicine.frequency1) frequencies.push('Once daily')
        if (medicine.frequency2) frequencies.push('Twice daily')
        if (medicine.frequency3) frequencies.push('Three times daily')

        const freqText = frequencies.length > 0 ? frequencies.join(', ') : 'As directed'
        return `${index + 1}. ${medicine.medicineName} - ${freqText}`
    }

    // Print functionality
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Prescription-${prescription.patientName?.replace(/\s+/g, '-') || 'Blank'}-${prescription.createdAt.toLocaleDateString()}`,
        pageStyle: `
      @page {
        size: A4;
        margin: 0.5in;
      }
      @media print {
        body { 
          font-family: 'Times New Roman', serif;
          color: #000 !important;
          background: white !important;
          font-size: 12px;
        }
        .no-print { 
          display: none !important; 
        }
      }
    `
    })

    // PDF Download functionality
    const handleDownloadPDF = async () => {
        if (!componentRef.current) return

        try {
            const printButtons = componentRef.current.querySelectorAll('.no-print')
            printButtons.forEach(btn => (btn as HTMLElement).style.display = 'none')

            const canvas = await html2canvas(componentRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a4')

            const imgWidth = 210
            const pageHeight = 295
            const imgHeight = (canvas.height * imgWidth) / canvas.width

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight <= pageHeight ? imgHeight : pageHeight)

            const fileName = `Prescription-${prescription.patientName?.replace(/\s+/g, '-') || 'Blank'}-${prescription.createdAt.toLocaleDateString().replace(/\//g, '-')}.pdf`
            pdf.save(fileName)

            printButtons.forEach(btn => (btn as HTMLElement).style.display = '')
        } catch (error) {
            console.error('Error generating PDF:', error)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Control Buttons */}
                <div className="no-print mb-4 flex justify-between items-center bg-white p-4 rounded-lg shadow">
                    <button
                        onClick={() => router.push('/doctor/raw-prescriptions')}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                        ← Back to Prescriptions
                    </button>
                    <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Saved:</span> {prescription.createdAt.toLocaleDateString()} at {prescription.createdAt.toLocaleTimeString()}
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={handlePrint}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                                🖨️ Print
                            </button>
                            
                        </div>
                    </div>
                </div>

                {/* Prescription Display */}
                <div ref={componentRef} className="bg-white shadow-lg">
                    {/* Header - Same as Original */}
                    <div className="border-b-4 border-blue-800 p-6">
                        <div className="flex justify-between items-start">
                            {/* Left side - Medical Icon & Clinic Info */}
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-800 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7z" />
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-blue-800">MediCare Clinic</h1>
                                    <p className="text-sm text-gray-600">Professional Medical Care</p>
                                    <p className="text-xs text-gray-500">License No: MC-2024-001 | Tel: (021) 111-2345</p>
                                </div>
                            </div>

                            {/* Right side - Date & Doctor */}
                            <div className="text-right">
                                <div className="text-2xl font-bold text-blue-800">PRESCRIPTION</div>
                                <div className="text-sm text-gray-600 mt-2">
                                    <p><strong>Date:</strong> {prescription.createdAt.toLocaleDateString()}</p>
                                    <p><strong>Dr.</strong> {prescription.doctor.displayName}</p>
                                    <p className="text-xs text-gray-500">{prescription.doctor.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Clean Display - Same as PDF Format */}
                    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', padding: '30px' }}>
                        {/* Patient Information Section */}
                        <div style={{ marginBottom: '25px', paddingBottom: '15px', borderBottom: '2px solid #000' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ width: '65%' }}>
                                    <h3 style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '16px' }}>PATIENT INFORMATION:</h3>
                                    {prescription.patientName && (
                                        <p style={{ marginBottom: '8px' }}><strong>Name:</strong> {prescription.patientName}</p>
                                    )}
                                    {prescription.patientAge && (
                                        <p style={{ marginBottom: '8px' }}><strong>Age:</strong> {prescription.patientAge}</p>
                                    )}
                                    {prescription.patientGender && (
                                        <p style={{ marginBottom: '8px' }}><strong>Gender:</strong> {prescription.patientGender}</p>
                                    )}
                                    {prescription.patientCNIC && (
                                        <p style={{ marginBottom: '8px' }}><strong>CNIC:</strong> {prescription.patientCNIC}</p>
                                    )}
                                    {prescription.patientPhone && (
                                        <p style={{ marginBottom: '8px' }}><strong>Phone:</strong> {prescription.patientPhone}</p>
                                    )}
                                    {prescription.patientAddress && (
                                        <p style={{ marginBottom: '8px' }}><strong>Address:</strong> {prescription.patientAddress}</p>
                                    )}
                                    {!prescription.patientName && !prescription.patientAge && !prescription.patientGender &&
                                        !prescription.patientCNIC && !prescription.patientPhone && !prescription.patientAddress && (
                                            <p style={{ fontStyle: 'italic', color: '#666' }}>Patient details not specified</p>
                                        )}
                                </div>
                                <div style={{ width: '30%', textAlign: 'right' }}>
                                    <p style={{ fontSize: '12px', color: '#666' }}>
                                        <strong>Prescription ID:</strong><br />
                                        {prescription.id}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Main Content in 3 Sections */}
                        <div style={{ display: 'flex', minHeight: '350px', gap: '20px' }}>
                            {/* Left Section - Diagnosis */}
                            <div style={{ width: '33%', paddingRight: '15px', borderRight: '1px solid #333' }}>
                                <h3 style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '16px' }}>DIAGNOSIS:</h3>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', minHeight: '100px' }}>
                                    {prescription.diagnosis || (
                                        <span style={{ fontStyle: 'italic', color: '#666' }}>No diagnosis specified</span>
                                    )}
                                </div>
                            </div>

                            {/* Middle Section - Medicines */}
                            <div style={{ width: '34%', paddingLeft: '15px', paddingRight: '15px', borderRight: '1px solid #333' }}>
                                <h3 style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '16px' }}>℞ MEDICINES:</h3>
                                <div style={{ lineHeight: '1.8' }}>
                                    {prescription.medicines.length > 0 ? (
                                        prescription.medicines.map((medicine, index) => (
                                            <div key={medicine.id} style={{ marginBottom: '12px' }}>
                                                {formatMedicineForDisplay(medicine, index)}
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ fontStyle: 'italic', color: '#666' }}>No medicines prescribed</p>
                                    )}
                                </div>
                            </div>

                            {/* Right Section - Tests */}
                            <div style={{ width: '33%', paddingLeft: '15px' }}>
                                <h3 style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '16px' }}>TESTS:</h3>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', minHeight: '100px' }}>
                                    {prescription.tests || (
                                        <span style={{ fontStyle: 'italic', color: '#666' }}>No tests required</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recommendations Section (if any) */}
                        {prescription.recommendations && (
                            <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #ccc' }}>
                                <h3 style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>RECOMMENDATIONS:</h3>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                    {prescription.recommendations}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 border-t">
                        <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-600">
                                <p><strong>Valid for 30 days</strong> | Contact: (021) 111-2345</p>
                                <p className="mt-1">Prescription saved on: {prescription.createdAt.toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <div className="w-40 border-b border-gray-400 mb-1"></div>
                                <p className="text-sm font-medium">Dr. {prescription.doctor.displayName}</p>
                                <p className="text-xs text-gray-500">PMDC Reg: 12345-A</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
