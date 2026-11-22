import { useState } from 'react';
import { Bell, Palette, Globe, Shield, Save, Sun, Moon, Check } from 'lucide-react';
import { Card, SectionHeader, Button } from '@/components/ui';
import { useTheme, type Theme } from '@/lib/useTheme';
import { LANGUAGES, t as translate, type LangCode, type TranslationKey } from '@/lib/i18n';

type SettingsProps = {
  lang: LangCode;
  onLanguageChange: (lang: LangCode) => void;
};

export function Settings({ lang, onLanguageChange }: SettingsProps) {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    jobMatches: true,
    skillGaps: true,
    weeklyReport: false,
    productUpdates: true,
  });
  const [saved, setSaved] = useState(false);

  const t = (key: TranslationKey) => translate(lang, key);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const themeOptions: { value: Theme; labelKey: TranslationKey; icon: React.ReactNode }[] = [
    { value: 'light', labelKey: 'settings.light', icon: <Sun size={16} /> },
    { value: 'dark', labelKey: 'settings.dark', icon: <Moon size={16} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-800 dark:text-navy-100">{t('settings.title')}</h1>
        <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Notifications */}
      <Card>
        <SectionHeader title={t('settings.notifications')} subtitle={t('settings.notificationsSub')} />
        <div className="space-y-3">
          <ToggleRow
            icon={<Bell size={16} />}
            label={t('settings.jobMatches')}
            description={t('settings.jobMatchesDesc')}
            checked={notifications.jobMatches}
            onChange={(v) => setNotifications({ ...notifications, jobMatches: v })}
          />
          <ToggleRow
            icon={<Bell size={16} />}
            label={t('settings.skillGaps')}
            description={t('settings.skillGapsDesc')}
            checked={notifications.skillGaps}
            onChange={(v) => setNotifications({ ...notifications, skillGaps: v })}
          />
          <ToggleRow
            icon={<Bell size={16} />}
            label={t('settings.weeklyReport')}
            description={t('settings.weeklyReportDesc')}
            checked={notifications.weeklyReport}
            onChange={(v) => setNotifications({ ...notifications, weeklyReport: v })}
          />
          <ToggleRow
            icon={<Bell size={16} />}
            label={t('settings.productUpdates')}
            description={t('settings.productUpdatesDesc')}
            checked={notifications.productUpdates}
            onChange={(v) => setNotifications({ ...notifications, productUpdates: v })}
          />
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <SectionHeader title={t('settings.appearance')} subtitle={t('settings.appearanceSub')} />
        <div className="flex gap-3">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all ${
                theme === opt.value
                  ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-navy-200 dark:border-navy-700 text-navy-600 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-700'
              }`}
            >
              {opt.icon}
              <span className="font-medium">{t(opt.labelKey)}</span>
              {theme === opt.value && (
                <span className="w-2 h-2 rounded-full bg-primary-500" />
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-navy-400 mt-3">
          {t('settings.currentTheme')}: <span className="font-medium text-navy-600 dark:text-navy-300">{theme === 'light' ? t('settings.light') : t('settings.dark')}</span>
        </p>
      </Card>

      {/* Privacy & Language */}
      <Card>
        <SectionHeader title={t('settings.privacy')} subtitle={t('settings.privacySub')} />
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-navy-50 dark:bg-navy-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-navy-800 flex items-center justify-center text-navy-500 dark:text-navy-400">
                <Shield size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-navy-700 dark:text-navy-200">{t('settings.profileVisibility')}</p>
                <p className="text-xs text-navy-400">{t('settings.profileVisibilityDesc')}</p>
              </div>
            </div>
            <select className="px-3 py-1.5 rounded-lg bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 text-sm text-navy-700 dark:text-navy-200 focus:outline-none focus:border-primary-300">
              <option>{t('settings.private')}</option>
              <option>{t('settings.recruitersOnly')}</option>
              <option>{t('settings.public')}</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-navy-50 dark:bg-navy-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-navy-800 flex items-center justify-center text-navy-500 dark:text-navy-400">
                <Globe size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-navy-700 dark:text-navy-200">{t('settings.language')}</p>
                <p className="text-xs text-navy-400">{t('settings.languageDesc')}</p>
              </div>
            </div>
            <select
              value={lang}
              onChange={(e) => onLanguageChange(e.target.value as LangCode)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 text-sm text-navy-700 dark:text-navy-200 focus:outline-none focus:border-primary-300 min-w-[140px]"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="flex justify-end items-center gap-3">
        {saved && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> {t('common.saved')}
          </span>
        )}
        <Button onClick={handleSave}>
          <Save size={16} />
          {t('common.saveChanges')}
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-navy-50 dark:bg-navy-900">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white dark:bg-navy-800 flex items-center justify-center text-navy-500 dark:text-navy-400">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-navy-700 dark:text-navy-200">{label}</p>
          <p className="text-xs text-navy-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary-500' : 'bg-navy-300 dark:bg-navy-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}
