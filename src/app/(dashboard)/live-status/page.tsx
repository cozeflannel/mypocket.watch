'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Users, Clock, DollarSign, AlertTriangle, RefreshCw, MessageSquare, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameMonth, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import type { TimeEntry, Worker, Schedule } from '@/types/database';

interface TimeEntryWithWorker extends TimeEntry {
  worker: Pick<Worker, 'id' | 'first_name' | 'last_name' | 'color' | 'hourly_rate'>;
}

interface ScheduleWithWorker extends Schedule {
  worker: Pick<Worker, 'id' | 'first_name' | 'last_name' | 'color'>;
}

interface NoShowItem {
  schedule: ScheduleWithWorker;
  minutesLate: number;
}

interface MissingPunchItem {
  entry: TimeEntryWithWorker;
  issueType: string;
  lastTimestamp: string;
}

export default function LiveStatusPage() {
  const { company } = useCompany();
  const [entries, setEntries] = useState<TimeEntryWithWorker[]>([]);
  const [noShows, setNoShows] = useState<NoShowItem[]>([]);
  const [missingPunches, setMissingPunches] = useState<MissingPunchItem[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [messages, setMessages] = useState<{ phone: string; worker_name: string; messages: { body: string; direction: string; created_at: string }[] }[]>([]);
  const [schedules, setSchedules] = useState<ScheduleWithWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchData = useCallback(async () => {
    if (!company) return;
    const supabase = createClient();

    // Fetch today's time entries
    const { data: todayEntries } = await supabase
      .from('time_entries')
      .select('*, worker:workers(id, first_name, last_name, color, hourly_rate)')
      .eq('company_id', company.id)
      .eq('is_correction', false)
      .gte('clock_in', `${today}T00:00:00Z`)
      .lt('clock_in', `${today}T23:59:59Z`)
      .order('clock_in', { ascending: true });

    // Fetch today's schedules
    const { data: todaySchedules } = await supabase
      .from('schedules')
      .select('*, worker:workers(id, first_name, last_name, color)')
      .eq('company_id', company.id)
      .eq('date', today);

    // Fetch all active workers
    const { data: allWorkers } = await supabase
      .from('workers')
      .select('*')
      .eq('company_id', company.id)
      .eq('is_active', true);

    const typedEntries = (todayEntries || []) as TimeEntryWithWorker[];
    const typedSchedules = (todaySchedules || []) as ScheduleWithWorker[];
    setWorkers((allWorkers || []) as Worker[]);
    setEntries(typedEntries);

    // Detect no-shows
    const clockedInWorkerIds = new Set(typedEntries.map((e) => e.worker_id));
    const currentNoShows: NoShowItem[] = [];
    const nowTime = new Date();

    for (const sched of typedSchedules) {
      if (clockedInWorkerIds.has(sched.worker_id)) continue;
      const [h, m] = sched.start_time.split(':').map(Number);
      const shiftStart = new Date(`${today}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
      const minutesLate = (nowTime.getTime() - shiftStart.getTime()) / 60000;
      if (minutesLate > 15) {
        currentNoShows.push({ schedule: sched, minutesLate: Math.round(minutesLate) });
      }
    }
    setNoShows(currentNoShows);

    // Detect missing punches
    const missing: MissingPunchItem[] = [];
    for (const entry of typedEntries) {
      if (entry.clock_in && !entry.clock_out) {
        const hoursElapsed = (nowTime.getTime() - new Date(entry.clock_in).getTime()) / 3600000;
        if (hoursElapsed > 12) {
          missing.push({
            entry,
            issueType: 'Missing clock out',
            lastTimestamp: entry.lunch_in || entry.lunch_out || entry.clock_in,
          });
        }
      }
      if (entry.lunch_out && !entry.lunch_in && !entry.clock_out) {
        const hoursOnLunch = (nowTime.getTime() - new Date(entry.lunch_out).getTime()) / 3600000;
        if (hoursOnLunch > 2) {
          missing.push({
            entry,
            issueType: 'Missing lunch return',
            lastTimestamp: entry.lunch_out,
          });
        }
      }
    }
    setMissingPunches(missing);
    setSchedules(typedSchedules);

    // Fetch today's message logs
    try {
      const { data: msgLogs } = await supabase
        .from('message_logs')
        .select('*, worker:workers(id, first_name, last_name)')
        .eq('company_id', company.id)
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`)
        .order('created_at', { ascending: true });

      if (msgLogs && msgLogs.length > 0) {
        // Group by worker_id
        const grouped: Record<string, { phone: string; worker_name: string; messages: { body: string; direction: string; created_at: string }[] }> = {};
        for (const msg of msgLogs) {
          const key = msg.worker_id || msg.phone_number || 'unknown';
          if (!grouped[key]) {
            const wName = msg.worker ? `${msg.worker.first_name} ${msg.worker.last_name}` : (msg.phone_number || 'Unknown');
            grouped[key] = { phone: msg.phone_number || '', worker_name: wName, messages: [] };
          }
          grouped[key].messages.push({ body: msg.message || msg.content || '', direction: msg.direction || 'inbound', created_at: msg.created_at });
        }
        setMessages(Object.values(grouped));
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }

    setLoading(false);
  }, [company, today]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!company) return;
    const supabase = createClient();

    const channel = supabase
      .channel('time-entries-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries',
          filter: `company_id=eq.${company.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [company, fetchData]);

  const activeWorkers = entries.filter((e) => e.clock_in && !e.clock_out).length;

  const calcHours = (entry: TimeEntryWithWorker): number => {
    const clockIn = new Date(entry.clock_in);
    const clockOut = entry.clock_out ? new Date(entry.clock_out) : now;
    let minutes = (clockOut.getTime() - clockIn.getTime()) / 60000;
    if (entry.lunch_out) {
      const lunchEnd = entry.lunch_in ? new Date(entry.lunch_in) : (entry.clock_out ? new Date(entry.clock_out) : now);
      const lunchStart = new Date(entry.lunch_out);
      minutes -= (lunchEnd.getTime() - lunchStart.getTime()) / 60000;
    }
    minutes -= entry.break_minutes || 0;
    return Math.max(0, minutes / 60);
  };

  const todayTotalHours = entries.reduce((sum, e) => sum + calcHours(e), 0);
  const todayTotalPay = entries.reduce((sum, e) => {
    const hours = calcHours(e);
    const rate = e.worker?.hourly_rate || 0;
    return sum + hours * rate;
  }, 0);

  const formatTime = (ts: string | null) => {
    if (!ts) return '—';
    return format(new Date(ts), 'h:mm a');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Status</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Today: {format(now, 'EEEE, MMMM d, yyyy')} • {format(now, 'h:mm:ss a')}
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Workers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeWorkers} <span className="text-sm font-normal text-gray-400">/ {workers.length}</span>
              </p>
              <p className="text-xs text-gray-400">Active now</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
              <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {todayTotalHours.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400">Today</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900">
              <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Pay</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${todayTotalPay.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">Today</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Issues</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {noShows.length + missingPunches.length}
              </p>
              <p className="text-xs text-gray-400">
                {noShows.length} no-show{noShows.length !== 1 && 's'} • {missingPunches.length} missing
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* No Shows */}
      {noShows.length > 0 && (
        <Card padding="none">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
              ⚠️ No Shows ({noShows.length})
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker</TableHead>
                <TableHead>Expected Start</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {noShows.map((ns) => (
                <TableRow key={ns.schedule.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: ns.schedule.worker.color }} />
                      {ns.schedule.worker.first_name} {ns.schedule.worker.last_name}
                    </div>
                  </TableCell>
                  <TableCell>{ns.schedule.start_time}</TableCell>
                  <TableCell>
                    <Badge variant="danger">{ns.minutesLate} min late</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Missing Punches */}
      {missingPunches.length > 0 && (
        <Card padding="none">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              ⏰ Missing Punches ({missingPunches.length})
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Last Entry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missingPunches.map((mp) => (
                <TableRow key={mp.entry.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: mp.entry.worker.color }} />
                      {mp.entry.worker.first_name} {mp.entry.worker.last_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="warning">{mp.issueType}</Badge>
                  </TableCell>
                  <TableCell>{formatTime(mp.lastTimestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Live Activity */}
      <Card padding="none">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            📋 Live Activity
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Lunch Out</TableHead>
              <TableHead>Lunch In</TableHead>
              <TableHead>Clock Out</TableHead>
              <TableHead>Total Hours</TableHead>
              <TableHead>Running Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableEmpty
                icon="📭"
                title="No activity yet today"
                description="Time entries will appear here as workers clock in"
              />
            ) : (
              entries.map((entry) => {
                const hours = calcHours(entry);
                const pay = hours * (entry.worker?.hourly_rate || 0);
                const isActive = entry.clock_in && !entry.clock_out;

                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-full ${isActive ? 'animate-pulse' : ''}`}
                          style={{ backgroundColor: entry.worker?.color || '#gray' }}
                        />
                        <span className="font-medium">
                          {entry.worker?.first_name} {entry.worker?.last_name}
                        </span>
                        {isActive && (
                          <Badge variant="success">Active</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatTime(entry.clock_in)}</TableCell>
                    <TableCell>{formatTime(entry.lunch_out)}</TableCell>
                    <TableCell>{formatTime(entry.lunch_in)}</TableCell>
                    <TableCell>{formatTime(entry.clock_out)}</TableCell>
                    <TableCell className="font-mono">{hours.toFixed(2)}h</TableCell>
                    <TableCell className="font-mono">${pay.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {entries.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-800">
            <div className="flex justify-end gap-8 text-sm font-semibold text-gray-900 dark:text-white">
              <span>Total: {todayTotalHours.toFixed(2)}h</span>
              <span>Total: ${todayTotalPay.toFixed(2)}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Message Threads */}
      <Card padding="none">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Message Threads
            </h2>
            <span className="text-sm text-gray-400">Today</span>
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {messages.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No messages today
            </div>
          ) : (
            messages.map((thread, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{thread.worker_name}</span>
                  {thread.phone && (
                    <span className="text-xs text-gray-400">{thread.phone}</span>
                  )}
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {thread.messages.map((msg, j) => (
                    <div key={j} className={cn('flex', msg.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'rounded-lg px-3 py-1.5 text-sm max-w-[80%]',
                        msg.direction === 'outbound'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                      )}>
                        <p>{msg.body}</p>
                        <p className={cn('text-[10px] mt-0.5', msg.direction === 'outbound' ? 'text-blue-200' : 'text-gray-400')}>
                          {format(new Date(msg.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Calendar Widget */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(now, 'MMMM yyyy')}
          </h2>
        </div>
        {(() => {
          const monthStart = startOfMonth(now);
          const monthEnd = endOfMonth(now);
          const calStart = startOfWeek(monthStart);
          const calEnd = endOfWeek(monthEnd);
          const days = eachDayOfInterval({ start: calStart, end: calEnd });
          const scheduleDates = new Set(schedules.map(s => s.date));

          return (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {days.map((day, i) => {
                  const inMonth = isSameMonth(day, now);
                  const todayMatch = isToday(day);
                  const hasSchedule = scheduleDates.has(format(day, 'yyyy-MM-dd'));
                  return (
                    <div
                      key={i}
                      className={cn(
                        'relative py-2 rounded-md',
                        !inMonth && 'text-gray-300 dark:text-gray-700',
                        inMonth && 'text-gray-700 dark:text-gray-300',
                        todayMatch && 'bg-blue-600 text-white font-bold'
                      )}
                    >
                      {format(day, 'd')}
                      {hasSchedule && (
                        <span className={cn(
                          'absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full',
                          todayMatch ? 'bg-white' : 'bg-blue-500'
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </Card>
    </div>
  );
}
