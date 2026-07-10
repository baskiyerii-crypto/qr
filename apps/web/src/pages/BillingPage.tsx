import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { CheckCircle2, XCircle, CreditCard, Check } from 'lucide-react';

export function BillingPage() {
  const search = useSearch({ strict: false }) as { success?: string; error?: string };

  const { data: plans } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => api.get<Array<{
      id: string;
      name: string;
      monthlyPrice: number;
      maxEmployees: number;
      maxBranches: number;
    }>>('/billing/plans'),
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.get<{ status: string; plan: { name: string; monthlyPrice: number } } | null>('/billing/subscription'),
  });

  const checkout = useMutation({
    mutationFn: (planId: string) =>
      api.post<{ paymentPageUrl?: string; checkoutFormContent?: string }>('/billing/checkout', { planId }),
    onSuccess: (data) => {
      if (data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl;
      }
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Abonelik & Ödeme" description="iyzico ile güvenli ödeme — bayi komisyonu otomatik dağıtılır" icon={<CreditCard className="h-5 w-5" />} />

      {search.success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700">
          <CheckCircle2 className="h-5 w-5" /> Ödeme başarılı! Aboneliğiniz aktifleştirildi.
        </div>
      )}
      {search.error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-rose-700">
          <XCircle className="h-5 w-5" /> Ödeme başarısız. Lütfen tekrar deneyin.
        </div>
      )}

      {subscription && (
        <Card>
          <CardHeader><CardTitle>Mevcut Abonelik</CardTitle></CardHeader>
          <p className="text-sm text-slate-600">
            Plan: <strong className="text-slate-900">{subscription.plan?.name}</strong> — {subscription.plan?.monthlyPrice} ₺/ay
          </p>
          <Badge variant={subscription.status === 'ACTIVE' ? 'success' : 'default'} dot className="mt-2">{subscription.status}</Badge>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {plans?.map((plan) => (
          <Card key={plan.id} hover className="flex flex-col">
            <h3 className="text-lg font-bold text-primary">{plan.name}</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">{plan.monthlyPrice} ₺<span className="text-sm font-normal text-slate-500">/ay</span></p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> {plan.maxEmployees} personele kadar</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> {plan.maxBranches} şube</li>
            </ul>
            <Button
              className="mt-4 w-full"
              disabled={checkout.isPending || subscription?.status === 'ACTIVE'}
              onClick={() => checkout.mutate(plan.id)}
            >
              {checkout.isPending ? 'Yönlendiriliyor...' : 'iyzico ile Öde'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
