import { Database, ExternalLink } from "lucide-react";
import type { MetadadosDataset } from "../lib/datasets";

// Selo de procedência: toda informação pública mostra fonte e data de atualização.
export function SeloFonte({ meta }: { meta: MetadadosDataset }) {
  const data = new Date(meta.atualizadoEm).toLocaleDateString("pt-BR");
  return (
    <p className="text-[0.75rem] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <Database className="h-3.5 w-3.5 text-slate-500" />
      <span>
        <strong className="text-slate-700">Fonte:</strong> {meta.fonte}
      </span>
      {meta.periodo && <span>· Período: {meta.periodo}</span>}
      <span>· Atualizado em {data}</span>
      <span>· {meta.metodo === "api" ? "Coleta automática" : "Planilha"}</span>
      {meta.urlFonte && (
        <a href={meta.urlFonte} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-blue-600 hover:underline">
          Ver fonte <ExternalLink className="h-3 w-3" aria-hidden="true" /><span className="sr-only"> (abre em nova aba)</span>
        </a>
      )}
    </p>
  );
}
