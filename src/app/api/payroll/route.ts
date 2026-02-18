import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';
import { calculateDailyHours } from '@/lib/time';
import { calculatePayrollHours, calculateGrossPay, estimateFederalTax, calculateFICA } from '@/lib/payroll';

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = ctx.supabase
    .from('payroll_periods')
    .select('*')
    .eq('company_id', ctx.company.id)
    .order('start_date', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const body = await request.json();
  const { start_date, end_date, process: shouldProcess } = body;

  if (!start_date || !end_date) {
    return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 });
  }

  // Check for existing period overlapping
  const { data: existing } = await ctx.supabase
    .from('payroll_periods')
    .select('id')
    .eq('company_id', ctx.company.id)
    .lte('start_date', end_date)
    .gte('end_date', start_date)
    .limit(1);

  if (existing?.length) {
    return NextResponse.json({ error: 'A payroll period already exists for this date range' }, { status: 409 });
  }

  // Create period
  const { data: period, error: periodError } = await ctx.supabase
    .from('payroll_periods')
    .insert({
      company_id: ctx.company.id,
      start_date,
      end_date,
      status: shouldProcess ? 'processing' : 'open',
    })
    .select()
    .single();

  if (periodError) return NextResponse.json({ error: periodError.message }, { status: 500 });

  if (shouldProcess) {
    await processPayroll(ctx, period.id, start_date, end_date);
  }

  const { data: result } = await ctx.supabase
    .from('payroll_periods')
    .select('*')
    .eq('id', period.id)
    .single();

  return NextResponse.json(result, { status: 201 });
}

async function processPayroll(
  ctx: { supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>; company: import('@/types/database').Company; adminUser: import('@/types/database').AdminUser },
  periodId: string,
  startDate: string,
  endDate: string
) {
  // Get all active workers
  const { data: workers } = await ctx.supabase
    .from('workers')
    .select('*')
    .eq('company_id', ctx.company.id)
    .eq('is_active', true);

  if (!workers?.length) return;

  let totalGross = 0;

  for (const worker of workers) {
    // Get time entries for this period
    const { data: entries } = await ctx.supabase
      .from('time_entries')
      .select('*')
      .eq('worker_id', worker.id)
      .eq('company_id', ctx.company.id)
      .eq('is_correction', false)
      .gte('clock_in', `${startDate}T00:00:00Z`)
      .lte('clock_in', `${endDate}T23:59:59Z`);

    if (!entries?.length) continue;

    // Calculate daily hours
    const dailyHoursMap = new Map<string, number>();
    for (const entry of entries) {
      const day = entry.clock_in.split('T')[0];
      const hours = calculateDailyHours(entry.clock_in, entry.clock_out, entry.break_minutes || 0);
      
      // Account for lunch break
      let lunchMinutes = 0;
      if (entry.lunch_out && entry.lunch_in) {
        lunchMinutes = (new Date(entry.lunch_in).getTime() - new Date(entry.lunch_out).getTime()) / 60000;
      }
      const netHours = Math.max(0, hours - lunchMinutes / 60);
      dailyHoursMap.set(day, (dailyHoursMap.get(day) || 0) + netHours);
    }

    const dailyHours = Array.from(dailyHoursMap.values());
    const hourlyRate = worker.hourly_rate || 0;

    const payrollHours = calculatePayrollHours(dailyHours, {
      dailyThreshold: ctx.company.overtime_threshold_daily,
      weeklyThreshold: ctx.company.overtime_threshold_weekly,
      overtimeMultiplier: ctx.company.overtime_multiplier,
    });

    const grossPay = calculateGrossPay(
      payrollHours.regularHours,
      payrollHours.overtimeHours,
      hourlyRate,
      ctx.company.overtime_multiplier
    );

    // Estimate annualized taxes for per-period deduction
    const weeksInYear = 52;
    const annualGross = grossPay * weeksInYear;
    const annualFederal = estimateFederalTax(annualGross);
    const annualFica = calculateFICA(annualGross);
    const periodFederal = Math.round((annualFederal / weeksInYear) * 100) / 100;
    const periodSS = Math.round((annualFica.socialSecurity / weeksInYear) * 100) / 100;
    const periodMedicare = Math.round((annualFica.medicare / weeksInYear) * 100) / 100;
    const totalDeductions = periodFederal + periodSS + periodMedicare;
    const netPay = Math.round((grossPay - totalDeductions) * 100) / 100;

    await ctx.supabase.from('payroll_entries').insert({
      company_id: ctx.company.id,
      payroll_period_id: periodId,
      worker_id: worker.id,
      regular_hours: payrollHours.regularHours,
      overtime_hours: payrollHours.overtimeHours,
      hourly_rate: hourlyRate,
      gross_pay: grossPay,
      deductions: {
        federal_tax: periodFederal,
        social_security: periodSS,
        medicare: periodMedicare,
      },
      net_pay: netPay,
    });

    totalGross += grossPay;
  }

  await ctx.supabase
    .from('payroll_periods')
    .update({
      status: 'closed',
      total_gross_amount: Math.round(totalGross * 100) / 100,
      closed_at: new Date().toISOString(),
      closed_by: ctx.adminUser.id,
    })
    .eq('id', periodId);
}
