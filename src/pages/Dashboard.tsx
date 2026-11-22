import { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Target,
  Sparkles,
  TrendingDown,
  MapPin,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Mail,
  GraduationCap,
  Clock,
  Upload,
  Pencil,
  Activity,
  FileCheck,
} from 'lucide-react';
import type { Profile, CV, Job } from '@/lib/types';
import { runFullAnalysis, reanalyzeCv, type AnalysisResult } from '@/lib/analysis';
import {
  Card,
  SectionHeader,
  StatCard,
  Badge,
  Button,
  SkillPill,
  ProgressBar,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import { t as translate, type LangCode, type TranslationKey } from '@/lib/i18n';

type DashboardProps = {
  profile: Profile | null;
  cv: CV | null;
  cvs?: CV[];
  userEmail?: string;
  onNavigate: (page: string, options?: { editProfile?: boolean }) => void;
  onReanalyze: () => void;
  lang: LangCode;
};

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: 'cv' | 'profile';
};

export function Dashboard({
  profile,
  cv,
  cvs = [],
  userEmail = '',
  onNavigate,
  onReanalyze,
  lang,
}: DashboardProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(Boolean(cv));
  const [reanalyzing, setReanalyzing] = useState(false);

  const t = useCallback((key: TranslationKey) => translate(lang, key), [lang]);

  useEffect(() => {
    if (!cv) {
      setAnalysis(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    runFullAnalysis(cv)
      .then((result) => {
        setAnalysis(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [cv]);

  const handleReanalyze = async () => {
    if (!cv) return;
    setReanalyzing(true);
    try {
      const result = await reanalyzeCv(cv);
      setAnalysis(result);
      onReanalyze();
    } catch (err) {
      console.error('Reanalysis failed:', err);
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return <LoadingState message={t('dashboard.analyzingProfile')} />;
  }

  const fullName = profile?.name?.trim() || userEmail.split('@')[0] || 'Student';
  const email = userEmail || profile?.email || '';
  const latestScore = analysis?.cvScore ?? cv?.score ?? 0;

  const scoreGrade = !cv
    ? '—'
    : latestScore >= 85
      ? 'A+'
      : latestScore >= 70
        ? 'A'
        : latestScore >= 55
          ? 'B'
          : 'C';

  const scoreSubtitle = !cv
    ? 'Upload a CV to get scored'
    : latestScore >= 80
      ? t('dashboard.topCandidate')
      : latestScore >= 55
        ? 'Solid foundation'
        : 'Room to improve';

  const activities: ActivityItem[] = [
    ...cvs.map((item) => ({
      id: `cv-${item.id}`,
      title: `CV analyzed: ${item.filename}`,
      detail: `Score ${item.score}/100 · ${item.parsed_skills.length} skills extracted`,
      timestamp: item.uploaded_at || item.created_at,
      type: 'cv' as const,
    })),
    ...(profile?.updated_at
      ? [
          {
            id: `profile-upd-${profile.id}`,
            title:
              profile.updated_at !== profile.created_at
                ? 'Profile updated'
                : 'Student profile created',
            detail: `${fullName}${profile.university ? ` · ${profile.university}` : ''}`,
            timestamp: profile.updated_at,
            type: 'profile' as const,
          },
        ]
      : []),
  ]
    .filter((a) => Boolean(a.timestamp))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero with Student Identity & Profile Summary */}
      <div className="card p-6 lg:p-8 gradient-hero border-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <Badge variant="primary" size="md">
              <Sparkles size={14} />
              {t('dashboard.aiActive')}
            </Badge>
            <h1 className="text-2xl lg:text-3xl font-bold text-navy-800 mt-4">
              {t('dashboard.greeting')} {fullName}
            </h1>
            <p className="text-navy-600 mt-1.5 text-sm lg:text-base">
              {t('dashboard.subtitle')}
            </p>

            {/* Real student profile metadata */}
            <div className="flex flex-wrap items-center gap-2.5 mt-3">
              {email && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-600 bg-white/70 dark:bg-navy-800/70 px-2.5 py-1 rounded-lg border border-navy-200/60">
                  <Mail size={12} className="text-primary-500" />
                  {email}
                </span>
              )}
              {profile?.title && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-600 bg-white/70 dark:bg-navy-800/70 px-2.5 py-1 rounded-lg border border-navy-200/60">
                  {profile.title}
                </span>
              )}
              {profile?.university && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-600 bg-white/70 dark:bg-navy-800/70 px-2.5 py-1 rounded-lg border border-navy-200/60">
                  <GraduationCap size={12} className="text-primary-500" />
                  {profile.university}
                  {profile.graduation_year ? ` (${profile.graduation_year})` : ''}
                </span>
              )}
              {profile?.location && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-600 bg-white/70 dark:bg-navy-800/70 px-2.5 py-1 rounded-lg border border-navy-200/60">
                  <MapPin size={12} className="text-primary-500" />
                  {profile.location}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
              {cv ? (
                <>
                  <Button onClick={() => onNavigate('job-matches')}>
                    {t('dashboard.exploreMatches')}
                    <ArrowRight size={16} />
                  </Button>
                  <Button variant="secondary" onClick={handleReanalyze} disabled={reanalyzing}>
                    <RefreshCw size={16} className={reanalyzing ? 'animate-spin' : ''} />
                    {reanalyzing ? t('dashboard.analyzing') : t('dashboard.reanalyze')}
                  </Button>
                </>
              ) : (
                <Button onClick={() => onNavigate('my-cv')}>
                  <Upload size={16} />
                  {t('common.uploadCv')}
                </Button>
              )}
              <Button variant="ghost" onClick={() => onNavigate('profile', { editProfile: true })}>
                <Pencil size={15} />
                {t('profile.editProfile')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Real Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText size={20} className="text-primary-600" />}
          title={t('dashboard.cvScore')}
          value={`${latestScore}/100`}
          subtitle={scoreSubtitle}
          bgClass="gradient-primary-soft"
          iconBg="bg-primary-100"
          badge={<Badge variant="primary">{scoreGrade}</Badge>}
        />
        <StatCard
          icon={<FileCheck size={20} className="text-amber-600" />}
          title="Total Uploaded CVs"
          value={`${cvs.length}`}
          subtitle={cv ? `Latest: ${cv.filename}` : 'No CVs uploaded yet'}
          bgClass="gradient-amber"
          iconBg="bg-amber-100"
        />
        <StatCard
          icon={<Target size={20} className="text-emerald-600" />}
          title={t('dashboard.jobsMatched')}
          value={`${analysis?.jobsMatched || 0}`}
          subtitle={`${analysis?.strongMatches || 0} ${t('dashboard.strongMatches')}`}
          bgClass="gradient-mint"
          iconBg="bg-emerald-100"
        />
        <StatCard
          icon={<TrendingDown size={20} className="text-orange-600" />}
          title={t('dashboard.skillsDetected')}
          value={`${analysis?.skillsDetected || cv?.parsed_skills.length || 0}`}
          subtitle={`${analysis?.skillGapsCount || 0} ${t('dashboard.gapsIdentified')}`}
          bgClass="gradient-peach"
          iconBg="bg-orange-100"
          badge={
            analysis && analysis.highPriorityGaps > 0 ? (
              <Badge variant="error">!</Badge>
            ) : undefined
          }
        />
      </div>

      {/* Job Recommendations + Skill Gap */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Job Matches */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <SectionHeader
              title={t('dashboard.bestMatches')}
              subtitle={t('dashboard.bestMatchesSub')}
              action={
                <button
                  onClick={() => onNavigate('job-matches')}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  {t('common.viewAll')} <ArrowRight size={14} />
                </button>
              }
            />
            <div className="space-y-3">
              {(analysis?.topJobs || []).map((job) => (
                <JobMatchRow key={job.id} job={job} onNavigate={onNavigate} lang={lang} />
              ))}
              {(!analysis?.topJobs || analysis.topJobs.length === 0) && (
                <EmptyState
                  icon={<Target size={24} />}
                  title={t('dashboard.noMatches')}
                  message="Upload your CV to calculate compatibility scores across available roles."
                  action={
                    <Button onClick={() => onNavigate('my-cv')}>
                      <Upload size={15} /> {t('common.uploadCv')}
                    </Button>
                  }
                />
              )}
            </div>
          </Card>
        </div>

        {/* Skill Gap + Top Skills to Learn */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <SectionHeader
              title={t('dashboard.yourSkillGap')}
              action={
                <button
                  onClick={() => onNavigate('skill-gap')}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  {t('common.details')} <ArrowRight size={14} />
                </button>
              }
            />
            {analysis?.skillGaps && analysis.skillGaps.length > 0 ? (
              <div className="space-y-3.5">
                {analysis.skillGaps.slice(0, 6).map((gap) => (
                  <ProgressBar key={gap.id} label={gap.skill_name} value={gap.current_level} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-navy-500 text-center py-6">
                Upload a CV to view your skill gap breakdown.
              </p>
            )}
          </Card>

          <Card>
            <SectionHeader title={t('dashboard.topSkillsLearn')} />
            {analysis?.skillGaps && analysis.skillGaps.some((g) => g.priority !== 'none') ? (
              <div className="space-y-2.5">
                {analysis.skillGaps
                  .filter((g) => g.priority !== 'none')
                  .sort((a, b) => {
                    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
                    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
                  })
                  .slice(0, 4)
                  .map((gap) => (
                    <div key={gap.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-navy-700">{gap.skill_name}</span>
                      <Badge
                        variant={
                          gap.priority === 'high'
                            ? 'error'
                            : gap.priority === 'medium'
                              ? 'warning'
                              : 'neutral'
                        }
                      >
                        {gap.priority.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-navy-500 text-center py-4">
                No priority learning gaps detected yet.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* CV Analysis History + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CV Analysis History */}
        <Card>
          <SectionHeader
            title="CV Analysis History"
            subtitle="All resumes uploaded to your account"
            action={
              <button
                onClick={() => onNavigate('my-cv')}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Manage CVs <ArrowRight size={14} />
              </button>
            }
          />
          {cvs.length === 0 ? (
            <EmptyState
              icon={<FileText size={24} />}
              title="No CV analysis history yet"
              message="Upload a PDF or TXT resume to start tracking your CV score and detected skills."
              action={
                <Button onClick={() => onNavigate('my-cv')}>
                  <Upload size={15} /> {t('common.uploadCv')}
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {cvs.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate('my-cv')}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-navy-200/60 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                      <FileCheck size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-800 truncate">
                        {item.candidate_name || item.filename}
                      </p>
                      <p className="text-xs text-navy-500 truncate">
                        {item.filename} · {item.parsed_skills.length} skills ·{' '}
                        {new Date(item.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="primary">{item.score}/100</Badge>
                    <Badge variant={item.status === 'analyzed' ? 'success' : 'warning'}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Activities */}
        <Card>
          <SectionHeader
            title="Recent Activities"
            subtitle="Your latest account and analysis activity"
          />
          {activities.length === 0 ? (
            <p className="text-sm text-navy-500 text-center py-8">
              No recent activity recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-50/70 border border-navy-100"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      act.type === 'cv'
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    <Activity size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-800 truncate">{act.title}</p>
                    <p className="text-xs text-navy-500 mt-0.5 truncate">{act.detail}</p>
                  </div>
                  <span className="text-xs text-navy-400 flex items-center gap-1 shrink-0">
                    <Clock size={11} />
                    {new Date(act.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function JobMatchRow({
  job,
  onNavigate,
  lang,
}: {
  job: Job;
  onNavigate: (page: string) => void;
  lang: LangCode;
}) {
  const _t = (key: TranslationKey) => translate(lang, key);
  void _t;
  const matchColor =
    job.match_strength === 'strong'
      ? 'text-emerald-600 bg-emerald-50'
      : job.match_strength === 'moderate'
        ? 'text-primary-600 bg-primary-50'
        : 'text-orange-600 bg-orange-50';

  return (
    <div
      className="p-4 rounded-xl border border-navy-200/60 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer"
      onClick={() => onNavigate('job-matches')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary-600">
              {job.company.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy-800 truncate">{job.title}</p>
            <p className="text-xs text-navy-500">{job.company}</p>
            <p className="text-xs text-navy-400 flex items-center gap-1 mt-0.5">
              <MapPin size={11} /> {job.location}
            </p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-sm font-bold flex-shrink-0 ${matchColor}`}>
          {job.match_score}%
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {job.matched_skills.slice(0, 4).map((s) => (
          <SkillPill key={s} variant="matched">
            <CheckCircle2 size={11} className="mr-0.5" />
            {s}
          </SkillPill>
        ))}
        {job.missing_skills.slice(0, 2).map((s) => (
          <SkillPill key={s} variant="missing">
            <AlertCircle size={11} className="mr-0.5" />
            {s}
          </SkillPill>
        ))}
      </div>
    </div>
  );
}
