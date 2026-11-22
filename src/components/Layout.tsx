import { useState, useRef, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  FileText,
  Target,
  Briefcase,
  TrendingDown,
  GraduationCap,
  GitCompare,
  User,
  Pencil,
  Settings as SettingsIcon,
  Search,
  Upload,
  Bell,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import type { CV, PageKey, Profile } from '@/lib/types';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Avatar } from '@/components/ui';
import { useTheme } from '@/lib/useTheme';
import { t as translate, type LangCode, type TranslationKey } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

function CvLogo({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/WhatsApp_Image_2026-09-01_at_3.51.09_PM.jpeg"
      alt="CVision logo"
      width={size}
      height={size}
      className="rounded-lg object-cover"
    />
  );
}

type LayoutProps = {
  children: React.ReactNode;
  currentPage: PageKey;
  onNavigate: (page: PageKey, options?: { editProfile?: boolean }) => void;
  profile: Profile | null;
  cvs?: CV[];
  onUploadCV: () => void;
  lang: LangCode;
  user: SupabaseUser | null;
};

const NAV_KEYS: { key: PageKey; labelKey: TranslationKey; icon: React.ReactNode }[] = [
  { key: 'dashboard', labelKey: 'nav.dashboard', icon: <LayoutDashboard size={18} /> },
  { key: 'my-cv', labelKey: 'nav.myCv', icon: <FileText size={18} /> },
  { key: 'job-matches', labelKey: 'nav.jobMatches', icon: <Target size={18} /> },
  { key: 'all-jobs', labelKey: 'nav.allJobs', icon: <Briefcase size={18} /> },
  { key: 'skill-gap', labelKey: 'nav.skillGap', icon: <TrendingDown size={18} /> },
  { key: 'learning', labelKey: 'nav.learning', icon: <GraduationCap size={18} /> },
  { key: 'compare-jd', labelKey: 'nav.compareJd', icon: <GitCompare size={18} /> },
  { key: 'profile', labelKey: 'nav.profile', icon: <User size={18} /> },
  { key: 'settings', labelKey: 'nav.settings', icon: <SettingsIcon size={18} /> },
];

