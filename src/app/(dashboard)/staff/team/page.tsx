import { createClient } from '@/lib/supabase/server';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';

export default async function TeamPage() {
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from('team_hierarchy')
    .select('*, manager:workers(*)')
    .order('level')
    .order('sort_order');

  const teamList = teams ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team Management</h1>
      </div>

      <Card padding="none">
        <div className="px-6 py-4">
          <CardTitle>Teams</CardTitle>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Parent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamList.length === 0 ? (
              <TableEmpty
                icon="🏢"
                title="No teams"
                description="Create your first team to organize your workforce"
              />
            ) : (
              teamList.map((team) => {
                const parent = teamList.find((t) => t.id === team.parent_id);
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
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
