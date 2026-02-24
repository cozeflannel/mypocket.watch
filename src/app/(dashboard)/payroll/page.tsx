'use client';

import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { DollarSign, Plus, Download, ChevronDown, ChevronRight } from 'lucide-react';

type PayrollPeriod = {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
};

type PayrollEntry = {
  id: string;
  payroll_period_id: string;
  worker_id: string;
  regular_hours: number;
  overtime_hours: number;
  hourly_rate: number;
  gross_pay: number;
  deductions: number;
  net_pay: number;
  worker?: {
    first_name: string;
    last_name: string;
  };
};

export default function PayrollPage() {
  const { company } = useCompany();
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [entries, setEntries] = useState<Record<string, PayrollEntry[]>>({});
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Run Payroll Modal
  const [runPayrollOpen, setRunPayrollOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [processImmediately, setProcessImmediately] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Initialize dates to current week (Mon-Sun)
  useEffect(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    setStartDate(monday.toISOString().split('T')[0]);
    setEndDate(sunday.toISOString().split('T')[0]);
  }, []);

  const fetchPayroll = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const response = await fetch('/api/payroll');
      if (response.ok) {
        const data = await response.json();
        setPeriods(data.periods || []);
        setEntries(data.entries || {});
      }
    } catch (err) {
      console.error('Failed to fetch payroll:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  const handleRunPayroll = async () => {
    if (!startDate || !endDate) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          process: processImmediately,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payroll period');
      }

      await fetchPayroll();
      setRunPayrollOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to run payroll');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async (periodId: string) => {
    try {
      const response = await fetch(`/api/payroll/${periodId}/export`);
      if (!response.ok) throw new Error('Failed to export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${periodId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export');
    }
  };

  const togglePeriod = (periodId: string) => {
    const newExpanded = new Set(expandedPeriods);
    if (newExpanded.has(periodId)) {
      newExpanded.delete(periodId);
    } else {
      newExpanded.add(periodId);
    }
    setExpandedPeriods(newExpanded);
  };

  const latestPeriod = periods[0];
  const latestEntries = latestPeriod ? entries[latestPeriod.id] || [] : [];

  const totalGross = latestEntries.reduce((sum, e) => sum + Number(e.gross_pay || 0), 0);
  const totalNet = latestEntries.reduce((sum, e) => sum + Number(e.net_pay || 0), 0);
  const totalHours = latestEntries.reduce(
    (sum, e) => sum + Number(e.regular_hours || 0) + Number(e.overtime_hours || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading payroll data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payroll</h1>
        <Button onClick={() => setRunPayrollOpen(true)}>
          <Plus className="h-4 w-4" />
          Run Payroll
        </Button>
      </div>

      {/* Summary Cards */}
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

      {/* Payroll Periods */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <CardTitle>Payroll Periods</CardTitle>
        </div>
        {periods.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No payroll periods yet. Click "Run Payroll" to create one.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {periods.map((period) => {
              const periodEntries = entries[period.id] || [];
              const isExpanded = expandedPeriods.has(period.id);
              const periodGross = periodEntries.reduce((sum, e) => sum + Number(e.gross_pay || 0), 0);
              const periodNet = periodEntries.reduce((sum, e) => sum + Number(e.net_pay || 0), 0);
              const periodHours = periodEntries.reduce(
                (sum, e) => sum + Number(e.regular_hours || 0) + Number(e.overtime_hours || 0),
                0
              );

              return (
                <div key={period.id}>
                  {/* Period Header */}
                  <div
                    className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center justify-between"
                    onClick={() => togglePeriod(period.id)}
                  >
                    <div className="flex items-center gap-4">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {period.start_date} — {period.end_date}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span>{periodHours.toFixed(1)} hrs</span>
                          <span>•</span>
                          <span>${periodGross.toFixed(2)} gross</span>
                          <span>•</span>
                          <span>${periodNet.toFixed(2)} net</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          period.status === 'closed'
                            ? 'default'
                            : period.status === 'processing'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {period.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(period.id);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Period Details (Expanded) */}
                  {isExpanded && (
                    <div className="px-6 pb-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Worker Name</TableHead>
                            <TableHead>Regular Hrs</TableHead>
                            <TableHead>OT Hrs</TableHead>
                            <TableHead>Hourly Rate</TableHead>
                            <TableHead>Gross Pay</TableHead>
                            <TableHead>Deductions</TableHead>
                            <TableHead>Net Pay</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {periodEntries.length === 0 ? (
                            <TableEmpty
                              icon="💰"
                              title="No entries"
                              description="No payroll entries for this period"
                            />
                          ) : (
                            <>
                              {periodEntries.map((entry) => (
                                <TableRow key={entry.id}>
                                  <TableCell className="font-medium">
                                    {entry.worker?.first_name} {entry.worker?.last_name}
                                  </TableCell>
                                  <TableCell>{Number(entry.regular_hours || 0).toFixed(1)}</TableCell>
                                  <TableCell>{Number(entry.overtime_hours || 0).toFixed(1)}</TableCell>
                                  <TableCell>${Number(entry.hourly_rate || 0).toFixed(2)}</TableCell>
                                  <TableCell>${Number(entry.gross_pay || 0).toFixed(2)}</TableCell>
                                  <TableCell>${Number(entry.deductions || 0).toFixed(2)}</TableCell>
                                  <TableCell className="font-semibold">
                                    ${Number(entry.net_pay || 0).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ))}
                              {/* Totals Row */}
                              <TableRow className="bg-gray-50 dark:bg-gray-800/50 font-semibold">
                                <TableCell>Total</TableCell>
                                <TableCell>
                                  {periodEntries.reduce((sum, e) => sum + Number(e.regular_hours || 0), 0).toFixed(1)}
                                </TableCell>
                                <TableCell>
                                  {periodEntries.reduce((sum, e) => sum + Number(e.overtime_hours || 0), 0).toFixed(1)}
                                </TableCell>
                                <TableCell>—</TableCell>
                                <TableCell>
                                  ${periodEntries.reduce((sum, e) => sum + Number(e.gross_pay || 0), 0).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  ${periodEntries.reduce((sum, e) => sum + Number(e.deductions || 0), 0).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  ${periodEntries.reduce((sum, e) => sum + Number(e.net_pay || 0), 0).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            </>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Run Payroll Modal */}
      <Modal
        open={runPayrollOpen}
        onClose={() => setRunPayrollOpen(false)}
        title="Run Payroll"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="process-immediately"
              checked={processImmediately}
              onChange={(e) => setProcessImmediately(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="process-immediately" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Process immediately
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={() => setRunPayrollOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRunPayroll} loading={submitting}>
            Run Payroll
          </Button>
        </div>
      </Modal>
    </div>
  );
}
