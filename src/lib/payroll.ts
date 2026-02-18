interface PayrollHoursInput {
  regularHours: number;
  dailyThreshold: number;
  weeklyThreshold: number;
  overtimeMultiplier: number;
}

interface PayrollHoursResult {
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
}

export function calculatePayrollHours(
  dailyHours: number[],
  options: Omit<PayrollHoursInput, 'regularHours'>
): PayrollHoursResult {
  let weeklyRegular = 0;
  let weeklyOvertime = 0;

  for (const hours of dailyHours) {
    if (hours > options.dailyThreshold) {
      weeklyRegular += options.dailyThreshold;
      weeklyOvertime += hours - options.dailyThreshold;
    } else {
      weeklyRegular += hours;
    }
  }

  // Weekly overtime check (only if daily didn't already push to OT)
  if (weeklyRegular > options.weeklyThreshold) {
    const excess = weeklyRegular - options.weeklyThreshold;
    weeklyRegular = options.weeklyThreshold;
    weeklyOvertime += excess;
  }

  return {
    regularHours: Math.round(weeklyRegular * 100) / 100,
    overtimeHours: Math.round(weeklyOvertime * 100) / 100,
    totalHours: Math.round((weeklyRegular + weeklyOvertime) * 100) / 100,
  };
}

// 2024 Federal tax brackets (single filer, simplified for payroll estimation)
const FEDERAL_BRACKETS = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
] as const;

const FICA_SOCIAL_SECURITY_RATE = 0.062;
const FICA_SOCIAL_SECURITY_WAGE_BASE = 168600;
const FICA_MEDICARE_RATE = 0.0145;
const FICA_MEDICARE_ADDITIONAL_RATE = 0.009;
const FICA_MEDICARE_ADDITIONAL_THRESHOLD = 200000;

export function estimateFederalTax(annualGross: number): number {
  let tax = 0;
  for (const bracket of FEDERAL_BRACKETS) {
    if (annualGross <= bracket.min) break;
    const taxable = Math.min(annualGross, bracket.max) - bracket.min;
    tax += taxable * bracket.rate;
  }
  return Math.round(tax * 100) / 100;
}

export function calculateFICA(annualGross: number): {
  socialSecurity: number;
  medicare: number;
  total: number;
} {
  const ssWages = Math.min(annualGross, FICA_SOCIAL_SECURITY_WAGE_BASE);
  const socialSecurity = Math.round(ssWages * FICA_SOCIAL_SECURITY_RATE * 100) / 100;

  let medicare = annualGross * FICA_MEDICARE_RATE;
  if (annualGross > FICA_MEDICARE_ADDITIONAL_THRESHOLD) {
    medicare += (annualGross - FICA_MEDICARE_ADDITIONAL_THRESHOLD) * FICA_MEDICARE_ADDITIONAL_RATE;
  }
  medicare = Math.round(medicare * 100) / 100;

  return {
    socialSecurity,
    medicare,
    total: Math.round((socialSecurity + medicare) * 100) / 100,
  };
}

export function calculateGrossPay(
  regularHours: number,
  overtimeHours: number,
  hourlyRate: number,
  overtimeMultiplier: number = 1.5
): number {
  return Math.round(
    (regularHours * hourlyRate + overtimeHours * hourlyRate * overtimeMultiplier) * 100
  ) / 100;
}
