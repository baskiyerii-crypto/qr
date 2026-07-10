import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Download, Building2, AlertTriangle, BarChart3, Clock, CalendarX } from 'lucide-react';

interface BranchStat {
  branchId: string;
  branchName: string;
  employeeCount: number;
  presentToday: number;
  totalWorkedHours: number;
  totalOvertimeHours: number;
  totalLateMinutes: number;
  absentDays: number;
  lateEntries: number;
}

interface Absentee {
  employeeId: string;
  name: string;
  branchName: string | null;
}

export function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: stats } = useQuery({
    queryKey: ['reports-branches', year, month],
    queryFn: () => api.get<BranchStat[]>(`/reports/branches?year=${year}&month=${month}`),
  });
  const { data: absentees } = useQuery({
    queryKey: ['absence-alerts'],
    queryFn: () => api.get<Absentee[]>('/reports/absence-alerts'),
  });

  const totalEmployees = stats?.reduce((s, b) => s + b.employeeCount, 0) ?? 0;
  const totalOt = stats?.reduce((s, b) => s + b.totalOvertimeHours, 0) ?? 0;
  const totalAbsent = stats?.reduce((s, b) => s + b.absentDays, 0) ?? 0;

  const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Raporlar"
        description="Şube karşılaştırma ve devamsızlık"
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <>
            <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-36">
              {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </Select>
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28">
              {[now.getFullYear(), now.getFullYear() - 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
            <Button variant="secondary" onClick={() => api.download(`/reports/branches/export?year=${year}&month=${month}`, `sube-karsilastirma-${year}-${month}.xlsx`)}>
              <Download className="h-4 w-4" /> Excel
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Toplam Personel" value={totalEmployees} icon={<Building2 className="h-5 w-5" />} />
        <StatCard title="Fazla Mesai (saat)" value={totalOt} icon={<Clock className="h-5 w-5" />} />
        <StatCard title="Devamsız Gün" value={totalAbsent} icon={<CalendarX className="h-5 w-5" />} />
      </div>

      <Card padded={false}>
        <CardHeader className="border-b border-slate-100 px-6 py-4">
          <CardTitle>Şube Karşılaştırma — {monthNames[month - 1]} {year}</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Şube</th>
                <th className="px-6 py-3">Personel</th>
                <th className="px-6 py-3">Bugün Gelen</th>
                <th className="px-6 py-3">Çalışılan (saat)</th>
                <th className="px-6 py-3">Fazla Mesai (saat)</th>
                <th className="px-6 py-3">Geç Giriş</th>
                <th className="px-6 py-3">Devamsız Gün</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.map((b) => (
                <tr key={b.branchId} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-3.5 font-medium text-slate-900">{b.branchName}</td>
                  <td className="px-6 py-3.5">{b.employeeCount}</td>
                  <td className="px-6 py-3.5">{b.presentToday}</td>
                  <td className="px-6 py-3.5">{b.totalWorkedHours}</td>
                  <td className="px-6 py-3.5">{b.totalOvertimeHours}</td>
                  <td className="px-6 py-3.5">{b.lateEntries}</td>
                  <td className="px-6 py-3.5">{b.absentDays}</td>
                </tr>
              ))}
              {stats?.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400">Veri yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padded={false}>
        <CardHeader className="border-b border-slate-100 px-6 py-4">
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Bugün Giriş Yapmayanlar</CardTitle>
        </CardHeader>
        <div className="divide-y divide-slate-100">
          {absentees?.map((a) => (
            <div key={a.employeeId} className="flex items-center justify-between px-6 py-3">
              <span className="font-medium text-slate-900">{a.name}</span>
              <span className="text-sm text-slate-500">{a.branchName ?? '—'}</span>
            </div>
          ))}
          {absentees?.length === 0 && <p className="px-6 py-6 text-center text-sm text-slate-400">Bugün için devamsız personel yok.</p>}
        </div>
      </Card>
    </div>
  );
}
