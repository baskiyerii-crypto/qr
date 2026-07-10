import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StatCard';
import { Download, Calculator, FileText, Wallet } from 'lucide-react';

type LineItem = {
  employee: { user: { firstName: string; lastName: string } };
  baseSalary: number;
  overtimePay: number;
  deductions: number;
  netPay: number;
};

type PayrollResult = {
  payrollRun: { year: number; month: number; status: string };
  lineItems: LineItem[];
};

export function PayrollPage() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const calculate = useMutation({
    mutationFn: () => api.post<PayrollResult>(`/payroll/calculate?year=${year}&month=${month}`),
  });

  const handleDownload = async (type: 'excel' | 'pdf') => {
    const ext = type === 'excel' ? 'xlsx' : 'pdf';
    await api.download(`/payroll/export/${type}?year=${year}&month=${month}`, `bordro-${month}-${year}.${ext}`);
  };

  const items = calculate.data?.lineItems;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maaş & Bordro"
        description={`${month}/${year} dönemi`}
        icon={<Wallet className="h-5 w-5" />}
        actions={
          <>
            <Button onClick={() => calculate.mutate()} disabled={calculate.isPending}>
              <Calculator className="h-4 w-4" /> Hesapla
            </Button>
            <Button variant="secondary" onClick={() => handleDownload('excel')} disabled={!calculate.isSuccess}>
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" onClick={() => handleDownload('pdf')} disabled={!calculate.isSuccess}>
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </>
        }
      />

      {calculate.isError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{calculate.error.message}</p>}

      <Card padded={false}>
        <CardHeader className="border-b border-slate-100 px-6 py-4">
          <CardTitle>Bordro Özeti</CardTitle>
        </CardHeader>
        {calculate.isPending ? (
          <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}</div>
        ) : items && items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Personel</th>
                  <th className="px-6 py-3">Brüt</th>
                  <th className="px-6 py-3">Fazla mesai</th>
                  <th className="px-6 py-3">Kesinti</th>
                  <th className="px-6 py-3">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, i) => (
                  <tr key={i} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${item.employee.user.firstName} ${item.employee.user.lastName}`} size="sm" />
                        <span className="font-medium text-slate-900">{item.employee.user.firstName} {item.employee.user.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">{Number(item.baseSalary).toLocaleString('tr-TR')} ₺</td>
                    <td className="px-6 py-3.5 text-emerald-600">+{Number(item.overtimePay).toLocaleString('tr-TR')} ₺</td>
                    <td className="px-6 py-3.5 text-rose-500">−{Number(item.deductions).toLocaleString('tr-TR')} ₺</td>
                    <td className="px-6 py-3.5 font-semibold">{Number(item.netPay).toLocaleString('tr-TR')} ₺</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Bordro hesaplanmadı" description={'Dönem bordrosunu görmek için "Hesapla" butonuna tıklayın.'} icon={<Wallet className="h-6 w-6" />} />
        )}
      </Card>
    </div>
  );
}
