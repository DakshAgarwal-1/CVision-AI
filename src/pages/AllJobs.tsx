import { useEffect, useState } from 'react';
import { MapPin, Briefcase, Building2 } from 'lucide-react';
import type { Job } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { Card, Badge, LoadingState, EmptyState } from '@/components/ui';
import { JobCard } from './JobMatches';
import { Briefcase as BriefcaseIcon } from 'lucide-react';
import type { LangCode } from '@/lib/i18n';

export function AllJobs({ lang = 'en' }: { lang?: LangCode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data } = await supabase.from('jobs').select('*').order('posted_date', { ascending: false });
    setJobs((data || []) as Job[]);
    setLoading(false);
  };

  if (loading) return <LoadingState message="Loading all jobs..." />;

  const filtered = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">All Jobs</h1>
        <p className="text-sm text-navy-500 mt-1">Browse all available positions</p>
      </div>

      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search by title, company, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 px-4 rounded-xl bg-white border border-navy-200 text-sm text-navy-700 placeholder:text-navy-400 focus:outline-none focus:border-primary-300 transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BriefcaseIcon size={28} />}
            title="No jobs found"
            message={search ? "Try a different search term." : "No jobs are currently available."}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
