'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  User,
  Users,
  Calendar,
  Eye,
  Edit2,
  ArrowRight,
  X,
  Building2
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import type { Worker } from '@/types';

type WorkerFormData = {
  // Step 1: Worker Information
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  position: string;
  hourly_rate: string;
  hire_date: string;
  // Step 2: Team & Assignment
  manager_id: string | null;
  team_ids: string[];
  // Step 3: Schedule
  schedule_template: string;
  custom_schedule: {
    [key: string]: { enabled: boolean; start: string; end: string };
  };
};

const SCHEDULE_TEMPLATES = [
  { id: 'monday_friday', name: 'Monday - Friday', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '08:00', end: '17:00' },
  { id: 'monday_friday_7', name: 'Monday - Friday (7am-4pm)', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '07:00', end: '16:00' },
  { id: 'weekend', name: 'Weekend Shift', days: ['saturday', 'sunday'], start: '09:00', end: '18:00' },
  { id: 'night', name: 'Night Shift', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '22:00', end: '06:00' },
  { id: 'custom', name: 'Custom Schedule', days: [], start: '', end: '' },
];

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const initialFormData: WorkerFormData = {
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  position: '',
  hourly_rate: '',
  hire_date: new Date().toISOString().split('T')[0],
  manager_id: null,
  team_ids: [],
  schedule_template: 'monday_friday',
  custom_schedule: DAYS.reduce((acc, day) => {
    acc[day.key] = { enabled: false, start: '09:00', end: '17:00' };
    return acc;
  }, {} as { [key: string]: { enabled: boolean; start: string; end: string } }),
};

