import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id } = await params;

  const { data: period } = await ctx.supabase
    .from('payroll_periods')
    .select('*')
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .single();

  if (!period) return NextResponse.json({ error: 'Payroll period not found' }, { status: 404 });

  const { data: entries } = await ctx.supabase
    .from('payroll_entries')
    .select('*, worker:workers(id, first_name, last_name)')
    .eq('payroll_period_id', id)
    .eq('company_id', ctx.company.id);

  if (!entries?.length) {
    return NextResponse.json({ error: 'No payroll entries found' }, { status: 404 });
  }

  const headers = [
    'WorkerName', 'WorkerID', 'RegularHours', 'OvertimeHours', 'TotalHours',
    'HourlyRate', 'GrossPay', 'FederalTax', 'SocialSecurity', 'Medicare',
    'TotalDeductions', 'NetPay', 'PayPeriodStart', 'PayPeriodEnd',
  ];

  const rows = entries.map((e) => {
    const worker = e.worker as { first_name: string; last_name: string };
    const deductions = (e.deductions || {}) as Record<string, number>;
    const fedTax = deductions.federal_tax || 0;
    const ss = deductions.social_security || 0;
    const medicare = deductions.medicare || 0;
    const totalDed = fedTax + ss + medicare;

    return [
      `"${worker.first_name} ${worker.last_name}"`,
      e.worker_id,
      e.regular_hours,
      e.overtime_hours,
      (e.regular_hours + e.overtime_hours).toFixed(2),
      e.hourly_rate,
      e.gross_pay,
      fedTax.toFixed(2),
      ss.toFixed(2),
      medicare.toFixed(2),
      totalDed.toFixed(2),
      e.net_pay,
      period.start_date,
      period.end_date,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="payroll_${period.start_date}_${period.end_date}.csv"`,
    },
  });
}
