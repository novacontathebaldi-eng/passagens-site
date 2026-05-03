"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteClientAccount, toggleClientBan } from "../actions";

export default function DangerZoneAdmin({ uid, isBanned }: { uid: string; isBanned: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStrategy, setDeleteStrategy] = useState<"ANONYMIZE" | "HARD_DELETE">("ANONYMIZE");

  const handleToggleBan = () => {
    startTransition(async () => {
      try {
        await toggleClientBan(uid, !isBanned);
        toast.success(isBanned ? "Conta reativada com sucesso!" : "Conta suspensa com sucesso!");
        router.refresh();
      } catch (error: any) {
        toast.error("Erro ao alterar status: " + error.message);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteClientAccount(uid, deleteStrategy);
        toast.success("Conta removida com sucesso!");
        router.push("/admin/clientes");
      } catch (error: any) {
        toast.error("Erro ao deletar conta: " + error.message);
      } finally {
        setShowDeleteModal(false);
      }
    });
  };

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
            onClick={handleToggleBan}
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
            onClick={() => setShowDeleteModal(true)}
            disabled={isPending}
            className="px-4 py-2 text-sm font-bold bg-error text-white rounded-xl hover:bg-error-dark transition-colors shrink-0 disabled:opacity-50"
          >
            Deletar Conta
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl w-full max-w-md p-6 shadow-2xl border border-outline-variant/20">
            <h3 className="text-xl font-bold text-error mb-2">Excluir Conta</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Escolha a estratégia de exclusão. Contas com histórico financeiro <b>não podem</b> sofrer Hard Delete.
            </p>

            <div className="space-y-3 mb-6">
              <label className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${deleteStrategy === "ANONYMIZE" ? "border-primary bg-primary-light/10" : "border-outline-variant hover:bg-surface-container-low"}`}>
                <input 
                  type="radio" 
                  name="strategy" 
                  checked={deleteStrategy === "ANONYMIZE"} 
                  onChange={() => setDeleteStrategy("ANONYMIZE")}
                  className="mt-1"
                />
                <div>
                  <h4 className="font-semibold text-on-surface">Caminho A: Anonimização</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Oculte os dados pessoais (nome, CPF, etc), mas mantenha o histórico de reservas financeiras associado ao ID da conta para balanço contábil.</p>
                </div>
              </label>

              <label className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${deleteStrategy === "HARD_DELETE" ? "border-error bg-error-light/10" : "border-outline-variant hover:bg-surface-container-low"}`}>
                <input 
                  type="radio" 
                  name="strategy" 
                  checked={deleteStrategy === "HARD_DELETE"} 
                  onChange={() => setDeleteStrategy("HARD_DELETE")}
                  className="mt-1"
                />
                <div>
                  <h4 className="font-semibold text-error">Caminho B: Hard Delete</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Destruição total da conta, passagens e dados em cascata. Falhará se houver histórico de pagamentos aprovados ou pendentes.</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isPending}
                className="px-4 py-2 font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-6 py-2 bg-error text-white font-bold rounded-xl hover:bg-error-dark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>}
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
