import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/PageHeader';
import { Plus, Users, Clock } from 'lucide-react';

const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export function ShiftsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [assignEmployeeId, setAssignEmployeeId] = useState<string | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', dayOfWeek: 1, startTime: '09:00', endTime: '18:00' });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => api.get<Array<{ id: string; name: string; dayOfWeek: number; startTime: string; endTime: string }>>('/shifts/templates'),
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get<Array<{
      id: string;
      user: { firstName: string; lastName: string };
      shifts: Array<{ shiftTemplate: { id: string; name: string; dayOfWeek: number } }>;
    }>>('/employees'),
  });

  const create = useMutation({
    mutationFn: () => api.post('/shifts/templates', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shifts'] });
      setShowForm(false);
      setForm({ name: '', dayOfWeek: 1, startTime: '09:00', endTime: '18:00' });
    },
  });

  const assign = useMutation({
    mutationFn: ({ employeeId, shiftTemplateIds }: { employeeId: string; shiftTemplateIds: string[] }) =>
      api.post(`/shifts/assign/${employeeId}`, { shiftTemplateIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      setAssignEmployeeId(null);
      setSelectedTemplates([]);
    },
  });

  const toggleTemplate = (id: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vardiyalar"
        description="Şablon oluşturun ve personele atayın"
        icon={<Clock className="h-5 w-5" />}
        actions={<Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> Yeni Şablon</Button>}
      />

      {showForm && (
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input placeholder="Şablon adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })}>
              {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </Select>
            <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <Button className="mt-4" onClick={() => create.mutate()} disabled={!form.name}>Oluştur</Button>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold">Vardiya Şablonları</h3>
          {isLoading && <p className="text-slate-400">Yükleniyor...</p>}
          {!templates?.length && !isLoading && <p className="text-slate-400">Henüz şablon yok</p>}
          <div className="space-y-2">
            {templates?.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-slate-500">{dayNames[t.dayOfWeek]} · {t.startTime}–{t.endTime}</p>
                </div>
                <Badge>{dayNames[t.dayOfWeek]}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Users className="h-5 w-5" /> Personele Vardiya Ata
          </h3>
          {!employees?.length && <p className="text-slate-400">Önce personel ekleyin</p>}
          <div className="space-y-3">
            {employees?.map((emp) => (
              <div key={emp.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{emp.user.firstName} {emp.user.lastName}</p>
                    <p className="text-xs text-slate-500">
                      {emp.shifts?.length
                        ? emp.shifts.map((s) => `${dayNames[s.shiftTemplate.dayOfWeek]} (${s.shiftTemplate.name})`).join(', ')
                        : 'Vardiya atanmadı'}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => {
                    setAssignEmployeeId(emp.id);
                    setSelectedTemplates(emp.shifts?.map((s) => s.shiftTemplate.id) || []);
                  }}>
                    Ata
                  </Button>
                </div>
                {assignEmployeeId === emp.id && templates && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="mb-2 text-sm text-slate-600">Günleri seçin:</p>
                    <div className="flex flex-wrap gap-2">
                      {templates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleTemplate(t.id)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${selectedTemplates.includes(t.id) ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {dayNames[t.dayOfWeek]} {t.startTime}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" disabled={!selectedTemplates.length || assign.isPending}
                        onClick={() => assign.mutate({ employeeId: emp.id, shiftTemplateIds: selectedTemplates })}>
                        Kaydet
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAssignEmployeeId(null)}>İptal</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
