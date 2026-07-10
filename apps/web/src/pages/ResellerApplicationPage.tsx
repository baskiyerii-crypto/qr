import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

const SECTORS = ['Perakende', 'Üretim', 'Hizmet', 'Sağlık', 'Eğitim', 'Lojistik', 'Diğer'];
const CHANNELS = ['Sosyal medya', 'Yerel işletmeler', 'Muhasebe büroları', 'Tanıdık ağı', 'Online reklam', 'Diğer'];

export function ResellerApplicationPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ id: string; message: string } | null>(null);

  const [personal, setPersonal] = useState({
    firstName: '', lastName: '', email: '', phone: '', companyName: '', city: '', experienceNotes: '',
  });
  const [survey, setSurvey] = useState({
    dailyDeviceUsage: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    hasMarketingExperience: false,
    marketingExperienceDetail: '',
    hasDataAnalysisExperience: false,
    dataAnalysisTools: '',
    targetSectors: [] as string[],
    estimatedMonthlyClients: 5,
    salesChannels: [] as string[],
    whyReseller: '',
    kvkkConsent: false,
  });

  const toggleArray = (key: 'targetSectors' | 'salesChannels', value: string) => {
    setSurvey((s) => {
      const arr = s[key];
      return {
        ...s,
        [key]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value],
      };
    });
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{ id: string; message: string }>('/reseller-applications', {
        ...personal,
        surveyAnswers: survey,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Başvuru gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="flex min-h-screen flex-col bg-surface">
        <MarketingHeader />
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="max-w-md text-center shadow-elevated">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">Başvurunuz Alındı</h2>
            <p className="mt-2 text-sm text-slate-600">{result.message}</p>
            <p className="mt-4 rounded-xl bg-slate-100 px-4 py-2 font-mono text-sm">
              Başvuru No: {result.id.slice(0, 8).toUpperCase()}
            </p>
            <a
              href={`/bayi-basvuru/durum?id=${result.id}&phone=${encodeURIComponent(personal.phone)}`}
              className="mt-6 block"
            >
              <Button className="w-full">Başvuru Durumunu Takip Et</Button>
            </a>
          </Card>
        </div>
        <MarketingFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <MarketingHeader />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Ana sayfa
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Bayi Başvurusu</h1>
        <p className="mt-2 text-slate-600">
          Bilgisayar ve mobil kullanan, pazarlama veya veri analizi yapabilen herkes başvurabilir.
        </p>

        <div className="mb-8 mt-6 flex gap-2">
          {['Bilgiler', 'Anket', 'Özet'].map((label, i) => (
            <div
              key={label}
              className={`flex-1 rounded-lg py-2 text-center text-xs font-medium transition-colors ${
                step === i ? 'bg-primary text-primary-foreground' : step > i ? 'bg-muted text-primary' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i + 1}. {label}
            </div>
          ))}
        </div>

        <Card className="shadow-elevated">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input placeholder="Ad *" value={personal.firstName} onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })} />
              <Input placeholder="Soyad *" value={personal.lastName} onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })} />
              <Input className="sm:col-span-2" type="email" placeholder="E-posta *" value={personal.email} onChange={(e) => setPersonal({ ...personal, email: e.target.value })} />
              <Input className="sm:col-span-2" placeholder="WhatsApp / Telefon *" value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} />
              <Input placeholder="Firma adı (opsiyonel)" value={personal.companyName} onChange={(e) => setPersonal({ ...personal, companyName: e.target.value })} />
              <Input placeholder="Şehir" value={personal.city} onChange={(e) => setPersonal({ ...personal, city: e.target.value })} />
              <Textarea className="sm:col-span-2" placeholder="Deneyim notları" rows={3} value={personal.experienceNotes} onChange={(e) => setPersonal({ ...personal, experienceNotes: e.target.value })} />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium">Günlük bilgisayar/telefon kullanımı</label>
                <Select
                  className="mt-1"
                  value={survey.dailyDeviceUsage}
                  onChange={(e) => setSurvey({ ...survey, dailyDeviceUsage: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                >
                  <option value="LOW">Az (1-2 saat)</option>
                  <option value="MEDIUM">Orta (3-5 saat)</option>
                  <option value="HIGH">Yoğun (5+ saat)</option>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={survey.hasMarketingExperience} onChange={(e) => setSurvey({ ...survey, hasMarketingExperience: e.target.checked })} />
                Pazarlama / satış deneyimim var
              </label>
              {survey.hasMarketingExperience && (
                <Input placeholder="Pazarlama deneyimi detayı" value={survey.marketingExperienceDetail} onChange={(e) => setSurvey({ ...survey, marketingExperienceDetail: e.target.value })} />
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={survey.hasDataAnalysisExperience} onChange={(e) => setSurvey({ ...survey, hasDataAnalysisExperience: e.target.checked })} />
                Veri analizi yapabilirim (Excel, rapor vb.)
              </label>
              {survey.hasDataAnalysisExperience && (
                <Input placeholder="Kullandığınız araçlar" value={survey.dataAnalysisTools} onChange={(e) => setSurvey({ ...survey, dataAnalysisTools: e.target.value })} />
              )}
              <div>
                <label className="text-sm font-medium">Hedef sektörler *</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SECTORS.map((s) => (
                    <button key={s} type="button" onClick={() => toggleArray('targetSectors', s)} className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${survey.targetSectors.includes(s) ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Satış kanalları *</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CHANNELS.map((c) => (
                    <button key={c} type="button" onClick={() => toggleArray('salesChannels', c)} className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${survey.salesChannels.includes(c) ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Tahmini aylık müşteri sayısı: {survey.estimatedMonthlyClients}</label>
                <input type="range" min={0} max={50} className="mt-1 w-full" value={survey.estimatedMonthlyClients} onChange={(e) => setSurvey({ ...survey, estimatedMonthlyClients: parseInt(e.target.value) })} />
              </div>
              <Textarea placeholder="Neden bayi olmak istiyorsunuz? (min 20 karakter) *" rows={4} value={survey.whyReseller} onChange={(e) => setSurvey({ ...survey, whyReseller: e.target.value })} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 text-sm text-slate-700">
              <p><strong>Ad:</strong> {personal.firstName} {personal.lastName}</p>
              <p><strong>E-posta:</strong> {personal.email}</p>
              <p><strong>Telefon:</strong> {personal.phone}</p>
              <p><strong>Hedef sektörler:</strong> {survey.targetSectors.join(', ')}</p>
              <p><strong>Satış kanalları:</strong> {survey.salesChannels.join(', ')}</p>
              <label className="mt-4 flex items-start gap-2">
                <input type="checkbox" checked={survey.kvkkConsent} onChange={(e) => setSurvey({ ...survey, kvkkConsent: e.target.checked })} />
                <span>Kişisel verilerimin bayi başvurusu kapsamında işlenmesini kabul ediyorum (KVKK).</span>
              </label>
            </div>
          )}

          {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <div className="mt-6 flex justify-between">
            {step > 0 ? (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>Geri</Button>
            ) : <div />}
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)}>İleri <ArrowRight className="h-4 w-4" /></Button>
            ) : (
              <Button
                disabled={loading || !survey.kvkkConsent || survey.whyReseller.length < 20 || !survey.targetSectors.length || !survey.salesChannels.length}
                onClick={submit}
              >
                {loading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
              </Button>
            )}
          </div>
        </Card>
      </div>
      <MarketingFooter />
    </div>
  );
}
