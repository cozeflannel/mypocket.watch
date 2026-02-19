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
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock,
  User,
  X,
  Eye,
  Edit2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import type { Schedule, Worker } from '@/types/database';

type View = 'day' | 'week' | 'month';

interface ScheduleWithWorker extends Schedule {
  worker: Pick<Worker, 'id' | 'first_name' | 'last_name' | 'color' | 'position' | 'phone'>;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [schedules, setSchedules] = useState<ScheduleWithWorker[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithWorker | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    worker_id: '',
    date: '',
    start_time: '09:00',
    end_time: '17:00',
    break_minutes: 60,
    notes: '',
  });

  const { company } = useCompany();
  const supabase = createClient();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const fetchSchedules = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    const supabase = createClient();
    const startDate = format(calendarStart, 'yyyy-MM-dd');
    const endDate = format(calendarEnd, 'yyyy-MM-dd');

    const { data } = await supabase
      .from('schedules')
      .select('*, worker:workers(id, first_name, last_name, color, position, phone)')
      .eq('company_id', company.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('start_time', { ascending: true });

    setSchedules((data || []) as ScheduleWithWorker[]);
    setLoading(false);
  }, [company, calendarStart.toISOString(), calendarEnd.toISOString()]);

  const fetchWorkers = useCallback(async () => {
    if (!company) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('workers')
      .select('*')
      .eq('company_id', company.id)
      .eq('is_active', true)
      .order('first_name');
    setWorkers(data || []);
  }, [company]);

  useEffect(() => {
    fetchSchedules();
    fetchWorkers();
  }, [fetchSchedules, fetchWorkers]);

  function getSchedulesForDay(day: Date) {
    return schedules.filter((s) => isSameDay(new Date(s.date + 'T00:00:00'), day));
  }

  function formatShiftTime(time: string) {
    const [h, m] = time.split(':').map(Number);
    const d = new Date(2024, 0, 1, h, m);
    return format(d, 'h:mm a');
  }

  const handleAddShift = (day?: Date) => {
    const targetDate = day || currentDate;
    setSelectedDate(targetDate);
    setForm({
      worker_id: '',
      date: format(targetDate, 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '17:00',
      break_minutes: 60,
      notes: '',
    });
    setShiftModalOpen(true);
  };

  const handleSubmitShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !form.worker_id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('schedules')
        .insert({
          company_id: company.id,
          worker_id: form.worker_id,
          date: form.date,
          start_time: form.start_time,
          end_time: form.end_time,
          break_minutes: form.break_minutes,
          notes: form.notes || null,
        });

      if (error) throw error;
      
      setShiftModalOpen(false);
      await fetchSchedules();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;
    
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) {
      alert('Failed to delete: ' + error.message);
    } else {
      await fetchSchedules();
      setWorkerModalOpen(false);
    }
  };

  const handleScheduleClick = (schedule: ScheduleWithWorker) => {
    setSelectedSchedule(schedule);
    setWorkerModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-gray-500">Manage worker schedules and shifts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => handleAddShift()}>
            <Plus className="h-4 w-4" />
            Add Shift
          </Button>
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-500">Loading schedules...</span>
          </div>
        ) : view === 'month' && (
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
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm',
                          isToday(day) && 'bg-blue-600 font-bold text-white'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {isSameMonth(day, currentDate) && (
                        <button
                          onClick={() => handleAddShift(day)}
                          className="opacity-0 hover:opacity-100 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {daySchedules.slice(0, 3).map((sched) => (
                        <button
                          key={sched.id}
                          onClick={() => handleScheduleClick(sched)}
                          className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                          title={`${sched.worker.first_name} ${sched.worker.last_name}: ${formatShiftTime(sched.start_time)} – ${formatShiftTime(sched.end_time)}`}
                        >
                          <div
                            className="h-2 w-2 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: sched.worker.color }}
                          />
                          <span className="truncate">
                            {sched.worker.first_name} {formatShiftTime(sched.start_time)}
                          </span>
                        </button>
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
                        <button
                          key={sched.id}
                          onClick={() => handleScheduleClick(sched)}
                          className="w-full rounded border-l-2 bg-gray-50 px-2 py-1 text-left text-xs hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                          style={{ borderLeftColor: sched.worker.color }}
                        >
                          <p className="font-medium">{sched.worker.first_name} {sched.worker.last_name}</p>
                          <p className="text-gray-500">{formatShiftTime(sched.start_time)} – {formatShiftTime(sched.end_time)}</p>
                        </button>
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
                        <button
                          key={sched.id}
                          onClick={() => handleScheduleClick(sched)}
                          className="flex items-center gap-1 rounded bg-gray-50 px-2 py-0.5 text-xs hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                        >
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: sched.worker.color }}
                          />
                          {sched.worker.first_name} {sched.worker.last_name}
                          <span className="text-gray-400">
                            {formatShiftTime(sched.start_time)} – {formatShiftTime(sched.end_time)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Add Shift Modal */}
      <Modal 
        open={shiftModalOpen} 
        onClose={() => setShiftModalOpen(false)} 
        title="Add New Shift"
      >
        <form onSubmit={handleSubmitShift} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Worker *
            </label>
            <select
              required
              value={form.worker_id}
              onChange={(e) => setForm({ ...form, worker_id: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="">Select worker...</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.first_name} {worker.last_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date *
            </label>
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Time *
              </label>
              <input
                required
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Time *
              </label>
              <input
                required
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Break (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={form.break_minutes}
              onChange={(e) => setForm({ ...form, break_minutes: parseInt(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Optional notes..."
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShiftModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? 'Creating...' : 'Create Shift'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Worker Detail Modal */}
      <Modal
        open={workerModalOpen}
        onClose={() => setWorkerModalOpen(false)}
        title="Shift Details"
      >
        {selectedSchedule && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-full"
                style={{ backgroundColor: selectedSchedule.worker.color }}
              />
              <div>
                <p className="font-semibold">
                  {selectedSchedule.worker.first_name} {selectedSchedule.worker.last_name}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedSchedule.worker.position || 'Worker'}
                </p>
              </div>
            </div>
            
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium">{format(new Date(selectedSchedule.date), 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Time:</span>
                  <span className="font-medium">
                    {formatShiftTime(selectedSchedule.start_time)} - {formatShiftTime(selectedSchedule.end_time)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Break:</span>
                  <span className="font-medium">{selectedSchedule.break_minutes} minutes</span>
                </div>
                {selectedSchedule.notes && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-500">Notes:</span>
                    <span className="font-medium">{selectedSchedule.notes}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Shift
              </Button>
              <Button 
                variant="danger" 
                className="flex-1"
                onClick={() => handleDeleteSchedule(selectedSchedule.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
            
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Contact: {selectedSchedule.worker.phone || 'No phone'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
