"use client";

import { Suspense, useTransition, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { completeProfile, recoverAccountByCpf } from "../actions";
import { formatCPF, validateCPF } from "@/lib/utils";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import Link from "next/link";

type Props = {
  logoUrl?: string | null;
  companyName?: string;
};

export default function CompletarCadastroClient({ logoUrl, companyName }: Props) {
  return (
    <Suspense>
      <CompletarContent logoUrl={logoUrl} companyName={companyName} />
    </Suspense>
  );
}

function CompletarContent({ logoUrl, companyName }: Props) {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [isPending, startTransition] = useTransition();
  const [isRecovering, startRecovering] = useTransition();
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [conflictData, setConflictData] = useState<{ maskedEmail: string, cpf: string } | null>(null);

  useEffect(() => {
    if (errorParam) {
      toast.error(errorParam);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [errorParam]);

  const handleAction = (formData: FormData) => {
    const cpfValue = formData.get("cpf") as string;
    
    if (!validateCPF(cpfValue)) {
      toast.error("O CPF informado é inválido. Verifique os dígitos.");
      return;
    }

    startTransition(async () => {
      const nextParam = searchParams.get("next");
      if (nextParam) {
        formData.append("next", nextParam);
      }
      const result = await completeProfile(formData) as any;
      if (result?.error) {
        if (result.error === "CPF_DUPLICATE") {
          setConflictData({ maskedEmail: result.maskedEmail, cpf: result.conflictingCpf });
        } else {
          toast.error(result.error);
        }
      }
    });
  };

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-4">
            <Logo logoUrl={logoUrl} companyName={companyName} size="lg" />
          </Link>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Complete seu cadastro
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Precisamos de mais alguns dados para garantir sua segurança e reservas.
          </p>
        </div>

        {conflictData ? (
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant space-y-4">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-on-surface">CPF já cadastrado</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Detectamos que o CPF digitado já pertence à conta <strong>{conflictData.maskedEmail}</strong>.
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Parece que você já tem um cadastro. Deseja enviar um link de recuperação de senha para este e-mail?
            </p>

            <div className="pt-4 space-y-3">
              <button 
                type="button"
                onClick={() => {
                  startRecovering(async () => {
                    const res = await recoverAccountByCpf(conflictData.cpf);
                    if (res?.error) {
                      window.location.href = `/login?error=${encodeURIComponent(res.error)}`;
                    } else {
                      window.location.href = `/login?success=${encodeURIComponent('Enviamos um link de recuperação para seu e-mail antigo. Verifique a caixa de entrada para acessar sua conta.')}`;
                    }
                  });
                }}
                disabled={isRecovering}
                className="w-full bg-on-surface text-surface font-semibold py-3 rounded-xl shadow hover:bg-on-surface/90 transition-all disabled:opacity-60"
              >
                {isRecovering ? "Enviando..." : "Enviar link e acessar conta antiga"}
              </button>
              
              <button 
                type="button"
                onClick={() => setConflictData(null)}
                disabled={isRecovering}
                className="w-full bg-transparent border-2 border-outline-variant text-on-surface font-semibold py-3 rounded-xl hover:bg-surface-container-highest transition-all disabled:opacity-60"
              >
                Não, errei a digitação do CPF
              </button>
            </div>
          </div>
        ) : (
          <form action={handleAction} className="space-y-5">
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-on-surface mb-1.5">
                CPF <span className="text-error">*</span>
              </label>
              <input id="cpf" name="cpf" type="text" required placeholder="000.000.000-00"
                maxLength={14}
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-colors" />
            </div>

            <div>
              <label htmlFor="birth_date" className="block text-sm font-medium text-on-surface mb-1.5">
                Data de nascimento <span className="text-error">*</span>
              </label>
              <input id="birth_date" name="birth_date" type="date" required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface focus:border-primary focus:ring-0 transition-colors" />
            </div>

            <button type="submit" disabled={isPending}
              className="w-full gradient-cta text-on-cta font-semibold py-3.5 rounded-xl shadow-md hover:shadow-glow-cta transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {isPending ? "Salvando..." : "Completar cadastro"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
