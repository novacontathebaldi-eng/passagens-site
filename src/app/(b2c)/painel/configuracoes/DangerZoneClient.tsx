"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteOwnAccount } from "../actions";

export default function DangerZoneClient({ hasImpediments, email }: { hasImpediments: boolean, email: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationEmail !== email) {
      toast.error("O email digitado não confere.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteOwnAccount();
        toast.success(
          result.strategy === "ANONYMIZE" 
            ? "Conta anonimizada e desativada com sucesso. Até logo!" 
            : "Conta removida permanentemente com sucesso. Até logo!"
        );
        router.push("/");
      } catch (error: any) {
        toast.error("Erro ao deletar conta: " + error.message);
        setShowModal(false);
      }
    });
  };

  return (
    <div className="bg-error-light/10 border border-error/20 rounded-2xl p-6 mt-8">
      <h3 className="text-lg font-bold text-error mb-2">Zona de Perigo</h3>
      <p className="text-sm text-on-surface-variant mb-6">
        Ações destrutivas sobre a sua conta. Ao excluir, você perderá acesso a todas as suas compras e histórico.
      </p>

      <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-error/30">
        <div>
          <h4 className="font-semibold text-error">Excluir Minha Conta</h4>
          <p className="text-xs text-on-surface-variant mt-1">
            Esta ação é irreversível e removerá seu acesso ao Partiu Turismo.
          </p>
        </div>
        <button
          onClick={() => {
            setConfirmationEmail("");
            setShowModal(true);
          }}
          disabled={isPending}
          className="px-4 py-2 text-sm font-bold bg-error text-white rounded-xl hover:bg-error-dark transition-colors shrink-0 disabled:opacity-50"
        >
          Excluir Conta
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl w-full max-w-md p-6 shadow-2xl border border-error/20">
            <h3 className="text-xl font-bold text-error mb-4">Você tem certeza?</h3>
            
            {hasImpediments ? (
              <p className="text-sm text-on-surface-variant mb-6 font-medium bg-error-light/10 text-error-dark p-3 rounded-lg border border-error/20">
                Sua conta possui reservas ativas que impedem a exclusão total dos dados. Seus dados pessoais serão removidos e sua conta será desativada, mas o histórico de viagens será mantido para fins legais e de auditoria.
              </p>
            ) : (
              <p className="text-sm text-on-surface-variant mb-6 font-medium bg-error-light/10 text-error-dark p-3 rounded-lg border border-error/20">
                Sua conta e todos os seus dados serão permanentemente excluídos. Esta ação é irreversível.
              </p>
            )}

            <form onSubmit={handleDelete}>
              <p className="text-sm text-on-surface-variant mb-2">
                Para prosseguir, confirme digitando seu email (<b>{email}</b>):
              </p>
              <input
                type="email"
                value={confirmationEmail}
                onChange={(e) => setConfirmationEmail(e.target.value)}
                placeholder={email}
                className="w-full rounded-xl border border-error bg-surface px-4 py-3 text-sm text-on-surface focus:border-error focus:ring-1 focus:ring-error transition-colors mb-6 font-medium"
                disabled={isPending}
                required
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isPending}
                  className="px-4 py-2 font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || confirmationEmail !== email}
                  className="px-6 py-2 bg-error text-white font-bold rounded-xl hover:bg-error-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isPending && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>}
                  Confirmar Exclusão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
