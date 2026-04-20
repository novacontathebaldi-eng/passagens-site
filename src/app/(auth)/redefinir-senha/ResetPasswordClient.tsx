"use client";

import { useFormStatus } from "react-dom";
import { updatePassword } from "@/app/(auth)/actions";
import { useSearchParams } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-cta hover:bg-cta/90 text-on-cta font-bold py-3 rounded-xl transition-all shadow-sm hover:shadow-glow-cta disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Salvando...
        </>
      ) : (
        "Salvar Nova Senha"
      )}
    </button>
  );
}

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  if (success) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-sm text-center">
        <span className="text-4xl block mb-4">✅</span>
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

      <form action={updatePassword} className="space-y-5">
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

        <SubmitButton />
      </form>
    </div>
  );
}
