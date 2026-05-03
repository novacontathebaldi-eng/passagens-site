"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteClientAccount, toggleClientBan } from "../actions";
import { formatDate } from "@/lib/utils";

export default function DangerZoneAdmin({ 
  uid, 
  email, 
  isBanned, 
  criticalReservations 
}: { 
  uid: string; 
  email: string; 
  isBanned: boolean;
  criticalReservations: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  const handleToggleBan = () => {
    startTransition(async () => {
      try {
        await toggleClientBan(uid, !isBanned);
        toast.success(isBanned ? "Conta reativada com sucesso!" : "Conta suspensa com sucesso!");
        router.refresh();
      } catch (error: any) {
        toast.error("Erro ao alterar status: " + error.message);
      } finally {
        setShowBanModal(false);
      }
    });
  };

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationEmail !== email) {
      toast.error("O email digitado não confere.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteClientAccount(uid);
        toast.success(
          result.strategy === "ANONYMIZE" 
            ? "Conta anonimizada e desativada com sucesso." 
            : "Conta removida permanentemente com sucesso!"
        );
        router.push("/admin/clientes");
      } catch (error: any) {
        toast.error("Erro ao deletar conta: " + error.message);
        setShowDeleteModal(false);
      }
    });
  };

  const hasImpediments = criticalReservations && criticalReservations.length > 0;

  return (
    <div className="bg-error-light/10 border border-error/20 rounded-2xl p-6 mt-6">
      <h3 className="text-lg font-bold text-error mb-2">Zona de Perigo</h3>
      <p className="text-sm text-on-surface-variant mb-6">
        Ações destrutivas e administrativas para esta conta. Tenha certeza absoluta antes de prosseguir.
      </p>

      <div className="flex flex-col gap-4">
        {/* Toggle Ban */}
        <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-outline-variant/30">
          <div>
            <h4 className="font-semibold text-on-surface">{isBanned ? "Reativar Conta" : "Suspender Conta"}</h4>
            <p className="text-xs text-on-surface-variant mt-1">
              {isBanned 
                ? "Permite que o usuário faça login e realize compras novamente." 
                : "Bloqueia o acesso da conta. O usuário não poderá logar."}
            </p>
          </div>
          <button
            onClick={() => setShowBanModal(true)}
            disabled={isPending}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors shrink-0 ${
              isBanned
                ? "bg-success text-white hover:bg-success-dark"
                : "bg-warning text-white hover:bg-warning-dark"
            } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isPending ? "Processando..." : (isBanned ? "Reativar Acesso" : "Suspender Acesso")}
          </button>
        </div>

        {/* Delete Account */}
        <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-outline-variant/30">
          <div>
            <h4 className="font-semibold text-error">Deletar Conta</h4>
            <p className="text-xs text-on-surface-variant mt-1">
              Remove o usuário do sistema permanentemente.
            </p>
          </div>
          <button
            onClick={() => {
              setConfirmationEmail("");
              setShowDeleteModal(true);
            }}
            disabled={isPending}
            className="px-4 py-2 text-sm font-bold bg-error text-white rounded-xl hover:bg-error-dark transition-colors shrink-0 disabled:opacity-50"
          >
            Deletar Conta
          </button>
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl w-full max-w-md p-6 shadow-2xl border border-outline-variant/20">
            <h3 className="text-xl font-bold text-on-surface mb-2">
              {isBanned ? "Reativar Conta" : "Suspender Conta"}
            </h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Tem certeza que deseja {isBanned ? "reativar" : "suspender"} o acesso desta conta?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBanModal(false)}
                disabled={isPending}
                className="px-4 py-2 font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleToggleBan}
                disabled={isPending}
                className={`px-6 py-2 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 ${
                  isBanned ? "bg-success hover:bg-success-dark" : "bg-warning hover:bg-warning-dark"
                }`}
              >
                {isPending && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl w-full max-w-md p-6 shadow-2xl border border-outline-variant/20">
            <h3 className="text-xl font-bold text-error mb-2">Excluir Conta</h3>
            
            {hasImpediments ? (
              <div className="mb-6">
                <p className="text-sm text-on-surface-variant mb-3">
                  Este cliente possui {criticalReservations.length} reserva(s) que impedem a exclusão total:
                </p>
                <ul className="text-xs text-on-surface bg-surface-container-low rounded-lg p-3 space-y-2 mb-3 max-h-32 overflow-y-auto">
                  {criticalReservations.map(r => (
                    <li key={r.id} className="flex justify-between items-center">
                      <span>• {(r.excursions?.tour_packages as any)?.title || "Reserva"} — {formatDate(r.created_at)}</span>
                      <span className="font-bold text-[10px] uppercase bg-surface border border-outline-variant/30 px-1.5 py-0.5 rounded">{r.status}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-on-surface-variant font-medium bg-primary-light/10 text-primary-dark p-3 rounded-lg border border-primary/20">
                  Por conter histórico financeiro ativo, os dados pessoais serão anonimizados e a conta será desativada permanentemente. As reservas serão mantidas para fins de auditoria.
                </p>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant mb-6 font-medium bg-error-light/10 text-error-dark p-3 rounded-lg border border-error/20">
                Este cliente não possui histórico financeiro ativo. Todos os dados, reservas e informações serão excluídos permanentemente. Esta ação é irreversível.
              </p>
            )}

            <form onSubmit={handleDelete}>
              <p className="text-sm text-on-surface-variant mb-2">
                Para prosseguir, digite o e-mail <b>{email}</b> abaixo:
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
                  onClick={() => setShowDeleteModal(false)}
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
