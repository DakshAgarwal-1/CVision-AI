import { useState } from 'react';
import { GitCompare, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import type { CV } from '@/lib/types';
import { compareJobDescription } from '@/lib/analysis';
import { Card, SectionHeader, Button, Badge, SkillPill, ProgressBar } from '@/components/ui';
import type { LangCode } from '@/lib/i18n';

type CompareJDProps = {
  cv: CV | null;
  lang?: LangCode;
};

export function CompareJD({ cv }: CompareJDProps) {
  const [jdText, setJdText] = useState('');
  const [result, setResult] = useState<{
    matchedSkills: string[];
    missingSkills: string[];
    matchScore: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!jdText.trim() || !cv) return;
    setLoading(true);
    try {
      const res = await compareJobDescription(jdText, cv.parsed_skills || []);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Compare Job Description</h1>
        <p className="text-sm text-navy-500 mt-1">Paste a job description to see how your skills match up</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card>
          <SectionHeader title="Job Description" subtitle="Paste the full job description text" />
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste job description here..."
            className="w-full h-64 p-4 rounded-xl bg-navy-50 border border-navy-200 text-sm text-navy-700 placeholder:text-navy-400 focus:outline-none focus:border-primary-300 focus:bg-white transition-all resize-none"
          />
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-navy-400">{jdText.length} characters</p>
            <Button onClick={handleCompare} disabled={!jdText.trim() || loading || !cv}>
              <GitCompare size={16} />
              {loading ? 'Analyzing...' : 'Compare'}
            </Button>
          </div>
          {!cv && (
            <p className="text-xs text-amber-600 mt-2">Upload a CV first to enable comparison.</p>
          )}
        </Card>

        {/* Results */}
        <Card>
          <SectionHeader title="Match Results" subtitle="Your skills vs. job requirements" />
          {!result ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
                <Sparkles size={24} className="text-primary-400" />
              </div>
              <p className="text-sm text-navy-500">
                Results will appear here after you compare.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Score */}
              <div className="text-center py-4">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-2xl font-bold ${
                  result.matchScore >= 80
                    ? 'bg-emerald-100 text-emerald-700'
                    : result.matchScore >= 50
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {result.matchScore}%
                </div>
                <p className="text-sm font-medium text-navy-600 mt-2">Overall Match</p>
              </div>

              <ProgressBar value={result.matchScore} label="Compatibility" />

              {/* Matched skills */}
              {result.matchedSkills.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-navy-700 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    Skills you have ({result.matchedSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedSkills.map((s) => (
                      <SkillPill key={s} variant="matched">{s}</SkillPill>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing skills */}
              {result.missingSkills.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-navy-700 mb-2 flex items-center gap-1.5">
                    <AlertCircle size={16} className="text-red-500" />
                    Skills to develop ({result.missingSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingSkills.map((s) => (
                      <SkillPill key={s} variant="missing">{s}</SkillPill>
                    ))}
                  </div>
                </div>
              )}

              {result.matchedSkills.length === 0 && result.missingSkills.length === 0 && (
                <p className="text-sm text-navy-500 text-center py-4">
                  No recognizable skills found in the job description.
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
