"use client";

import { Suspense, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login, signInWithGoogle } from "../actions";

export default function LoginClient({ v }: { v: number }) {
  return (
    <Suspense>
      <LoginContent v={v} />
    </Suspense>
  );
}

function LoginContent({ v }: { v: number }) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const redirectParams = searchParams.get("redirect");

  const [isEmailPending, startEmailTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();

  const handleEmailAction = (formData: FormData) => {
    startEmailTransition(() => {
      if (redirectParams) {
        formData.append("redirect", redirectParams);
      }
      login(formData);
    });
  };

  const handleGoogleAction = () => {
    startGoogleTransition(() => {
      signInWithGoogle(redirectParams);
    });
  };

  return (
    <main className="min-h-screen bg-surface flex">
      {/* Left: Image Panel */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        {/* Dynamic background image from admin, fallback to gradient */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/api/settings/image?field=login_image_url&v=${v}')`,
          }}
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 gradient-hero opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Decorative blurs */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-center p-12">
          <h2 className="text-4xl font-extrabold font-[family-name:var(--font-display)] text-white mb-4 drop-shadow-xl">
            Sua próxima aventura começa aqui
          </h2>
          <p className="text-lg text-white/90 leading-relaxed max-w-md drop-shadow-md font-medium">
            Descubra destinos incríveis com excursões turísticas de ônibus
            premium. Pacotes completos com guia e tudo incluso.
          </p>
          <div className="mt-6 flex items-center gap-6 text-sm text-white font-medium drop-shadow">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Ônibus executivo
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Guia turístico
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Tudo incluso
            </span>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="inline-flex items-center gap-2">
              <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="8" className="fill-primary" />
                <path d="M8 10L16 24L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 10L16 18L20 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
              </svg>
              <span className="text-2xl font-extrabold font-[family-name:var(--font-display)] text-primary">
                ViajaEdu!
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-on-surface">
              Entrar na sua conta
            </h1>
            <p className="mt-2 text-on-surface-variant">
              Bom te ver de volta! Acesse para gerenciar suas viagens.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-error-light border border-error/20 px-4 py-3 text-sm text-error">
              {error === "auth_code_error"
                ? "Erro na autenticação. Tente novamente."
                : error}
            </div>
          )}

          {/* Google Login */}
          <form action={handleGoogleAction}>
            <button
              type="submit"
              disabled={isGooglePending}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border-2 border-outline-variant hover:border-primary hover:bg-primary-container/30 transition-all duration-200 font-medium text-on-surface disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGooglePending ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-outline-variant border-t-primary rounded-full animate-spin"></div>
                  Aguarde...
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuar com Google
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface text-on-surface-variant">
                ou entre com e-mail
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form action={handleEmailAction} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-on-surface mb-1.5"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="seu@email.com"
                className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-on-surface"
                >
                  Senha
                </label>
                <Link
                  href="/esqueci-senha"
                  className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isEmailPending}
              className="w-full gradient-cta text-on-cta font-semibold py-3.5 rounded-xl shadow-md hover:shadow-glow-cta transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isEmailPending ? "Entrando..." : "Entrar na plataforma"}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant">
            Não tem conta?{" "}
            <Link
              href="/cadastro"
              className="font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              Cadastre-se gratuitamente
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
