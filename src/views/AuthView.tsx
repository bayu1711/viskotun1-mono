'use client';

import React, { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  const fieldId = useId();
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
        await loginWithEmail(email, password);
        toast.success(email.toLowerCase().includes('admin') ? COPY.auth.toastAdminEntered : COPY.auth.toastWelcomeBack);
      } else {
        await signupWithEmail(name, email, password);
        toast.success(email.toLowerCase().includes('admin') ? COPY.auth.toastAdminEntered : COPY.auth.toastAccountCreated);
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5 py-12 font-sans text-ink">
      {/* Brand logo */}
      <Link href={ROUTES.landing} className="mb-8 flex min-h-11 items-center transition-opacity hover:opacity-85">
        <Image
          src={COPY.brand.logoUrl}
          alt={COPY.brand.name}
          width={160}
          height={39}
          priority
          className="h-10 w-auto object-contain"
        />
      </Link>

      <div className="w-full max-w-md rounded-callout bg-canvas p-6 sm:p-8">
        {/* Mode Switcher Tabs */}
        <div className="mb-6 flex rounded-full bg-ink/5 p-1">
          <button
            type="button"
            onClick={() => setActiveMode('login')}
            className={clsx(
              'min-h-11 flex-1 rounded-full text-sm font-semibold transition-colors',
              isLogin ? 'bg-white text-ink' : 'text-ink/70 hover:text-ink'
            )}
          >
            {COPY.auth.tabSignIn}
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('signup')}
            className={clsx(
              'min-h-11 flex-1 rounded-full text-sm font-semibold transition-colors',
              !isLogin ? 'bg-white text-ink' : 'text-ink/70 hover:text-ink'
            )}
          >
            {COPY.auth.tabCreateAccount}
          </button>
        </div>

        <div className="text-center">
          <h1 className="text-balance text-3xl font-bold tracking-tight">
            {isLogin ? COPY.auth.loginTitle : COPY.auth.signupTitle}
          </h1>
          <p className="mt-2 text-pretty text-base leading-relaxed text-ink/75">
            {isLogin ? COPY.auth.loginSubtitle : COPY.auth.signupSubtitle}
          </p>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isSubmitting}
          className="mt-6 flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full border border-ink bg-white text-base font-semibold text-ink transition-colors hover:bg-ink/5 disabled:opacity-50"
        >
          <Icon icon={GoogleIcon} size="sm" />
          <span>{COPY.auth.googleButton}</span>
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-ink/15" />
          </div>
          <span className="relative bg-canvas px-3 text-sm text-ink/70">{COPY.auth.orWithEmail}</span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor={`${fieldId}-name`} className="block text-sm font-semibold text-ink">
                {COPY.auth.nameLabel}
              </label>
              <input
                id={`${fieldId}-name`}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={COPY.auth.namePlaceholder}
                className="mt-1.5 min-h-12 w-full rounded-xl border border-ink/40 bg-white px-4 text-base text-ink placeholder:text-ink/60 focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
              />
            </div>
          )}

          <div>
            <label htmlFor={`${fieldId}-email`} className="block text-sm font-semibold text-ink">
              {COPY.auth.emailLabel}
            </label>
            <input
              id={`${fieldId}-email`}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={COPY.auth.emailPlaceholder}
              required
              className="mt-1.5 min-h-12 w-full rounded-xl border border-ink/40 bg-white px-4 text-base text-ink placeholder:text-ink/60 focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
            />
          </div>

          <div>
            <label htmlFor={`${fieldId}-password`} className="block text-sm font-semibold text-ink">
              {COPY.auth.passwordLabel}
            </label>
            <input
              id={`${fieldId}-password`}
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={COPY.auth.passwordPlaceholder}
              required
              minLength={6}
              className="mt-1.5 min-h-12 w-full rounded-xl border border-ink/40 bg-white px-4 text-base text-ink placeholder:text-ink/60 focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
            />
          </div>


          <PillButton type="submit" size="md" fullWidth loading={isSubmitting} className="mt-2 min-h-12 text-base font-semibold">
            {isLogin ? COPY.auth.loginButton : COPY.auth.signupButton}
          </PillButton>
        </form>

        {/* Quick Access Modes */}
        <div className="mt-6 space-y-4 border-t border-ink/15 pt-5 text-center">
          <div>
            <button
              type="button"
              onClick={handleAdminContinue}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink/75 underline underline-offset-4 transition-colors hover:text-ink"
            >
              <Icon icon={ShieldOutlinedIcon} size="xs" />
              <span>{COPY.auth.adminButton}</span>
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGuestContinue}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4 hover:text-ink/80"
            >
              <span>{COPY.auth.guestButton}</span>
              <Icon icon={ArrowForwardIcon} size="xs" />
            </button>
            <p className="text-pretty text-sm leading-relaxed text-ink/70">
              {COPY.auth.guestNotice}
            </p>
          </div>
        </div>
      </div>

      {/* Switch between Login and Signup */}
      <p className="mt-4 text-sm text-ink/75">
        {isLogin ? (
          <button
            type="button"
            onClick={() => setActiveMode('signup')}
            className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-ink"
          >
            {COPY.auth.needAccount}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveMode('login')}
            className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-ink"
          >
            {COPY.auth.haveAccount}
          </button>
        )}
      </p>
    </div>
  );
}
