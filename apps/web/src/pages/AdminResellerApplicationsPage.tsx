import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/PageHeader';
import { Inbox } from 'lucide-react';

const STATUS_MAP: Record<string, string> = {
  SUBMITTED: 'Gönderildi',
  UNDER_REVIEW: 'İnceleniyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
};

const STATUS_OPTIONS = [
  { value: '', label: 'Tümü' },
  { value: 'SUBMITTED', label: 'Gönderildi' },
  { value: 'UNDER_REVIEW', label: 'İnceleniyor' },
  { value: 'APPROVED', label: 'Onaylandı' },
  { value: 'REJECTED', label: 'Reddedildi' },
];

export function AdminResellerApplicationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [approveCode, setApproveCode] = useState('');
  const [iban, setIban] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const qc = useQueryClient();

  const { data: applications } = useQuery({
    queryKey: ['admin-applications', statusFilter],
    queryFn: () => api.get<Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      companyName: string | null;
      status: string;
      createdAt: string;
    }>>(`/admin/reseller-applications${statusFilter ? `?status=${statusFilter}` : ''}`),
  });

  const { data: detail } = useQuery({
    queryKey: ['admin-application', selectedId],
    queryFn: () => api.get<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      companyName: string | null;
      city: string | null;
      status: string;
      reviewNotes: string | null;
      createdAt: string;
      surveyAnswers: Record<string, unknown>;
      events: Array<{ type: string; message: string; createdAt: string }>;
    }>(`/admin/reseller-applications/${selectedId}`),
    enabled: !!selectedId,
  });

  const review = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/reseller-applications/${id}/review`, { reviewNotes: reviewNotes || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
      qc.invalidateQueries({ queryKey: ['admin-application', selectedId] });
    },
  });

  const approve = useMutation({
    mutationFn: (id: string) =>
      api.post(`/admin/reseller-applications/${id}/approve`, {
        code: approveCode.toUpperCase(),
        iban: iban || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
      setSelectedId(null);
    },
  });

  const reject = useMutation({
    mutationFn: (id: string) =>
      api.post(`/admin/reseller-applications/${id}/reject`, { rejectionReason: rejectReason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
      setSelectedId(null);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bayi Başvuruları"
        description="Bayilik başvurularını inceleyin ve onaylayın"
        icon={<Inbox className="h-5 w-5" />}
        actions={
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padded={false}>
          <div className="divide-y divide-slate-100">
            {applications?.map((a) => (
              <button key={a.id} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50" onClick={() => { setSelectedId(a.id); setApproveCode(`BAYI-${a.firstName.slice(0, 3).toUpperCase()}`); setReviewNotes(''); }}>
                <div>
                  <p className="font-medium text-slate-900">{a.firstName} {a.lastName}</p>
                  <p className="text-xs text-slate-400">{a.email} · {a.companyName || '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.status === 'APPROVED' ? 'success' : a.status === 'REJECTED' ? 'error' : 'warning'}>{STATUS_MAP[a.status] || a.status}</Badge>
                  <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </button>
            ))}
            {!applications?.length && <p className="px-5 py-6 text-center text-sm text-slate-400">Başvuru yok</p>}
          </div>
        </Card>

        {detail && (
          <Card>
            <h3 className="font-semibold">{detail.firstName} {detail.lastName}</h3>
            <p className="text-sm text-slate-500">{detail.email} · {detail.phone}</p>
            <p className="mt-1 text-xs text-slate-400">
              Başvuru: {new Date(detail.createdAt).toLocaleString('tr-TR')}
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <p><strong>Şirket:</strong> {detail.companyName || '—'}</p>
              <p><strong>Şehir:</strong> {detail.city || '—'}</p>
              <p><strong>Motivasyon:</strong> {String(detail.surveyAnswers.whyReseller || '')}</p>
              <p><strong>Sektörler:</strong> {(detail.surveyAnswers.targetSectors as string[])?.join(', ')}</p>
              <p><strong>Kanallar:</strong> {(detail.surveyAnswers.salesChannels as string[])?.join(', ')}</p>
              <p><strong>Tahmini müşteri:</strong> {String(detail.surveyAnswers.estimatedMonthlyClients)}</p>
              {detail.reviewNotes && (
                <p className="rounded-lg bg-amber-50 p-2 text-amber-800"><strong>İnceleme notu:</strong> {detail.reviewNotes}</p>
              )}
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold">Timeline</h4>
              <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-slate-600">
                {detail.events.map((e, i) => (
                  <li key={i}>{e.type}: {e.message} ({new Date(e.createdAt).toLocaleString('tr-TR')})</li>
                ))}
              </ul>
            </div>

            {['SUBMITTED', 'UNDER_REVIEW'].includes(detail.status) && (
              <div className="mt-6 space-y-3">
                {detail.status === 'SUBMITTED' && (
                  <>
                    <Input
                      placeholder="İnceleme notu (opsiyonel)"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    />
                    <Button size="sm" onClick={() => review.mutate(detail.id)}>İncelemeye Al</Button>
                  </>
                )}
                <Input placeholder="Bayi kodu (örn: BAYI-ALI)" value={approveCode} onChange={(e) => setApproveCode(e.target.value.toUpperCase())} />
                <Input placeholder="IBAN (iyzico alt üye için)" value={iban} onChange={(e) => setIban(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => approve.mutate(detail.id)} disabled={approve.isPending || !approveCode}>Onayla</Button>
                  <Input placeholder="Red gerekçesi" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="flex-1" />
                  <Button variant="danger" onClick={() => reject.mutate(detail.id)} disabled={reject.isPending || rejectReason.length < 5}>Reddet</Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
