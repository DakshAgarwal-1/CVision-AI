import { useEffect, useState, useCallback } from 'react';
import { FileText, Upload, Trash2, CheckCircle2, Clock, FileCheck } from 'lucide-react';
import type { CV } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { parseCvFile, analyzeCv } from '@/lib/cv-parser';
import { Card, Button, Badge, SkillPill, EmptyState, LoadingState } from '@/components/ui';
import { t as translate, type LangCode, type TranslationKey } from '@/lib/i18n';

type MyCVProps = {
  cv: CV | null;
  onCVUpdated: () => void;
  onUploadCV: () => void;
  lang: LangCode;
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}

export function MyCV({ onCVUpdated, onUploadCV, lang }: MyCVProps) {
  const { user } = useAuth();
  const [allCVs, setAllCVs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const t = useCallback((key: TranslationKey) => translate(lang, key), [lang]);

  const fetchCVs = useCallback(async () => {
    if (!user?.id) {
      setAllCVs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });
    if (fetchError) {
      console.error('CV list fetch failed:', fetchError);
      setError(`Could not load CVs: ${getErrorMessage(fetchError, t('mycv.failedUpload'))}`);
    }
    setAllCVs((data || []) as CV[]);
    setLoading(false);
  }, [user?.id, t]);

  useEffect(() => {
    fetchCVs();
  }, [fetchCVs]);

  const handleFileUpload = async (file: File) => {
    if (!user?.id) {
      setError('Please sign in to upload a CV.');
      return;
    }
    setUploading(true);
    setError(null);
    setUploadProgress(t('mycv.readingFile'));

    try {
      const rawText = await parseCvFile(file);
      setUploadProgress(t('mycv.analyzingContent'));

      const analysis = analyzeCv(rawText);

      setUploadProgress(t('mycv.savingDb'));
      const { error: insertError } = await supabase
        .from('cvs')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_size: file.size,
          raw_text: rawText,
          parsed_skills: analysis.skills,
          experience_years: analysis.experienceYears,
          education: analysis.education,
          score: analysis.score,
          status: 'analyzed',
          candidate_name: analysis.candidateName,
        })
        .select()
        .maybeSingle();

      if (insertError) throw insertError;

      // Sync latest cv_score onto student profile
      await supabase
        .from('profile')
        .update({ cv_score: analysis.score, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      setUploadProgress('');
      await fetchCVs();
      onCVUpdated();
    } catch (err) {
      console.error('CV upload failed:', err);
      setError(getErrorMessage(err, t('mycv.failedUpload')));
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) return;
    await supabase.from('cvs').delete().eq('id', id).eq('user_id', user.id);
    const { data: remaining } = await supabase
      .from('cvs')
      .select('score')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextScore = (remaining as { score?: number } | null)?.score ?? 0;
    await supabase
      .from('profile')
      .update({ cv_score: nextScore, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    await fetchCVs();
    onCVUpdated();
  };

  if (loading) {
    return <LoadingState message={t('mycv.loadingCvs')} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">{t('mycv.title')}</h1>
        <p className="text-sm text-navy-500 mt-1">{t('mycv.subtitle')}</p>
      </div>

      {/* Upload zone */}
      <Card>
        <div
          className="border-2 border-dashed border-navy-200 rounded-2xl p-8 text-center hover:border-primary-300 transition-colors cursor-pointer"
          onClick={() => document.getElementById('cv-file-input')?.click()}
        >
          <input
            id="cv-file-input"
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = '';
            }}
          />
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-3" style={{ borderWidth: '3px' }} />
              <p className="text-sm text-navy-600">{uploadProgress || t('mycv.processing')}</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <Upload size={24} className="text-primary-500" />
              </div>
              <p className="text-base font-semibold text-navy-700">
                {t('mycv.dropHere')}
              </p>
              <p className="text-sm text-navy-500 mt-1">{t('mycv.supports')}</p>
            </>
          )}
        </div>
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-left">
            <p className="text-sm text-red-600 break-words">{error}</p>
          </div>
        )}
      </Card>

      {/* CV List */}
      {allCVs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText size={28} />}
            title={t('mycv.noCvs')}
            message={t('mycv.noCvsMsg')}
            action={<Button onClick={onUploadCV}><Upload size={16} /> {t('common.uploadCv')}</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allCVs.map((cvItem) => (
            <Card key={cvItem.id} hover>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <FileCheck size={20} className="text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-800 truncate max-w-[200px]">
                      {cvItem.candidate_name || cvItem.filename}
                    </p>
                    <p className="text-xs text-navy-500 mt-0.5">
                      {cvItem.candidate_name ? `${cvItem.filename} · ` : ''}
                      {(cvItem.file_size / 1024).toFixed(0)} KB · {new Date(cvItem.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(cvItem.id)}
                  aria-label="Delete CV"
                  className="p-2 rounded-lg text-navy-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Badge variant={cvItem.status === 'analyzed' ? 'success' : 'warning'}>
                  {cvItem.status === 'analyzed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  {cvItem.status}
                </Badge>
                <Badge variant="primary">Score: {cvItem.score}/100</Badge>
                {cvItem.experience_years > 0 && (
                  <Badge variant="neutral">{cvItem.experience_years}y exp</Badge>
                )}
              </div>

              {cvItem.parsed_skills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-navy-500 mb-2">{t('mycv.detectedSkills')} ({cvItem.parsed_skills.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cvItem.parsed_skills.slice(0, 8).map((s) => (
                      <SkillPill key={s}>{s}</SkillPill>
                    ))}
                    {cvItem.parsed_skills.length > 8 && (
                      <span className="text-xs text-navy-400 py-1">
                        +{cvItem.parsed_skills.length - 8} {t('common.more')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {cvItem.education && (
                <div className="mt-3 pt-3 border-t border-navy-100">
                  <p className="text-xs text-navy-500">{cvItem.education}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
