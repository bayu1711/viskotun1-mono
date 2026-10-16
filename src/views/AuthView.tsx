'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import GoogleIcon from '@mui/icons-material/Google';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { COPY } from '../data/copy';
import { ROUTES } from '../data/navigation';
import { Icon } from '../components/ui/Icon';
import { PillButton } from '../components/ui/PillButton';

interface AuthViewProps {
  mode: 'login' | 'signup';
}

export function AuthView({ mode }: AuthViewProps) {
  const [activeMode, setActiveMode] = useState<'login' | 'signup'>(mode);
  const isLogin = activeMode === 'login';
  const router = useRouter();
  const { isAuthenticated, loginWithEmail, loginWithGoogle, signupWithEmail, loginAsGuest, loginAsAdmin } = useAuth();

  useEffect(() => {
    setActiveMode(mode);
  }, [mode]);

  useEffect(() => {
    router.prefetch(ROUTES.routine);
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(ROUTES.routine);
    }
  }, [isAuthenticated, router]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [asAdmin, setAsAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error(COPY.auth.toastValidEmail);
      return;
    }
    if (!password) {
      toast.error(COPY.auth.toastPasswordRequired);
      return;
    }
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await loginWithEmail(email, password, asAdmin);
        toast.success(asAdmin || email.toLowerCase().includes('admin') ? COPY.auth.toastAdminEntered : COPY.auth.toastWelcomeBack);
      } else {
        await signupWithEmail(name, email, password, asAdmin);
        toast.success(asAdmin || email.toLowerCase().includes('admin') ? COPY.auth.toastAdminEntered : COPY.auth.toastAccountCreated);
      }
      router.push(ROUTES.routine);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : COPY.auth.toastAuthFailed;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      toast.success(COPY.auth.toastGoogleSuccess);
      router.push(ROUTES.routine);
    } catch {
      toast.error(COPY.auth.toastGoogleFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminContinue = () => {
    loginAsAdmin();
    toast.success(COPY.auth.toastAdminEntered);
    router.push(ROUTES.routine);
  };

  const handleGuestContinue = () => {
    loginAsGuest();
    toast.info(COPY.auth.toastGuestEntered);
    router.push(ROUTES.routine);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-5 py-12 font-sans text-ink">
      {/* Brand logo */}
      <Link href={ROUTES.landing} className="mb-8 flex items-center gap-2.5 font-medium tracking-tight">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
          {COPY.brand.initials}
        </span>
        <span className="text-xl font-medium">{COPY.brand.name}</span>
      </Link>

      <div className="w-full max-w-md rounded-card border border-ink/15 bg-white p-7 shadow-sm sm:p-8">
        {/* Mode Switcher Tabs */}
        <div className="mb-6 flex rounded-full border border-ink/10 bg-canvas p-1">
          <button
            type="button"
            onClick={() => setActiveMode('login')}
            className={clsx(
              'flex-1 rounded-full py-1.5 text-xs font-medium transition-colors',
              isLogin ? 'bg-white text-ink shadow-2xs' : 'text-ink/60 hover:text-ink'
            )}
          >
            {COPY.auth.tabSignIn}
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('signup')}
            className={clsx(
              'flex-1 rounded-full py-1.5 text-xs font-medium transition-colors',
              !isLogin ? 'bg-white text-ink shadow-2xs' : 'text-ink/60 hover:text-ink'
            )}
          >
            {COPY.auth.tabCreateAccount}
          </button>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-normal tracking-tight">
            {isLogin ? COPY.auth.loginTitle : COPY.auth.signupTitle}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-ink/50">
            {isLogin ? COPY.auth.loginSubtitle : COPY.auth.signupSubtitle}
          </p>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isSubmitting}
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full border border-ink/20 bg-white py-2.5 text-xs font-medium text-ink transition-colors hover:bg-canvas disabled:opacity-50"
        >
          <Icon icon={GoogleIcon} size="sm" />
          <span>{COPY.auth.googleButton}</span>
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-ink/10" />
          </div>
          <span className="relative bg-white px-3 text-2xs text-ink/40">{COPY.auth.orWithEmail}</span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-2xs font-medium text-ink/70">
                {COPY.auth.nameLabel}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={COPY.auth.namePlaceholder}
                className="mt-1 w-full rounded-tile border border-ink/15 bg-canvas px-3.5 py-2 text-xs text-ink placeholder:text-ink/30 focus:border-ink focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-2xs font-medium text-ink/70">
              {COPY.auth.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={COPY.auth.emailPlaceholder}
              required
              className="mt-1 w-full rounded-tile border border-ink/15 bg-canvas px-3.5 py-2 text-xs text-ink placeholder:text-ink/30 focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-2xs font-medium text-ink/70">
              {COPY.auth.passwordLabel}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={COPY.auth.passwordPlaceholder}
              required
              minLength={6}
              className="mt-1 w-full rounded-tile border border-ink/15 bg-canvas px-3.5 py-2 text-xs text-ink placeholder:text-ink/30 focus:border-ink focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1 text-2xs text-ink/70">
            <input
              type="checkbox"
              checked={asAdmin}
              onChange={(e) => setAsAdmin(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-ink/20 text-ink accent-ink focus:ring-0"
            />
            <span>{COPY.auth.adminCheckboxLabel}</span>
          </label>

          <PillButton type="submit" size="md" fullWidth loading={isSubmitting} className="mt-2 text-xs">
            {isLogin ? COPY.auth.loginButton : COPY.auth.signupButton}
          </PillButton>
        </form>

        {/* Quick Access Modes */}
        <div className="mt-6 border-t border-ink/10 pt-5 space-y-4 text-center">
          <div>
            <button
              type="button"
              onClick={handleAdminContinue}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-semibold lowercase text-ink transition-colors hover:bg-mint"
            >
              <Icon icon={ShieldOutlinedIcon} size="xs" />
              <span>{COPY.auth.adminButton}</span>
            </button>
            <p className="mt-1 text-2xs leading-relaxed text-ink/40">
              {COPY.auth.adminNotice}
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGuestContinue}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/75 hover:text-ink underline underline-offset-4"
            >
              <span>{COPY.auth.guestButton}</span>
              <Icon icon={ArrowForwardIcon} size="xs" />
            </button>
            <p className="mt-1 text-2xs leading-relaxed text-ink/40">
              {COPY.auth.guestNotice}
            </p>
          </div>
        </div>
      </div>

      {/* Switch between Login and Signup */}
      <p className="mt-6 text-xs text-ink/60">
        {isLogin ? (
          <button
            type="button"
            onClick={() => setActiveMode('signup')}
            className="hover:text-ink underline underline-offset-2"
          >
            {COPY.auth.needAccount}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveMode('login')}
            className="hover:text-ink underline underline-offset-2"
          >
            {COPY.auth.haveAccount}
          </button>
        )}
      </p>
    </div>
  );
}
