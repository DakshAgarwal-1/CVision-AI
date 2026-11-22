import { useState } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Sun,
  Moon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/useTheme';

type AuthPageProps = {
  onAuthSuccess: () => void;
  initialMode?: Mode;
  onPasswordUpdated?: () => void;
};

type Mode = 'signin' | 'signup' | 'reset' | 'update-password';

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthPage({
  onAuthSuccess,
  initialMode = 'signin',
  onPasswordUpdated,
}: AuthPageProps) {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [info, setInfo] = useState<string | null>(null);

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
    setFieldErrors({});
    setInfo(null);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const validateForm = (): boolean => {
    const nextErrors: FieldErrors = {};
    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    if (mode !== 'update-password') {
      if (!trimmedEmail) {
        nextErrors.email = 'Email address is required.';
      } else if (!EMAIL_REGEX.test(trimmedEmail)) {
        nextErrors.email = 'Please enter a valid email address.';
      }
    }

    if (mode === 'signup') {
      if (!trimmedName) {
        nextErrors.fullName = 'Full name is required.';
      } else if (trimmedName.length < 2) {
        nextErrors.fullName = 'Full name must be at least 2 characters.';
      }

      if (!password) {
        nextErrors.password = 'Password is required.';
      } else if (password.length < 6) {
        nextErrors.password = 'Password must be at least 6 characters.';
      }

      if (!confirmPassword) {
        nextErrors.confirmPassword = 'Please confirm your password.';
      } else if (password !== confirmPassword) {
        nextErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    if (mode === 'signin') {
      if (!password) {
        nextErrors.password = 'Password is required.';
      }
    }

    if (mode === 'update-password') {
      if (!password) {
        nextErrors.password = 'New password is required.';
      } else if (password.length < 6) {
        nextErrors.password = 'New password must be at least 6 characters.';
      }

      if (!confirmPassword) {
        nextErrors.confirmPassword = 'Please confirm your new password.';
      } else if (password !== confirmPassword) {
        nextErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError(Object.values(nextErrors)[0] || 'Please check the highlighted fields.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!validateForm()) return;

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    setBusy(true);

    try {
      if (mode === 'signin') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (authError) throw authError;
        if (!data.session) {
          throw new Error('Unable to start session. Please try again.');
        }
        onAuthSuccess();
      } else if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { full_name: trimmedName },
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        });
        if (authError) throw authError;

        // Supabase returns empty identities when email already exists and confirmation is enabled
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setError('This email already has an account. Please sign in instead.');
          setBusy(false);
          return;
        }

        if (data.user && data.session) {
          const { data: existingProfile } = await supabase
            .from('profile')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle();

          if (!existingProfile) {
            await supabase.from('profile').insert({
              user_id: data.user.id,
              name: trimmedName,
              title: '',
              cv_score: 0,
              email: trimmedEmail,
            });
          }
          onAuthSuccess();
        } else if (data.user && !data.session) {
          setInfo(
            'Account created successfully! Please check your email and click the confirmation link before signing in.'
          );
          setMode('signin');
          setPassword('');
          setConfirmPassword('');
          setFieldErrors({});
        }
      } else if (mode === 'reset') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        });
        if (resetError) throw resetError;
        setInfo('Password reset link sent! Check your email inbox to set a new password.');
      } else if (mode === 'update-password') {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setInfo('Password updated successfully! Redirecting to your dashboard...');
        onPasswordUpdated?.();
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Something went wrong. Please try again.';
      if (message.includes('already registered') || message.includes('User already registered')) {
        setError('This email already has an account. Try signing in instead.');
      } else if (message.includes('Invalid login')) {
        setError('Wrong email or password. Please check your credentials and try again.');
      } else if (message.includes('at least 6')) {
        setError('Password must be at least 6 characters.');
      } else if (message.includes('Email not confirmed')) {
        setError('Please confirm your email address before signing in.');
      } else if (message.includes('rate limit') || message.includes('Too many requests')) {
        setError('Too many attempts. Please wait a moment and try again.');
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f5fb] bg-gradient-to-br from-[#eff6ff] via-[#f5f3ff] to-[#e0e7ff] dark:bg-[#0f172a] dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#0f172a] px-4 py-8 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-primary-300/25 dark:bg-primary-600/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-80 bg-indigo-300/25 dark:bg-indigo-600/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-colors"
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber-400" />}
      </button>

      <div className="relative w-full max-w-md">
        {/* C-Vision Branding Header */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg ring-2 ring-white dark:ring-slate-700 bg-white mb-4">
            <img
              src="/WhatsApp_Image_2026-09-01_at_3.51.09_PM.jpeg"
              alt="CVision logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-[#e13a35]">CV</span>
            <span className="text-slate-900 dark:text-white">ision</span>
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            AI-powered career &amp; job portal
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700 p-6 sm:p-8 text-slate-900 dark:text-slate-100">
          {/* Mode tabs */}
          {(mode === 'signin' || mode === 'signup') && (
            <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700 mb-6">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2.5 text-sm rounded-lg font-semibold transition-all ${
                    mode === m
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {m === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          )}

          {mode === 'reset' && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reset Password</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Enter your registered email and we&apos;ll send a reset link.
              </p>
            </div>
          )}

          {mode === 'update-password' && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Set New Password</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Choose a strong new password for your account.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="auth-fullname"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block"
                >
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400"
                  />
                  <input
                    id="auth-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: undefined }));
                    }}
                    placeholder="Enter your full name"
                    className={`w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 dark:bg-slate-900 border text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all ${
                      fieldErrors.fullName
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-primary-500'
                    }`}
                    autoComplete="name"
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.fullName}</p>
                )}
              </div>
            )}

            {mode !== 'update-password' && (
              <div>
                <label
                  htmlFor="auth-email"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400"
                  />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                    }}
                    placeholder="student@university.edu"
                    className={`w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 dark:bg-slate-900 border text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all ${
                      fieldErrors.email
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-primary-500'
                    }`}
                    autoComplete="email"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.email}</p>
                )}
              </div>
            )}

            {mode !== 'reset' && (
              <div>
                <label
                  htmlFor="auth-password"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block"
                >
                  {mode === 'update-password' ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400"
                  />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                    }}
                    placeholder="At least 6 characters"
                    className={`w-full h-11 pl-11 pr-11 rounded-xl bg-slate-50 dark:bg-slate-900 border text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all ${
                      fieldErrors.password
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-primary-500'
                    }`}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.password}</p>
                )}
              </div>
            )}

            {(mode === 'signup' || mode === 'update-password') && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400"
                  />
                  <input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                      }
                    }}
                    placeholder="Re-enter your password"
                    className={`w-full h-11 pl-11 pr-11 rounded-xl bg-slate-50 dark:bg-slate-900 border text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all ${
                      fieldErrors.confirmPassword ||
                      (confirmPassword.length > 0 && password !== confirmPassword)
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-primary-500'
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword ? (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">Passwords do not match.</p>
                ) : (
                  fieldErrors.confirmPassword && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {fieldErrors.confirmPassword}
                    </p>
                  )
                )}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {info && (
              <div
                role="status"
                className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm"
              >
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span>{info}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-xl bg-[#2563eb] bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:from-[#1d4ed8] hover:to-[#6d28d9] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {busy ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {mode === 'signin'
                    ? 'Sign In'
                    : mode === 'signup'
                      ? 'Create Account'
                      : mode === 'reset'
                        ? 'Send Reset Link'
                        : 'Update Password'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-5 text-center space-y-2">
            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
              >
                Forgot password?
              </button>
            )}
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
