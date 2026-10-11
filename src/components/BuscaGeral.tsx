import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ExternalLink, Search, X } from "lucide-react";
import { MAX_RESULTADOS, buscar, indiceDinamico, indiceEstatico, type EntradaBusca, type Rota } from "../lib/busca";

interface Props {
  onIr: (rota: Rota) => void;
}

// Busca geral: seções do site, programas e dados publicados (repositório, alertas, faltas, pregões, produção científica).
export function BuscaGeral({ onIr }: Props) {
  const [aberto, setAberto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [dinamico, setDinamico] = useState<EntradaBusca[]>([]);
  const [carregando, setCarregando] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const estatico = useMemo(indiceEstatico, []);

  // Ao abrir: foco no campo e carga dos dados publicados (uma vez por visita)
  useEffect(() => {
    if (!aberto) return;
    campo.current?.focus();
    let ativo = true;
    setCarregando(true);
    indiceDinamico().then((d) => {
      if (!ativo) return;
      setDinamico(d);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [aberto]);

  // Esc fecha; Tab fica dentro da janela; o foco volta ao botão
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setAberto(false);
      if (e.key !== "Tab" || !caixa.current) return;
      const focaveis = caixa.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href]');
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      botao.current?.focus();
    };
  }, [aberto]);

  const indice = useMemo(() => [...estatico, ...dinamico], [estatico, dinamico]);
  const achados = useMemo(() => buscar(indice, consulta), [indice, consulta]);
  const mostrados = achados.slice(0, MAX_RESULTADOS);
  const temConsulta = consulta.trim().length > 0;

  const ir = (rota: Rota) => {
    setAberto(false);
    setConsulta("");
    onIr(rota);
  };

  const resumo = !temConsulta
    ? ""
    : achados.length === 0
    ? carregando
      ? "Buscando…"
      : "Nenhum resultado."
    : `${achados.length} ${achados.length === 1 ? "resultado" : "resultados"}${achados.length > MAX_RESULTADOS ? `; mostrando os ${MAX_RESULTADOS} mais relevantes` : ""}.`;

  return (
    <>
      <button
        ref={botao}
        type="button"
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        Buscar
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-[8vh] font-sans" onMouseDown={(e) => e.target === e.currentTarget && setAberto(false)}>
          <div ref={caixa} role="dialog" aria-modal="true" aria-labelledby="busca-titulo" className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4">
              <h2 id="busca-titulo" className="font-display text-sm font-bold text-slate-900">Buscar no Observatório</h2>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar a busca" className="cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-slate-200 hover:text-slate-900">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="border-b border-slate-200 p-3">
              <label htmlFor="busca-campo" className="sr-only">O que você procura?</label>
              <input
                id="busca-campo"
                ref={campo}
                type="search"
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                placeholder="Ex.: dipirona, hipertensão, farmácia popular"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="mt-2 text-xs text-slate-600">
                Procura nas seções do site, nos programas e nos dados publicados. {carregando && "Carregando os dados publicados…"}
              </p>
            </div>

            <div role="status" aria-live="polite" className="sr-only">{resumo}</div>

            <div className="flex-1 overflow-y-auto p-3">
              {!temConsulta && <p className="p-3 text-sm text-slate-600">Digite uma ou mais palavras. Acentos e maiúsculas não importam.</p>}
              {temConsulta && achados.length === 0 && !carregando && (
                <p className="p-3 text-sm text-slate-600">Nenhum resultado para “{consulta.trim()}”. Tente outra palavra ou menos palavras.</p>
              )}
              {mostrados.length > 0 && (
                <ul className="space-y-2">
                  {mostrados.map((r) => (
                    <li key={r.id} className="rounded-xl border border-slate-200 p-3">
                      <p className="text-[0.75rem] font-mono font-bold uppercase tracking-wide text-blue-700">{r.grupo}</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">{r.titulo}</p>
                      {r.trecho && <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{r.trecho}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <button type="button" onClick={() => ir(r.rota)} className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
                          Ir para a seção <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        </button>
                        {r.link && (
                          <a href={r.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:underline">
                            Abrir a fonte <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            <span className="sr-only">(abre em nova aba)</span>
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
