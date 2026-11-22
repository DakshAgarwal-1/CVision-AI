import { useEffect, useState, useCallback, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { MyCV } from '@/pages/MyCV';
import { JobMatches } from '@/pages/JobMatches';
import { AllJobs } from '@/pages/AllJobs';
import { SkillGapPage } from '@/pages/SkillGap';
import { Learning } from '@/pages/Learning';
import { CompareJD } from '@/pages/CompareJD';
import { ProfilePage } from '@/pages/Profile';
import { Settings } from '@/pages/Settings';
import { AuthPage } from '@/pages/Auth';
import { LoadingState } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useLanguage } from '@/lib/useLanguage';
import { t as translate } from '@/lib/i18n';
import type { Profile, CV, PageKey } from '@/lib/types';

function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [openProfileInEditMode, setOpenProfileInEditMode] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const loadedUserIdRef = useRef<string | null>(null);

  const {
    session,
    user,
    loading: authLoading,
    isPasswordRecovery,
    clearPasswordRecovery,
  } = useAuth();
  const { lang, changeLanguage } = useLanguage();

  const t = useCallback((key: Parameters<typeof translate>[1]) => translate(lang, key), [lang]);

  const fetchData = useCallback(async (userIdOverride?: string) => {
    const targetUserId = userIdOverride || user?.id;
    if (!targetUserId) {
      setProfile(null);
      setCvs([]);
      setDataLoading(false);
      return;
    }

    const [{ data: profileData, error: profileErr }, { data: cvRows, error: cvErr }] =
      await Promise.all([
        supabase.from('profile').select('*').eq('user_id', targetUserId).maybeSingle(),
        supabase
          .from('cvs')
          .select('*')
          .eq('user_id', targetUserId)
          .order('uploaded_at', { ascending: false }),
      ]);

    if (profileErr) {
      console.error('Profile fetch error:', profileErr);
    }
    if (cvErr) {
      console.error('CV fetch error:', cvErr);
    }

    const typedCvs = ((cvRows as CV[] | null) ?? []);
    const latestCvScore = typedCvs[0]?.score ?? 0;

    if (!profileData && user) {
      const fullName =
        (user.user_metadata as { full_name?: string } | null)?.full_name ||
        user.email?.split('@')[0] ||
        'Student';
      const email = user.email || '';
      const { data: newProfile } = await supabase
        .from('profile')
        .insert({
          user_id: user.id,
          name: fullName,
          title: '',
          cv_score: latestCvScore,
          email,
        })
        .select()
        .maybeSingle();
      setProfile((newProfile as Profile | null) ?? null);
    } else {
      setProfile((profileData as Profile | null) ?? null);
    }

    setCvs(typedCvs);
    setDataLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    if (session && user) {
      if (loadedUserIdRef.current !== user.id) {
        loadedUserIdRef.current = user.id;
        setDataLoading(true);
        fetchData(user.id);
      }
    } else {
      loadedUserIdRef.current = null;
      setProfile(null);
      setCvs([]);
      setDataLoading(false);
      setCurrentPage('dashboard');
      setOpenProfileInEditMode(false);
    }
  }, [session, user, authLoading, fetchData]);

  const handleNavigate = (page: string, options?: { editProfile?: boolean }) => {
    if (page === 'profile') {
      setOpenProfileInEditMode(Boolean(options?.editProfile));
    } else {
      setOpenProfileInEditMode(false);
    }
    setCurrentPage(page as PageKey);
    window.scrollTo(0, 0);
  };

  const handleUploadCV = () => {
    setOpenProfileInEditMode(false);
    setCurrentPage('my-cv');
    window.scrollTo(0, 0);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f6f5fb] flex items-center justify-center">
        <LoadingState message={t('common.loading')} />
      </div>
    );
  }

  if (isPasswordRecovery) {
    return (
      <AuthPage
        initialMode="update-password"
        onAuthSuccess={() => {}}
        onPasswordUpdated={() => {
          clearPasswordRecovery();
        }}
      />
    );
  }

  if (!session || !user) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-[#f6f5fb] flex items-center justify-center">
        <LoadingState message={t('common.loading')} />
      </div>
    );
  }

  const latestCv = cvs[0] ?? null;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            profile={profile}
            cv={latestCv}
            cvs={cvs}
            userEmail={user.email || ''}
            onNavigate={handleNavigate}
            onReanalyze={() => fetchData(user.id)}
            lang={lang}
          />
        );
      case 'my-cv':
        return (
          <MyCV
            cv={latestCv}
            onCVUpdated={() => fetchData(user.id)}
            onUploadCV={handleUploadCV}
            lang={lang}
          />
        );
      case 'job-matches':
        return <JobMatches cv={latestCv} onNavigate={handleNavigate} lang={lang} />;
      case 'all-jobs':
        return <AllJobs lang={lang} />;
      case 'skill-gap':
        return <SkillGapPage cv={latestCv} onNavigate={handleNavigate} lang={lang} />;
      case 'learning':
        return <Learning cv={latestCv} lang={lang} />;
      case 'compare-jd':
        return <CompareJD cv={latestCv} lang={lang} />;
      case 'profile':
        return (
          <ProfilePage
            profile={profile}
            onProfileUpdated={() => fetchData(user.id)}
            onNavigate={handleNavigate}
            initialEditing={openProfileInEditMode}
            lang={lang}
          />
        );
      case 'settings':
        return <Settings lang={lang} onLanguageChange={changeLanguage} />;
      default:
        return (
          <Dashboard
            profile={profile}
            cv={latestCv}
            cvs={cvs}
            userEmail={user.email || ''}
            onNavigate={handleNavigate}
            onReanalyze={() => fetchData(user.id)}
            lang={lang}
          />
        );
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      profile={profile}
      cvs={cvs}
      onUploadCV={handleUploadCV}
      lang={lang}
      user={user}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;
