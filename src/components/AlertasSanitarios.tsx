import { useEffect, useState } from "react";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { lerDataset, type Linha, type MetadadosDataset } from "../lib/datasets";
import { SeloFonte } from "./SeloFonte";

const COR_TIPO: Record<string, string> = {
  Recolhimento: "bg-red-50 text-red-700 border-red-200",
  Suspensão: "bg-amber-50 text-amber-800 border-amber-200",
  Proibição: "bg-red-50 text-red-700 border-red-200",
  Falsificação: "bg-purple-50 text-purple-700 border-purple-200",
  Outro: "bg-slate-50 text-slate-600 border-slate-200",
};

function dataBR(iso: unknown): string {
  const m = String(iso ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso ?? "");
}

// Alertas de vigilância sanitária (recolhimentos, suspensões etc.), mais recentes primeiro.
export function AlertasSanitarios() {
  const [estado, setEstado] = useState<"carregando" | "vazio" | "erro" | "ok">("carregando");
  const [meta, setMeta] = useState<MetadadosDataset | null>(null);
  const [alertas, setAlertas] = useState<Linha[]>([]);
  const [filtro, setFiltro] = useState("Todos");

  useEffect(() => {
    let ativo = true;
    lerDataset("alertas_sanitarios")
      .then((r) => {
        if (!ativo) return;
        if (!r || r.linhas.length === 0) return setEstado("vazio");
        setMeta(r.meta);
        setAlertas([...r.linhas].sort((a, b) => String(b.data).localeCompare(String(a.data))));
        setEstado("ok");
      })
      .catch(() => ativo && setEstado("erro"));
    return () => {
      ativo = false;
    };
  }, []);

  const tipos = ["Todos", ...Array.from(new Set(alertas.map((a) => String(a.tipo))))];
  const visiveis = filtro === "Todos" ? alertas : alertas.filter((a) => a.tipo === filtro);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-2">
        <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-600" /> Alertas Sanitários
        </h2>
        <p className="text-xs text-slate-500">
          Recolhimentos, suspensões e proibições de medicamentos divulgados pela Anvisa. Confira sempre o lote do seu medicamento e a fonte oficial.
        </p>
        {meta && <SeloFonte meta={meta} />}
      </div>

      {estado === "carregando" && <p className="text-xs text-slate-500">Carregando…</p>}
      {estado === "erro" && <p className="text-xs text-red-600">Não foi possível carregar os alertas agora.</p>}
      {estado === "vazio" && (
        <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6">Aguardando alertas. Esta seção será preenchida pela equipe do observatório.</p>
      )}

      {estado === "ok" && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {tipos.map((t) => (
              <button
                key={t}
                onClick={() => setFiltro(t)}
                className={`px-3 py-1 rounded-full text-xs border cursor-pointer ${filtro === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visiveis.map((a, i) => (
              <article key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[0.75rem] font-mono font-bold px-2 py-0.5 rounded border ${COR_TIPO[String(a.tipo)] ?? COR_TIPO.Outro}`}>{String(a.tipo)}</span>
                  <span className="text-[0.75rem] text-slate-500 font-mono">{dataBR(a.data)}</span>
                </div>
                <h3 className="font-semibold text-sm text-slate-900">{String(a.produto)}</h3>
                {a.empresa ? <p className="text-[0.75rem] text-slate-500">Empresa: {String(a.empresa)}</p> : null}
                <p className="text-xs text-slate-700">{String(a.motivo)}</p>
                <p className="text-[0.75rem] text-slate-600">
                  <strong>Lotes:</strong> {a.lotes ? String(a.lotes) : "todos os lotes ou conforme a fonte"}
                </p>
                {/^https?:\/\//i.test(String(a.link)) && <a href={String(a.link)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-blue-600 hover:underline">
                  Ver fonte oficial <ExternalLink className="h-3 w-3" aria-hidden="true" /><span className="sr-only"> (abre em nova aba)</span>
                </a>}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
