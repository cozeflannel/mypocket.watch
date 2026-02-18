'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isToday,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import type { Schedule, Worker } from '@/types/database';

type View = 'day' | 'week' | 'month';

interface ScheduleWithWorker extends Schedule {
  worker: Pick<Worker, 'id' | 'first_name' | 'last_name' | 'color'>;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [schedules, setSchedules] = useState<ScheduleWithWorker[]>([]);
  const { company } = useCompany();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const fetchSchedules = useCallback(async () => {
    if (!company) return;
    const supabase = createClient();
    const startDate = format(calendarStart, 'yyyy-MM-dd');
    const endDate = format(calendarEnd, 'yyyy-MM-dd');

    const { data } = await supabase
      .from('schedules')
      .select('*, worker:workers(id, first_name, last_name, color)')
      .eq('company_id', company.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('start_time', { ascending: true });

    setSchedules((data || []) as ScheduleWithWorker[]);
  }, [company, calendarStart.toISOString(), calendarEnd.toISOString()]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  function getSchedulesForDay(day: Date) {
    return schedules.filter((s) => isSameDay(new Date(s.date + 'T00:00:00'), day));
  }

  function formatShiftTime(time: string) {
    const [h, m] = time.split(':').map(Number);
    const d = new Date(2024, 0, 1, h, m);
    return format(d, 'h:mm a');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-2">
          {(['day', 'week', 'month'] as const).map((v) => (
            <Button
              key={v}
              variant={view === v ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Card padding="none">
        {/* Month navigation */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {view === 'month' && (
          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px">
              {weekDays.map((day) => (
                <div key={day} className="py-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-px">
              {days.map((day) => {
                const daySchedules = getSchedulesForDay(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'min-h-[80px] rounded-lg border border-transparent p-2 text-sm',
                      isToday(day) && 'bg-blue-50 dark:bg-blue-950',
                      !isSameMonth(day, currentDate) && 'text-gray-300 dark:text-gray-700',
                      isSameMonth(day, currentDate) && 'text-gray-900 dark:text-gray-100'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm',
                        isToday(day) && 'bg-blue-600 font-bold text-white'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {daySchedules.slice(0, 3).map((sched) => (
                        <div
                          key={sched.id}
                          className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-xs"
                          title={`${sched.worker.first_name} ${sched.worker.last_name}: ${formatShiftTime(sched.start_time)} – ${formatShiftTime(sched.end_time)}`}
                        >
                          <div
                            className="h-2 w-2 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: sched.worker.color }}
                          />
                          <span className="truncate">
                            {sched.worker.first_name} {formatShiftTime(sched.start_time)}
                          </span>
                        </div>
                      ))}
                      {daySchedules.length > 3 && (
                        <p className="pl-1 text-xs text-gray-400">+{daySchedules.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'week' && (
          <div className="p-6">
            <div className="grid grid-cols-7 gap-2">
              {eachDayOfInterval({
                start: startOfWeek(currentDate),
                end: endOfWeek(currentDate),
              }).map((day) => {
                const daySchedules = getSchedulesForDay(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'min-h-[400px] rounded-lg border border-gray-200 p-3 dark:border-gray-800',
                      isToday(day) && 'border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/50'
                    )}
                  >
                    <p className="mb-2 text-sm font-medium">{format(day, 'EEE d')}</p>
                    <div className="space-y-1">
                      {daySchedules.map((sched) => (
                        <div
                          key={sched.id}
                          className="rounded border-l-2 bg-gray-50 px-2 py-1 text-xs dark:bg-gray-800"
                          style={{ borderLeftColor: sched.worker.color }}
                        >
                          <p className="font-medium">{sched.worker.first_name} {sched.worker.last_name}</p>
                          <p className="text-gray-500">{formatShiftTime(sched.start_time)} – {formatShiftTime(sched.end_time)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'day' && (
          <div className="p-6">
            <h3 className="mb-4 text-lg font-medium">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h3>
            <div className="space-y-1">
              {Array.from({ length: 24 }, (_, i) => {
                const daySchedules = getSchedulesForDay(currentDate);
                const hourSchedules = daySchedules.filter((s) => {
                  const [h] = s.start_time.split(':').map(Number);
                  return h === i;
                });
                return (
                  <div key={i} className="flex min-h-[48px] border-t border-gray-100 dark:border-gray-800">
                    <span className="w-16 py-2 text-xs text-gray-400">
                      {format(new Date(2024, 0, 1, i), 'h a')}
                    </span>
                    <div className="flex flex-1 flex-wrap gap-1 py-1">
                      {hourSchedules.map((sched) => (
                        <div
                          key={sched.id}
                          className="flex items-center gap-1 rounded bg-gray-50 px-2 py-0.5 text-xs dark:bg-gray-800"
                        >
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: sched.worker.color }}
                          />
                          {sched.worker.first_name} {sched.worker.last_name}
                          <span className="text-gray-400">
                            {formatShiftTime(sched.start_time)} – {formatShiftTime(sched.end_time)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