export function Layout({
  children,
  currentPage,
  onNavigate,
  profile,
  cvs = [],
  onUploadCV,
  lang,
  user,
}: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const t = useCallback((key: TranslationKey) => translate(lang, key), [lang]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (page: PageKey, options?: { editProfile?: boolean }) => {
    onNavigate(page, options);
    setMobileOpen(false);
    setProfileOpen(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setLoggingOut(false);
      setProfileOpen(false);
    }
  };

  const displayName =
    profile?.name ||
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name ||
    user?.email?.split('@')[0] ||
    'Student';
  const displayEmail = user?.email || profile?.email || '—';

  const latestCv = cvs[0] ?? null;
  const realNotifications = latestCv
    ? [
        {
          id: 'cv-analyzed',
          title: `CV analyzed: ${latestCv.filename}`,
          detail: `Score ${latestCv.score}/100 · ${latestCv.parsed_skills.length} skills detected`,
          page: 'my-cv' as PageKey,
        },
        {
          id: 'job-matches',
          title: t('settings.jobMatches'),
          detail: 'View roles matched to your latest CV skills',
          page: 'job-matches' as PageKey,
        },
      ]
    : [
        {
          id: 'upload-first',
          title: 'Upload your first CV',
          detail: 'Unlock personalized job matching and skill gap insights',
          page: 'my-cv' as PageKey,
        },
      ];

  const unreadCount = notificationsRead ? 0 : realNotifications.length;

  return (
    <div className="min-h-screen bg-[#f6f5fb] dark:bg-navy-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/80 dark:bg-navy-800/80 backdrop-blur-md border-b border-navy-200/60 dark:border-navy-700">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left: Logo + mobile menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-700 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} className="text-navy-700 dark:text-navy-200" />
            </button>
            <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => handleNavigate('dashboard')}>
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md ring-1 ring-navy-200/60 dark:ring-navy-700 transition-all duration-300 group-hover:shadow-lg group-hover:ring-primary-300 group-hover:scale-105">
                <CvLogo size={40} />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/10 group-hover:to-transparent transition-all duration-300" />
              </div>
              <span className="text-lg font-bold hidden sm:block tracking-tight">
                <span className="text-[#e13a35]">CV</span><span className="text-navy-800 dark:text-white">ision</span>
              </span>
            </div>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
              <input
                type="text"
                placeholder={t('common.searchPlaceholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNavigate('all-jobs');
                }}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-navy-50 dark:bg-navy-900 border border-navy-200 dark:border-navy-700 text-sm text-navy-700 dark:text-navy-200 placeholder:text-navy-400 focus:outline-none focus:border-primary-300 focus:bg-white dark:focus:bg-navy-800 transition-all"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-navy-100 dark:hover:bg-navy-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon size={18} className="text-navy-600" />
              ) : (
                <Sun size={18} className="text-amber-400" />
              )}
            </button>

            {/* Upload CV */}
            <button
              onClick={onUploadCV}
              className="btn-primary text-xs lg:text-sm"
            >
              <Upload size={15} />
              <span className="hidden sm:inline">{t('common.uploadCv')}</span>
            </button>

            {/* Notifications dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2.5 rounded-xl hover:bg-navy-100 dark:hover:bg-navy-700 transition-colors"
                aria-label="Notifications"
              >
                <Bell size={18} className="text-navy-600 dark:text-navy-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-navy-800 rounded-2xl shadow-xl border border-navy-200 dark:border-navy-700 overflow-hidden animate-fade-in z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-navy-100 dark:border-navy-700">
                    <p className="text-sm font-semibold text-navy-800 dark:text-navy-100">{t('common.notifications')}</p>
                    <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">{unreadCount} {t('common.new')}</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {realNotifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          handleNavigate(item.page);
                        }}
                        className={`w-full text-left flex gap-3 px-4 py-3 border-b border-navy-50 dark:border-navy-700/50 hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors cursor-pointer ${
                          notificationsRead ? '' : 'bg-primary-50/30 dark:bg-primary-900/10'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            notificationsRead ? 'bg-navy-300' : 'bg-primary-500'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy-800 dark:text-navy-100 truncate">{item.title}</p>
                          <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5">{item.detail}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationsRead(true)}
                    className="w-full py-2.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors"
                  >
                    {t('common.markAllRead')}
                  </button>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2.5 pl-2 lg:pl-3 lg:border-l lg:border-navy-200 dark:lg:border-navy-700 hover:bg-navy-50 dark:hover:bg-navy-700/50 rounded-xl p-1 transition-colors"
                aria-label="User menu"
                aria-expanded={profileOpen}
              >
                <Avatar name={displayName} size="sm" src={profile?.avatar_url} />
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-navy-800 dark:text-navy-100 leading-tight max-w-[140px] truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-navy-500 dark:text-navy-400 max-w-[140px] truncate">
                    {profile?.title || displayEmail}
                  </p>
                </div>
                <ChevronDown size={14} className="hidden lg:block text-navy-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-navy-800 rounded-2xl shadow-xl border border-navy-200 dark:border-navy-700 overflow-hidden animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-navy-100 dark:border-navy-700">
                    <div className="flex items-center gap-3">
                      <Avatar name={displayName} size="md" src={profile?.avatar_url} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-800 dark:text-navy-100 truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-navy-500 dark:text-navy-400 truncate">
                          {displayEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1.5">
                    {/* 1. Personal Details */}
                    <button
                      type="button"
                      onClick={() => handleNavigate('profile', { editProfile: false })}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 dark:text-navy-200 hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors"
                    >
                      <User size={16} /> Personal Details
                    </button>

                    {/* 2. Edit Profile */}
                    <button
                      type="button"
                      onClick={() => handleNavigate('profile', { editProfile: true })}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 dark:text-navy-200 hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors"
                    >
                      <Pencil size={16} /> {t('profile.editProfile')}
                    </button>

                    {/* 3. Account Settings */}
                    <button
                      type="button"
                      onClick={() => handleNavigate('settings')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 dark:text-navy-200 hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors"
                    >
                      <SettingsIcon size={16} /> Account Settings
                    </button>

                    {/* 4. Other profile options */}
                    <button
                      type="button"
                      onClick={() => handleNavigate('my-cv')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 dark:text-navy-200 hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors"
                    >
                      <FileText size={16} /> {t('nav.myCv')} ({cvs.length})
                    </button>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 dark:text-navy-200 hover:bg-primary-50 dark:hover:bg-navy-700 transition-colors"
                    >
                      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                      {theme === 'light' ? t('common.darkMode') : t('common.lightMode')}
                    </button>

                    {/* 5. Divider & 6. LOGOUT at the VERY BOTTOM */}
                    {user && (
                      <>
                        <div className="border-t border-navy-100 dark:border-navy-700 my-1.5" />
                        <button
                          type="button"
                          onClick={handleLogout}
                          disabled={loggingOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        >
                          <LogOut size={16} />
                          {loggingOut ? 'Logging out...' : 'Logout'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar — Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-60 flex-col py-4 px-3 border-r border-navy-200/60 dark:border-navy-700 bg-white/60 dark:bg-navy-800/60 backdrop-blur-sm">
        <nav className="flex flex-col gap-1">
          {NAV_KEYS.map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavigate(item.key)}
              className={`sidebar-item ${currentPage === item.key ? 'sidebar-item-active' : ''}`}
            >
              {item.icon}
              {t(item.labelKey)}
            </button>
          ))}
        </nav>
      </aside>

      {/* Sidebar — Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-white dark:bg-navy-800 shadow-2xl flex flex-col animate-slide-up">
            <div className="flex items-center justify-between h-16 px-4 border-b border-navy-200 dark:border-navy-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-navy-200/60 dark:ring-navy-700">
                  <CvLogo size={32} />
                </div>
                <span className="text-base font-bold tracking-tight">
                  <span className="text-primary-600">CV</span><span className="text-navy-800 dark:text-white">ision</span>
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-700"
                aria-label="Close menu"
              >
                <X size={18} className="text-navy-600 dark:text-navy-300" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3 overflow-y-auto">
              {NAV_KEYS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNavigate(item.key)}
                  className={`sidebar-item ${currentPage === item.key ? 'sidebar-item-active' : ''}`}
                >
                  {item.icon}
                  {t(item.labelKey)}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="lg:ml-60 mt-16 min-h-[calc(100vh-4rem)]">
        <div className="max-w-[1400px] mx-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
