import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import puppeteer from 'puppeteer'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.roles.includes('DOCTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const prescriptionId = params.id

    // Get prescription details (rest of your existing logic...)
    const prescription = await prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        doctorId: user.id,
        status: 'FINAL'
      },
      include: {
        patient: { include: { pii: true } },
        items: { include: { medicine: true } },
        doctor: { select: { displayName: true, email: true } }
      }
    })

    if (!prescription) {
      return NextResponse.json({ 
        error: 'Prescription not found or not finalized' 
      }, { status: 404 })
    }

    // Generate PDF logic (your existing code)
    const htmlContent = generatePrescriptionHTML(prescription)
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    })

    await browser.close()

    // Log audit
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

    return new Response(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="prescription-${prescriptionId.slice(0, 8)}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

// Your existing generatePrescriptionHTML function
function generatePrescriptionHTML(prescription: any): string {
  // Keep your existing HTML generation logic
  return `<!DOCTYPE html><html><!-- your existing HTML --></html>`
}
