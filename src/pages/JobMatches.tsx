import { useEffect, useState, useCallback } from 'react';
import { MapPin, CheckCircle2, AlertCircle, ArrowRight, Building2, Target } from 'lucide-react';
import type { CV, Job } from '@/lib/types';
import { runFullAnalysis, type AnalysisResult } from '@/lib/analysis';
import { Card, SectionHeader, Badge, Button, SkillPill, LoadingState, EmptyState } from '@/components/ui';
import { t as translate, type LangCode, type TranslationKey } from '@/lib/i18n';

type JobMatchesProps = {
  cv: CV | null;
  onNavigate: (page: string) => void;
  lang: LangCode;
};

export function JobMatches({ cv, lang }: JobMatchesProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'strong' | 'moderate' | 'weak'>('all');

  const t = useCallback((key: TranslationKey) => translate(lang, key), [lang]);

  useEffect(() => {
    if (!cv) {
      setLoading(false);
      return;
    }
    runFullAnalysis(cv).then((result) => {
      setAnalysis(result);
      setLoading(false);
    });
  }, [cv]);

  if (loading) return <LoadingState message={t('jobmatches.matching')} />;

  const allJobs = analysis?.topJobs || [];
  const filteredJobs = filter === 'all' ? allJobs : allJobs.filter((j) => j.match_strength === filter);

  const filterLabels: Record<string, string> = {
    all: t('common.all'),
    strong: t('jobmatches.strong'),
    moderate: t('jobmatches.moderate'),
    weak: t('jobmatches.weak'),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">{t('jobmatches.title')}</h1>
          <p className="text-sm text-navy-500 mt-1">{t('jobmatches.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'strong', 'moderate', 'weak'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-navy-600 border border-navy-200 hover:bg-primary-50'
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Target size={28} />}
            title={t('jobmatches.noMatches')}
            message={t('jobmatches.noMatchesMsg')}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

export function JobCard({ job, lang }: { job: Job; lang: LangCode }) {
  const t = (key: TranslationKey) => translate(lang, key);
  const matchBg =
    job.match_strength === 'strong'
      ? 'bg-emerald-50 text-emerald-700'
      : job.match_strength === 'moderate'
      ? 'bg-primary-50 text-primary-700'
      : 'bg-orange-50 text-orange-700';

  return (
    <Card hover>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-primary-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-navy-800">{job.title}</h3>
            <p className="text-sm text-navy-500">{job.company}</p>
            <p className="text-xs text-navy-400 flex items-center gap-1 mt-0.5">
              <MapPin size={11} /> {job.location}
              {job.is_remote && <span className="ml-1 text-emerald-500">· {t('common.remote')}</span>}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-sm ${matchBg}`}>
            {job.match_score}% {t('common.match')}
          </div>
          <p className="text-xs text-navy-400 mt-1 capitalize">{job.match_strength}</p>
        </div>
      </div>

      {job.salary_range && (
        <p className="text-sm font-medium text-navy-600 mb-3">{job.salary_range}</p>
      )}

      {job.description && (
        <p className="text-sm text-navy-500 mb-3 line-clamp-2">{job.description}</p>
      )}

      <div className="space-y-2">
        {job.matched_skills.length > 0 && (
          <div>
            <p className="text-xs font-medium text-navy-500 mb-1.5">{t('jobmatches.skillsYouHave')}</p>
            <div className="flex flex-wrap gap-1.5">
              {job.matched_skills.map((s) => (
                <SkillPill key={s} variant="matched">
                  <CheckCircle2 size={11} className="mr-0.5" />
                  {s}
                </SkillPill>
              ))}
            </div>
          </div>
        )}
        {job.missing_skills.length > 0 && (
          <div>
            <p className="text-xs font-medium text-navy-500 mb-1.5">{t('jobmatches.missing')}</p>
            <div className="flex flex-wrap gap-1.5">
              {job.missing_skills.map((s) => (
                <SkillPill key={s} variant="missing">
                  <AlertCircle size={11} className="mr-0.5" />
                  {s}
                </SkillPill>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-navy-100">
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{job.job_type}</Badge>
          <Badge variant="neutral">{job.experience_level}</Badge>
        </div>
        <Button variant="ghost" className="text-primary-600">
          {t('common.viewDetails')} <ArrowRight size={14} />
        </Button>
      </div>
    </Card>
  );
}
