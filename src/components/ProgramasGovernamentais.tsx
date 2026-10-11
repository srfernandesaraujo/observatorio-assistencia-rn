import { ExternalLink, MapPin, ListChecks } from "lucide-react";
import { PROGRAMAS_GOVERNAMENTAIS } from "../content/programas";

export function ProgramasGovernamentais() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-display font-bold text-slate-900">Programas Governamentais</h2>
        <p className="text-xs text-slate-500 mt-1">
          Onde e como obter medicamentos pelo SUS e por programas do governo. Confirme sempre as regras vigentes na fonte oficial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROGRAMAS_GOVERNAMENTAIS.map((p) => (
          <article key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-slate-900">{p.nome}</h3>
              <span className="text-[0.75rem] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100 shrink-0">{p.esfera}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{p.resumo}</p>
            <p className="text-xs text-slate-600 flex gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span><strong className="text-slate-800">Onde:</strong> {p.ondeObter}</span>
            </p>
            <div className="text-xs text-slate-600">
              <p className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
                <ListChecks className="h-3.5 w-3.5 text-slate-500" /> Como acessar
              </p>
              <ul className="list-disc pl-5 space-y-0.5">
                {p.comoAcessar.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
            <a href={p.fonte.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-blue-600 hover:underline">
              Fonte: {p.fonte.rotulo} <ExternalLink className="h-3 w-3" aria-hidden="true" /><span className="sr-only"> (abre em nova aba)</span>
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
