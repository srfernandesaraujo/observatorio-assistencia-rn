import { ProgramasGovernamentais } from "./components/ProgramasGovernamentais";
import { Judicializacao } from "./components/Judicializacao";
import { Landing, type Destino } from "./components/Landing";
import { Admin } from "./components/Admin";
import { Comparador } from "./components/Comparador";
import { Repositorio } from "./components/Repositorio";
import { VisaoGeral } from "./components/VisaoGeral";
import { AlertasSanitarios } from "./components/AlertasSanitarios";
import { TabelaDataset } from "./components/TabelaDataset";
import { lerPerfil, type Perfil } from "./lib/perfis";
import { EmElaboracao } from "./components/EmElaboracao";
import { useState, useEffect, useRef } from "react";
import {
  Layers,
  Home,
  Activity,
  FileText,
  AlertTriangle,
  Calendar,
  User,
  ArrowRight,
  Sparkles,
  Info,
  RefreshCw,
  ShieldAlert,
  Coins,
  ShieldCheck,
  Scale,
  BookOpen,
  Heart,
  Map,
  Settings,
  X,
  MessageSquare,
  BarChart3,
  Key
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { auth } from "./firebase";
import { 
  signInWithPopup,
  signInWithRedirect, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";

export default function App() {
  const [activeTab, setActiveTab] = useState<"inicio" | "principal" | "producao" | "configuracoes">("inicio");
  const [activeRnSubTab, setActiveRnSubTab] = useState<string>("visao_geral");

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Floating Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // States para Assistente de IA
  const [aiQuery, setAiQuery] = useState("");
  const [aiChat, setAiChat] = useState<{ role: "user" | "model" | "system"; text: string }[]>([
    {
      role: "model",
      text: "Olá! Sou o assistente do **Observatório da Assistência Farmacêutica do RN**. Respondo apenas com os dados publicados aqui, sempre citando a fonte. Posso ajudar com alertas sanitários, programas de acesso a medicamentos e indicadores. Não substituo o farmacêutico nem o médico."
    }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Perfil de acesso (null = verificando)
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Navegação superior: cada item abre uma área; "indicadores" mostra a barra lateral de módulos.
  type TopNavId = "inicio" | "indicadores" | "programas" | "educacao" | "impacto" | "producao" | "admin";
  const INDICADORES_SUBTABS = ["visao_geral", "comparador", "desabastecimento", "alertas", "custos", "qualidade", "judicializacao", "ats_farmacovigilancia"];
  const isIndicadores = activeTab === "principal" && INDICADORES_SUBTABS.includes(activeRnSubTab);
  const topNav: { id: TopNavId; label: string; icon: any }[] = [
    { id: "inicio", label: "Início", icon: Home },
    { id: "indicadores", label: "Indicadores", icon: Activity },
    { id: "programas", label: "Programas Governamentais", icon: Map },
    { id: "educacao", label: "Educação e Repositório", icon: BookOpen },
    { id: "impacto", label: "Relatório de Impacto", icon: Heart },
    { id: "producao", label: "Produção Científica", icon: FileText },
    ...(currentUser ? [{ id: "admin" as TopNavId, label: "Administração", icon: Settings }] : []),
  ];
  const currentTopNav: TopNavId =
    activeTab === "inicio" ? "inicio"
    : activeTab === "producao" ? "producao"
    : activeTab === "configuracoes" ? "admin"
    : isIndicadores ? "indicadores"
    : activeRnSubTab === "programas" ? "programas"
    : activeRnSubTab === "repositorio" ? "educacao"
    : "impacto";
  // Atalhos da página inicial: abrem uma seção específica de Indicadores ou outra área.
  const abrir = (d: Destino) => {
    if (d === "assistente") return setIsChatOpen(true);
    const sub: Record<string, string> = {
      indicadores: "visao_geral",
      comparador: "comparador",
      desabastecimento: "desabastecimento",
      alertas: "alertas",
      programas: "programas",
      educacao: "repositorio",
      impacto: "relatorio_impacto",
    };
    if (d === "producao") return setActiveTab("producao");
    setActiveTab("principal");
    setActiveRnSubTab(sub[d]);
    window.scrollTo({ top: 0 });
  };
  const goTo = (id: TopNavId) => {
    if (id === "inicio") setActiveTab("inicio");
    else if (id === "producao") setActiveTab("producao");
    else if (id === "admin") setActiveTab("configuracoes");
    else {
      setActiveTab("principal");
      setActiveRnSubTab(id === "indicadores" ? "visao_geral" : id === "programas" ? "programas" : id === "educacao" ? "repositorio" : "relatorio_impacto");
    }
  };

  // Scroll ao final do chat
  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiChat, aiLoading, isChatOpen]);

  // Estado de autenticação e permissão de administração
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setPerfil(null);
      if (user) setPerfil(await lerPerfil(user.email));
    });
    return () => unsubscribe();
  }, []);

  // Google Sign-In and Sign-Out Handlers
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (firstError: any) {
      let error = firstError;
      if (error?.code === "auth/popup-blocked" || error?.code === "auth/operation-not-supported-in-this-environment") {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError: any) {
          error = redirectError;
        }
      }
      console.error("Erro durante o login com o Google:", error);
      const code = error.code || "unknown";
            
      let msg = "Ocorreu um erro ao realizar o login com o Google.";
      if (code === "auth/unauthorized-domain") {
        msg = "Este endereço ainda não está autorizado para login. Avise a coordenação do projeto.";
      } else if (code === "auth/popup-blocked") {
        msg = "O popup de login foi bloqueado pelo seu navegador. Por favor, permita popups para este site e clique em entrar novamente.";
      } else if (code === "auth/operation-not-supported-in-this-environment") {
        msg = "Seu navegador não permitiu abrir a janela de login. Abra o site em uma aba normal e tente novamente.";
      } else if (code === "auth/configuration-not-found" || code === "auth/admin-restricted-operation" || code === "auth/unsupported-provider") {
        msg = "O login com Google não está disponível no momento. Avise a coordenação do projeto.";
      } else if (error.message) {
        msg = `Erro (${code}): ${error.message}`;
      }
      setAuthError(msg);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao deslogar do Firebase:", error);
    }
  };

  // Chat com o Gemini
  const handleAiSubmit = async (queryText?: string) => {
    const finalQuery = queryText || aiQuery;
    if (!finalQuery.trim()) return;

    setAiChat((prev) => [...prev, { role: "user", text: finalQuery }]);
    setAiQuery("");
    setAiLoading(true);

    try {
      const response = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: finalQuery })
      });
      const data = await response.json();
      
      setAiChat((prev) => [...prev, { role: "model", text: data.response || data.error || "Sem resposta do assistente." }]);
    } catch (error) {
      setAiChat((prev) => [
        ...prev,
        {
          role: "system",
          text: "Erro de conexão com o módulo de IA. Tente novamente em instantes."
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col antialiased">
      
      {/* HEADER / BRAND AREA */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/10">
            <Layers className="h-5 w-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-slate-900 flex items-center gap-2">
              Observatório da Assistência Farmacêutica
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/50">
                EM DESENVOLVIMENTO
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-sans">
              Transparência de dados da assistência farmacêutica no Rio Grande do Norte
            </p>
          </div>
        </div>

        {/* METADATA INFO */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
          {currentUser ? (
            <div className="flex items-center gap-2">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || "Usuário"}
                  referrerPolicy="no-referrer"
                  className="h-5 w-5 rounded-full border border-teal-500"
                />
              ) : (
                <User className="h-3.5 w-3.5 text-teal-600" />
              )}
              <span className="text-slate-700 font-medium truncate max-w-[150px]">
                {currentUser.displayName || currentUser.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-[10px] font-bold text-red-500 hover:text-red-700 ml-1.5 hover:underline cursor-pointer"
                title="Desconectar do Firebase"
              >
                Sair
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition-all cursor-pointer shadow-sm hover:shadow"
            >
              <Key className="h-3.5 w-3.5 animate-pulse" />
              Acesso administrativo
            </button>
          )}
          <div className="hidden sm:block h-3 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>{new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <nav className="bg-white px-6 py-2 border-b border-slate-200 flex overflow-x-auto gap-1 scrollbar-none sticky top-[73px] z-30 shadow-sm font-sans" aria-label="Navegação principal">
        {topNav.map((item) => (
          <button
            key={item.id}
            onClick={() => goTo(item.id)}
            aria-current={currentTopNav === item.id ? "page" : undefined}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap border ${
              currentTopNav === item.id
                ? "bg-blue-50 text-blue-600 border-blue-100 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">

        {/* INÍCIO: LANDING PAGE INSTITUCIONAL */}
        {activeTab === "inicio" && <Landing onNavigate={abrir} />}

        {/* PRODUÇÃO CIENTÍFICA */}
        {activeTab === "producao" && (
          <TabelaDataset templateId="producao_cientifica" titulo="Produção Científica" />
        )}

        {/* ÁREAS DO SITE: INDICADORES (COM BARRA LATERAL), PROGRAMAS, REPOSITÓRIO E IMPACTO */}
        {activeTab === "principal" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start font-sans">
            {isIndicadores && (
              <nav aria-label="Seções de indicadores" className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1 md:sticky md:top-[140px] z-20">
                <div className="pb-3 border-b border-slate-100 mb-3">
                  <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Indicadores</span>
                  <p className="text-[10px] text-slate-500 mt-2">Dados com fonte e data de atualização</p>
                </div>
                {[
                  { id: "visao_geral", label: "Visão geral", icon: Activity },
                  { id: "comparador", label: "Comparador territorial", icon: BarChart3 },
                  { id: "desabastecimento", label: "Desabastecimento e pregões", icon: AlertTriangle },
                  { id: "alertas", label: "Alertas sanitários", icon: ShieldAlert },
                  { id: "custos", label: "Custos e orçamento", icon: Coins },
                  { id: "judicializacao", label: "Judicialização", icon: Scale },
                  { id: "qualidade", label: "Qualidade dos serviços", icon: ShieldCheck },
                  { id: "ats_farmacovigilancia", label: "ATS", icon: RefreshCw },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveRnSubTab(item.id)}
                    aria-current={activeRnSubTab === item.id ? "page" : undefined}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-3 transition-all cursor-pointer border ${
                      activeRnSubTab === item.id
                        ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold shadow-sm"
                        : "bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${activeRnSubTab === item.id ? "text-blue-600" : "text-slate-400"}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </nav>
            )}

            <div className={isIndicadores ? "lg:col-span-3 space-y-6" : "lg:col-span-4 space-y-6"}>
              {activeRnSubTab === "visao_geral" && <VisaoGeral onNavigate={setActiveRnSubTab} />}
              {activeRnSubTab === "comparador" && <Comparador />}
              {activeRnSubTab === "desabastecimento" && (
                <div className="space-y-6">
                  <TabelaDataset templateId="desabastecimento" />
                  <TabelaDataset templateId="pregoes" titulo="Acompanhamento de pregões" />
                </div>
              )}
              {activeRnSubTab === "alertas" && <AlertasSanitarios />}
              {activeRnSubTab === "custos" && <TabelaDataset templateId="custos" />}
              {activeRnSubTab === "judicializacao" && <Judicializacao />}
              {activeRnSubTab === "qualidade" && (
                <EmElaboracao titulo="Qualidade dos serviços" texto="Esta seção usará instrumentos validados de qualidade e acreditação, em definição com a SUAF. Nenhum dado de exemplo é exibido enquanto isso." />
              )}
              {activeRnSubTab === "ats_farmacovigilancia" && (
                <EmElaboracao titulo="Avaliação de tecnologias em saúde (ATS)" texto="As análises de ATS estão em organização com a equipe responsável e serão publicadas com fonte e data." />
              )}
              {activeRnSubTab === "programas" && <ProgramasGovernamentais />}
              {activeRnSubTab === "repositorio" && <Repositorio />}
              {activeRnSubTab === "relatorio_impacto" && (
                <EmElaboracao titulo="Relatório de impacto" texto="O relatório de impacto será elaborado com dados verificados e metodologia aberta." />
              )}
            </div>
          </div>
        )}

        {/* ADMINISTRAÇÃO: IMPORTAÇÃO DE PLANILHAS */}
        {activeTab === "configuracoes" && currentUser && (
          <Admin email={currentUser.email || ""} perfil={perfil} />
        )}

      </main>

      {/* CHAT FLUTUANTE DA IA OBSERVADORA */}
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        id="btn-floating-chat"
        title="IA Observadora"
      >
        <MessageSquare className="h-6 w-6 animate-pulse" />
      </button>

      {/* Modal do Chat */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 flex flex-col w-full max-w-2xl h-[85vh] max-h-[680px] shadow-2xl overflow-hidden font-sans">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between font-sans">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 font-sans">Assistente do Observatório</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Responde só com dados publicados</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[9px] bg-emerald-50 border border-emerald-250 text-emerald-700 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulsing-alert"></span>
                  ATIVO
                </span>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chat Bubbles Scroll */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth bg-slate-50/30">
              {aiChat.map((msg, index) => (
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
                        ? "bg-red-50 border border-red-100 text-red-800 rounded-tl-none font-mono text-[10px]"
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
              
              {aiLoading && (
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
              <div ref={chatEndRef} />
            </div>

            {/* QUICK QUERY CHIPS */}
            <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-1.5 items-center">
              <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1 mr-1">
                <Info className="h-3 w-3" /> Sugestões:
              </span>
              {[
                { label: "Alertas recentes", q: "Quais são os alertas sanitários mais recentes?" },
                { label: "Como obter remédios", q: "Como posso obter medicamentos pelo SUS?" },
                { label: "Faltas de medicamentos", q: "Há medicamentos em falta no RN?" }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAiSubmit(chip.q)}
                  className="text-[10px] bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 px-2 py-1 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap font-sans"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAiSubmit();
              }}
              className="p-3 bg-white border-t border-slate-200 flex gap-2 font-sans"
            >
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Pergunte sobre remanejamentos, estoques, judicialização..."
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 placeholder-slate-400 font-sans"
                disabled={aiLoading}
              />
              <button
                type="submit"
                disabled={aiLoading || !aiQuery.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs font-sans shadow-md disabled:shadow-none shrink-0"
              >
                Enviar
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200 py-6 px-6 bg-white text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl w-full mx-auto">
        <div>
          <span>© 2026 Observatório da Assistência Farmacêutica do RN • Dados com fonte e data de atualização</span>
        </div>
        <div className="font-mono">
          <span>Projeto em desenvolvimento</span>
        </div>
      </footer>

      {/* ERRO DE LOGIN */}
      {authError && (
        <div role="alertdialog" aria-modal="true" aria-label="Falha no login" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 text-red-600">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h3 className="font-bold text-base text-slate-950">Não foi possível entrar</h3>
              </div>
              <button onClick={() => setAuthError(null)} aria-label="Fechar" className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{authError}</p>
            <div className="flex justify-end">
              <button onClick={() => setAuthError(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer">Fechar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
