import { useEffect, useRef, useState } from "react";
import { ArrowRight, Info, MessageSquare, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Mensagem = { role: "user" | "model" | "system"; text: string };

const BOAS_VINDAS: Mensagem = {
  role: "model",
  text: "Olá! Sou o assistente do **Observatório da Assistência Farmacêutica do RN**. Respondo apenas com os dados publicados aqui, sempre citando a fonte. Posso ajudar com alertas sanitários, programas de acesso a medicamentos e indicadores. Não substituo o farmacêutico nem o médico.",
};

const SUGESTOES = [
  { label: "Alertas recentes", q: "Quais são os alertas sanitários mais recentes?" },
  { label: "Como obter remédios", q: "Como posso obter medicamentos pelo SUS?" },
  { label: "Faltas de medicamentos", q: "Há medicamentos em falta no RN?" },
];

interface Props {
  aberto: boolean;
  aoAbrir: () => void;
  aoFechar: () => void;
}

// Assistente de perguntas (IA ancorada nos dados publicados): botão flutuante e janela de conversa.
export function AssistenteChat({ aberto, aoAbrir, aoFechar }: Props) {
  const [pergunta, setPergunta] = useState("");
  const [conversa, setConversa] = useState<Mensagem[]>([BOAS_VINDAS]);
  const [carregando, setCarregando] = useState(false);

  const fimRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const dialogoRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);

  // Janela do assistente: foco no campo ao abrir, Esc fecha, Tab fica dentro da janela e o foco volta ao botão
  useEffect(() => {
    if (!aberto) return;
    campoRef.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        aoFechar();
        return;
      }
      if (e.key !== "Tab" || !dialogoRef.current) return;
      const focaveis = dialogoRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');
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
      botaoRef.current?.focus();
    };
  }, [aberto]);

  // Rola a conversa até a última mensagem
  useEffect(() => {
    if (aberto) {
      fimRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversa, carregando, aberto]);

  // Chat com o Gemini
  const enviar = async (texto?: string) => {
    const final = texto || pergunta;
    if (!final.trim()) return;

    setConversa((prev) => [...prev, { role: "user", text: final }]);
    setPergunta("");
    setCarregando(true);

    try {
      const response = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: final }),
      });
      const data = await response.json();

      setConversa((prev) => [...prev, { role: "model", text: data.response || data.error || "Sem resposta do assistente." }]);
    } catch (error) {
      setConversa((prev) => [
        ...prev,
        {
          role: "system",
          text: "Erro de conexão com o módulo de IA. Tente novamente em instantes.",
        },
      ]);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <aside aria-label="Assistente do Observatório" className="print:hidden">
      <button
        ref={botaoRef}
        onClick={aoAbrir}
        aria-label="Abrir o assistente de perguntas"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        id="btn-floating-chat"
        title="Assistente do Observatório"
      >
        <MessageSquare className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Modal do Chat */}
      {aberto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div ref={dialogoRef} role="dialog" aria-modal="true" aria-labelledby="chat-titulo" className="bg-white rounded-2xl border border-slate-200 flex flex-col w-full max-w-2xl h-[85vh] max-h-[42.5rem] shadow-2xl overflow-hidden font-sans">

            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between font-sans">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 id="chat-titulo" className="font-display font-bold text-sm text-slate-900 font-sans">Assistente do Observatório</h2>
                  <p className="text-[0.75rem] text-slate-500 font-mono">Responde só com dados publicados</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[0.75rem] bg-emerald-50 border border-emerald-250 text-emerald-700 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulsing-alert"></span>
                  ATIVO
                </span>
                <button
                  onClick={aoFechar}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  aria-label="Fechar o assistente"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Chat Bubbles Scroll */}
            <div role="log" aria-live="polite" aria-label="Conversa com o assistente" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth bg-slate-50/30">
              {conversa.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-4 text-xs ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none font-medium shadow-sm"
                        : msg.role === "system"
                        ? "bg-red-50 border border-red-100 text-red-800 rounded-tl-none font-mono text-[0.75rem]"
                        : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-none leading-relaxed shadow-sm"
                    }`}
                  >
                    {msg.role !== "user" ? (
                      <div className="markdown-body pr-1 text-slate-800">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <span>{msg.text}</span>
                    )}
                  </div>
                </div>
              ))}

              {carregando && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-150 rounded-2xl rounded-tl-none p-4 max-w-[80%] flex items-center gap-3 shadow-sm">
                    <div className="flex gap-1.5 items-center">
                      <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">Processando dados e gerando diagnósticos...</span>
                  </div>
                </div>
              )}
              <div ref={fimRef} />
            </div>

            {/* QUICK QUERY CHIPS */}
            <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-1.5 items-center">
              <span className="text-[0.75rem] font-mono text-slate-500 flex items-center gap-1 mr-1">
                <Info className="h-3 w-3" /> Sugestões:
              </span>
              {SUGESTOES.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => enviar(chip.q)}
                  className="text-[0.75rem] bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 px-2 py-1 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap font-sans"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enviar();
              }}
              className="p-3 bg-white border-t border-slate-200 flex gap-2 font-sans"
            >
              <input
                ref={campoRef}
                type="text"
                aria-label="Sua pergunta"
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                placeholder="Ex.: Como obtenho medicamentos pelo SUS?"
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 placeholder-slate-500 font-sans"
                disabled={carregando}
              />
              <button
                type="submit"
                disabled={carregando || !pergunta.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs font-sans shadow-md disabled:shadow-none shrink-0"
              >
                Enviar
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

          </div>
        </div>
      )}
    </aside>
  );
}
