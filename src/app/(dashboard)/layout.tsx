import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { LoadingProvider } from '@/contexts/LoadingContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CompanyProvider>
      <LoadingProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </LoadingProvider>
    </CompanyProvider>
  );
}
