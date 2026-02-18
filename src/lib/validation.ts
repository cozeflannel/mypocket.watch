interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTimeEntry(entry: {
  clock_in: string;
  clock_out?: string | null;
  break_minutes?: number;
  entry_type?: string;
}): ValidationResult {
  const errors: string[] = [];

  if (!entry.clock_in) {
    errors.push('Clock-in time is required');
  }

  if (entry.clock_out) {
    const clockIn = new Date(entry.clock_in);
    const clockOut = new Date(entry.clock_out);
    if (clockOut <= clockIn) {
      errors.push('Clock-out must be after clock-in');
    }
    const diffHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
    if (diffHours > 24) {
      errors.push('Time entry cannot exceed 24 hours');
    }
  }

  if (entry.break_minutes !== undefined && entry.break_minutes < 0) {
    errors.push('Break minutes cannot be negative');
  }

  const validTypes = ['regular', 'overtime', 'holiday', 'pto'];
  if (entry.entry_type && !validTypes.includes(entry.entry_type)) {
    errors.push(`Invalid entry type. Must be one of: ${validTypes.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateWorker(worker: {
  first_name: string;
  last_name: string;
  phone?: string | null;
  email?: string | null;
  hourly_rate?: number | null;
}): ValidationResult {
  const errors: string[] = [];

  if (!worker.first_name?.trim()) {
    errors.push('First name is required');
  }
  if (!worker.last_name?.trim()) {
    errors.push('Last name is required');
  }

  if (worker.phone) {
    const phoneResult = validatePhone(worker.phone);
    if (!phoneResult.valid) {
      errors.push(...phoneResult.errors);
    }
  }

  if (worker.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(worker.email)) {
    errors.push('Invalid email address');
  }

  if (worker.hourly_rate !== undefined && worker.hourly_rate !== null) {
    if (worker.hourly_rate < 0) {
      errors.push('Hourly rate cannot be negative');
    }
    if (worker.hourly_rate > 1000) {
      errors.push('Hourly rate seems unreasonably high');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  if (!/^\+?1?\d{10,15}$/.test(cleaned)) {
    errors.push('Invalid phone number format. Expected 10-15 digits, optionally starting with + or +1');
  }

  return { valid: errors.length === 0, errors };
}

export function formatPhoneForStorage(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('1') && cleaned.length === 11) return `+${cleaned}`;
  if (cleaned.length === 10) return `+1${cleaned}`;
  return `+${cleaned}`;
}
