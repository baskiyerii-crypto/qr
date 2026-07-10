import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { ClipboardList, Plus, Trash2, Bell, FileSpreadsheet, FileText } from 'lucide-react';

type QuestionDraft = {
  order: number;
  type: 'SINGLE_CHOICE' | 'SHORT_TEXT';
  text: string;
  required: boolean;
  options: Array<{ label: string; order: number }>;
};

type SurveyListItem = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  _count: { assignments: number; responses: number };
};

type SurveyStats = {
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number;
  questions: Array<{
    questionId: string;
    text: string;
    type: string;
    optionCounts?: Array<{ label: string; count: number }>;
    textAnswers?: string[];
  }>;
};

type SurveyParticipant = {
  employeeId: string;
  firstName: string;
  lastName: string;
  branchName: string | null;
  departmentName: string | null;
  status: 'completed' | 'pending';
  submittedAt: string | null;
};

type SurveyParticipants = {
  totalAssigned: number;
  totalCompleted: number;
  totalPending: number;
  completionRate: number;
  participants: SurveyParticipant[];
};

export function SurveysPage() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState<'ALL' | 'DEPARTMENT' | 'SELECTED'>('ALL');
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { order: 0, type: 'SINGLE_CHOICE', text: '', required: true, options: [{ label: '', order: 0 }, { label: '', order: 1 }] },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resultsTab, setResultsTab] = useState<'summary' | 'participation'>('summary');
  const [participantSearch, setParticipantSearch] = useState('');
  const qc = useQueryClient();

  const { data: surveys } = useQuery({
    queryKey: ['surveys'],
    queryFn: () => api.get<SurveyListItem[]>('/surveys'),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get<Array<{ id: string; name: string }>>('/companies/departments'),
    enabled: showForm,
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () =>
      api.get<Array<{ id: string; user: { firstName: string; lastName: string }; department?: { name: string } }>>('/employees'),
    enabled: showForm && targetType === 'SELECTED',
  });

  const { data: stats } = useQuery({
    queryKey: ['survey-stats', selectedId],
    queryFn: () => api.get<SurveyStats>(`/surveys/${selectedId}/stats`),
    enabled: !!selectedId,
  });

  const { data: participants } = useQuery({
    queryKey: ['survey-participants', selectedId],
    queryFn: () => api.get<SurveyParticipants>(`/surveys/${selectedId}/participants`),
    enabled: !!selectedId,
  });

  const selectedSurvey = surveys?.find((s) => s.id === selectedId);

  const remind = useMutation({
    mutationFn: () => api.post<{ reminded: number }>(`/surveys/${selectedId}/remind`, {}),
    onSuccess: (res) => {
      alert(`${res?.reminded ?? 0} personele hatırlatma gönderildi`);
    },
  });

  const create = useMutation({
    mutationFn: (payload: unknown) => api.post('/surveys', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['surveys'] });
      setShowForm(false);
      setTitle('');
      setDescription('');
      setQuestions([{ order: 0, type: 'SINGLE_CHOICE', text: '', required: true, options: [{ label: '', order: 0 }, { label: '', order: 1 }] }]);
    },
  });

  const closeSurvey = useMutation({
    mutationFn: (id: string) => api.patch(`/surveys/${id}`, { status: 'CLOSED' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surveys'] }),
  });

  const addQuestion = () => {
    setQuestions((q) => [
      ...q,
      { order: q.length, type: 'SHORT_TEXT', text: '', required: true, options: [] },
    ]);
  };

  const updateQuestion = (index: number, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Anketler"
        description="Personel anketleri oluşturun ve sonuçları izleyin"
        icon={<ClipboardList className="h-5 w-5" />}
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="mr-1 h-4 w-4" />
            {showForm ? 'İptal' : 'Yeni Anket'}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate({
                title,
                description: description || undefined,
                status: 'ACTIVE',
                targetType,
                departmentIds: targetType === 'DEPARTMENT' ? selectedDeptIds : undefined,
                employeeIds: targetType === 'SELECTED' ? selectedEmpIds : undefined,
                questions: questions.map((q, i) => ({
                  order: i,
                  type: q.type,
                  text: q.text,
                  required: q.required,
                  options: q.type === 'SINGLE_CHOICE' ? q.options.filter((o) => o.label.trim()) : undefined,
                })),
              });
            }}
            className="space-y-4"
          >
            <Input placeholder="Anket başlığı" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Textarea placeholder="Açıklama (opsiyonel)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />

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
                    {emp.department && <span className="text-slate-400">({emp.department.name})</span>}
                  </label>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-700">Sorular</p>
              {questions.map((q, qi) => (
                <div key={qi} className="rounded-xl border border-border p-4 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Soru metni"
                      value={q.text}
                      onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                      className="flex-1"
                      required
                    />
                    <select
                      value={q.type}
                      onChange={(e) =>
                        updateQuestion(qi, {
                          type: e.target.value as QuestionDraft['type'],
                          options:
                            e.target.value === 'SINGLE_CHOICE'
                              ? [{ label: '', order: 0 }, { label: '', order: 1 }]
                              : [],
                        })
                      }
                      className="rounded-lg border border-input bg-background px-2 text-sm"
                    >
                      <option value="SINGLE_CHOICE">Çoktan seçmeli</option>
                      <option value="SHORT_TEXT">Kısa metin</option>
                    </select>
                    {questions.length > 1 && (
                      <Button type="button" variant="ghost" onClick={() => setQuestions((p) => p.filter((_, i) => i !== qi))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(qi, { required: e.target.checked })} />
                    Zorunlu
                  </label>
                  {q.type === 'SINGLE_CHOICE' &&
                    q.options.map((opt, oi) => (
                      <Input
                        key={oi}
                        placeholder={`Seçenek ${oi + 1}`}
                        value={opt.label}
                        onChange={(e) => {
                          const opts = [...q.options];
                          opts[oi] = { ...opts[oi], label: e.target.value };
                          updateQuestion(qi, { options: opts });
                        }}
                      />
                    ))}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addQuestion}>
                Soru Ekle
              </Button>
            </div>

            <Button type="submit" disabled={create.isPending}>
              Anketi Yayınla
            </Button>
          </form>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {surveys?.map((s) => (
            <Card
              key={s.id}
              hover
              className={`cursor-pointer ${selectedId === s.id ? 'ring-2 ring-primary/40' : ''}`}
              onClick={() => setSelectedId(s.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{s.title}</p>
                  <p className="text-sm text-slate-500">
                    {s._count.responses}/{s._count.assignments} tamamlandı
                  </p>
                </div>
                <Badge variant={s.status === 'ACTIVE' ? 'success' : 'default'}>{s.status}</Badge>
              </div>
              {s.status === 'ACTIVE' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSurvey.mutate(s.id);
                  }}
                >
                  Kapat
                </Button>
              )}
            </Card>
          ))}
          {!surveys?.length && <p className="text-center text-sm text-slate-400 py-8">Henüz anket yok</p>}
        </div>

        {selectedId && stats && (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Sonuçlar</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {selectedSurvey?.status === 'ACTIVE' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => remind.mutate()}
                      disabled={remind.isPending || !participants?.totalPending}
                    >
                      <Bell className="h-4 w-4" /> Hatırlat ({participants?.totalPending ?? 0})
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => api.download(`/surveys/${selectedId}/export/excel`, `anket-${selectedId.slice(0, 8)}.xlsx`)}
                  >
                    <FileSpreadsheet className="h-4 w-4" /> Excel
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => api.download(`/surveys/${selectedId}/export/pdf`, `anket-${selectedId.slice(0, 8)}.pdf`)}
                  >
                    <FileText className="h-4 w-4" /> PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <div className="mb-4 flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-primary">{stats.totalCompleted}</p>
                <p className="text-xs text-slate-500">Tamamlayan</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-slate-700">{stats.totalAssigned}</p>
                <p className="text-xs text-slate-500">Hedef</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-emerald-600">%{stats.completionRate}</p>
                <p className="text-xs text-slate-500">Oran</p>
              </div>
            </div>

            <div className="mb-4 flex gap-2 border-b border-border">
              {(['summary', 'participation'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setResultsTab(tab)}
                  className={`px-3 py-2 text-sm font-medium ${resultsTab === tab ? 'border-b-2 border-primary text-primary' : 'text-slate-500'}`}
                >
                  {tab === 'summary' ? 'Özet' : 'Katılım'}
                </button>
              ))}
            </div>

            {resultsTab === 'summary' && (
            <div className="space-y-4">
              {stats.questions.map((q) => (
                <div key={q.questionId} className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm font-medium">{q.text}</p>
                  {q.optionCounts?.map((o) => (
                    <div key={o.label} className="mt-1 flex justify-between text-sm text-slate-600">
                      <span>{o.label}</span>
                      <span>{o.count}</span>
                    </div>
                  ))}
                  {q.textAnswers?.map((t, i) => (
                    <p key={i} className="mt-1 text-sm text-slate-500 italic">
                      "{t}"
                    </p>
                  ))}
                </div>
              ))}
            </div>
            )}

            {resultsTab === 'participation' && participants && (
              <div className="space-y-3">
                <Input
                  placeholder="Personel ara..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                />
                {(['completed', 'pending'] as const).map((status) => {
                  const list = participants.participants.filter(
                    (p) =>
                      p.status === status &&
                      `${p.firstName} ${p.lastName}`.toLowerCase().includes(participantSearch.toLowerCase()),
                  );
                  return (
                    <div key={status}>
                      <p className="mb-2 text-sm font-semibold text-slate-700">
                        {status === 'completed' ? 'Tamamladı' : 'Bekliyor'} ({list.length})
                      </p>
                      <div className="max-h-48 space-y-1 overflow-y-auto">
                        {list.map((p) => (
                          <div key={p.employeeId} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                            <div>
                              <span className="font-medium">{p.firstName} {p.lastName}</span>
                              <span className="ml-2 text-xs text-slate-500">
                                {p.branchName}{p.departmentName ? ` · ${p.departmentName}` : ''}
                              </span>
                            </div>
                            <Badge variant={status === 'completed' ? 'success' : 'warning'}>
                              {status === 'completed' ? 'Tamamladı' : 'Bekliyor'}
                            </Badge>
                          </div>
                        ))}
                        {!list.length && <p className="text-xs text-slate-400">Kayıt yok</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
