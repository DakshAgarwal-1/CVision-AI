import { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
  Save,
  LogOut,
  ShieldCheck,
  Settings,
  CheckCircle2,
  AlertCircle,
  Pencil,
  User as UserIcon,
} from 'lucide-react';
import type { Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { Card, SectionHeader, Button, Avatar, Badge } from '@/components/ui';
import { t as translate, type LangCode } from '@/lib/i18n';

type ProfilePageProps = {
  profile: Profile | null;
  onProfileUpdated: () => void;
  onNavigate?: (page: string) => void;
  initialEditing?: boolean;
  lang: LangCode;
};

export function ProfilePage({
  profile,
  onProfileUpdated,
  onNavigate,
  initialEditing = false,
  lang,
}: ProfilePageProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(initialEditing);
  const [form, setForm] = useState({
    name: profile?.name || (user?.user_metadata as { full_name?: string } | undefined)?.full_name || '',
    title: profile?.title || '',
    email: user?.email || profile?.email || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    university: profile?.university || '',
    graduation_year: profile?.graduation_year || new Date().getFullYear() + 1,
    bio: profile?.bio || '',
  });
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setEditing(initialEditing);
  }, [initialEditing]);

  useEffect(() => {
    setForm({
      name: profile?.name || (user?.user_metadata as { full_name?: string } | undefined)?.full_name || '',
      title: profile?.title || '',
      email: user?.email || profile?.email || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      university: profile?.university || '',
      graduation_year: profile?.graduation_year || new Date().getFullYear() + 1,
      bio: profile?.bio || '',
    });
  }, [profile, user]);

  const accountEmail = user?.email || profile?.email || '';
  const displayName =
    profile?.name ||
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name ||
    accountEmail.split('@')[0] ||
    'Student';

  const handleSave = async () => {
    const trimmedName = form.name.trim();
    if (trimmedName.length < 2) {
      setError('Full Name must be at least 2 characters.');
      return;
    }
    if (!user?.id) {
      setError('Your session has expired. Please sign in again.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const now = new Date().toISOString();
      if (profile) {
        const { error: updateError } = await supabase
          .from('profile')
          .update({
            name: trimmedName,
            title: form.title.trim(),
            email: accountEmail || form.email.trim(),
            phone: form.phone.trim() || null,
            location: form.location.trim() || null,
            university: form.university.trim() || null,
            graduation_year: form.graduation_year || null,
            bio: form.bio.trim() || null,
            updated_at: now,
          })
          .eq('id', profile.id)
          .eq('user_id', user.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('profile').insert({
          user_id: user.id,
          name: trimmedName,
          title: form.title.trim(),
          cv_score: 0,
          email: accountEmail || form.email.trim(),
          phone: form.phone.trim() || null,
          location: form.location.trim() || null,
          university: form.university.trim() || null,
          graduation_year: form.graduation_year || null,
          bio: form.bio.trim() || null,
        });
        if (insertError) throw insertError;
      }

      await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });

      await onProfileUpdated();
      setEditing(false);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Failed to save profile.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">{translate(lang, 'profile.title')}</h1>
        <p className="text-sm text-navy-500 mt-1">{translate(lang, 'profile.subtitle')}</p>
      </div>

      {/* 1. Profile Header Card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar name={displayName} size="lg" src={profile?.avatar_url} />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-navy-800 truncate">{displayName}</h2>
            <p className="text-sm text-navy-500 truncate">{profile?.title || accountEmail}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile?.location && (
                <Badge variant="neutral">
                  <MapPin size={11} className="mr-1" /> {profile.location}
                </Badge>
              )}
              {profile?.university && (
                <Badge variant="primary">
                  <GraduationCap size={11} className="mr-1" /> {profile.university}
                </Badge>
              )}
              <Badge variant="success">CV Score: {profile?.cv_score || 0}/100</Badge>
            </div>
          </div>
          {!editing && (
            <Button
              variant="secondary"
              onClick={() => {
                setSuccess(null);
                setError(null);
                setEditing(true);
              }}
            >
              <Pencil size={15} />
              {translate(lang, 'profile.editProfile')}
            </Button>
          )}
        </div>
      </Card>

      {/* 2. Personal Details & Edit Profile */}
      <Card>
        <SectionHeader
          title={translate(lang, 'profile.personalInfo')}
          action={
            editing && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setError(null);
                  }}
                >
                  {translate(lang, 'common.cancel')}
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save size={16} />
                  {saving ? translate(lang, 'profile.saving') : translate(lang, 'common.save')}
                </Button>
              </div>
            )
          }
        />

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={translate(lang, 'profile.fullName')}>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                className="form-input"
              />
            </Field>
            <Field label="Registered Email">
              <input
                value={accountEmail}
                readOnly
                disabled
                className="form-input opacity-75 cursor-not-allowed"
              />
            </Field>
            <Field label={translate(lang, 'profile.titleField')}>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Computer Science Student"
                className="form-input"
              />
            </Field>
            <Field label={translate(lang, 'profile.phone')}>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555 000 0000"
                className="form-input"
              />
            </Field>
            <Field label={translate(lang, 'profile.location')}>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="City, Country"
                className="form-input"
              />
            </Field>
            <Field label={translate(lang, 'profile.university')}>
              <input
                value={form.university}
                onChange={(e) => setForm({ ...form, university: e.target.value })}
                placeholder="Your university or college"
                className="form-input"
              />
            </Field>
            <Field label={translate(lang, 'profile.graduationYear')}>
              <input
                type="number"
                value={form.graduation_year}
                onChange={(e) =>
                  setForm({
                    ...form,
                    graduation_year: parseInt(e.target.value, 10) || new Date().getFullYear() + 1,
                  })
                }
                className="form-input"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label={translate(lang, 'profile.bio')}>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  placeholder="Tell employers about your goals, projects, and interests..."
                  className="form-input resize-none"
                />
              </Field>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow icon={<UserIcon size={16} />} label={translate(lang, 'profile.fullName')} value={displayName} />
            <InfoRow icon={<Mail size={16} />} label="Registered Email" value={accountEmail || '—'} />
            <InfoRow icon={<Phone size={16} />} label={translate(lang, 'profile.phone')} value={profile?.phone || '—'} />
            <InfoRow icon={<MapPin size={16} />} label={translate(lang, 'profile.location')} value={profile?.location || '—'} />
            <InfoRow icon={<GraduationCap size={16} />} label={translate(lang, 'profile.university')} value={profile?.university || '—'} />
            <InfoRow
              icon={<Calendar size={16} />}
              label={translate(lang, 'profile.graduation')}
              value={profile?.graduation_year?.toString() || '—'}
            />
          </div>
        )}

        {profile?.bio && !editing && (
          <div className="mt-4 pt-4 border-t border-navy-100">
            <p className="text-xs font-medium text-navy-500 mb-1">{translate(lang, 'profile.bio')}</p>
            <p className="text-sm text-navy-700">{profile.bio}</p>
          </div>
        )}
      </Card>

      {/* 3. Account Settings & Other Options */}
      {onNavigate && (
        <Card>
          <SectionHeader title="Account Settings" subtitle="Manage appearance, language, and privacy preferences" />
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => onNavigate('settings')}>
              <Settings size={16} />
              Account Settings
            </Button>
            <Button variant="secondary" onClick={() => onNavigate('my-cv')}>
              Manage Uploaded CVs
            </Button>
          </div>
        </Card>
      )}

      {/* 4. Divider & Logout at the VERY BOTTOM */}
      <div className="border-t border-navy-200/70 pt-2">
        <Card>
          <SectionHeader title="Account Session" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy-800">Signed in as {displayName}</p>
              <p className="text-sm text-navy-500 truncate">{accountEmail}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all duration-200 disabled:opacity-50"
            >
              <LogOut size={16} />
              {signingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-navy-500 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-50">
      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-navy-500 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-navy-400">{label}</p>
        <p className="text-sm font-medium text-navy-700 truncate">{value}</p>
      </div>
    </div>
  );
}
