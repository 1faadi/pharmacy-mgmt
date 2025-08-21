'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useReactToPrint } from 'react-to-print'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface Doctor {
    id: string
    name: string
    email: string
}

interface Medicine {
    id: string
    name: string
    frequencies: [boolean, boolean, boolean]
}

interface RawPrescriptionPadProps {
    doctor: Doctor
}

export default function RawPrescriptionPad({ doctor }: RawPrescriptionPadProps) {
    const componentRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // Patient information - UPDATED: replaced patientAddress with patientGender
    const [patientName, setPatientName] = useState('')
    const [patientAge, setPatientAge] = useState('')
    const [patientCNIC, setPatientCNIC] = useState('')
    const [patientPhone, setPatientPhone] = useState('')
    const [patientGender, setPatientGender] = useState('')

    // Medical information
    const [medicines, setMedicines] = useState<Medicine[]>([
        { id: '1', name: '', frequencies: [false, false, false] }
    ])
    const [diagnosis, setDiagnosis] = useState('')
    const [tests, setTests] = useState('')
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

    // Medicine management
    const addMedicine = () => {
        const newMedicine: Medicine = {
            id: Date.now().toString(),
            name: '',
            frequencies: [false, false, false]
        }
        setMedicines([...medicines, newMedicine])
    }
    
    const removeMedicine = (id: string) => {
        if (medicines.length > 1) {
            setMedicines(medicines.filter(med => med.id !== id))
        }
    }

    const updateMedicineName = (id: string, name: string) => {
        setMedicines(medicines.map(med =>
            med.id === id ? { ...med, name } : med
        ))
    }

    const toggleFrequency = (id: string, index: number) => {
        setMedicines(medicines.map(med => {
            if (med.id === id) {
                const newFrequencies = [...med.frequencies] as [boolean, boolean, boolean]
                newFrequencies[index] = !newFrequencies[index]
                return { ...med, frequencies: newFrequencies }
            }
            return med
        }))
    }

    // Format medicine for print - convert checkboxes to readable text
    const formatMedicineForPrint = (medicine: Medicine, index: number) => {
        if (!medicine.name.trim()) return null

        const frequencies = []
        if (medicine.frequencies[0]) frequencies.push('Once daily')
        if (medicine.frequencies[1]) frequencies.push('Twice daily')
        if (medicine.frequencies) frequencies.push('Three times daily')

        const freqText = frequencies.length > 0 ? frequencies.join(', ') : 'As directed'

        return `${index + 1}. ${medicine.name} - ${freqText}`
    }
    
    // Add these new state variables
    const [isSaving, setIsSaving] = useState(false)
    const [savedPrescriptionId, setSavedPrescriptionId] = useState<string | null>(null)
    const [showSaveSuccess, setShowSaveSuccess] = useState(false)

    // Add save function - UPDATED: patientGender instead of patientAddress
    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await fetch('/api/raw-prescriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patientName,
                    patientAge,
                    patientCNIC,
                    patientPhone,
                    patientGender, // UPDATED: changed from patientAddress
                    diagnosis,
                    tests,
                    recommendations: '',
                    medicines: medicines.map(med => ({
                        id: med.id,
                        name: med.name,
                        frequencies: med.frequencies
                    }))
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to save prescription')
            }

            const result = await response.json()
            setSavedPrescriptionId(result.prescription.id)
            setShowSaveSuccess(true)

            // Hide success message after 3 seconds
            setTimeout(() => setShowSaveSuccess(false), 3000)

        } catch (error) {
            console.error('Error saving prescription:', error)
            alert('Failed to save prescription. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }
    
    // Print functionality
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Raw-Prescription-${patientName.replace(/\s+/g, '-') || 'Blank'}-${new Date().toLocaleDateString()}`,
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
        .form-view {
          display: none !important;
        }
        .print-view {
          display: block !important;
        }
      }
    `
    })

    // PDF Download functionality
    const handleDownloadPDF = async () => {
        if (!componentRef.current) return

        setIsGeneratingPDF(true)
        try {
            // Hide controls and form, show print view
            const printButtons = componentRef.current.querySelectorAll('.no-print')
            const formView = componentRef.current.querySelector('.form-view')
            const printView = componentRef.current.querySelector('.print-view')

            printButtons.forEach(btn => (btn as HTMLElement).style.display = 'none')
            if (formView) (formView as HTMLElement).style.display = 'none'
            if (printView) (printView as HTMLElement).style.display = 'block'

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

            const fileName = `Raw-Prescription-${patientName.replace(/\s+/g, '-') || 'Blank'}-${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`
            pdf.save(fileName)

            // Restore original view
            printButtons.forEach(btn => (btn as HTMLElement).style.display = '')
            if (formView) (formView as HTMLElement).style.display = 'flex'
            if (printView) (printView as HTMLElement).style.display = 'none'
        } catch (error) {
            console.error('Error generating PDF:', error)
        } finally {
            setIsGeneratingPDF(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto"> {/* UPDATED: increased max-width for better layout */}
                {/* Control Buttons */}
                <div className="no-print mb-4 flex justify-between items-center bg-white p-4 rounded-lg shadow">
                    <button
                        onClick={() => router.push('/doctor/welcome')}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                        ← Back to Dashboard
                    </button>

                    {/* Success Message */}
                    {showSaveSuccess && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
                            ✅ Prescription saved successfully!
                        </div>
                    )}

                    <div className="flex space-x-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                            {isSaving ? '💾 Saving...' : '💾 Save Prescription'}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            🖨️ Print
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPDF}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {isGeneratingPDF ? '📄 Generating...' : '📄 Download PDF'}
                        </button>
                    </div>
                </div>

                {/* Prescription Form */}
                <div ref={componentRef} className="bg-white shadow-lg">
                    {/* Header - ORIGINAL KEPT AS IS */}
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
                                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                                    <p><strong>Dr.</strong> {doctor.name}</p>
                                    <p className="text-xs text-gray-500">{doctor.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form View - Editable Form with UPDATED LAYOUT */}
                    <div className="form-view flex h-auto min-h-[500px]">
                        {/* Section 1: Patient Details - REDUCED WIDTH (1/5) */}
                        <div className="w-1/5 border-r border-gray-400 p-4"> {/* UPDATED: w-1/5 instead of w-1/3, reduced padding */}
                            <div className="space-y-3"> {/* UPDATED: reduced spacing */}
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        className="w-full h-9 px-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none bg-white text-black text-sm" // UPDATED: smaller height and padding
                                    />
                                </div>

                                {/* Age */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
                                    <input
                                        type="text"
                                        value={patientAge}
                                        onChange={(e) => setPatientAge(e.target.value)}
                                        className="w-full h-9 px-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none bg-white text-black text-sm"
                                    />
                                </div>

                                {/* CNIC */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">CNIC</label>
                                    <input
                                        type="text"
                                        value={patientCNIC}
                                        onChange={(e) => setPatientCNIC(e.target.value)}
                                        className="w-full h-9 px-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none bg-white text-black text-sm"
                                        maxLength={15}
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={patientPhone}
                                        onChange={(e) => setPatientPhone(e.target.value)}
                                        className="w-full h-9 px-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none bg-white text-black text-sm"
                                    />
                                </div>

                                {/* Gender - UPDATED: replaced Address with Gender */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                                    <select
                                        value={patientGender}
                                        onChange={(e) => setPatientGender(e.target.value)}
                                        className="w-full h-9 px-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none bg-white text-black text-sm"
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Medicines - INCREASED WIDTH (2/5) */}
                        <div className="w-2/5 border-r border-gray-400 p-6"> {/* UPDATED: w-2/5 instead of w-1/3 */}
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Medicines</label>

                            {/* Scrollable Medicine Container */}
                            <div className="max-h-80 overflow-y-auto pr-2 mb-4 border rounded-md border-gray-200 bg-gray-50">
                                <div className="space-y-3 p-3">
                                    {medicines.map((medicine) => (
                                        <div key={medicine.id} className="flex items-center gap-2 bg-white p-2 rounded border">
                                            {/* Medicine Name Input */}
                                            <input
                                                type="text"
                                                value={medicine.name}
                                                onChange={(e) => updateMedicineName(medicine.id, e.target.value)}
                                                className="flex-1 h-10 px-3 border border-gray-300 rounded focus:border-blue-500 focus:outline-none bg-white text-black text-sm"
                                                placeholder="Medicine name"
                                            />

                                            {/* 3 Checkboxes for frequency */}
                                            <div className="flex gap-2 ml-2 flex-shrink-0">
                                                {[0, 1, 2].map((index) => (
                                                    <label key={index} className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={medicine.frequencies[index]}
                                                            onChange={() => toggleFrequency(medicine.id, index)}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                                                    </label>
                                                ))}
                                            </div>

                                            {/* Remove Medicine Button */}
                                            {medicines.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedicine(medicine.id)}
                                                    className="no-print text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                                                    title="Remove medicine"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {/* Empty State Message */}
                                    {medicines.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>No medicines added yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Add Medicine Button */}
                            <button
                                type="button"
                                onClick={addMedicine}
                                className="no-print w-full py-2 px-4 border border-dashed border-gray-400 rounded text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium"
                            >
                                <span className="text-lg mr-2">+</span>
                                Add Medicine
                            </button>

                            {/* Medicine Count Indicator */}
                            <p className="no-print text-xs text-gray-500 mt-2 text-center">
                                {medicines.length} medicine{medicines.length !== 1 ? 's' : ''} added
                            </p>
                        </div>

                        {/* Section 3: Diagnosis & Tests - SAME WIDTH (2/5) */}
                        <div className="w-2/5 p-6"> {/* UPDATED: w-2/5 instead of w-1/3 */}
                            {/* Diagnosis */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Diagnosis</label>
                                <textarea
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none bg-white text-black resize-none"
                                    placeholder="Enter diagnosis..."
                                />
                            </div>

                            {/* Tests */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tests</label>
                                <textarea
                                    value={tests}
                                    onChange={(e) => setTests(e.target.value)}
                                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none bg-white text-black resize-none"
                                    placeholder="Enter tests..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Print View - Clean Prescription Format - UNCHANGED PDF LAYOUT */}
                    <div className="print-view hidden" style={{ fontFamily: 'Times New Roman, serif', fontSize: '12px', padding: '20px' }}>
                        {/* Patient Information Section */}
                        <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #000' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ width: '60%' }}>
                                    <p><strong>Name:</strong> {patientName}</p>
                                    <p><strong>Age:</strong> {patientAge}</p>
                                    <p><strong>Gender:</strong> {patientGender}</p> {/* UPDATED: Gender instead of Address */}
                                    <p><strong>CNIC:</strong> {patientCNIC}</p>
                                    <p><strong>Phone:</strong> {patientPhone}</p>
                                </div>
                                <div style={{ width: '35%', textAlign: 'right' }}>
                                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                                    <p><strong>Dr:</strong> {doctor.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Content in 3 Sections - PDF LAYOUT UNCHANGED */}
                        <div style={{ display: 'flex', minHeight: '300px' }}>
                            {/* Left Section - Diagnosis */}
                            <div style={{ width: '33%', paddingRight: '15px', borderRight: '1px solid #000' }}>
                                <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>DIAGNOSIS:</h3>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                    {diagnosis || 'Not specified'}
                                </div>
                            </div>

                            {/* Middle Section - Medicines */}
                            <div style={{ width: '34%', paddingLeft: '15px', paddingRight: '15px', borderRight: '1px solid #000' }}>
                                <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>℞ MEDICINES:</h3>
                                <div style={{ lineHeight: '1.6' }}>
                                    {medicines.filter(med => med.name.trim()).length > 0 ? (
                                        medicines.filter(med => med.name.trim()).map((medicine, index) => {
                                            const formatted = formatMedicineForPrint(medicine, index)
                                            return formatted ? (
                                                <div key={medicine.id} style={{ marginBottom: '8px' }}>
                                                    {formatted}
                                                </div>
                                            ) : null
                                        })
                                    ) : (
                                        <p>No medicines prescribed</p>
                                    )}
                                </div>
                            </div>

                            {/* Right Section - Tests */}
                            <div style={{ width: '33%', paddingLeft: '15px' }}>
                                <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>TESTS:</h3>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                    {tests || 'No tests required'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 border-t">
                        <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-600">
                                <p><strong>Valid for 30 days</strong> | Contact: (021) 111-2345</p>
                            </div>
                            <div className="text-right">
                                <div className="w-40 border-b border-gray-400 mb-1"></div>
                                <p className="text-sm font-medium">Dr. {doctor.name}</p>
                                <p className="text-xs text-gray-500">PMDC Reg: 12345-A</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
