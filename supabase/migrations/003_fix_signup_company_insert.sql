-- Fix: Allow authenticated users to insert companies during signup
-- This addresses the chicken-and-egg problem where new users can't create
-- a company because get_user_company_id() returns null for them.

-- Add INSERT policy for companies table
-- Allow any authenticated user to insert a company (they'll become the owner)
create policy "Authenticated users can create companies"
  on public.companies for insert
  to authenticated
  with check (true);

-- Note: This is safe because:
-- 1. Only authenticated users can insert (must have signed up)
-- 2. Each user should only create one company (enforced by application logic)
-- 3. The admin_users table links them as 'owner' of the company
-- 4. After creation, RLS policies restrict them to only their own company
