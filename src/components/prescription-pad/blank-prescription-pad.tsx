'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useReactToPrint } from 'react-to-print'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'react-toastify'

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

    // Patient information
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

    // ✅ VALIDATION FUNCTION
    const validateForm = (): boolean => {
        if (!patientName.trim()) {
            toast.error('❌ Please enter the patient\'s name!', {
                position: 'top-center',
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
            })
            return false
        }

        if (!patientAge.trim()) {
            toast.error('❌ Please enter the patient\'s age!', {
                position: 'top-center',
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
            })
            return false
        }

        const hasValidMedicine = medicines.some(med => med.name.trim() !== '')
        if (!hasValidMedicine) {
            toast.error('❌ Please add at least one medicine!', {
                position: 'top-center',
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
            })
            return false
        }

        return true
    }

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

    // Format medicine for print
    const formatMedicineForPrint = (medicine: Medicine, index: number) => {
        if (!medicine.name.trim()) return null

        const frequencies = []
        if (medicine.frequencies[0]) frequencies.push('Morning')
        if (medicine.frequencies[1]) frequencies.push('Afternoon')
        if (medicine.frequencies[2]) frequencies.push('Evening') // Fixed the typo

        const freqText = frequencies.length > 0 ? frequencies.join(', ') : 'As directed'
        return `${index + 1}. ${medicine.name} - ${freqText}`
    }

    // Save state variables
    const [isSaving, setIsSaving] = useState(false)
    const [savedPrescriptionId, setSavedPrescriptionId] = useState<string | null>(null)
    const [showSaveSuccess, setShowSaveSuccess] = useState(false)

    // ✅ UPDATED SAVE FUNCTION WITH VALIDATION
    const handleSave = async () => {
        if (!validateForm()) {
            return
        }

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
                    patientGender,
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

            toast.success('✅ Prescription saved successfully!', {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
            })

            setTimeout(() => setShowSaveSuccess(false), 3000)

        } catch (error) {
            console.error('Error saving prescription:', error)
            toast.error('❌ Failed to save prescription. Please try again!', {
                position: 'top-center',
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
            })
        } finally {
            setIsSaving(false)
        }
    }

    // ✅ UPDATED PRINT FUNCTION WITH VALIDATION
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

    // ✅ UPDATED PDF DOWNLOAD FUNCTION WITH VALIDATION
    const handleDownloadPDF = async () => {
        if (!validateForm()) {
            return
        }

        if (!componentRef.current) return

        setIsGeneratingPDF(true)
        try {
            const loadingToast = toast.loading('📄 Generating PDF...', {
                position: 'top-center',
            })

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

            toast.update(loadingToast, {
                render: '✅ PDF downloaded successfully!',
                type: 'success',
                isLoading: false,
                autoClose: 3000,
                closeOnClick: true,
                pauseOnHover: true,
            })

            printButtons.forEach(btn => (btn as HTMLElement).style.display = '')
            if (formView) (formView as HTMLElement).style.display = 'flex'
            if (printView) (printView as HTMLElement).style.display = 'none'
        } catch (error) {
            console.error('Error generating PDF:', error)
            toast.error('❌ Failed to generate PDF. Please try again!', {
                position: 'top-center',
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
            })
        } finally {
            setIsGeneratingPDF(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 py-4 sm:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Control Buttons - Responsive */}
                <div className="no-print mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow">
                    <button
                        onClick={() => router.push('/doctor/welcome')}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                    >
                        ← Back to Dashboard
                    </button>

                    {/* Success Message */}
                    {showSaveSuccess && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded w-full sm:w-auto text-center">
                            ✅ Prescription saved successfully!
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                            {isSaving ? '💾 Saving...' : '💾 Save Prescription'}
                        </button>
                        <button
                            onClick={() => {
                                if (validateForm()) {
                                    handlePrint()
                                }
                            }}
                            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            🖨️ Print
                        </button>
                       
                    </div>
                </div>

                {/* Prescription Form */}
                <div ref={componentRef} className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Header - Responsive */}
                    <div className="border-b-4 border-blue-800 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-800 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7z" />
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-blue-800">MediCare Clinic</h1>
                                    <p className="text-xs sm:text-sm text-gray-600">Professional Medical Care</p>
                                    <p className="text-xs text-gray-500">License No: MC-2024-001 | Tel: (021) 111-2345</p>
                                </div>
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto">
                                <div className="text-xl sm:text-2xl font-bold text-blue-800">PRESCRIPTION</div>
                                <div className="text-xs sm:text-sm text-gray-600 mt-2">
                                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                                    <p><strong>Dr.</strong> {doctor.name}</p>
                                    <p className="text-xs text-gray-500">{doctor.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form View - RESPONSIVE LAYOUT */}
                    <div className="form-view flex flex-col lg:flex-row lg:h-auto lg:min-h-[500px]">
                        {/* Patient Details Section - 25% on desktop, full width on mobile */}
                        <div className="w-full lg:w-1/4 lg:border-r lg:border-gray-400 border-b lg:border-b-0 border-gray-400 p-4">
                            <div className="space-y-3">
                                {/* Name - Required */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        className={`w-full h-9 px-2 border rounded focus:outline-none bg-white text-black text-sm ${
                                            !patientName.trim() ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        placeholder="Patient name"
                                    />
                                </div>

                                {/* Age - Required */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Age <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={patientAge}
                                        onChange={(e) => setPatientAge(e.target.value)}
                                        className={`w-full h-9 px-2 border rounded focus:outline-none bg-white text-black text-sm ${
                                            !patientAge.trim() ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        placeholder="Age"
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
                                        placeholder="CNIC number"
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
                                        placeholder="Phone number"
                                    />
                                </div>

                                {/* Gender */}
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

                        {/* Medicines Section - 50% on desktop, full width on mobile */}
                        <div className="w-full lg:w-1/2 lg:border-r lg:border-gray-400 border-b lg:border-b-0 border-gray-400 p-4 lg:p-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Medicines <span className="text-red-500">*</span>
                            </label>

                            <div className="max-h-60 lg:max-h-80 overflow-y-auto pr-2 mb-4 border rounded-md border-gray-200 bg-gray-50">
                                <div className="space-y-3 p-3">
                                    {medicines.map((medicine) => (
                                        <div key={medicine.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-white p-2 rounded border">
                                            <input
                                                type="text"
                                                value={medicine.name}
                                                onChange={(e) => updateMedicineName(medicine.id, e.target.value)}
                                                className="w-full sm:flex-1 h-10 px-3 border border-gray-300 rounded focus:border-blue-500 focus:outline-none bg-white text-black text-sm"
                                                placeholder="Medicine name"
                                            />
                                            <div className="flex gap-2 justify-center sm:justify-start w-full sm:w-auto sm:flex-shrink-0">
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
                                                {medicines.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMedicine(medicine.id)}
                                                        className="no-print text-red-500 hover:text-red-700 p-1 flex-shrink-0 ml-2"
                                                        title="Remove medicine"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={addMedicine}
                                className="no-print w-full py-2 px-4 border border-dashed border-gray-400 rounded text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium"
                            >
                                <span className="text-lg mr-2">+</span>
                                Add Medicine
                            </button>

                            <p className="no-print text-xs text-gray-500 mt-2 text-center">
                                {medicines.length} medicine{medicines.length !== 1 ? 's' : ''} added
                            </p>
                        </div>

                        {/* Diagnosis & Tests Section - 25% on desktop, full width on mobile */}
                        <div className="w-full lg:w-1/4 p-4 lg:p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Diagnosis</label>
                                <textarea
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    className="w-full h-24 lg:h-32 px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none bg-white text-black resize-none"
                                    placeholder="Enter diagnosis..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tests</label>
                                <textarea
                                    value={tests}
                                    onChange={(e) => setTests(e.target.value)}
                                    className="w-full h-24 lg:h-32 px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none bg-white text-black resize-none"
                                    placeholder="Enter tests..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Print View - Clean Format (unchanged) */}
                    <div className="print-view hidden" style={{ fontFamily: 'Times New Roman, serif', fontSize: '12px', padding: '20px' }}>
                        <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #000' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ width: '60%' }}>
                                    <p><strong>Name:</strong> {patientName}</p>
                                    <p><strong>Age:</strong> {patientAge}</p>
                                    <p><strong>Gender:</strong> {patientGender}</p>
                                    <p><strong>CNIC:</strong> {patientCNIC}</p>
                                    <p><strong>Phone:</strong> {patientPhone}</p>
                                </div>
                                <div style={{ width: '35%', textAlign: 'right' }}>
                                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                                    <p><strong>Dr:</strong> {doctor.name}</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', minHeight: '300px' }}>
                            <div style={{ width: '33%', paddingRight: '15px', borderRight: '1px solid #000' }}>
                                <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>DIAGNOSIS:</h3>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                    {diagnosis || 'Not specified'}
                                </div>
                            </div>
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
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="text-xs text-gray-600">
                                <p><strong>Valid for 30 days</strong> | Contact: (021) 111-2345</p>
                            </div>
                            <div className="text-left sm:text-right">
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
