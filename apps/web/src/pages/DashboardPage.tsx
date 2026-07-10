import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, Calendar, Smartphone } from 'lucide-react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardData {
  totalEmployees: number;
  checkedInNow: number;
  checkInsToday: number;
  pendingLeaves: number;
  pendingDevices: number;
  liveAttendance: Array<{
    id: string;
    serverTimestamp: string;
    employee: { user: { firstName: string; lastName: string } };
    branch: { name: string };
  }>;
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/dashboard'),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const attendanceData = [
    { name: 'İçeride', value: data?.checkedInNow || 0, color: '#6366f1' },
    { name: 'Dışarıda', value: (data?.totalEmployees || 0) - (data?.checkedInNow || 0), color: '#e2e8f0' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Bugünkü özet ve canlı devam durumu" />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Toplam Personel" value={data?.totalEmployees || 0} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Şu An İçeride" value={data?.checkedInNow || 0} icon={<UserCheck className="h-5 w-5" />} subtitle="Canlı" />
        <StatCard title="Bekleyen İzin" value={data?.pendingLeaves || 0} icon={<Calendar className="h-5 w-5" />} />
        <StatCard title="Cihaz Onayı" value={data?.pendingDevices || 0} icon={<Smartphone className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Canlı Devam</CardTitle>
          </CardHeader>
          {data?.liveAttendance?.length ? (
            <div className="space-y-2">
              {data.liveAttendance.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={`${r.employee.user.firstName} ${r.employee.user.lastName}`}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {r.employee.user.firstName} {r.employee.user.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{r.branch.name}</p>
                    </div>
                  </div>
                  <Badge variant="success" dot>
                    İçeride
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">Şu an içeride personel yok</p>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Devam Dağılımı</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={attendanceData} dataKey="value" innerRadius={50} outerRadius={80}>
                {attendanceData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-muted0" /> İçeride ({data?.checkedInNow})
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-200" /> Dışarıda
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
