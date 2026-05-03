"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addClientNote, deleteClientNote } from "../actions";

type Note = {
  id: string;
  content: string;
  created_at: string;
  admin_id: string;
  admin_name?: string;
};

export default function ClientNotes({ clientId, initialNotes }: { clientId: string; initialNotes: Note[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        await addClientNote(clientId, content.trim());
        toast.success("Nota adicionada!");
        setContent("");
        router.refresh(); // recarrega a pagina para puxar os dados atualizados do server
      } catch (error: any) {
        toast.error("Erro ao adicionar nota: " + error.message);
      }
    });
  };

  const handleDelete = (noteId: string) => {
    if (!confirm("Tem certeza que deseja apagar esta nota?")) return;

    startTransition(async () => {
      try {
        await deleteClientNote(noteId);
        toast.success("Nota removida!");
        router.refresh();
      } catch (error: any) {
        toast.error("Erro ao remover nota: " + error.message);
      }
    });
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6">
      <h3 className="text-lg font-bold text-on-surface mb-4">Notas Internas</h3>

      <div className="space-y-4 mb-6">
        {initialNotes.length === 0 ? (
          <p className="text-sm text-outline italic text-center py-4 bg-surface-container-low/30 rounded-xl">Nenhuma nota interna registrada.</p>
        ) : (
          initialNotes.map((note) => (
            <div key={note.id} className="p-4 bg-surface rounded-xl border border-outline-variant/30 relative group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-primary">{note.admin_name || "Admin"}</span>
                <span className="text-[10px] text-outline font-mono">
                  {new Date(note.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{note.content}</p>
              
              <button 
                onClick={() => handleDelete(note.id)}
                disabled={isPending}
                className="absolute top-3 right-3 p-1.5 bg-error-light/20 text-error rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error-light/40 disabled:opacity-50"
                title="Apagar nota"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <textarea
          id="note-content"
          name="note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Adicione uma observação sobre este cliente..."
          className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none h-24"
          disabled={isPending}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className="px-6 py-2 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-dark transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>}
            Salvar Nota
          </button>
        </div>
      </form>
    </div>
  );
}
