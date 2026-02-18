'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Company, AdminUser } from '@/types/database';

interface CompanyContextValue {
  company: Company | null;
  adminUser: AdminUser | null;
  loading: boolean;
}

const CompanyContext = createContext<CompanyContextValue>({
  company: null,
  adminUser: null,
  loading: true,
});

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: admin } = await supabase
        .from('admin_users')
        .select('*')
        .eq('auth_uid', user.id)
        .eq('is_active', true)
        .single();

      if (admin) {
        setAdminUser(admin as AdminUser);
        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .eq('id', admin.company_id)
          .single();
        if (comp) setCompany(comp as Company);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <CompanyContext.Provider value={{ company, adminUser, loading }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
