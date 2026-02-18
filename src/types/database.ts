export interface Company {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  pay_period_type: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  overtime_threshold_daily: number;
  overtime_threshold_weekly: number;
  overtime_multiplier: number;
  business_phone: string | null;
  business_email: string | null;
  job_site_lat: number | null;
  job_site_lng: number | null;
  geofence_radius: number; // in meters
  subscription_status: string;
  subscription_tier: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  auth_uid: string;
  company_id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'manager';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  hourly_rate: number | null;
  position: string | null;
  color: string;
  is_active: boolean;
  hire_date: string | null;
  phone_verified: boolean;
  onboarding_completed: boolean;
  preferred_communication: 'sms' | 'whatsapp' | 'telegram' | 'messenger';
  whatsapp_id: string | null;
  telegram_id: string | null;
  messenger_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TeamHierarchy {
  id: string;
  company_id: string;
  name: string;
  level: number;
  sort_order: number;
  parent_id: string | null;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamHierarchyWithManager extends TeamHierarchy {
  manager: Pick<Worker, 'id' | 'first_name' | 'last_name' | 'color' | 'position'> | null;
}

export interface LocationVerification {
  id: string;
  token: string;
  worker_id: string;
  company_id: string;
  platform: 'sms' | 'whatsapp' | 'telegram' | 'messenger';
  message_source: string;
  status: 'pending' | 'verified' | 'failed' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  company_id: string;
  worker_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  notes: string | null;
  google_event_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  company_id: string;
  worker_id: string;
  clock_in: string;
  clock_out: string | null;
  lunch_out: string | null;
  lunch_in: string | null;
  break_minutes: number;
  entry_type: 'regular' | 'overtime' | 'holiday' | 'pto';
  source: 'manual' | 'sms' | 'whatsapp' | 'telegram' | 'messenger' | 'admin';
  notes: string | null;
  is_correction: boolean;
  corrected_entry_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollPeriod {
  id: string;
  company_id: string;
  start_date: string;
  end_date: string;
  status: 'open' | 'processing' | 'closed';
  total_gross_amount: number | null;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollEntry {
  id: string;
  company_id: string;
  payroll_period_id: string;
  worker_id: string;
  regular_hours: number;
  overtime_hours: number;
  holiday_hours: number;
  pto_hours: number;
  hourly_rate: number;
  gross_pay: number;
  deductions: Record<string, number>;
  net_pay: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  company_id: string;
  worker_id: string | null;
  admin_user_id: string | null;
  type: 'no_show' | 'missing_punch' | 'overtime_alert' | 'schedule_change' | 'payroll_ready' | 'general';
  title: string;
  message: string;
  related_date: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface MessageLog {
  id: string;
  company_id: string;
  worker_id: string | null;
  direction: 'inbound' | 'outbound';
  platform: 'sms' | 'whatsapp' | 'telegram' | 'messenger';
  message_type: string | null;
  to_address: string;
  from_address: string;
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'received';
  external_id: string | null;
  created_at: string;
}

export interface ConnectedAccount {
  id: string;
  company_id: string;
  worker_id: string;
  provider: 'google';
  access_token: string;
  refresh_token: string;
  expires_at: number;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  company_id: string;
  admin_user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// Join types for queries
export interface TimeEntryWithWorker extends TimeEntry {
  worker: Pick<Worker, 'id' | 'first_name' | 'last_name' | 'color' | 'hourly_rate'>;
}

export interface ScheduleWithWorker extends Schedule {
  worker: Pick<Worker, 'id' | 'first_name' | 'last_name' | 'color' | 'position'>;
}

export interface PayrollEntryWithWorker extends PayrollEntry {
  worker: Pick<Worker, 'id' | 'first_name' | 'last_name' | 'color'>;
}
