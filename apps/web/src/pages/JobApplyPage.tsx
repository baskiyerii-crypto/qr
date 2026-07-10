import { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { CheckCircle2, Briefcase } from 'lucide-react';

type FormField = {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options: string[];
};

type FormData = {
  posting: {
    title: string;
    description: string | null;
    companyName: string;
    branchName: string | null;
  };
  fields: FormField[];
};

export function JobApplyPage() {
  const { token } = useParams({ strict: false }) as { token: string };
  const [formData, setFormData] = useState<FormData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [cvUrl, setCvUrl] = useState('');
  const [result, setResult] = useState<{ trackingCode: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api
      .get<FormData>(`/recruitment/public/posting/${token}/form`)
      .then(setFormData)
      .catch(() => setLoadError('İlan bulunamadı veya kapanmış'));
  }, [token]);

  const setAnswer = (fieldId: string, value: string | string[]) => {
    setAnswers((p) => ({ ...p, [fieldId]: value }));
  };

  const uploadCv = async (file: File) => {
    const res = await api.upload<{ fileUrl: string }>(`/recruitment/public/upload-cv/${token}`, file);
    setCvUrl(res.fileUrl);
    return res.fileUrl;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let firstName = '';
      let lastName = '';
      let phone = '';
      let email = '';

      for (const f of formData?.fields ?? []) {
        const val = answers[f.id];
        const label = f.label.toLowerCase();
        if (typeof val === 'string') {
          if (label.includes('ad') && !label.includes('soyad')) firstName = val;
          if (label.includes('soyad')) lastName = val;
          if (label.includes('telefon')) phone = val;
          if (label.includes('e-posta') || label.includes('email')) email = val;
        }
      }

      const res = await api.post<{ trackingCode: string }>(`/recruitment/apply/${token}`, {
        firstName: firstName || 'Aday',
        lastName: lastName || '-',
        email: email || undefined,
        phone: phone || '0000000000',
        answers,
        cvUrl: cvUrl || undefined,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Başvuru başarısız');
    } finally {
      setLoading(false);
    }
  };

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col bg-surface">
        <MarketingHeader />
        <div className="mx-auto max-w-lg flex-1 px-4 py-10 text-center text-slate-600">{loadError}</div>
        <MarketingFooter />
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex min-h-screen flex-col bg-surface">
        <MarketingHeader />
        <div className="mx-auto max-w-lg flex-1 px-4 py-10"><div className="skeleton h-64 rounded-2xl" /></div>
        <MarketingFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <MarketingHeader />
      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-primary"><Briefcase className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{formData.posting.title}</h1>
            <p className="text-sm text-slate-500">{formData.posting.companyName}{formData.posting.branchName ? ` · ${formData.posting.branchName}` : ''}</p>
          </div>
        </div>
        {formData.posting.description && (
          <p className="mt-4 text-sm text-slate-600">{formData.posting.description}</p>
        )}
        <Card className="mt-6 shadow-elevated">
          {result ? (
            <div className="space-y-3 py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></div>
              <p className="text-lg font-semibold text-slate-900">Başvurunuz alındı!</p>
              <p className="text-sm text-slate-600">Takip kodunuz:</p>
              <p className="text-2xl font-bold tracking-widest text-primary">{result.trackingCode}</p>
              <p className="text-sm text-slate-500">
                Bu kod ve telefon numaranızla{' '}
                <a href="/kariyer/durum" className="font-medium text-primary underline">durum sayfasından</a> başvurunuzu takip edebilirsiniz.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {formData.fields.map((f) => {
                if (f.type === 'FILE_CV') {
                  return (
                    <div key={f.id}>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        {f.label}{f.required ? ' *' : ''}
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        required={f.required && !cvUrl}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              await uploadCv(file);
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'CV yüklenemedi');
                            }
                          }
                        }}
                        className="block w-full text-sm"
                      />
                      {cvUrl && <p className="mt-1 text-xs text-emerald-600">CV yüklendi ✓</p>}
                    </div>
                  );
                }
                if (f.type === 'TEXTAREA') {
                  return (
                    <Textarea
                      key={f.id}
                      rows={4}
                      placeholder={`${f.label}${f.required ? ' *' : ''}`}
                      value={(answers[f.id] as string) ?? ''}
                      onChange={(e) => setAnswer(f.id, e.target.value)}
                      required={f.required}
                    />
                  );
                }
                if (f.type === 'SINGLE_CHOICE') {
                  return (
                    <div key={f.id}>
                      <p className="mb-2 text-sm font-medium text-slate-700">{f.label}{f.required ? ' *' : ''}</p>
                      <div className="space-y-2">
                        {f.options.map((opt) => (
                          <label key={opt} className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={f.id}
                              value={opt}
                              required={f.required}
                              checked={answers[f.id] === opt}
                              onChange={() => setAnswer(f.id, opt)}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }
                if (f.type === 'MULTI_CHOICE') {
                  return (
                    <div key={f.id}>
                      <p className="mb-2 text-sm font-medium text-slate-700">{f.label}{f.required ? ' *' : ''}</p>
                      <div className="space-y-2">
                        {f.options.map((opt) => {
                          const selected = (answers[f.id] as string[] | undefined) ?? [];
                          return (
                            <label key={opt} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={selected.includes(opt)}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...selected, opt]
                                    : selected.filter((x) => x !== opt);
                                  setAnswer(f.id, next);
                                }}
                              />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return (
                  <Input
                    key={f.id}
                    type={f.type === 'NUMBER' ? 'number' : f.type === 'DATE' ? 'date' : 'text'}
                    placeholder={`${f.label}${f.required ? ' *' : ''}`}
                    value={(answers[f.id] as string) ?? ''}
                    onChange={(e) => setAnswer(f.id, e.target.value)}
                    required={f.required}
                  />
                );
              })}
              {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
              <Button className="w-full" disabled={loading}>Başvur</Button>
            </form>
          )}
        </Card>
      </div>
      <MarketingFooter />
    </div>
  );
}
