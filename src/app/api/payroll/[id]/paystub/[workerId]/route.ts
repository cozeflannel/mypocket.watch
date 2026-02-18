import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';
import { generatePaystubPDF } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; workerId: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id, workerId } = await params;
  const format = new URL(request.url).searchParams.get('format');

  const { data: period } = await ctx.supabase
    .from('payroll_periods')
    .select('*')
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .single();

  if (!period) return NextResponse.json({ error: 'Payroll period not found' }, { status: 404 });

  const { data: entry } = await ctx.supabase
    .from('payroll_entries')
    .select('*, worker:workers(*)')
    .eq('payroll_period_id', id)
    .eq('worker_id', workerId)
    .eq('company_id', ctx.company.id)
    .single();

  if (!entry) return NextResponse.json({ error: 'Payroll entry not found' }, { status: 404 });

  if (format === 'pdf') {
    try {
      const pdfBuffer = await generatePaystubPDF(ctx.company, entry.worker, period, entry);
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="paystub_${entry.worker.last_name}_${period.end_date}.pdf"`,
        },
      });
    } catch (err) {
      console.error('PDF Generation Error:', err);
      return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
  }

  return NextResponse.json(entry);
}
