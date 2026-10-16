'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GoogleIcon from '@mui/icons-material/Google';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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
  const isLogin = mode === 'login';
  const router = useRouter();
  const { loginWithEmail, loginWithGoogle, signupWithEmail, loginAsGuest } = useAuth();

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
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
        toast.success(COPY.auth.toastWelcomeBack);
      } else {
        await signupWithEmail(name, email, password);
        toast.success(COPY.auth.toastAccountCreated);
      }
      router.push(ROUTES.routine);
    } catch {
      toast.error(COPY.auth.toastAuthFailed);
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
          pe
        </span>
        <span className="text-xl lowercase font-medium">{COPY.brand.name}</span>
      </Link>

      <div className="w-full max-w-md rounded-card border border-ink/15 bg-white p-7 shadow-sm sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-normal lowercase tracking-tight">
            {isLogin ? COPY.auth.loginTitle : COPY.auth.signupTitle}
          </h1>
          <p className="mt-2 text-xs leading-relaxed lowercase text-ink/50">
            {isLogin ? COPY.auth.loginSubtitle : COPY.auth.signupSubtitle}
          </p>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isSubmitting}
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full border border-ink/20 bg-white py-2.5 text-xs lowercase font-medium text-ink transition-colors hover:bg-canvas disabled:opacity-50"
        >
          <Icon icon={GoogleIcon} size="sm" />
          <span>{COPY.auth.googleButton}</span>
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-ink/10" />
          </div>
          <span className="relative bg-white px-3 text-2xs lowercase text-ink/40">{COPY.auth.orWithEmail}</span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-2xs lowercase font-medium text-ink/70">
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
            <label className="block text-2xs lowercase font-medium text-ink/70">
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
            <label className="block text-2xs lowercase font-medium text-ink/70">
              {COPY.auth.passwordLabel}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={COPY.auth.passwordPlaceholder}
              className="mt-1 w-full rounded-tile border border-ink/15 bg-canvas px-3.5 py-2 text-xs text-ink placeholder:text-ink/30 focus:border-ink focus:outline-none"
            />
          </div>

          <PillButton type="submit" size="md" fullWidth loading={isSubmitting} className="mt-2 text-xs lowercase">
            {isLogin ? COPY.auth.loginButton : COPY.auth.signupButton}
          </PillButton>
        </form>

        {/* Guest Mode Fallback */}
        <div className="mt-6 border-t border-ink/10 pt-5 text-center">
          <button
            type="button"
            onClick={handleGuestContinue}
            className="inline-flex items-center gap-1.5 text-xs lowercase font-medium text-ink/75 hover:text-ink underline underline-offset-4"
          >
            <span>{COPY.auth.guestButton}</span>
            <Icon icon={ArrowForwardIcon} size="xs" />
          </button>
          <p className="mt-2 text-2xs leading-relaxed lowercase text-ink/40">
            {COPY.auth.guestNotice}
          </p>
        </div>
      </div>

      {/* Switch between Login and Signup */}
      <p className="mt-6 text-xs lowercase text-ink/60">
        {isLogin ? (
          <Link href={ROUTES.signup} className="hover:text-ink underline underline-offset-2">
            {COPY.auth.needAccount}
          </Link>
        ) : (
          <Link href={ROUTES.login} className="hover:text-ink underline underline-offset-2">
            {COPY.auth.haveAccount}
          </Link>
        )}
      </p>
    </div>
  );
}
