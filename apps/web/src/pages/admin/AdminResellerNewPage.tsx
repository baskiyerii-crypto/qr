import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Field } from '@/components/ui/Label';
import { ArrowLeft } from 'lucide-react';

export function AdminResellerNewPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: '', companyName: '', code: '', commissionRate: '15', marketerId: '',
  });

  const { data: marketers } = useQuery({
    queryKey: ['admin-marketers'],
    queryFn: () => api.get<Array<{ id: string; companyName: string; code: string }>>('/admin/marketers'),
  });

  const create = useMutation({
    mutationFn: () => api.post<{ id: string }>('/admin/resellers', {
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      companyName: form.companyName,
      code: form.code.toUpperCase(),
      commissionRate: parseFloat(form.commissionRate) / 100,
      marketerId: form.marketerId || undefined,
    }),
    onSuccess: (data: { id?: string }) => {
      qc.invalidateQueries({ queryKey: ['admin-resellers'] });
      if (data?.id) {
        navigate({ to: '/admin/resellers/$id', params: { id: data.id } });
      } else {
        navigate({ to: '/admin/resellers' });
      }
    },
  });

  return (
    <div className="space-y-6">
      <Link to="/admin/resellers" className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Bayiler
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">Yeni Bayi</h1>

      <Card>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid gap-4 sm:grid-cols-2">
          <Field label="Bayi firma adı"><Input placeholder="Firma adı" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required /></Field>
          <Field label="Bayi kodu"><Input placeholder="ör: BAYI01" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></Field>
          <Field label="Ad"><Input placeholder="Ad" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></Field>
          <Field label="Soyad"><Input placeholder="Soyad" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></Field>
          <Field label="E-posta" className="sm:col-span-2"><Input placeholder="ornek@firma.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Şifre" hint="En az 8 karakter" className="sm:col-span-2"><Input placeholder="••••••••" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></Field>
          <Field label="Telefon"><Input placeholder="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></Field>
          <Field label="Komisyon %"><Input placeholder="15" type="number" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} /></Field>
          <Field label="Pazarlamacı (opsiyonel)" className="sm:col-span-2">
            <Select value={form.marketerId} onChange={(e) => setForm({ ...form, marketerId: e.target.value })}>
              <option value="">Doğrudan (pazarlamacı yok)</option>
              {marketers?.map((m) => <option key={m.id} value={m.id}>{m.companyName} ({m.code})</option>)}
            </Select>
          </Field>
          <Button type="submit" className="sm:col-span-2" disabled={create.isPending}>Bayi Oluştur</Button>
        </form>
      </Card>
    </div>
  );
}
