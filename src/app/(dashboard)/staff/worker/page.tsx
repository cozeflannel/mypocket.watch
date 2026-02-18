'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Plus } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import type { Worker } from '@/types';

export default function WorkerPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    hourly_rate: '',
  });
  const [saving, setSaving] = useState(false);

  const { company } = useCompany();
  const supabase = createClient();

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

  useEffect(() => {
    loadWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (!company) return;
    await supabase.from('workers').insert({
      company_id: company.id,
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone || null,
      email: form.email || null,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
    });
    setForm({ first_name: '', last_name: '', phone: '', email: '', hourly_rate: '' });
    setModalOpen(false);
    setSaving(false);
    loadWorkers();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Worker Management</h1>
        <Button onClick={() => setModalOpen(true)}>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Worker">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                First Name
              </label>
              <input
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Name
              </label>
              <input
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Hourly Rate</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.hourly_rate}
              onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
              placeholder="0.00"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Adding...' : 'Add Worker'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
