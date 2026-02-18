-- Row Level Security Policies for Multi-Tenant Isolation
-- Apply company-level isolation to all tables

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM admin_users WHERE auth_uid = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Companies: Users can only see/update their own company
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (id = auth.user_company_id());

CREATE POLICY "Users can update their own company"
  ON companies FOR UPDATE
  USING (id = auth.user_company_id());

-- Admin Users: Users can view their company's admins
CREATE POLICY "Users can view company admins"
  ON admin_users FOR SELECT
  USING (company_id = auth.user_company_id());

CREATE POLICY "Users can update their own profile"
  ON admin_users FOR UPDATE
  USING (auth_uid = auth.uid());

-- Workers: Company-level isolation
CREATE POLICY "Users can view their company's workers"
  ON workers FOR SELECT
  USING (company_id = auth.user_company_id());

CREATE POLICY "Users can insert workers to their company"
  ON workers FOR INSERT
  WITH CHECK (company_id = auth.user_company_id());

CREATE POLICY "Users can update their company's workers"
  ON workers FOR UPDATE
  USING (company_id = auth.user_company_id());

CREATE POLICY "Users can delete their company's workers"
  ON workers FOR DELETE
  USING (company_id = auth.user_company_id());

-- Time Entries: Access through workers (company isolation)
CREATE POLICY "Users can view their company's time entries"
  ON time_entries FOR SELECT
  USING (
    worker_id IN (
      SELECT id FROM workers WHERE company_id = auth.user_company_id()
    )
  );

CREATE POLICY "Users can insert time entries for their company's workers"
  ON time_entries FOR INSERT
  WITH CHECK (
    worker_id IN (
      SELECT id FROM workers WHERE company_id = auth.user_company_id()
    )
  );

CREATE POLICY "Users can update their company's time entries"
  ON time_entries FOR UPDATE
  USING (
    worker_id IN (
      SELECT id FROM workers WHERE company_id = auth.user_company_id()
    )
  );

CREATE POLICY "Users can delete their company's time entries"
  ON time_entries FOR DELETE
  USING (
    worker_id IN (
      SELECT id FROM workers WHERE company_id = auth.user_company_id()
    )
  );

-- Schedules: Access through workers (company isolation)
CREATE POLICY "Users can view their company's schedules"
  ON schedules FOR SELECT
  USING (
    worker_id IN (
      SELECT id FROM workers WHERE company_id = auth.user_company_id()
    )
  );

CREATE POLICY "Users can insert schedules for their company's workers"
  ON schedules FOR INSERT
  WITH CHECK (
    worker_id IN (
      SELECT id FROM workers WHERE company_id = auth.user_company_id()
    )
  );

CREATE POLICY "Users can update their company's schedules"
  ON schedules FOR UPDATE
  USING (
    worker_id IN (
      SELECT id FROM workers WHERE company_id = auth.user_company_id()
    )
  );

CREATE POLICY "Users can delete their company's schedules"
  ON schedules FOR DELETE
  USING (
    worker_id IN (
      SELECT id FROM workers WHERE company_id = auth.user_company_id()
    )
  );

-- Payroll Periods: Company-level isolation
-- Note: Assuming payroll_periods table has company_id column
-- If not, this needs to be added first!
CREATE POLICY "Users can view their company's payroll periods"
  ON payroll_periods FOR SELECT
  USING (company_id = auth.user_company_id());

CREATE POLICY "Users can insert payroll periods for their company"
  ON payroll_periods FOR INSERT
  WITH CHECK (company_id = auth.user_company_id());

CREATE POLICY "Users can update their company's payroll periods"
  ON payroll_periods FOR UPDATE
  USING (company_id = auth.user_company_id());

CREATE POLICY "Users can delete their company's payroll periods"
  ON payroll_periods FOR DELETE
  USING (company_id = auth.user_company_id());

-- Audit Logs: Company-level isolation
CREATE POLICY "Users can view their company's audit logs"
  ON audit_logs FOR SELECT
  USING (company_id = auth.user_company_id());

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true); -- Allow inserts from service role

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_company_id() TO authenticated;
