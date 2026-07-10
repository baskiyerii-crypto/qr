import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { Megaphone } from 'lucide-react';

export function AnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [requiresAck, setRequiresAck] = useState(true);
  const [targetType, setTargetType] = useState<'ALL' | 'DEPARTMENT' | 'SELECTED'>('ALL');
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements'),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get<Array<{ id: string; name: string }>>('/companies/departments'),
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () =>
      api.get<Array<{ id: string; user: { firstName: string; lastName: string } }>>('/employees'),
    enabled: targetType === 'SELECTED',
  });

  const { data: stats } = useQuery({
    queryKey: ['announcement-stats', selectedId],
    queryFn: () =>
      api.get<{
        stats: { read: number; pending: number; acknowledged: number };
        announcement: {
          reads: Array<{
            employee: { user: { firstName: string; lastName: string } };
            readAt: string | null;
            acknowledgedAt: string | null;
          }>;
        };
      }>(`/announcements/${selectedId}/stats`),
    enabled: !!selectedId,
  });

  const create = useMutation({
    mutationFn: (payload: unknown) => api.post('/announcements', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      setTitle('');
      setBody('');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Duyurular" description="Şirket geneli duyuru gönderin ve okunma durumunu izleyin" icon={<Megaphone className="h-5 w-5" />} />

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({
              title,
              body,
              requiresAck,
              targetType,
              departmentIds: targetType === 'DEPARTMENT' ? selectedDeptIds : undefined,
              employeeIds: targetType === 'SELECTED' ? selectedEmpIds : undefined,
            });
          }}
          className="space-y-4"
        >
          <Input placeholder="Başlık" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Textarea rows={4} placeholder="Duyuru metni" value={body} onChange={(e) => setBody(e.target.value)} required />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={requiresAck} onChange={(e) => setRequiresAck(e.target.checked)} className="accent-primary" />
            Okudum / Kabul zorunlu
          </label>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Hedef kitle</p>
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'DEPARTMENT', 'SELECTED'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTargetType(t)}
                  className={`rounded-lg px-3 py-1.5 text-sm ${targetType === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  {t === 'ALL' ? 'Tüm personel' : t === 'DEPARTMENT' ? 'Departman' : 'Seçili personel'}
                </button>
              ))}
            </div>
          </div>

          {targetType === 'DEPARTMENT' && (
            <div className="flex flex-wrap gap-2">
              {departments?.map((d) => (
                <label key={d.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedDeptIds.includes(d.id)}
                    onChange={(e) =>
                      setSelectedDeptIds((ids) =>
                        e.target.checked ? [...ids, d.id] : ids.filter((x) => x !== d.id),
                      )
                    }
                  />
                  {d.name}
                </label>
              ))}
            </div>
          )}

          {targetType === 'SELECTED' && (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
              {employees?.map((emp) => (
                <label key={emp.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedEmpIds.includes(emp.id)}
                    onChange={(e) =>
                      setSelectedEmpIds((ids) =>
                        e.target.checked ? [...ids, emp.id] : ids.filter((x) => x !== emp.id),
                      )
                    }
                  />
                  {emp.user.firstName} {emp.user.lastName}
                </label>
              ))}
            </div>
          )}

          <Button type="submit">Gönder</Button>
        </form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {(announcements as Array<{ id: string; title: string; requiresAck: boolean; createdAt: string }>)?.map((a) => (
            <Card
              key={a.id}
              hover
              className={`cursor-pointer ${selectedId === a.id ? 'ring-2 ring-primary/40' : ''}`}
              onClick={() => setSelectedId(a.id)}
            >
              <p className="font-medium text-slate-900">{a.title}</p>
              <p className="text-sm text-slate-500">{new Date(a.createdAt).toLocaleString('tr-TR')}</p>
              {a.requiresAck && <Badge variant="primary" className="mt-2">Kabul gerekli</Badge>}
            </Card>
          ))}
        </div>

        {selectedId && stats && (
          <Card>
            <CardHeader>
              <CardTitle>Okuma Durumu</CardTitle>
            </CardHeader>
            <div className="mb-4 flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-primary">{stats.stats.read}</p>
                <p className="text-xs text-slate-500">Okudu</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-amber-500">{stats.stats.pending}</p>
                <p className="text-xs text-slate-500">Bekliyor</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-emerald-600">{stats.stats.acknowledged}</p>
                <p className="text-xs text-slate-500">Kabul etti</p>
              </div>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {stats.announcement.reads.map((r, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{r.employee.user.firstName} {r.employee.user.lastName}</span>
                  <Badge variant={r.acknowledgedAt ? 'success' : r.readAt ? 'info' : 'warning'}>
                    {r.acknowledgedAt ? 'Kabul' : r.readAt ? 'Okudu' : 'Bekliyor'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
