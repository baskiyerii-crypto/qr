import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { MessageSquare, Users, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { UserRole } from '@qr/shared';

type Conversation = {
  id: string;
  type: string;
  name?: string;
  subject?: string;
  participants: Array<{
    employeeId?: string;
    userId?: string;
    employee?: { user: { firstName: string; lastName: string } };
    user?: { firstName: string; lastName: string };
  }>;
  messages: Array<{ body: string; createdAt: string }>;
};

type Message = {
  id: string;
  body: string;
  createdAt: string;
  senderUser?: { firstName: string; lastName: string };
  senderEmployee?: { user: { firstName: string; lastName: string } };
};

const MANAGER_ROLES = [
  UserRole.COMPANY_ADMIN,
  UserRole.HR_MANAGER,
  UserRole.REGIONAL_MANAGER,
  UserRole.BRANCH_MANAGER,
];

export function MessagesPage() {
  const user = useAuthStore((s) => s.user);
  const isManager = user && MANAGER_ROLES.includes(user.role);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showNew, setShowNew] = useState<'dm' | 'group' | null>(null);
  const [recipientId, setRecipientId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const qc = useQueryClient();

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get<Conversation[]>('/messages/conversations'),
    refetchInterval: 8000,
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', selectedConv],
    queryFn: () => api.get<Message[]>(`/messages/conversations/${selectedConv}`),
    enabled: !!selectedConv,
    refetchInterval: 5000,
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () =>
      api.get<Array<{ id: string; user: { firstName: string; lastName: string } }>>('/employees'),
    enabled: !!isManager && !!showNew,
  });

  const send = useMutation({
    mutationFn: (body: unknown) => api.post('/messages', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', selectedConv] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setMessage('');
    },
  });

  const createConv = useMutation({
    mutationFn: (body: unknown) => api.post<Conversation>('/messages/conversations', body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConv(data.id);
      setShowNew(null);
      setGroupName('');
      setGroupMemberIds([]);
      setRecipientId('');
    },
  });

  const convLabel = (c: Conversation) => {
    if (c.type === 'GROUP') return c.name ?? 'Grup';
    const emp = c.participants.find((p) => p.employee)?.employee;
    if (emp) return `${emp.user.firstName} ${emp.user.lastName}`;
    return c.subject ?? 'Konuşma';
  };

  const senderName = (m: Message) => {
    if (m.senderEmployee?.user) {
      return `${m.senderEmployee.user.firstName} ${m.senderEmployee.user.lastName}`;
    }
    if (m.senderUser) return `${m.senderUser.firstName} ${m.senderUser.lastName}`;
    return 'Bilinmeyen';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mesajlar"
        description="Yönetici–personel yazışmaları ve grup sohbetleri"
        icon={<MessageSquare className="h-5 w-5" />}
        actions={
          isManager ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowNew('dm')}>
                <UserPlus className="mr-1 h-4 w-4" />
                Yeni Mesaj
              </Button>
              <Button size="sm" onClick={() => setShowNew('group')}>
                <Users className="mr-1 h-4 w-4" />
                Grup Oluştur
              </Button>
            </div>
          ) : undefined
        }
      />

      {showNew && isManager && (
        <Card className="space-y-3">
          {showNew === 'dm' ? (
            <>
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Personel seçin</option>
                {employees?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.user.firstName} {e.user.lastName}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button
                  disabled={!recipientId}
                  onClick={() =>
                    createConv.mutate({ type: 'DIRECT', recipientEmployeeId: recipientId })
                  }
                >
                  Konuşma Başlat
                </Button>
                <Button variant="ghost" onClick={() => setShowNew(null)}>
                  İptal
                </Button>
              </div>
            </>
          ) : (
            <>
              <Input placeholder="Grup adı" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
              <div className="max-h-32 overflow-y-auto rounded-lg border p-2 space-y-1">
                {employees?.map((e) => (
                  <label key={e.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={groupMemberIds.includes(e.id)}
                      onChange={(ev) =>
                        setGroupMemberIds((ids) =>
                          ev.target.checked ? [...ids, e.id] : ids.filter((x) => x !== e.id),
                        )
                      }
                    />
                    {e.user.firstName} {e.user.lastName}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={!groupName || groupMemberIds.length === 0}
                  onClick={() =>
                    createConv.mutate({
                      type: 'GROUP',
                      name: groupName,
                      memberEmployeeIds: groupMemberIds,
                    })
                  }
                >
                  Grup Oluştur
                </Button>
                <Button variant="ghost" onClick={() => setShowNew(null)}>
                  İptal
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card padded={false} className="p-2">
          <div className="space-y-1">
            {conversations?.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedConv(c.id)}
                className={`w-full rounded-xl p-3 text-left text-sm transition-colors ${selectedConv === c.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
              >
                <p className="font-medium text-slate-900">
                  {convLabel(c)}
                  {c.type === 'GROUP' && (
                    <span className="ml-1 text-xs text-slate-400">(grup)</span>
                  )}
                </p>
                <p className="truncate text-slate-400">{c.messages[0]?.body}</p>
              </button>
            ))}
            {!conversations?.length && (
              <p className="px-3 py-6 text-center text-sm text-slate-400">Konuşma yok</p>
            )}
          </div>
        </Card>
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConv ? (
            <>
              <div className="mb-4 max-h-96 flex-1 space-y-3 overflow-y-auto">
                {messages?.map((m) => (
                  <div key={m.id} className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
                    <p className="text-xs font-medium text-slate-500">{senderName(m)}</p>
                    <p className="text-slate-700">{m.body}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(m.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send.mutate({ conversationId: selectedConv, body: message });
                }}
                className="flex gap-2"
              >
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mesaj yazın..."
                  className="flex-1"
                />
                <Button type="submit">Gönder</Button>
              </form>
            </>
          ) : (
            <p className="py-12 text-center text-slate-400">Bir konuşma seçin</p>
          )}
        </Card>
      </div>
    </div>
  );
}
