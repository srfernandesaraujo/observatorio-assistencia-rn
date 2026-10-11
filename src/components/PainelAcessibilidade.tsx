import { useEffect, useId, useRef, useState } from "react";
import { Accessibility, Minus, Plus, RotateCcw } from "lucide-react";
import {
  PASSOS_FONTE,
  aplicarPreferencias,
  guardarPreferencias,
  iniciarVLibras,
  lerPreferencias,
  padrao,
  type Preferencias,
} from "../lib/acessibilidade";

interface InterruptorProps {
  rotulo: string;
  descricao: string;
  ligado: boolean;
  aoMudar: (v: boolean) => void;
}

function Interruptor({ rotulo, descricao, ligado, aoMudar }: InterruptorProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p id={`${id}-r`} className="text-sm font-medium text-slate-900">{rotulo}</p>
        <p id={`${id}-d`} className="text-xs text-slate-600">{descricao}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-labelledby={`${id}-r`}
        aria-describedby={`${id}-d`}
        onClick={() => aoMudar(!ligado)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border-2 transition-colors cursor-pointer ${ligado ? "bg-blue-700 border-blue-700" : "bg-slate-200 border-slate-500"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white border border-slate-500 transition-all ${ligado ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

// Painel "Acessibilidade" no cabeçalho: tamanho do texto, contraste, espaçamento, movimento e Libras.
export function PainelAcessibilidade() {
  const [aberto, setAberto] = useState(false);
  const [prefs, setPrefs] = useState<Preferencias>(lerPreferencias);
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const idPainel = useId();

  useEffect(() => {
    aplicarPreferencias(prefs);
    if (prefs.libras) iniciarVLibras();
  }, [prefs]);

  // Esc fecha e devolve o foco ao botão; clique fora também fecha
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        botao.current?.focus();
      }
    };
    const aoClicar = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicar);
    };
  }, [aberto]);

  const mudar = (parcial: Partial<Preferencias>) => {
    const novo = { ...prefs, ...parcial };
    setPrefs(novo);
    guardarPreferencias(novo);
  };

  const restaurar = () => {
    const novo = padrao();
    setPrefs(novo);
    guardarPreferencias(novo);
  };

  const percentual = PASSOS_FONTE[prefs.passoFonte];

  return (
    <div ref={raiz} className="relative">
      <button
        ref={botao}
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        aria-controls={idPainel}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer"
      >
        <Accessibility className="h-4 w-4" aria-hidden="true" />
        Acessibilidade
      </button>

      {aberto && (
        <div
          id={idPainel}
          role="group"
          aria-label="Opções de acessibilidade"
          className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] max-h-[calc(100vh-12rem)] overflow-y-auto z-50 bg-white border border-slate-300 rounded-xl shadow-xl p-4 space-y-4 text-left font-sans"
        >
          <div>
            <p className="text-sm font-medium text-slate-900">Tamanho do texto</p>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => mudar({ passoFonte: Math.max(0, prefs.passoFonte - 1) })}
                disabled={prefs.passoFonte === 0}
                aria-label="Diminuir o tamanho do texto"
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-400 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="min-w-14 text-center text-sm font-semibold text-slate-900" role="status" aria-live="polite">
                {percentual}%
              </span>
              <button
                type="button"
                onClick={() => mudar({ passoFonte: Math.min(PASSOS_FONTE.length - 1, prefs.passoFonte + 1) })}
                disabled={prefs.passoFonte === PASSOS_FONTE.length - 1}
                aria-label="Aumentar o tamanho do texto"
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-400 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <Interruptor rotulo="Alto contraste" descricao="Fundo preto, texto claro e bordas destacadas." ligado={prefs.altoContraste} aoMudar={(v) => mudar({ altoContraste: v })} />
          <Interruptor rotulo="Espaçamento de texto" descricao="Mais espaço entre linhas, letras e palavras." ligado={prefs.espacamento} aoMudar={(v) => mudar({ espacamento: v })} />
          <Interruptor rotulo="Reduzir animações" descricao="Remove movimentos e transições." ligado={prefs.reduzirMovimento} aoMudar={(v) => mudar({ reduzirMovimento: v })} />
          <Interruptor rotulo="Tradução em Libras" descricao="Ativa o VLibras, do governo federal (carrega um serviço externo)." ligado={prefs.libras} aoMudar={(v) => mudar({ libras: v })} />

          <button
            type="button"
            onClick={restaurar}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-400 text-slate-800 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Restaurar padrões
          </button>
          <p className="text-xs text-slate-600">As escolhas ficam salvas apenas neste navegador.</p>
        </div>
      )}
    </div>
  );
}
