"use client";

import { Suspense, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signup, signInWithGoogle } from "../actions";

import { Logo } from "@/components/Logo";

export default function CadastroClient({ v, logoUrl, companyName }: { v: number, logoUrl?: string | null, companyName?: string }) {
  return (
    <Suspense>
      <CadastroContent v={v} logoUrl={logoUrl} companyName={companyName} />
    </Suspense>
  );
}

function CadastroContent({ v, logoUrl, companyName }: { v: number, logoUrl?: string | null, companyName?: string }) {
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
      signup(formData);
    });
  };

  const handleGoogleAction = () => {
    startGoogleTransition(() => {
      signInWithGoogle(redirectParams);
    });
  };

  return (
    <main className="min-h-screen bg-surface flex relative">
      {/* Botão Voltar (Mobile) */}
      <Link href="/login" className="lg:hidden absolute top-6 left-6 sm:left-12 flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors z-50">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar ao login
      </Link>
      {/* Left: Image Panel */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        {/* Dynamic background image from admin */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/api/settings/image?field=signup_image_url&v=${v}')`,
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 gradient-hero opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-32 left-16 w-80 h-80 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-16 right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-center p-12">
          <h2 className="text-4xl font-extrabold font-[family-name:var(--font-display)] text-white mb-4 drop-shadow-xl">
            Garanta sua vaga!
          </h2>
          <p className="text-lg text-white/90 leading-relaxed max-w-md drop-shadow-md font-medium">
            Crie sua conta gratuita e descubra excursões incríveis para os
            melhores destinos do Brasil.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 text-left text-sm max-w-sm">
            <div className="flex items-start gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <svg className="w-5 h-5 text-white mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <div className="text-white">
                <p className="font-semibold">Garanta sua vaga antecipado</p>
                <p className="opacity-75 text-xs">Reserve antes e não fique de fora</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <svg className="w-5 h-5 text-white mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="text-white">
                <p className="font-semibold">Salve seus acompanhantes</p>
                <p className="opacity-75 text-xs">Cadastre familiares para compras rápidas</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <svg className="w-5 h-5 text-white mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div className="text-white">
                <p className="font-semibold">Voucher digital no celular</p>
                <p className="opacity-75 text-xs">Sem papel, tudo no seu smartphone</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Signup Form */}
      <div className="flex-1 flex items-start sm:items-center justify-center p-6 pt-16 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <Link href="/" className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
              <Logo logoUrl={logoUrl} companyName={companyName} size="xl" />
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-on-surface">
              Criar sua conta
            </h1>
            <p className="mt-2 text-on-surface-variant">
              É rápido, grátis e você já pode reservar.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-error-light border border-error/20 px-4 py-3 text-sm text-error">
              {error}
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
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
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
                ou cadastre com e-mail
              </span>
            </div>
          </div>

          {/* Signup Form */}
          <form action={handleEmailAction} className="space-y-5">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-on-surface mb-1.5">
                Nome completo
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                placeholder="Seu nome completo"
                className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-on-surface mb-1.5">
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
              <label htmlFor="password" className="block text-sm font-medium text-on-surface mb-1.5">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-colors"
              />
            </div>

            {/* Marketing Opt-in (LGPD) */}
            <label
              htmlFor="accepts_marketing"
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                id="accepts_marketing"
                name="accepts_marketing"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                Quero receber ofertas exclusivas e vagas em primeira mão por
                e-mail. Posso cancelar a qualquer momento.
              </span>
            </label>

            <button
              type="submit"
              disabled={isEmailPending}
              className="w-full gradient-cta text-on-cta font-semibold py-3.5 rounded-xl shadow-md hover:shadow-glow-cta transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isEmailPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Criando conta...
                </span>
              ) : (
                "Criar conta gratuita"
              )}
            </button>

            <p className="text-xs text-center text-outline">
              Ao criar sua conta, você concorda com nossos{" "}
              <Link href="/termos" className="text-primary hover:underline">
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link href="/privacidade" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
              .
            </p>
          </form>

          <p className="text-center text-sm text-on-surface-variant">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
