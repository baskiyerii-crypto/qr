import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { MessageCircle } from 'lucide-react';

type Thread = {
  id: string;
  subject: string;
  status: string;
  type: string;
  createdAt: string;
  createdBy: { firstName: string; lastName: string; publicId: string; role: string };
  reseller?: { companyName: string; code: string };
  messages: Array<{
    id: string;
    body: string;
    createdAt: string;
    sender: { firstName: string; lastName: string; publicId: string };
  }>;
};

export function FeedbackPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [reply, setReply] = useState('');
  const qc = useQueryClient();

  const { data: threads } = useQuery({
    queryKey: ['feedback'],
    queryFn: () => api.get<Thread[]>('/feedback/my'),
  });

  const selected = threads?.find((t) => t.id === selectedId);

  const create = useMutation({
    mutationFn: () => api.post('/feedback', { subject, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback'] });
      setShowNew(false);
      setSubject('');
      setBody('');
    },
  });

  const sendReply = useMutation({
    mutationFn: (id: string) => api.post(`/feedback/${id}/reply`, { body: reply }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback'] });
      setReply('');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Geri Bildirim"
        description="Üst yöneticinize mesaj gönderin veya gelen talepleri yanıtlayın"
        icon={<MessageCircle className="h-5 w-5" />}
        actions={<Button onClick={() => setShowNew(!showNew)}>Yeni Geri Bildirim</Button>}
      />

      {showNew && (
        <Card>
          <div className="space-y-3">
            <Input placeholder="Konu" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <Textarea rows={4} placeholder="Mesajınız..." value={body} onChange={(e) => setBody(e.target.value)} />
            <Button onClick={() => create.mutate()} disabled={!subject || !body || create.isPending}>Gönder</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padded={false}>
          <div className="divide-y divide-slate-100">
            {threads?.map((t) => (
              <button key={t.id} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50" onClick={() => setSelectedId(t.id)}>
                <div>
                  <p className="font-medium text-slate-900">{t.subject}</p>
                  <p className="text-xs text-slate-400">{t.createdBy.firstName} {t.createdBy.lastName} · {t.createdBy.publicId}</p>
                </div>
                <Badge variant={t.status === 'OPEN' ? 'warning' : 'default'}>{t.status}</Badge>
              </button>
            ))}
            {!threads?.length && <p className="px-5 py-6 text-center text-sm text-slate-400">Geri bildirim yok</p>}
          </div>
        </Card>

        {selected && (
          <Card>
            <h3 className="font-semibold text-slate-900">{selected.subject}</h3>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {selected.messages.map((m) => (
                <div key={m.id} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-sm">
                  <p className="text-xs text-slate-400">{m.sender.firstName} {m.sender.lastName} ({m.sender.publicId})</p>
                  <p className="mt-1 text-slate-700">{m.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Input placeholder="Yanıt yazın..." value={reply} onChange={(e) => setReply(e.target.value)} className="flex-1" />
              <Button onClick={() => sendReply.mutate(selected.id)} disabled={!reply.trim()}>Yanıtla</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
