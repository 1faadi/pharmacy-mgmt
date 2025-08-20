import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import puppeteer from 'puppeteer'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.roles.includes('DOCTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const prescriptionId = params.id

    // Get prescription details
    const prescription = await prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        doctorId: user.id,
        status: 'FINAL' // Only generate PDF for finalized prescriptions
      },
      include: {
        patient: {
          include: { pii: true }
        },
        items: {
          include: { medicine: true }
        },
        doctor: {
          select: { displayName: true, email: true }
        }
      }
    })

    if (!prescription) {
      return NextResponse.json({ 
        error: 'Prescription not found or not finalized' 
      }, { status: 404 })
    }

    // Generate HTML content for PDF
    const htmlContent = generatePrescriptionHTML(prescription)

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    })

    await browser.close()

    // Log PDF generation
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'GENERATE_PDF',
        resourceType: 'PRESCRIPTION',
        resourceId: prescriptionId,
        details: {
          patientCode: prescription.patient.patientCode,
          generatedAt: new Date().toISOString()
        }
      }
    })

    // Return PDF as response
    return new Response(pdfBuffer as any, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="prescription-${prescription.patient.patientCode}-${prescriptionId.slice(0, 8)}.pdf"`
  }
})

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ 
      error: 'Failed to generate PDF' 
    }, { status: 500 })
  }
}

function generatePrescriptionHTML(prescription: any): string {
  const currentDate = new Date().toLocaleDateString()
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Prescription</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .clinic-name {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .clinic-motto {
            font-size: 16px;
            color: #666;
            font-style: italic;
        }
        .prescription-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 8px;
        }
        .patient-info, .prescription-meta {
            flex: 1;
        }
        .prescription-meta {
            text-align: right;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            margin-top: 30px;
            margin-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        .medicine-item {
            background-color: #f9fafb;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        .medicine-name {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
        }
        .medicine-details {
            margin-top: 8px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
        }
        .detail-item {
            font-size: 14px;
        }
        .detail-label {
            font-weight: bold;
            color: #6b7280;
        }
        .instructions {
            background-color: #ecfdf5;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
            margin-top: 10px;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            border-top: 2px solid #e5e7eb;
            padding-top: 20px;
            color: #6b7280;
        }
        .doctor-signature {
            text-align: right;
            margin-top: 50px;
        }
        .signature-line {
            border-top: 1px solid #333;
            width: 200px;
            margin: 30px 0 10px auto;
        }
        .qr-placeholder {
            width: 80px;
            height: 80px;
            background-color: #f3f4f6;
            border: 2px dashed #d1d5db;
            display: inline-block;
            position: relative;
        }
        .qr-placeholder::after {
            content: 'QR';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #9ca3af;
            font-weight: bold;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="clinic-name">MediCare Pharmacy</div>
        <div class="clinic-motto">"Your Health, Our Priority"</div>
    </div>

    <div class="prescription-info">
        <div class="patient-info">
            <h3 style="margin-top: 0; color: #2563eb;">Patient Information</h3>
            <p><strong>Name:</strong> ${prescription.patient.pii?.fullName || 'N/A'}</p>
            <p><strong>Patient Code:</strong> ${prescription.patient.patientCode}</p>
            <p><strong>Age Group:</strong> ${prescription.patient.ageBand || 'N/A'}</p>
            <p><strong>Phone:</strong> ${prescription.patient.pii?.phone || 'N/A'}</p>
        </div>
        <div class="prescription-meta">
            <h3 style="margin-top: 0; color: #2563eb;">Prescription Details</h3>
            <p><strong>Date:</strong> ${prescription.issuedOn.toLocaleDateString()}</p>
            <p><strong>Prescription ID:</strong> ${prescription.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>Doctor:</strong> ${prescription.doctor.displayName}</p>
            <div class="qr-placeholder"></div>
        </div>
    </div>

    <div class="section-title">Diagnosis</div>
    <p style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        ${prescription.diagnosis}
    </p>

    <div class="section-title">Prescribed Medicines</div>
    ${prescription.items.map((item: any, index: number) => `
        <div class="medicine-item">
            <div class="medicine-name">
                ${index + 1}. ${item.medicine.name} - ${item.medicine.strength} (${item.medicine.form})
            </div>
            <div class="medicine-details">
                <div class="detail-item">
                    <span class="detail-label">Dosage:</span><br>
                    ${item.dosage}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Frequency:</span><br>
                    ${item.frequency}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Duration:</span><br>
                    ${item.duration}
                </div>
            </div>
            ${item.remarks ? `
                <div class="instructions">
                    <strong>Special Instructions:</strong> ${item.remarks}
                </div>
            ` : ''}
        </div>
    `).join('')}

    <div class="section-title">Doctor's Recommendations</div>
    <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
        ${prescription.recommendation}
    </div>

    ${prescription.notes ? `
        <div class="section-title">Additional Notes</div>
        <p style="background-color: #f3f4f6; padding: 15px; border-radius: 8px;">
            ${prescription.notes}
        </p>
    ` : ''}

    <div class="doctor-signature">
        <div class="signature-line"></div>
        <p><strong>${prescription.doctor.displayName}</strong></p>
        <p style="font-size: 12px; color: #6b7280;">Licensed Medical Practitioner</p>
    </div>

    <div class="footer">
        <p style="font-size: 12px;">
            This is a computer-generated prescription. For any queries, please contact the pharmacy.<br>
            Generated on: ${currentDate} | Prescription ID: ${prescription.id.slice(0, 8).toUpperCase()}
        </p>
    </div>
</body>
</html>
  `
}
