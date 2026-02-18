import { createClient } from '@/lib/supabase/server';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';

export default async function StaffPage() {
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from('team_hierarchy')
    .select('*')
    .order('level')
    .order('sort_order');

  const { data: workers } = await supabase
    .from('workers')
    .select('*')
    .eq('is_active', true)
    .order('last_name');

  const teamList = teams ?? [];
  const workerList = workers ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Staff Overview</h1>

      {/* Hierarchy Tree */}
      <Card>
        <CardTitle>Team Hierarchy</CardTitle>
        <div className="mt-4">
          {teamList.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No teams configured. Add teams in the Team tab to build your organizational hierarchy.
            </p>
          ) : (
            <div className="space-y-2">
              {teamList
                .filter((t) => !t.parent_id)
                .map((team) => (
                  <div key={team.id}>
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
                      <span className="font-medium">{team.name}</span>
                      <Badge variant="info">Level {team.level}</Badge>
                    </div>
                    <div className="ml-6 mt-1 space-y-1">
                      {teamList
                        .filter((child) => child.parent_id === team.id)
                        .map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
                          >
                            <span className="text-gray-400">└</span>
                            <span>{child.name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </Card>

      {/* Workers Table */}
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
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workerList.length === 0 ? (
              <TableEmpty
                icon="👥"
                title="No workers"
                description="Add workers in the Worker tab to get started"
              />
            ) : (
              workerList.map((worker) => (
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
    </div>
  );
}
