import { ClipboardCheck, BusFront, AlertTriangle, ShieldCheck } from "lucide-react";

export default function ChecklistPage() {
  return (
    <div className="bg-surface min-h-screen pb-20">
      {/* Header */}
      <div className="bg-surface-container-lowest sticky top-14 z-30 px-4 py-4 border-b border-outline-variant/30 shadow-sm flex items-center gap-3">
        <ClipboardCheck className="w-6 h-6 text-primary" />
        <h1 className="font-bold text-on-surface text-lg">Checklist Pré-Viagem</h1>
      </div>

      <div className="p-4 space-y-6">
        
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-secondary/10 text-secondary rounded-full">
              <BusFront className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Inspeção Veicular</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                A liberação da viagem só é permitida após todas as checagens de segurança.
              </p>
            </div>
          </div>

          <form className="space-y-4">
            {/* Categoria: Mecânica Básica */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-outline uppercase tracking-wider">Mecânica Básica</h3>
              
              <label className="flex items-center gap-3 p-3 border border-outline-variant/30 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" />
                <span className="text-sm font-medium text-on-surface">Pneus calibrados e em bom estado</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-outline-variant/30 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" />
                <span className="text-sm font-medium text-on-surface">Nível de óleo e água conferidos</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-outline-variant/30 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" />
                <span className="text-sm font-medium text-on-surface">Sistema de freios testado</span>
              </label>
            </div>

            {/* Categoria: Conforto */}
            <div className="space-y-3 pt-4 border-t border-outline-variant/30">
              <h3 className="text-sm font-bold text-outline uppercase tracking-wider">Conforto e Limpeza</h3>
              
              <label className="flex items-center gap-3 p-3 border border-outline-variant/30 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" />
                <span className="text-sm font-medium text-on-surface">Ar-condicionado gelando</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-outline-variant/30 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" />
                <span className="text-sm font-medium text-on-surface">Banheiro limpo e higienizado</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-outline-variant/30 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" />
                <span className="text-sm font-medium text-on-surface">Água na geladeira abastecida</span>
              </label>
            </div>

            {/* Observações */}
            <div className="pt-4 border-t border-outline-variant/30">
              <label className="block text-sm font-bold text-on-surface mb-2">
                Observações ou Avarias
              </label>
              <textarea 
                rows={3}
                placeholder="Ex: Poltrona 14 com braço quebrado"
                className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              ></textarea>
            </div>

            <div className="bg-error/10 text-error p-4 rounded-xl flex items-start gap-3 mt-4">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs font-medium">Ao confirmar, você se responsabiliza legalmente pelas informações prestadas sobre as condições do veículo.</p>
            </div>

            <button type="button" className="w-full mt-6 py-4 bg-success text-on-primary rounded-xl font-bold hover:bg-success/90 transition-colors shadow-md flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Assinar Digitalmente e Liberar
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