export default function WorkerPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string; lead_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WorkerFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [newWorker, setNewWorker] = useState<Worker | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Edit state
  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<Worker>>({});
  const [editSaving, setEditSaving] = useState(false);

  const { company } = useCompany();
  const supabase = createClient();

  const steps = [
    { number: 1, title: 'Worker Info', icon: User },
    { number: 2, title: 'Team & Assignment', icon: Users },
    { number: 3, title: 'Schedule', icon: Calendar },
    { number: 4, title: 'Review', icon: Eye },
  ];

  async function loadWorkers() {
    if (!company) return;
    setLoading(true);
    const { data } = await supabase
      .from('workers')
      .select('*')
      .eq('company_id', company.id)
      .order('last_name');
    setWorkers(data ?? []);
    setLoading(false);
  }

  async function loadTeams() {
    if (!company) return;
    const { data } = await supabase
      .from('team_hierarchy')
      .select('*, lead:workers!lead_worker_id_fkey(first_name, last_name)')
      .eq('company_id', company.id);
    
    // Group by lead
    const teamsMap = new Map<string, { id: string; name: string; lead_name: string }>();
    for (const row of data || []) {
      const leadName = row.lead ? `${row.lead.first_name} ${row.lead.last_name}` : 'No Lead';
      if (!teamsMap.has(row.lead_worker_id)) {
        teamsMap.set(row.lead_worker_id, {
          id: row.lead_worker_id,
          name: leadName + "'s Team",
          lead_name: leadName,
        });
      }
    }
    setTeams(Array.from(teamsMap.values()));
  }

  useEffect(() => {
    loadWorkers();
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!company) return;
    
    setSaving(true);
    try {
      // Create worker
      const response = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          email: formData.email || null,
          position: formData.position || null,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
          hire_date: formData.hire_date,
          manager_id: formData.manager_id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add worker');
      }

      const worker = await response.json();
      setNewWorker(worker);

      // Assign to teams if selected
      if (formData.team_ids.length > 0) {
        for (const teamId of formData.team_ids) {
          await fetch('/api/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lead_worker_id: teamId,
              team_member_id: worker.id,
            }),
          });
        }
      }

      // Create schedule if custom
      if (formData.schedule_template === 'custom') {
        for (const day of DAYS) {
          const schedule = formData.custom_schedule[day.key];
          if (schedule.enabled) {
            // Create recurring schedule entries (simplified - just one week for now)
            await fetch('/api/schedules', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                worker_id: worker.id,
                start_time: schedule.start,
                end_time: schedule.end,
                break_minutes: 60,
              }),
            });
          }
        }
      }

      setWizardOpen(false);
      setShowSuccessModal(true);
      await loadWorkers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add worker');
    } finally {
      setSaving(false);
    }
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setCurrentStep(1);
    setFormData(initialFormData);
  };

  const getSelectedTemplate = () => {
    return SCHEDULE_TEMPLATES.find(t => t.id === formData.schedule_template);
  };

  // Edit worker functions
  const openEditModal = (worker: Worker) => {
    setEditWorker(worker);
    setEditData({
      first_name: worker.first_name,
      last_name: worker.last_name,
      phone: worker.phone,
      email: worker.email,
      position: worker.position,
      hourly_rate: worker.hourly_rate,
      is_active: worker.is_active,
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editWorker) return;
    setEditSaving(true);
    try {
      const response = await fetch(`/api/workers/${editWorker.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (!response.ok) throw new Error('Failed to update worker');
      await loadWorkers();
      setEditOpen(false);
      setEditWorker(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update worker');
    } finally {
      setEditSaving(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-6 flex items-center justify-center">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.number;
        const isComplete = currentStep > step.number;
        
        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  isComplete
                    ? 'border-green-500 bg-green-500 text-white'
                    : isActive
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 text-gray-300'
                }`}
              >
                {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className={`mt-1 text-xs ${isActive ? 'font-medium text-blue-600' : 'text-gray-500'}`}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-12 ${
                  isComplete ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Worker Information</h3>
      <p className="text-sm text-gray-500">Enter the worker's basic information.</p>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            First Name *
          </label>
          <input
            required
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Last Name *
          </label>
          <input
            required
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
      </div>
      
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone *</label>
        <input
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          placeholder="+1 (555) 000-0000"
        />
      </div>
      
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Position</label>
          <select
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="">Select position...</option>
            <option value="Worker">Worker</option>
            <option value="Lead">Lead</option>
            <option value="Manager">Manager</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Hire Date</label>
          <input
            type="date"
            value={formData.hire_date}
            onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
      </div>
      
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Hourly Rate</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.hourly_rate}
          onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          placeholder="0.00"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Team & Assignment</h3>
      <p className="text-sm text-gray-500">Assign the worker to a team or manager.</p>
      
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Reports To (Manager)
        </label>
        <select
          value={formData.manager_id || ''}
          onChange={(e) => setFormData({ ...formData, manager_id: e.target.value || null })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
        >
          <option value="">No manager assigned</option>
          {workers.map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.first_name} {worker.last_name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Add to Teams
        </label>
        {teams.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
            No teams yet. Create teams in the Team page first, or skip this step.
          </p>
        ) : (
          <div className="space-y-2">
            {teams.map((team) => (
              <label
                key={team.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  formData.team_ids.includes(team.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.team_ids.includes(team.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, team_ids: [...formData.team_ids, team.id] });
                    } else {
                      setFormData({ ...formData, team_ids: formData.team_ids.filter(id => id !== team.id) });
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{team.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Schedule Setup</h3>
      <p className="text-sm text-gray-500">Choose a schedule template or create a custom schedule.</p>
      
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Schedule Template
        </label>
        <div className="grid gap-2">
          {SCHEDULE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setFormData({ ...formData, schedule_template: template.id })}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                formData.schedule_template === template.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className={`h-4 w-4 rounded-full border-2 ${
                formData.schedule_template === template.id
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{template.name}</p>
                {template.days.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {template.days.join(', ')} • {template.start} - {template.end}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {formData.schedule_template === 'custom' && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Custom Schedule
          </label>
          <div className="space-y-2">
            {DAYS.map((day) => (
              <div
                key={day.key}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  formData.custom_schedule[day.key].enabled
                    ? 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.custom_schedule[day.key].enabled}
                  onChange={(e) => setFormData({
                    ...formData,
                    custom_schedule: {
                      ...formData.custom_schedule,
                      [day.key]: { ...formData.custom_schedule[day.key], enabled: e.target.checked },
                    },
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="w-12 text-sm font-medium">{day.label}</span>
                {formData.custom_schedule[day.key].enabled && (
                  <>
                    <input
                      type="time"
                      value={formData.custom_schedule[day.key].start}
                      onChange={(e) => setFormData({
                        ...formData,
                        custom_schedule: {
                          ...formData.custom_schedule,
                          [day.key]: { ...formData.custom_schedule[day.key], start: e.target.value },
                        },
                      })}
                      className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={formData.custom_schedule[day.key].end}
                      onChange={(e) => setFormData({
                        ...formData,
                        custom_schedule: {
                          ...formData.custom_schedule,
                          [day.key]: { ...formData.custom_schedule[day.key], end: e.target.value },
                        },
                      })}
                      className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => {
    const template = getSelectedTemplate();
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Review & Confirm</h3>
        <p className="text-sm text-gray-500">Review the worker details before adding.</p>
        
        <div className="space-y-4">
          {/* Worker Info Card */}
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium text-gray-900 dark:text-gray-100">Worker Information</p>
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Edit2 className="h-3 w-3" /> Edit
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>{' '}
                <span className="font-medium">{formData.first_name} {formData.last_name}</span>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>{' '}
                <span className="font-medium">{formData.phone}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>{' '}
                <span className="font-medium">{formData.email || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">Position:</span>{' '}
                <span className="font-medium">{formData.position || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">Hire Date:</span>{' '}
                <span className="font-medium">{formData.hire_date}</span>
              </div>
              <div>
                <span className="text-gray-500">Hourly Rate:</span>{' '}
                <span className="font-medium">{formData.hourly_rate ? `$${formData.hourly_rate}/hr` : '—'}</span>
              </div>
            </div>
          </div>
          
          {/* Team Assignment Card */}
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium text-gray-900 dark:text-gray-100">Team Assignment</p>
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Edit2 className="h-3 w-3" /> Edit
              </button>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Reports to:</span>{' '}
              {formData.manager_id ? (
                <span className="font-medium">
                  {workers.find(w => w.id === formData.manager_id)?.first_name}{' '}
                  {workers.find(w => w.id === formData.manager_id)?.last_name}
                </span>
              ) : (
                <span className="italic text-gray-400">No manager assigned</span>
              )}
            </div>
            <div className="mt-1 text-sm">
              <span className="text-gray-500">Teams:</span>{' '}
              {formData.team_ids.length > 0 ? (
                <span className="font-medium">
                  {formData.team_ids.map(id => teams.find(t => t.id === id)?.name).join(', ')}
                </span>
              ) : (
                <span className="italic text-gray-400">No teams assigned</span>
              )}
            </div>
          </div>
          
          {/* Schedule Card */}
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium text-gray-900 dark:text-gray-100">Schedule</p>
              <button
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Edit2 className="h-3 w-3" /> Edit
              </button>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Template:</span>{' '}
              <span className="font-medium">{template?.name}</span>
            </div>
            {template && template.days.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {template.days.join(', ')} • {template.start} - {template.end}
              </p>
            )}
            {formData.schedule_template === 'custom' && (
              <div className="mt-2 flex flex-wrap gap-2">
                {DAYS.filter(d => formData.custom_schedule[d.key].enabled).map(day => (
                  <Badge key={day.key} variant="default">
                    {day.label}: {formData.custom_schedule[day.key].start} - {formData.custom_schedule[day.key].end}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.first_name && formData.last_name && formData.phone;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Worker Management</h1>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Worker
        </Button>
      </div>

      <Card padding="none">
        <div className="px-6 py-4">
          <CardTitle>Workers</CardTitle>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableEmpty icon="⏳" title="Loading workers..." />
            ) : workers.length === 0 ? (
              <TableEmpty
                icon="👷"
                title="No workers yet"
                description="Click Add Worker to add your first team member"
              />
            ) : (
              workers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: worker.color }}
                      />
                      {worker.first_name} {worker.last_name}
                    </div>
                  </TableCell>
                  <TableCell>{worker.phone ?? '—'}</TableCell>
                  <TableCell>{worker.email ?? '—'}</TableCell>
                  <TableCell>
                    {worker.hourly_rate ? `$${Number(worker.hourly_rate).toFixed(2)}/hr` : '—'}
                  </TableCell>
                  <TableCell>{worker.hire_date ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={worker.is_active ? 'success' : 'default'}>
                      {worker.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(worker)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Wizard Modal */}
      <Modal 
        open={wizardOpen} 
        onClose={closeWizard} 
        title="Add New Worker"
        size="lg"
      >
        {renderStepIndicator()}
        
        <div className="min-h-[400px]">
          {renderCurrentStep()}
        </div>
        
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
          <div>
            {currentStep > 1 && (
              <Button variant="secondary" onClick={handleBack}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={closeWizard}>
              Cancel
            </Button>
            {currentStep < 4 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={saving}>
                <Check className="mr-1 h-4 w-4" />
                Add Worker
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Success Modal with Hierarchy Focus */}
      <Modal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="🎉 Worker Added Successfully!"
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          
          <p className="mt-4 text-lg font-semibold">
            {newWorker?.first_name} {newWorker?.last_name} has been added to your team!
          </p>
          
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-center gap-2">
              <Building2 className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Redirecting to Staff Hierarchy...
              </span>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={() => setShowSuccessModal(false)} className="w-full">
              View Staff Hierarchy
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowSuccessModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Worker Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit ${editData.first_name} ${editData.last_name}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">First Name</label>
              <input
                value={editData.first_name || ''}
                onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Last Name</label>
              <input
                value={editData.last_name || ''}
                onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input
              value={editData.phone || ''}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              value={editData.email || ''}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Position</label>
              <input
                value={editData.position || ''}
                onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Hourly Rate</label>
              <input
                type="number"
                step="0.01"
                value={editData.hourly_rate || ''}
                onChange={(e) => setEditData({ ...editData, hourly_rate: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={editData.is_active ?? true}
              onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm font-medium">Active</label>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={() => setEditOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditSave} loading={editSaving}>
            Save Changes
          </Button>
        </div>
      </Modal>
    </div>
  );
}
