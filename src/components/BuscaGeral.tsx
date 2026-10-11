import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ExternalLink, Search, X } from "lucide-react";
import { MAX_RESULTADOS, buscar, indiceDinamico, indiceEstatico, type EntradaBusca, type Rota } from "../lib/busca";

interface Props {
  onIr: (rota: Rota) => void;
}

// Busca geral no cabeçalho: campo sempre visível; ao digitar, os resultados aparecem logo abaixo.
// Procura nas seções do site, nos programas e nos dados publicados (repositório, alertas, faltas, pregões, produção científica).
export function BuscaGeral({ onIr }: Props) {
  const [consulta, setConsulta] = useState("");
  const [aberto, setAberto] = useState(false);
  const [dinamico, setDinamico] = useState<EntradaBusca[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [topo, setTopo] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const carregou = useRef(false);
  const foiFechado = useRef(false); // foco devolvido ao campo depois de fechar não reabre o painel
  const estatico = useMemo(indiceEstatico, []);

  // Os dados publicados são lidos uma vez por visita, na primeira vez que a pessoa usa o campo.
  const carregar = () => {
    if (carregou.current) return;
    carregou.current = true;
    setCarregando(true);
    indiceDinamico().then((d) => {
      setDinamico(d);
      setCarregando(false);
    });
  };

  const indice = useMemo(() => [...estatico, ...dinamico], [estatico, dinamico]);
  const achados = useMemo(() => buscar(indice, consulta), [indice, consulta]);
  const mostrados = achados.slice(0, MAX_RESULTADOS);
  const temConsulta = consulta.trim().length > 0;
  const painelAberto = aberto && temConsulta;

  // O painel é fixo na tela (não é cortado pelo cabeçalho); a posição vertical segue o campo.
  const medir = () => {
    const r = campo.current?.getBoundingClientRect();
    if (r) setTopo(r.bottom + 8);
  };
  useLayoutEffect(() => {
    if (!painelAberto) return;
    medir();
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, { passive: true });
    return () => {
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir);
    };
  }, [painelAberto]);

  // Clique fora fecha o painel
  useEffect(() => {
    if (!aberto) return;
    const aoClicar = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, [aberto]);

  const fecharEFocar = () => {
    foiFechado.current = true;
    setAberto(false);
    campo.current?.focus();
  };

  // Esc fecha o painel e devolve o foco ao campo; Tab para fora do conjunto também fecha
  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && aberto) {
      e.stopPropagation();
      fecharEFocar();
    }
  };
  const aoSairFoco = (e: React.FocusEvent) => {
    if (raiz.current && !raiz.current.contains(e.relatedTarget as Node | null)) setAberto(false);
  };

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
    <div ref={raiz} onKeyDown={aoTeclar} onBlur={aoSairFoco} className="relative">
      <label htmlFor="busca-campo" className="sr-only">Buscar no site</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input
          id="busca-campo"
          ref={campo}
          type="search"
          value={consulta}
          onChange={(e) => {
            setConsulta(e.target.value);
            setAberto(true);
            carregar();
          }}
          onFocus={() => {
            carregar();
            if (foiFechado.current) foiFechado.current = false;
            else if (consulta.trim()) setAberto(true);
          }}
          onClick={() => consulta.trim() && setAberto(true)}
          placeholder="Buscar no site"
          autoComplete="off"
          className="w-40 rounded-lg border border-slate-300 bg-white py-1 pl-8 pr-2 text-xs text-slate-800 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-40"
        />
      </div>

      <div role="status" aria-live="polite" className="sr-only">{resumo}</div>

      {painelAberto && (
        <div
          id="busca-resultados"
          style={{ top: topo }}
          className="fixed inset-x-4 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white font-sans shadow-2xl sm:inset-x-auto sm:right-6 sm:w-[36rem]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2">
            <p className="text-xs text-slate-600">
              {achados.length > 0 ? resumo : carregando ? "Buscando nos dados publicados…" : ""}
              {achados.length > 0 && carregando && " Carregando mais dados…"}
            </p>
            <button
              type="button"
              onClick={fecharEFocar}
              aria-label="Fechar os resultados"
              className="cursor-pointer rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {achados.length === 0 && !carregando && (
              <p className="p-2 text-sm text-slate-600">Nenhum resultado para “{consulta.trim()}”. Tente outra palavra ou menos palavras.</p>
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
      )}
    </div>
  );
}
