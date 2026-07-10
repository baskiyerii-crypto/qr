import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { Briefcase, MapPin } from 'lucide-react';

type CareersData = {
  company: { name: string; slug: string };
  postings: Array<{
    id: string;
    title: string;
    description: string | null;
    position: string | null;
    employmentType: string | null;
    salaryRange: string | null;
    branchName: string | null;
    publicToken: string;
  }>;
};

export function CompanyCareersPage() {
  const { slug } = useParams({ strict: false }) as { slug: string };

  const { data, isLoading, error } = useQuery({
    queryKey: ['careers', slug],
    queryFn: () => api.get<CareersData>(`/recruitment/public/careers/${slug}`),
  });

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <MarketingHeader />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        {isLoading ? (
          <div className="skeleton h-40 rounded-2xl" />
        ) : error || !data ? (
          <Card className="py-12 text-center text-slate-600">Kariyer sayfası bulunamadı.</Card>
        ) : (
          <>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-primary">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{data.company.name}</h1>
                <p className="text-slate-500">Açık pozisyonlar</p>
              </div>
            </div>
            <div className="space-y-4">
              {data.postings.map((p) => (
                <Card key={p.id} hover>
                  <h2 className="text-lg font-semibold text-slate-900">{p.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {[p.position, p.employmentType, p.salaryRange].filter(Boolean).join(' · ')}
                  </p>
                  {p.branchName && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="h-3 w-3" /> {p.branchName}
                    </p>
                  )}
                  {p.description && <p className="mt-3 text-sm text-slate-600 line-clamp-3">{p.description}</p>}
                  <Link to="/kariyer/basvuru/$token" params={{ token: p.publicToken }} className="mt-4 inline-block">
                    <Button>Başvur</Button>
                  </Link>
                </Card>
              ))}
              {!data.postings.length && (
                <Card className="py-10 text-center text-slate-500">Şu an açık ilan bulunmuyor.</Card>
              )}
            </div>
          </>
        )}
      </div>
      <MarketingFooter />
    </div>
  );
}
