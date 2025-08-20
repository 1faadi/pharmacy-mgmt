import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import puppeteer from 'puppeteer'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.roles.includes('DOCTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const prescriptionId = context.params.id

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
  // ... rest of the HTML generation function stays the same
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
        /* ... rest of your existing CSS ... */
    </style>
</head>
<body>
    <div class="header">
        <div class="clinic-name">MediCare Pharmacy</div>
        <div class="clinic-motto">"Your Health, Our Priority"</div>
    </div>
    <!-- ... rest of your existing HTML template ... -->
</body>
</html>
  `
}
