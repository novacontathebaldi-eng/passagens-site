import { useState } from "react";

interface StatusActionModalProps {
  isOpen: boolean;
  action: "APPROVE" | "CANCEL" | "REFUND" | "REACTIVATE" | null;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  isLoading: boolean;
}

export function StatusActionModal({ isOpen, action, onClose, onConfirm, isLoading }: StatusActionModalProps) {
  const [notes, setNotes] = useState("");

  if (!isOpen || !action) return null;

  const requiresNotes = action === "CANCEL" || action === "REFUND";

  let title = "";
  let description = "";
  let confirmText = "";
  let confirmColor = "";

  switch (action) {
    case "APPROVE":
      title = "Aprovar Reserva";
      description = "Confirma o recebimento do pagamento e aprovação desta reserva?";
      confirmText = "Aprovar";
      confirmColor = "bg-success hover:bg-success-dark text-white";
      break;
    case "CANCEL":
      title = "Cancelar Reserva";
      description = "Deseja realmente cancelar esta reserva? As vagas voltarão ao estoque.";
      confirmText = "Cancelar Reserva";
      confirmColor = "bg-error hover:bg-error-dark text-white";
      break;
    case "REFUND":
      title = "Reembolsar Reserva";
      description = "Você está marcando esta reserva como reembolsada. Confirma o estorno do valor?";
      confirmText = "Confirmar Reembolso";
      confirmColor = "bg-warning hover:bg-warning/80 text-white";
      break;
    case "REACTIVATE":
      title = "Reativar Reserva";
      description = "A reserva voltará para o status Aguardando PIX.";
      confirmText = "Reativar";
      confirmColor = "bg-primary hover:bg-primary-dark text-white";
      break;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(notes.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-xl font-bold text-on-surface mb-2">{title}</h2>
            <p className="text-on-surface-variant text-sm mb-4">{description}</p>
            
            {requiresNotes && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">
                  Motivo / Observação <span className="text-outline font-normal">(Opcional)</span>
                </label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Cliente desistiu por motivo de saúde..."
                  className="w-full h-24 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
                />
                <p className="text-xs text-on-surface-variant">
                  Esta nota será salva no histórico da reserva e poderá ser enviada no e-mail automático do cliente.
                </p>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 ${confirmColor}`}
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
