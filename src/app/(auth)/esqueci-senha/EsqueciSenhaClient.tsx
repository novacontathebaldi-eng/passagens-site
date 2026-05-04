"use client";

import { Suspense, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "../actions";
import { Logo } from "@/components/Logo";

export default function EsqueciSenhaClient({ logoUrl, companyName }: { logoUrl?: string | null, companyName?: string }) {
  return (
    <Suspense>
      <EsqueciSenhaContent logoUrl={logoUrl} companyName={companyName} />
    </Suspense>
  );
}

function EsqueciSenhaContent({ logoUrl, companyName }: { logoUrl?: string | null, companyName?: string }) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");
  const [isPending, startTransition] = useTransition();

  const handleAction = (formData: FormData) => {
    startTransition(() => {
      resetPassword(formData);
    });
  };

  return (
    <main className="min-h-screen bg-surface flex relative items-center justify-center p-4">
      {/* Botão Voltar */}
      <Link href="/login" className="lg:hidden absolute top-6 left-6 sm:left-12 flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors z-50">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar ao login
      </Link>

      <div className="w-full max-w-md space-y-8 mt-8 sm:mt-0">
        <div className="text-center flex flex-col items-center">
          <Link href="/" className="inline-block mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
            <Logo logoUrl={logoUrl} companyName={companyName} size="lg" />
          </Link>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Recuperar senha
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Informe seu e-mail e enviaremos um link para redefinir.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-error-light border border-error/20 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {success ? (
          <div className="rounded-xl bg-success-light border border-success/20 px-4 py-4 text-center">
            <p className="text-sm text-success font-medium flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              E-mail enviado!
            </p>
            <p className="text-sm text-on-surface-variant mt-2">
              Verifique sua caixa de entrada e spam.
            </p>
          </div>
        ) : (
          <form action={handleAction} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-on-surface mb-1.5">
                E-mail da conta
              </label>
              <input id="email" name="email" type="email" required placeholder="seu@email.com"
                className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-colors" />
            </div>
            <button type="submit" disabled={isPending}
              className="w-full gradient-primary text-on-primary font-semibold py-3.5 rounded-xl shadow-md hover:shadow-glow-primary transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {isPending ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-on-surface-variant">
          Lembrou?{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-primary-dark transition-colors">
            Voltar ao login
          </Link>
        </p>
      </div>
    </main>
  );
}
