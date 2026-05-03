/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

type ExcursionReport = {
  id: string;
  driver_id: string;
  checklist_results: Record<string, boolean>;
  observations: string | null;
  photo_paths: string[] | null;
  created_at: string;
  driver_name: string | null;
};

type ReportWithPhoto = ExcursionReport & {
  photoUrls: string[];
};

export default function AdminRelatorioVistoria({ excursionId }: { excursionId: string }) {
  const [reports, setReports] = useState<ReportWithPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchReports() {
      const { data, error } = await supabase
        .from("excursion_reports")
        .select(`
          id,
          driver_id,
          checklist_results,
          observations,
          photo_paths,
          created_at,
          profiles ( full_name )
        `)
        .eq("excursion_id", excursionId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar relatórios:", error);
        setIsLoading(false);
        return;
      }

      const formattedReports = await Promise.all(
        (data || []).map(async (report: any) => {
          let photoUrls: string[] = [];

          if (report.photo_paths && report.photo_paths.length > 0) {
            const urls = await Promise.all(
              report.photo_paths.map(async (path: string) => {
                const { data: urlData } = await supabase.storage
                  .from("excursion-reports")
                  .createSignedUrl(path, 3600); // 1 hour expiration
                return urlData?.signedUrl || null;
              })
            );
            photoUrls = urls.filter((url): url is string => url !== null);
          }

          const profileData = Array.isArray(report.profiles)
            ? report.profiles[0]
            : report.profiles;

          return {
            id: report.id,
            driver_id: report.driver_id,
            checklist_results: report.checklist_results || {},
            observations: report.observations,
            photo_paths: report.photo_paths,
            created_at: report.created_at,
            driver_name: profileData?.full_name || null,
            photoUrls,
          } as ReportWithPhoto;
        })
      );

      setReports(formattedReports);
      setIsLoading(false);
    }

    fetchReports();
  }, [excursionId, supabase]);

  if (isLoading) {
    return (
      <div className="py-8 text-center text-outline-variant">
        Carregando relatórios de vistoria...
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-8 text-center">
        <ClipboardCheckIcon className="w-12 h-12 text-outline-variant/50 mx-auto mb-3" />
        <h3 className="text-on-surface font-semibold">Nenhum relatório encontrado</h3>
        <p className="text-on-surface-variant text-sm mt-1">
          Os motoristas ainda não enviaram relatórios de vistoria para esta excursão.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reports.map((report) => (
        <div key={report.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
          <div className="border-b border-outline-variant/30 bg-surface-container-low/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-on-surface">
                  Vistoria — {report.driver_name || "Motorista Desconhecido"}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                  <CheckCircle2 className="w-3 h-3" /> Enviado
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Enviado em: {new Date(report.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Checklist */}
            {Object.keys(report.checklist_results).length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">Itens Verificados</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(report.checklist_results).map(([item, isOk]) => (
                    <div key={item} className="flex items-start gap-2">
                      {isOk ? (
                        <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                      )}
                      <span className="text-sm text-on-surface">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            {report.observations && (
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">Observações</h4>
                <div className="bg-surface-container-low p-4 rounded-xl text-sm text-on-surface whitespace-pre-wrap">
                  {report.observations}
                </div>
              </div>
            )}

            {/* Fotos */}
            {report.photoUrls.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">Fotos Anexadas</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {report.photoUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative inline-block aspect-square w-full rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Foto da vistoria ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <ExternalLink className="text-white opacity-0 group-hover:opacity-100 w-6 h-6 transition-opacity" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ClipboardCheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <path d="m9 14 2 2 4-4"/>
    </svg>
  );
}

