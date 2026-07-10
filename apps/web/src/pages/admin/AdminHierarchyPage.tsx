import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChevronDown, ChevronRight, Network, Megaphone, Store, Building2, Users } from 'lucide-react';

type Hierarchy = {
  totals: { totalEmployees: number; totalResellers: number; totalCompanies: number; totalMarketers: number };
  marketers: Array<{
    id: string; companyName: string; code: string;
    user: { publicId: string; email: string; firstName: string; lastName: string };
    _count: { resellers: number; companies: number };
    resellers: Array<{
      id: string; companyName: string; code: string;
      companies: Array<{ id: string; name: string; _count: { employees: number }; users: Array<{ publicId: string; firstName: string; lastName: string; role: string }> }>;
    }>;
    companies: Array<{ id: string; name: string; _count: { employees: number } }>;
  }>;
  directResellers: Array<{ id: string; companyName: string; code: string; companies: Array<{ id: string; name: string }> }>;
  directCompanies: Array<{ id: string; name: string; _count: { employees: number } }>;
};

export function AdminHierarchyPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { data } = useQuery({ queryKey: ['admin-hierarchy'], queryFn: () => api.get<Hierarchy>('/admin/hierarchy') });
  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Hiyerarşisi" description="Pazarlamacı, bayi ve müşteri ağacı" icon={<Network className="h-5 w-5" />} />
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard title="Pazarlamacılar" value={data?.totals.totalMarketers ?? 0} icon={<Megaphone className="h-5 w-5" />} />
        <StatCard title="Bayiler" value={data?.totals.totalResellers ?? 0} icon={<Store className="h-5 w-5" />} />
        <StatCard title="Şirketler" value={data?.totals.totalCompanies ?? 0} icon={<Building2 className="h-5 w-5" />} />
        <StatCard title="Personel" value={data?.totals.totalEmployees ?? 0} icon={<Users className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader><CardTitle>Pazarlamacı → Bayi → Müşteri</CardTitle></CardHeader>
        {data?.marketers.map((m) => (
          <div key={m.id} className="mb-2 rounded-lg border border-slate-100">
            <button type="button" className="flex w-full items-center gap-2 p-3 text-left hover:bg-slate-50" onClick={() => toggle(m.id)}>
              {expanded[m.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="font-medium">{m.companyName}</span>
              <Badge>{m.code}</Badge>
              <span className="text-sm text-slate-400">{m._count.resellers} bayi · {m._count.companies} doğrudan müşteri</span>
            </button>
            {expanded[m.id] && (
              <div className="border-t px-6 py-2">
                {m.resellers.map((r) => (
                  <div key={r.id} className="py-2">
                    <p className="text-sm font-medium">↳ {r.companyName} <Badge>{r.code}</Badge></p>
                    {r.companies.map((c) => (
                      <p key={c.id} className="ml-4 text-xs text-slate-500">• {c.name} ({c._count.employees} personel)</p>
                    ))}
                  </div>
                ))}
                {m.companies.map((c) => (
                  <p key={c.id} className="py-1 text-sm text-slate-600">★ Doğrudan: {c.name}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>

      {!!data?.directResellers.length && (
        <Card>
          <CardHeader><CardTitle>Doğrudan Bayiler (pazarlamacı yok)</CardTitle></CardHeader>
          {data.directResellers.map((r) => (
            <p key={r.id} className="py-1 text-sm">{r.companyName} <Badge>{r.code}</Badge> — {r.companies.length} müşteri</p>
          ))}
        </Card>
      )}

      {!!data?.directCompanies.length && (
        <Card>
          <CardHeader><CardTitle>Doğrudan Müşteriler (platform)</CardTitle></CardHeader>
          {data.directCompanies.map((c) => (
            <p key={c.id} className="py-1 text-sm">{c.name} ({c._count.employees} personel)</p>
          ))}
        </Card>
      )}
    </div>
  );
}
