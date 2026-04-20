"use client";

import { Suspense, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { completeProfile } from "../actions";

export default function CompletarCadastroPage() {
  return (
    <Suspense>
      <CompletarContent />
    </Suspense>
  );
}


function CompletarContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isPending, startTransition] = useTransition();

  const handleAction = (formData: FormData) => {
    startTransition(() => {
      const nextParam = searchParams.get("next");
      if (nextParam) {
        formData.append("next", nextParam);
      }
      completeProfile(formData);
    });
  };

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-on-surface mt-4">
            Complete seu cadastro
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Precisamos de mais alguns dados para garantir sua segurança e reservas.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-error-light border border-error/20 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <form action={handleAction} className="space-y-5">
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-on-surface mb-1.5">
              CPF <span className="text-error">*</span>
            </label>
            <input id="cpf" name="cpf" type="text" required placeholder="000.000.000-00"
              maxLength={14}
              className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-colors" />
            <p className="mt-1 text-xs text-outline">
              Obrigatório para emissão de voucher e embarque.
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-on-surface mb-1.5">
              Telefone / WhatsApp <span className="text-error">*</span>
            </label>
            <input id="phone" name="phone" type="tel" required placeholder="(11) 99999-9999"
              className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-colors" />
          </div>

          <div>
            <label htmlFor="birth_date" className="block text-sm font-medium text-on-surface mb-1.5">
              Data de nascimento
            </label>
            <input id="birth_date" name="birth_date" type="date"
              className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface focus:border-primary focus:ring-0 transition-colors" />
          </div>

          <button type="submit" disabled={isPending}
            className="w-full gradient-cta text-on-cta font-semibold py-3.5 rounded-xl shadow-md hover:shadow-glow-cta transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
            {isPending ? "Salvando..." : "Completar cadastro"}
          </button>
        </form>
      </div>
    </main>
  );
}
