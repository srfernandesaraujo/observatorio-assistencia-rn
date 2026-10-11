import { useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, Search } from "lucide-react";
import { lerDataset, type Linha, type MetadadosDataset } from "../lib/datasets";
import { normalizar } from "../lib/texto";
import { SeloFonte } from "./SeloFonte";

function dataBR(iso: unknown): string {
  const m = String(iso ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

// Repositório de documentos oficiais e materiais educativos (somente com link para a fonte).
export function Repositorio() {
  const [estado, setEstado] = useState<"carregando" | "vazio" | "erro" | "ok">("carregando");
  const [meta, setMeta] = useState<MetadadosDataset | null>(null);
  const [docs, setDocs] = useState<Linha[]>([]);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("Todos");

  useEffect(() => {
    let ativo = true;
    lerDataset("repositorio_documentos")
      .then((r) => {
        if (!ativo) return;
        if (!r || r.linhas.length === 0) return setEstado("vazio");
        setMeta(r.meta);
        setDocs([...r.linhas].sort((a, b) => String(b.data_publicacao ?? "").localeCompare(String(a.data_publicacao ?? ""))));
        setEstado("ok");
      })
      .catch(() => ativo && setEstado("erro"));
    return () => {
      ativo = false;
    };
  }, []);

  const tipos = useMemo(() => ["Todos", ...Array.from(new Set(docs.map((d) => String(d.tipo))))], [docs]);
  const visiveis = useMemo(() => {
    const q = normalizar(busca);
    return docs.filter(
      (d) =>
        (tipo === "Todos" || d.tipo === tipo) &&
        (!q || normalizar([d.titulo, d.orgao, d.resumo].map((x) => String(x ?? "")).join(" ")).includes(q))
    );
  }, [docs, busca, tipo]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-2">
        <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" /> Educação e Repositório
        </h2>
        <p className="text-xs text-slate-500">Notas técnicas, protocolos, legislação e materiais educativos. Cada item leva ao documento na fonte oficial.</p>
        {meta && <SeloFonte meta={meta} />}
      </div>

      {estado === "carregando" && <p className="text-xs text-slate-500">Carregando…</p>}
      {estado === "erro" && <p className="text-xs text-red-600">Não foi possível carregar o repositório agora.</p>}
      {estado === "vazio" && (
        <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6">Aguardando documentos. O repositório será preenchido pela equipe do observatório, sempre com link para a fonte oficial.</p>
      )}

      {estado === "ok" && (
        <>
          <div className="flex flex-col md:flex-row gap-3">
            <label className="relative flex-1">
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por título, órgão ou assunto"
                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs bg-white"
              />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tipos.map((t) => (
                <button key={t} onClick={() => setTipo(t)} className={`px-3 py-1 rounded-full text-xs border cursor-pointer ${tipo === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {visiveis.length === 0 && <p className="text-xs text-slate-500">Nenhum documento encontrado.</p>}
          <div className="space-y-3">
            {visiveis.map((d, i) => (
              <article key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.75rem] font-mono font-bold px-2 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-200">{String(d.tipo)}</span>
                  {d.data_publicacao ? <span className="text-[0.75rem] text-slate-500 font-mono">{dataBR(d.data_publicacao)}</span> : null}
                </div>
                <h3 className="font-semibold text-sm text-slate-900">{String(d.titulo)}</h3>
                <p className="text-[0.75rem] text-slate-500">{String(d.orgao)}</p>
                {d.resumo ? <p className="text-xs text-slate-700">{String(d.resumo)}</p> : null}
                {/^https?:\/\//i.test(String(d.link)) && (
                  <a href={String(d.link)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-blue-600 hover:underline">
                    Ver documento oficial <ExternalLink className="h-3 w-3" aria-hidden="true" /><span className="sr-only"> (abre em nova aba)</span>
                  </a>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
