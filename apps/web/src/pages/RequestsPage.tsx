import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';
import { ClipboardCheck } from 'lucide-react';

interface EmployeeRef {
  employee: { user: { firstName: string; lastName: string } };
  id: string;
  status: string;
  reason: string | null;
}
interface ShiftSwap extends EmployeeRef { date: string }
interface Overtime extends EmployeeRef { date: string; minutes: number }
interface Advance extends EmployeeRef { type: string; amount: string }

interface RequestsData {
  shiftSwaps: ShiftSwap[];
  overtime: Overtime[];
  advances: Advance[];
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === 'PENDING' ? 'warning' : status === 'APPROVED' ? 'success' : 'error'} dot>
      {status}
    </Badge>
  );
}

export function RequestsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['requests'],
    queryFn: () => api.get<RequestsData>('/requests'),
  });

  const review = useMutation({
    mutationFn: ({ kind, id, approve }: { kind: string; id: string; approve: boolean }) =>
      api.patch(`/requests/${kind}/${id}/review`, { approve }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  });

  const actions = (kind: string, id: string, status: string) =>
    status === 'PENDING' ? (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => review.mutate({ kind, id, approve: true })}>Onayla</Button>
        <Button size="sm" variant="danger" onClick={() => review.mutate({ kind, id, approve: false })}>Reddet</Button>
      </div>
    ) : null;

  const name = (r: EmployeeRef) => `${r.employee.user.firstName} ${r.employee.user.lastName}`;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card padded={false}>
      <CardHeader className="border-b border-slate-100 px-6 py-4">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {children}
    </Card>
  );

  const Row = ({ r, meta, kind }: { r: EmployeeRef; meta: string; kind: string }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
      <div className="flex items-center gap-3">
        <Avatar name={name(r)} size="sm" />
        <div>
          <p className="font-medium text-slate-900">{name(r)}</p>
          <p className="text-sm text-slate-500">{meta}</p>
        </div>
      </div>
      <div className="flex items-center gap-2"><StatusBadge status={r.status} />{actions(kind, r.id, r.status)}</div>
    </div>
  );

  const Empty = () => <p className="px-6 py-6 text-center text-sm text-slate-400">Kayıt yok.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Talepler" description="Vardiya takası, fazla mesai ve avans taleplerini yönetin" icon={<ClipboardCheck className="h-5 w-5" />} />

      <Section title="Vardiya Takası">
        <div className="divide-y divide-slate-100">
          {data?.shiftSwaps.map((r) => (
            <Row key={r.id} r={r} kind="shift-swap" meta={`${new Date(r.date).toLocaleDateString('tr-TR')} · ${r.reason ?? '—'}`} />
          ))}
          {!data?.shiftSwaps.length && <Empty />}
        </div>
      </Section>

      <Section title="Fazla Mesai">
        <div className="divide-y divide-slate-100">
          {data?.overtime.map((r) => (
            <Row key={r.id} r={r} kind="overtime" meta={`${new Date(r.date).toLocaleDateString('tr-TR')} · ${r.minutes} dk · ${r.reason ?? '—'}`} />
          ))}
          {!data?.overtime.length && <Empty />}
        </div>
      </Section>

      <Section title="Avans / Masraf">
        <div className="divide-y divide-slate-100">
          {data?.advances.map((r) => (
            <Row key={r.id} r={r} kind="advance" meta={`${r.type === 'ADVANCE' ? 'Avans' : 'Masraf'} · ${r.amount} ₺ · ${r.reason ?? '—'}`} />
          ))}
          {!data?.advances.length && <Empty />}
        </div>
      </Section>
    </div>
  );
}
