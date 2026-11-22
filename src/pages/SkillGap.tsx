import { useEffect, useState } from 'react';
import { TrendingDown, ArrowRight, GraduationCap } from 'lucide-react';
import type { CV, SkillGap } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { runFullAnalysis, type AnalysisResult } from '@/lib/analysis';
import { Card, SectionHeader, Badge, ProgressBar, Button, LoadingState, EmptyState } from '@/components/ui';
import type { LangCode } from '@/lib/i18n';

type SkillGapPageProps = {
  cv: CV | null;
  onNavigate: (page: string) => void;
  lang?: LangCode;
};

export function SkillGapPage({ cv, onNavigate }: SkillGapPageProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <LoadingState message="Analyzing skill gaps..." />;

  const gaps = analysis?.skillGaps || [];

  const sortedGaps = [...gaps].sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };
    return (order[a.priority] || 4) - (order[b.priority] || 4);
  });

  const skillsToLearn = sortedGaps.filter((g) => g.priority !== 'none');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Skill Gap Analysis</h1>
        <p className="text-sm text-navy-500 mt-1">Your current skill levels vs. target proficiency</p>
      </div>

      {/* Skill levels */}
      <Card>
        <SectionHeader title="Your Skill Levels" subtitle="Proficiency across detected and target skills" />
        {gaps.length === 0 ? (
          <EmptyState
            icon={<TrendingDown size={28} />}
            title="No skill data yet"
            message="Upload a CV to see your skill levels and gaps."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {sortedGaps.map((gap) => (
              <div key={gap.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-navy-700">{gap.skill_name}</span>
                    {gap.priority !== 'none' && (
                      <Badge
                        variant={gap.priority === 'high' ? 'error' : gap.priority === 'medium' ? 'warning' : 'neutral'}
                        size="sm"
                      >
                        {gap.priority}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm font-bold text-navy-800">{gap.current_level}%</span>
                </div>
                <div className="h-2.5 w-full bg-navy-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out ${
                      gap.current_level >= 80
                        ? 'from-emerald-400 to-emerald-500'
                        : gap.current_level >= 50
                        ? 'from-primary-400 to-indigo-500'
                        : gap.current_level >= 25
                        ? 'from-amber-400 to-orange-400'
                        : 'from-orange-400 to-red-400'
                    }`}
                    style={{ width: `${gap.current_level}%` }}
                  />
                </div>
                <p className="text-xs text-navy-400 mt-1">{gap.category}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Top Skills to Learn */}
      <Card>
        <SectionHeader
          title="Top Skills to Learn"
          subtitle="Prioritized recommendations based on job market demand"
          action={
            <Button variant="ghost" onClick={() => onNavigate('learning')}>
              View Resources <ArrowRight size={14} />
            </Button>
          }
        />
        {skillsToLearn.length === 0 ? (
          <p className="text-sm text-navy-500 text-center py-6">No skill gaps detected. You're all caught up!</p>
        ) : (
          <div className="space-y-2">
            {skillsToLearn.map((gap) => (
              <div
                key={gap.id}
                className="flex items-center justify-between p-3 rounded-xl bg-navy-50 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    gap.priority === 'high' ? 'bg-red-100' : gap.priority === 'medium' ? 'bg-amber-100' : 'bg-navy-100'
                  }`}>
                    <GraduationCap size={16} className={
                      gap.priority === 'high' ? 'text-red-600' : gap.priority === 'medium' ? 'text-amber-600' : 'text-navy-500'
                    } />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-700">{gap.skill_name}</p>
                    <p className="text-xs text-navy-400">Current: {gap.current_level}% → Target: {gap.target_level}%</p>
                  </div>
                </div>
                <Badge
                  variant={gap.priority === 'high' ? 'error' : gap.priority === 'medium' ? 'warning' : 'neutral'}
                  size="md"
                >
                  {gap.priority.toUpperCase()} PRIORITY
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
