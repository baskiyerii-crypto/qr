import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StatCard';
import { CheckSquare } from 'lucide-react';

export function TasksPage() {
  const [title, setTitle] = useState('');
  const [employeeIds, setEmployeeIds] = useState('');
  const qc = useQueryClient();

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks'),
  });

  const create = useMutation({
    mutationFn: (body: unknown) => api.post('/tasks', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setTitle('');
    },
  });

  const list = tasks as Array<{ id: string; title: string; dueDate: string; assignments: Array<{ status: string; employee: { user: { firstName: string } } }> }> | undefined;

  return (
    <div className="space-y-6">
      <PageHeader title="Görevler" description="Personele görev atayın ve durumlarını takip edin" icon={<CheckSquare className="h-5 w-5" />} />
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({
              title,
              employeeIds: employeeIds.split(',').map((s) => s.trim()).filter(Boolean),
              dueDate: new Date().toISOString().split('T')[0],
            });
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <Input placeholder="Görev başlığı" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
          <Input placeholder="Personel ID (virgülle)" value={employeeIds} onChange={(e) => setEmployeeIds(e.target.value)} className="flex-1" />
          <Button type="submit">Ata</Button>
        </form>
      </Card>
      {list && list.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((t) => (
            <Card key={t.id} hover>
              <p className="font-medium text-slate-900">{t.title}</p>
              <p className="text-sm text-slate-500">Son: {new Date(t.dueDate).toLocaleDateString('tr-TR')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {t.assignments?.map((a, i) => (
                  <Badge key={i} variant={a.status === 'COMPLETED' ? 'success' : 'default'}>{a.employee.user.firstName}: {a.status}</Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><EmptyState title="Görev yok" description="İlk görevi oluşturup personele atayın." icon={<CheckSquare className="h-6 w-6" />} /></Card>
      )}
    </div>
  );
}
