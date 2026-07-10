import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/StatCard';
import { cn } from '@/lib/utils';
import { ArrowLeft, FileSpreadsheet, FileText, LayoutGrid, List } from 'lucide-react';

interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  status: string;
  trackingCode: string;
  cvUrl: string | null;
  answers: string | null;
  createdAt: string;
  jobPosting?: {
    formTemplate?: {
      fields: Array<{ id: string; label: string; type: string }>;
    } | null;
  };
}

const KANBAN_COLUMNS = ['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Başvuruldu', UNDER_REVIEW: 'İncelemede', INTERVIEW: 'Mülakat',
  OFFER: 'Teklif', HIRED: 'İşe Alındı', REJECTED: 'Reddedildi',
};

export function RecruitmentApplicationsPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const qc = useQueryClient();
  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const [approveId, setApproveId] = useState<string | null>(null);
  const [position, setPosition] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const { data: apps, isLoading } = useQuery({
    queryKey: ['recruitment-applications', id],
    queryFn: () => api.get<Application[]>(`/recruitment/manage/postings/${id}/applications`),
  });

  const review = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      api.patch(`/recruitment/manage/applications/${appId}/review`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment-applications', id] }),
  });

  const approve = useMutation({
    mutationFn: (appId: string) =>
      api.post(`/recruitment/manage/applications/${appId}/approve`, { position: position || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recruitment-applications', id] });
      setApproveId(null);
      setPosition('');
    },
  });

  const parseAnswers = (app: Application) => {
    const raw: Record<string, unknown> = app.answers ? JSON.parse(app.answers) : {};
    const fields = app.jobPosting?.formTemplate?.fields ?? [];
    return fields
      .filter((f) => f.type !== 'FILE_CV')
      .map((f) => ({
        label: f.label,
        value: raw[f.id] != null ? (Array.isArray(raw[f.id]) ? (raw[f.id] as string[]).join(', ') : String(raw[f.id])) : '',
      }))
      .filter((x) => x.value);
  };

  const AppCard = ({ a, compact }: { a: Application; compact?: boolean }) => (
    <Card
      className={cn('cursor-pointer', compact && 'p-3')}
      hover
      draggable={a.status !== 'HIRED'}
      onDragStart={() => setDragId(a.id)}
      onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
    >
      <div className="flex items-start gap-2">
        {!compact && <Avatar name={`${a.firstName} ${a.lastName}`} />}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{a.firstName} {a.lastName}</p>
          <p className="truncate text-xs text-slate-500">{a.phone}</p>
          {!compact && (
            <>
              <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString('tr-TR')}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    api.download(`/recruitment/manage/applications/${a.id}/cv.pdf`, `basvuru-${a.trackingCode}.pdf`);
                  }}
                >
                  <FileText className="h-3 w-3" /> PDF
                </Button>
                {a.cvUrl && (
                  <a href={a.cvUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost">CV</Button>
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {expandedId === a.id && (
        <div className="mt-3 border-t border-border pt-3 text-sm" onClick={(e) => e.stopPropagation()}>
          {parseAnswers(a).map((ans) => (
            <p key={ans.label} className="text-slate-600"><span className="font-medium">{ans.label}:</span> {ans.value}</p>
          ))}
          <div className="mt-2 flex flex-wrap gap-2">
            <Select
              className="w-40"
              value={a.status}
              onChange={(e) => review.mutate({ appId: a.id, status: e.target.value })}
              disabled={a.status === 'HIRED'}
            >
              {KANBAN_COLUMNS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </Select>
            {a.status !== 'HIRED' && a.email && (
              approveId === a.id ? (
                <div className="flex gap-2">
                  <Input placeholder="Pozisyon" value={position} onChange={(e) => setPosition(e.target.value)} className="h-9 w-36" />
                  <Button size="sm" onClick={() => approve.mutate(a.id)}>İşe Al</Button>
                </div>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => setApproveId(a.id)}>İşe Al</Button>
              )
            )}
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/recruitment" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500">
            <ArrowLeft className="h-4 w-4" /> İlanlara dön
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">Adaylar</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={view === 'kanban' ? 'primary' : 'secondary'}
            onClick={() => setView('kanban')}
          >
            <LayoutGrid className="h-4 w-4" /> Kanban
          </Button>
          <Button
            size="sm"
            variant={view === 'list' ? 'primary' : 'secondary'}
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" /> Liste
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => api.download(`/recruitment/manage/postings/${id}/applications/export/excel`, `basvurular-${id.slice(0, 8)}.xlsx`)}
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : apps && apps.length > 0 ? (
        view === 'kanban' ? (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {KANBAN_COLUMNS.map((col) => (
              <div
                key={col}
                className="min-w-[220px] flex-1 rounded-2xl bg-muted/40 p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) {
                    review.mutate({ appId: dragId, status: col });
                    setDragId(null);
                  }
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{STATUS_LABELS[col]}</span>
                  <Badge variant="default">{apps.filter((a) => a.status === col).length}</Badge>
                </div>
                <div className="space-y-2">
                  {apps.filter((a) => a.status === col).map((a) => (
                    <AppCard key={a.id} a={a} compact />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {apps.map((a) => (
              <Card key={a.id} hover>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={`${a.firstName} ${a.lastName}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{a.firstName} {a.lastName}</h3>
                        <Badge variant={a.status === 'HIRED' ? 'success' : a.status === 'REJECTED' ? 'error' : 'warning'} dot>
                          {STATUS_LABELS[a.status] || a.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{a.phone}{a.email ? ` · ${a.email}` : ''}</p>
                      <p className="text-xs text-slate-400">Takip: {a.trackingCode} · {new Date(a.createdAt).toLocaleDateString('tr-TR')}</p>
                      {parseAnswers(a).map((ans) => (
                        <p key={ans.label} className="text-xs text-slate-600">{ans.label}: {ans.value}</p>
                      ))}
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => api.download(`/recruitment/manage/applications/${a.id}/cv.pdf`, `basvuru-${a.trackingCode}.pdf`)}>
                          <FileText className="h-4 w-4" /> PDF CV
                        </Button>
                        {a.cvUrl && <a href={a.cvUrl} target="_blank" className="text-xs font-medium text-primary underline">Yüklenen CV</a>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Select
                      className="w-40"
                      value={a.status}
                      onChange={(e) => review.mutate({ appId: a.id, status: e.target.value })}
                      disabled={a.status === 'HIRED'}
                    >
                      {KANBAN_COLUMNS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </Select>
                    {a.status !== 'HIRED' && a.email && (
                      approveId === a.id ? (
                        <div className="flex gap-2">
                          <Input placeholder="Pozisyon" value={position} onChange={(e) => setPosition(e.target.value)} className="h-9 w-36" />
                          <Button size="sm" onClick={() => approve.mutate(a.id)}>İşe Al</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => setApproveId(a.id)}>İşe Al</Button>
                      )
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card><EmptyState title="Başvuru yok" description="Bu ilana henüz başvuru gelmedi." /></Card>
      )}
    </div>
  );
}
