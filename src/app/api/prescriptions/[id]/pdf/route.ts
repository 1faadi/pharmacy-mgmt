// src/app/api/prescriptions/[id]/pdf/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/dt'
import puppeteer from 'puppeteer'

// Ensure Node runtime (PDF generation needs Node, not Edge)
export const runtime = 'nodejs'
// Optional: avoid caching for dynamic PDFs
export const dynamic = 'force-dynamic'

export async function GET(req: Request, context: any) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.roles?.includes('DOCTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id: prescriptionId } = (context?.params ?? {}) as { id: string }

    const prescription = await prisma.prescription.findFirst({
      where: { id: prescriptionId, doctorId: user.id, status: 'FINAL' },
      include: {
        patient: { include: { pii: true } },
        items: { include: { medicine: true } },
        doctor: { select: { displayName: true, email: true } },
      },
    })

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescription not found or not finalized' },
        { status: 404 }
      )
    }

    const htmlContent = generatePrescriptionHTML(prescription)

    // NOTE for AWS Amplify / serverless:
    // - If Puppeteer fails to launch, switch to `puppeteer-core` + `@sparticuz/chromium`
    //   and pass `executablePath: await chromium.executablePath()` plus chromium.args.
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    })

    await browser.close()

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'GENERATE_PDF',
        resourceType: 'PRESCRIPTION',
        resourceId: prescriptionId,
        details: {
          patientCode: prescription.patient.patientCode,
          generatedAt: new Date().toISOString(),
        },
      },
    })

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="prescription-${prescriptionId.slice(
          0,
          8
        )}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

function generatePrescriptionHTML(prescription: any): string {
  const currentDate = new Date().toLocaleDateString()

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Prescription</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
    .clinic-name { font-size: 32px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
    .clinic-motto { font-size: 16px; color: #666; font-style: italic; }
    .section { margin-top: 20px; }
    .items { margin-top: 10px; }
    .item { padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px; }
    .label { font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-name">MediCare Pharmacy</div>
    <div class="clinic-motto">"Your Health, Our Priority"</div>
  </div>

  <h2>Prescription for ${prescription.patient.pii?.fullName ?? '—'}</h2>
  <p><span class="label">Date:</span> ${currentDate}</p>
  <p><span class="label">Diagnosis:</span> ${prescription.diagnosis ?? '—'}</p>
  <p><span class="label">Recommendation:</span> ${prescription.recommendation ?? '—'}</p>

  <div class="section">
    <h3>Medicines</h3>
    <div class="items">
      ${
        (prescription.items ?? [])
          .map(
            (it: any, idx: number) => `
        <div class="item">
          <div><span class="label">#${idx + 1}</span> ${it.medicine?.name ?? ''} ${it.medicine?.strength ?? ''} ${it.medicine?.form ?? ''}</div>
          <div><span class="label">Dosage:</span> ${it.dosage ?? '—'}</div>
          <div><span class="label">Frequency:</span> ${it.frequency ?? '—'}</div>
          <div><span class="label">Duration:</span> ${it.duration ?? '—'}</div>
          ${it.remarks ? `<div><span class="label">Remarks:</span> ${it.remarks}</div>` : ''}
        </div>`
          )
          .join('') || '<p>No items</p>'
      }
    </div>
  </div>

  <div class="section">
    <p><span class="label">Doctor:</span> ${prescription.doctor?.displayName ?? '—'} (${prescription.doctor?.email ?? '—'})</p>
  </div>
</body>
</html>`
}
