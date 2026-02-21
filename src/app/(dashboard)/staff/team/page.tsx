'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Plus, Trash2, Users, ChevronRight } from 'lucide-react';
import type { Worker, TeamHierarchy } from '@/types/database';

interface TeamWithManager extends TeamHierarchy {
  manager: Pick<Worker, 'id' | 'first_name' | 'last_name' | 'color' | 'position'> | null;
}

export default function TeamPage() {
  const { company } = useCompany();
  const [teams, setTeams] = useState<TeamWithManager[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', level: 0, parent_id: '', manager_id: '' });

  const fetchData = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    const supabase = createClient();

    const [teamsRes, workersRes] = await Promise.all([
      fetch('/api/teams').then((r) => r.json()),
      supabase
        .from('workers')
        .select('*')
        .eq('company_id', company.id)
        .eq('is_active', true)
        .order('first_name'),
    ]);

    setTeams(Array.isArray(teamsRes) ? teamsRes : []);
    setWorkers(workersRes.data ?? []);
    setLoading(false);
  }, [company]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          level: form.level,
          parent_id: form.parent_id || null,
          manager_id: form.manager_id || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setModalOpen(false);
      setForm({ name: '', level: 0, parent_id: '', manager_id: '' });
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this team?')) return;
    const res = await fetch(`/api/teams?id=${id}`, { method: 'DELETE' });
    if (res.ok) await fetchData();
  };

  // Build hierarchy tree
  const rootTeams = teams.filter((t) => !t.parent_id);
  const childTeams = (parentId: string) => teams.filter((t) => t.parent_id === parentId);

  // Workers assigned to each team
  const teamWorkers = (teamId: string) =>
    workers.filter((w) => (w as Worker & { team_id?: string }).team_id === teamId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      {/* Visual Hierarchy */}
      <Card>
        <CardTitle>Organization Structure</CardTitle>
        <div className="mt-4">
          {teams.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
              <Users className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <h3 className="mt-4 font-semibold">No teams yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Create your first team to organize your workforce hierarchy.
              </p>
              <Button className="mt-4" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Team
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {rootTeams.map((team) => (
                <div key={team.id}>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold">{team.name}</span>
                      <Badge variant="info">Level {team.level}</Badge>
                      {team.manager && (
                        <span className="text-sm text-gray-500">
                          Manager: {team.manager.first_name} {team.manager.last_name}
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(team.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  {/* Children */}
                  {childTeams(team.id).map((child) => (
                    <div
                      key={child.id}
                      className="ml-8 mt-1 flex items-center justify-between rounded-lg px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        <span>{child.name}</span>
                        <Badge variant="default">Level {child.level}</Badge>
                        {child.manager && (
                          <span className="text-xs text-gray-500">
                            {child.manager.first_name} {child.manager.last_name}
                          </span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(child.id)}>
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </Button>
                    </div>
                  ))}
                  {/* Workers in team */}
                  {teamWorkers(team.id).length > 0 && (
                    <div className="ml-8 mt-1 flex flex-wrap gap-2 px-4 py-1">
                      {teamWorkers(team.id).map((w) => (
                        <span
                          key={w.id}
                          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700"
                        >
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: w.color }} />
                          {w.first_name} {w.last_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Teams Table */}
      <Card padding="none">
        <div className="px-6 py-4">
          <CardTitle>All Teams</CardTitle>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Parent Team</TableHead>
              <TableHead>Members</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.length === 0 ? (
              <TableEmpty icon="🏢" title="No teams" description="Create your first team" />
            ) : (
              teams.map((team) => {
                const parent = teams.find((t) => t.id === team.parent_id);
                const members = teamWorkers(team.id);
                return (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>
                      <Badge variant="info">Level {team.level}</Badge>
                    </TableCell>
                    <TableCell>
                      {team.manager
                        ? `${team.manager.first_name} ${team.manager.last_name}`
                        : '—'}
                    </TableCell>
                    <TableCell>{parent?.name ?? '—'}</TableCell>
                    <TableCell>{members.length}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(team.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Team Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Team">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Team Name *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
              placeholder="e.g. Construction Crew A"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Level
            </label>
            <input
              type="number"
              min="0"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
            <p className="mt-1 text-xs text-gray-500">0 = top level, higher = deeper in hierarchy</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Parent Team
            </label>
            <select
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="">None (top-level)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Team Manager
            </label>
            <select
              value={form.manager_id}
              onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="">No manager</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.first_name} {w.last_name} {w.position ? `(${w.position})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Create Team
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
