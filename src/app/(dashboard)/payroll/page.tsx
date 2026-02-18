import { createClient } from '@/lib/supabase/server';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { DollarSign } from 'lucide-react';

export default async function PayrollPage() {
  const supabase = await createClient();

  const { data: periods } = await supabase
    .from('payroll_periods')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(10);

  const latestPeriod = periods?.[0];

  const { data: entries } = latestPeriod
    ? await supabase
        .from('payroll_entries')
        .select('*, worker:workers(*)')
        .eq('payroll_period_id', latestPeriod.id)
    : { data: [] };

  const payrollEntries = entries ?? [];
  const totalGross = payrollEntries.reduce((sum, e) => sum + Number(e.gross_pay), 0);
  const totalNet = payrollEntries.reduce((sum, e) => sum + Number(e.net_pay), 0);
  const totalHours = payrollEntries.reduce(
    (sum, e) => sum + Number(e.regular_hours) + Number(e.overtime_hours),
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payroll</h1>

      {/* Period selector */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>
              {latestPeriod
                ? `${latestPeriod.start_date} — ${latestPeriod.end_date}`
                : 'No Payroll Periods'}
            </CardTitle>
            {latestPeriod && (
              <Badge
                variant={
                  latestPeriod.status === 'closed'
                    ? 'default'
                    : latestPeriod.status === 'processing'
                    ? 'warning'
                    : 'success'
                }
                className="mt-2"
              >
                {latestPeriod.status}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900">
            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gross Pay</p>
            <p className="text-2xl font-bold">${totalGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
            <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Net Pay</p>
            <p className="text-2xl font-bold">${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Hours</p>
          <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
        </Card>
      </div>

      {/* Worker payroll table */}
      <Card padding="none">
        <div className="px-6 py-4">
          <CardTitle>Worker Payroll</CardTitle>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Regular Hrs</TableHead>
              <TableHead>OT Hrs</TableHead>
              <TableHead>Gross Pay</TableHead>
              <TableHead>Net Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payrollEntries.length === 0 ? (
              <TableEmpty
                icon="💰"
                title="No payroll entries"
                description="Create a payroll period and process entries to see data here"
              />
            ) : (
              payrollEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {entry.worker?.first_name} {entry.worker?.last_name}
                  </TableCell>
                  <TableCell>{Number(entry.regular_hours).toFixed(1)}</TableCell>
                  <TableCell>{Number(entry.overtime_hours).toFixed(1)}</TableCell>
                  <TableCell>${Number(entry.gross_pay).toFixed(2)}</TableCell>
                  <TableCell>${Number(entry.net_pay).toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
