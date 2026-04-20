"use client";

import { useTransition } from "react";
import { updatePassword } from "@/app/(auth)/actions";
import { useSearchParams } from "next/navigation";


export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");
  const [isPending, startTransition] = useTransition();

  const handleAction = (formData: FormData) => {
    startTransition(() => {
      updatePassword(formData);
    });
  };

  if (success) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-sm text-center">
        <svg className="w-12 h-12 mx-auto mb-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-bold text-on-surface mb-2">Senha atualizada!</h2>
        <p className="text-on-surface-variant text-sm mb-6">
          Sua senha foi redefinida com sucesso. Agora você pode entrar na sua conta.
        </p>
        <a
          href="/login"
          className="inline-block bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-xl font-bold transition-colors"
        >
          Fazer Login
        </a>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-sm">
      {error && (
        <div className="mb-6 p-4 bg-error-light text-error rounded-xl text-sm border border-error/20 flex items-start gap-2">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      <form action={handleAction} className="space-y-5">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-on-surface mb-1.5"
          >
            Nova Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Digite sua nova senha"
            className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-cta hover:bg-cta/90 text-on-cta font-bold py-3 rounded-xl transition-all shadow-sm hover:shadow-glow-cta disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Nova Senha"
          )}
        </button>
      </form>
    </div>
  );
}