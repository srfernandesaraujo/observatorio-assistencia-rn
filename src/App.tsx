import { ProgramasGovernamentais } from "./components/ProgramasGovernamentais";
import { Judicializacao } from "./components/Judicializacao";
import { Landing, type Destino } from "./components/Landing";
import { Admin } from "./components/Admin";
import { Comparador } from "./components/Comparador";
import { AlertasSanitarios } from "./components/AlertasSanitarios";
import { TabelaDataset } from "./components/TabelaDataset";
import { lerPerfil, type Perfil } from "./lib/perfis";
import { EmElaboracao } from "./components/EmElaboracao";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Layers,
  Home,
  Activity,
  FileText,
  Database,
  Cpu,
  AlertTriangle,
  UploadCloud,
  CheckCircle,
  Search,
  Calendar,
  User,
  Copy,
  Plus,
  ArrowRight,
  Sparkles,
  Send,
  Terminal,
  Info,
  Clock,
  Building,
  RefreshCw,
  TrendingDown,
  ExternalLink,
  ShieldAlert,
  Sliders,
  FileSpreadsheet,
  MapPin,
  TrendingUp,
  Coins,
  ShieldCheck,
  Scale,
  BookOpen,
  Heart,
  Map,
  Settings,
  X,
  MessageSquare,
  Lock,
  BarChart3,
  LineChart,
  HelpCircle,
  AlertCircle,
  Phone,
  Sun,
  Thermometer,
  Eye,
  EyeOff,
  Key
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  REGIOES_SAUDE_RN,
  CUSTOS_AF_RN,
  QUALIDADE_MEDIDAS_RN,
  JUDICIALIZACAO_RN,
  ATS_DOSSIERS_RN,
  REPOSITORIO_DOCUMENTOS_RN
} from "./rnData";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { 
  signInWithPopup,
  signInWithRedirect, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  setDoc,
  getDoc,
  getDocFromServer
} from "firebase/firestore";

export default function App() {
  const [activeTab, setActiveTab] = useState<"inicio" | "principal" | "producao" | "configuracoes">("inicio");
  const [activeRnSubTab, setActiveRnSubTab] = useState<string>("visao_geral");

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);

  // Floating Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // States para Módulos de Planejamento do RN
  const [selectedRegionId, setSelectedRegionId] = useState<string>("REG-VII");
  const [mapViewMode, setMapViewMode] = useState<"heatmap" | "solid">("heatmap");
  const [qaScores, setQaScores] = useState<Record<string, boolean>>({
    "QA-01": true,
    "QA-02": true,
    "QA-03": false,
    "QA-04": true,
    "QA-05": true,
    "QA-06": true,
    "QA-07": false,
  });
  const [docSearch, setDocSearch] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState<string>("All");
  const [reportPeriod, setReportPeriod] = useState("2026-S1");
  const [reportConfig, setReportConfig] = useState({
    biddingConsolidation: true,
    logisticsOptimization: true,
    judicialDeterrence: true
  });
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [stats, setStats] = useState<any>({
    totalMedicamentos: 8,
    totalInstituicoes: 5,
    desabastecidosCount: 1,
    criticosCount: 2,
    totalMovimentacoes: 6,
    alertaTotal: 3
  });
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  // States para Cópia de Código
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Carregar dados iniciais do Backend Express
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, alertsRes, transactionsRes] = await Promise.all([
        fetch("/api/dashboard/stats").then((r) => r.json()),
        fetch("/api/dashboard/stock-alerts").then((r) => r.json()),
        fetch("/api/dashboard/recent-transactions").then((r) => r.json())
      ]);

      if (!statsRes.error) setStats(statsRes);
      if (!alertsRes.error) setStockAlerts(alertsRes);
      if (!transactionsRes.error) setTransactions(transactionsRes);
    } catch (error) {
      console.warn("Erro ao buscar dados do servidor, utilizando fallback estático:", error);
      // Fallback estático caso o servidor backend esteja reiniciando ou indisponível
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Estado de autenticação e permissão de administração
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      setPerfil(null);
      if (user) setPerfil(await lerPerfil(user.email));
    });
    return () => unsubscribe();
  }, []);

  // Google Sign-In and Sign-Out Handlers
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthErrorCode(null);
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
      setAuthErrorCode(code);
      
      let msg = "Ocorreu um erro ao realizar o login com o Google.";
      if (code === "auth/unauthorized-domain") {
        msg = "Domínio não autorizado nas configurações do Firebase. Você precisa adicionar os domínios do AI Studio à lista de 'Domínios Autorizados' no console do Firebase Authentication.";
      } else if (code === "auth/popup-blocked") {
        msg = "O popup de login foi bloqueado pelo seu navegador. Por favor, permita popups para este site e clique em entrar novamente.";
      } else if (code === "auth/operation-not-supported-in-this-environment") {
        msg = "Operação não suportada. O ambiente de visualização do AI Studio roda dentro de um iframe seguro, o que impede a comunicação de popups em alguns navegadores. Clique no botão de 'Abrir em nova aba' no canto superior direito do preview para autenticar sem restrições!";
      } else if (code === "auth/configuration-not-found" || code === "auth/admin-restricted-operation" || code === "auth/unsupported-provider") {
        msg = "Provedor de Login com o Google não está ativado no seu projeto Firebase. Ative o método 'Google' na aba 'Sign-in Method' do Firebase Authentication.";
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

  // Manipular Cópia de Código
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 3. Gerar Relatório de Impacto Social (Economia e Vidas Salvas)
  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    setGeneratedReport(null);

    setTimeout(() => {
      let economiaAcumulada = 0;
      let vidasSalvas = 0;

      if (reportConfig.biddingConsolidation) {
        economiaAcumulada += 8450000;
        vidasSalvas += 125;
      }
      if (reportConfig.logisticsOptimization) {
        economiaAcumulada += 3120000;
        vidasSalvas += 145;
      }
      if (reportConfig.judicialDeterrence) {
        economiaAcumulada += 2680000;
        vidasSalvas += 72;
      }

      setGeneratedReport({
        titulo: "Relatório de Sustentabilidade Assistencial e Impacto Social",
        subtitulo: `Consolidado de Assistência Farmacêutica - Estado do Rio Grande do Norte`,
        periodo: reportPeriod === "2026-S1" ? "1º Semestre de 2026" : "Ano Completo de 2025",
        economia: economiaAcumulada,
        vidas: vidasSalvas,
        detalhes: [
          reportConfig.biddingConsolidation && {
            area: "Licitações Regionalizadas & Pregões Consolidados",
            economia: 8450000,
            impacto: "Redução de custos de aquisição em larga escala por meio de atas de registro de preços conjuntas na UNICAT.",
            vidasEstimadas: 125
          },
          reportConfig.logisticsOptimization && {
            area: "Otimização Logística & Remanejamentos Preventivos por IA",
            economia: 3120000,
            impacto: "Redução do desperdício de lotes vencidos e fretes duplicados por meio de cruzamento relacional e remanejamento dinâmico de segurança.",
            vidasEstimadas: 145
          },
          reportConfig.judicialDeterrence && {
            area: "Dispersão de Litigiosidade & ATS Estadual",
            economia: 2680000,
            impacto: "Deterrença de bloqueios judiciais e compras de varejo urgentes através da incorporação rápida de tecnologias avaliadas pelo comitê estadual.",
            vidasEstimadas: 72
          }
        ].filter(Boolean),
        dataGeracao: new Date().toLocaleString("pt-BR"),
        chaveAutenticidade: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-SUS-RN`
      });
      setIsGeneratingReport(false);
    }, 1200);
  };

  // 4. Calcular índice de qualidade de serviços de saúde
  const calculateQualityIndex = () => {
    const totalItems = QUALIDADE_MEDIDAS_RN.requisitosAcreditacao.length;
    const checkedItems = QUALIDADE_MEDIDAS_RN.requisitosAcreditacao.filter(req => qaScores[req.id]).length;
    return Math.round((checkedItems / totalItems) * 100);
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
          text: "Erro de conexão com o módulo de IA. Certifique-se de que o backend está online e a chave de API cadastrada."
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

        {/* LOADING SHIMMER */}
        {loading && activeTab === "principal" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl"></div>
            ))}
            <div className="md:col-span-3 h-96 bg-white border border-slate-200 rounded-xl"></div>
            <div className="h-96 bg-white border border-slate-200 rounded-xl"></div>
          </div>
        )}

        {/* AVISO DE DADOS ILUSTRATIVOS (enquanto as fontes reais não são integradas) */}
        {isIndicadores && !["comparador", "alertas", "judicializacao"].includes(activeRnSubTab) && (
          <div role="note" className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg px-4 py-2.5">
            <strong>Dados ilustrativos.</strong> Os números desta área são de demonstração e serão substituídos por fontes oficiais com data de atualização.
          </div>
        )}

        {/* TAB 1: PAINEL PRINCIPAL (SIDEBAR + CONTEÚDO) */}
        {!loading && activeTab === "principal" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start font-sans">
            
            {/* SIDEBAR SUB-TABS SELECTOR (ALWAYS VISIBLE) */}
            <div className={isIndicadores ? "lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1 md:sticky md:top-[140px] z-20 font-sans" : "hidden"}>
              <div className="pb-3 border-b border-slate-100 mb-3">
                <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">INDICADORES</span>
                <h3 className="font-display font-bold text-sm text-slate-900 mt-2 font-sans">Indicadores</h3>
                <p className="text-[10px] text-slate-500 font-sans">Dados com fonte e data de atualização</p>
              </div>
              {[
                { id: "visao_geral", label: "Visão Geral e Alertas", icon: Activity, hover: "hover:bg-blue-50 hover:text-blue-600" },
                { id: "comparador", label: "Comparador Territorial", icon: BarChart3, hover: "hover:bg-blue-50 hover:text-blue-600" },
                { id: "desabastecimento", label: "Desabastecimento RN", icon: AlertTriangle, hover: "hover:bg-red-50 hover:text-red-600" },
                { id: "alertas", label: "Alertas Sanitários", icon: ShieldAlert, hover: "hover:bg-red-50 hover:text-red-600" },
                { id: "custos", label: "Custos & Orçamento", icon: Coins, hover: "hover:bg-emerald-50 hover:text-emerald-600" },
                { id: "qualidade", label: "Qualidade de Serviços", icon: ShieldCheck, hover: "hover:bg-blue-50 hover:text-blue-600" },
                { id: "judicializacao", label: "Índice Judicialização", icon: Scale, hover: "hover:bg-purple-50 hover:text-purple-600" },
                { id: "ats_farmacovigilancia", label: "ATS", icon: RefreshCw, hover: "hover:bg-indigo-50 hover:text-indigo-600" },

              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => {
                    setActiveRnSubTab(subTab.id);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-3 transition-all cursor-pointer border ${
                    activeRnSubTab === subTab.id
                      ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold shadow-sm"
                      : `bg-white border-transparent text-slate-600 ${subTab.hover}`
                  }`}
                >
                  <subTab.icon className={`h-4 w-4 shrink-0 ${activeRnSubTab === subTab.id ? "text-blue-600" : "text-slate-400"}`} />
                  <span className="truncate">{subTab.label}</span>
                </button>
              ))}
            </div>

            {/* MAIN CORE CONTENT WORKSPACE (RIGHT SIDE) */}
            <div className={isIndicadores ? "lg:col-span-3 space-y-6" : "lg:col-span-4 space-y-6"}>
              
              {/* SUB-TAB 0: VISÃO GERAL */}
              {activeRnSubTab === "visao_geral" && (
                <>
            {/* CENTRO DE CONTROLE OPERACIONAL - DADOS CURADOS POR SERVIÇO */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-150 pb-3">
                <div>
                  <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Resumo Curado dos Serviços do Observatório
                  </h2>
                  <p className="text-xs text-slate-500">
                    Acesso imediato aos indicadores mais importantes de cada área operacional neste momento
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">Monitoramento Ativo</span>
                </div>
              </div>

              {/* GRID BENTO DOS SERVIÇOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. DESABASTECIMENTO */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">Ruptura & Abastecimento</span>
                      <span className="text-[10px] font-mono text-slate-400">SESAP-RN</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Desabastecimento Geral
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ruptura em <strong>6.8%</strong> da grade regular do estado, com foco na Região Metropolitana.
                    </p>
                    <div className="bg-white rounded border border-slate-100 p-2.5 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-600 font-semibold">VII Região (Metropolitana):</span>
                        <span className="text-red-600 font-bold">11.2%</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-600">Amoxicilina 500mg:</span>
                        <span className="text-red-500 font-bold">Crítico (0 dias)</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveRnSubTab("desabastecimento")}
                    className="mt-4 pt-2.5 border-t border-slate-100 text-xs font-semibold text-blue-600 hover:text-blue-750 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Abrir Painel de Desabastecimento <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {/* 2. CUSTOS E ORÇAMENTO */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded">Planejamento Orçamentário</span>
                      <span className="text-[10px] font-mono text-slate-400">UNICAT</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-emerald-600" />
                      Custos & Financiamento
                    </h3>
                    <p className="text-xs text-slate-500">
                      Acompanhamento orçamentário e economia de pregões de compra do Consórcio Estadual.
                    </p>
                    <div className="bg-white rounded border border-slate-100 p-2.5 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-600">Orçamento AF Anual:</span>
                        <span className="text-slate-800 font-bold">R$ 142.5M</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-600">Economia Unitária Média:</span>
                        <span className="text-emerald-600 font-bold">-22% Consórcio</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveRnSubTab("custos")}
                    className="mt-4 pt-2.5 border-t border-slate-100 text-xs font-semibold text-emerald-650 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Visualizar Planilha de Custos <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {/* 3. QUALIDADE DOS SERVIÇOS */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">Garantia & Acreditação</span>
                      <span className="text-[10px] font-mono text-slate-400">Farmacovigilância</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      Qualidade de Serviços
                    </h3>
                    <p className="text-xs text-slate-500">
                      Presença profissional, cadeia térmica e conformidade técnica das farmácias.
                    </p>
                    <div className="bg-white rounded border border-slate-100 p-2.5 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-600">Score de Acreditação:</span>
                        <span className="text-blue-600 font-bold">{calculateQualityIndex()}% de Conformidade</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-600">Estabilidade de Cadeia de Frio:</span>
                        <span className="text-emerald-600 font-bold">92% de Sucesso</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveRnSubTab("qualidade")}
                    className="mt-4 pt-2.5 border-t border-slate-100 text-xs font-semibold text-blue-650 hover:text-blue-705 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Avaliar Requisitos de Qualidade <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {/* 5. JUDICIALIZAÇÃO */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded">Litígios em Saúde</span>
                      <span className="text-[10px] font-mono text-slate-400">PGE / Poder Judiciário</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                      <Scale className="h-4 w-4 text-purple-600" />
                      Índice de Judicialização
                    </h3>
                    <p className="text-xs text-slate-500">
                      Gargalos de fornecimento judicial, valores bloqueados e pedidos de novos anticorpos.
                    </p>
                    <div className="bg-white rounded border border-slate-100 p-2.5 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-600">Ações Judiciais Ativas:</span>
                        <span className="text-slate-800 font-bold">184 Processos</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-600">Item mais litigado:</span>
                        <span className="text-purple-600 font-semibold">Pembrolizumabe (Oncológico)</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveRnSubTab("judicializacao")}
                    className="mt-4 pt-2.5 border-t border-slate-100 text-xs font-semibold text-purple-650 hover:text-purple-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Auditar Processos Judiciais <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {/* 6. ATS E VIGILÂNCIA */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded">Incorporação de Tecnologias</span>
                      <span className="text-[10px] font-mono text-slate-400">SUVISA / CONITEC</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                      <RefreshCw className="h-4 w-4 text-indigo-500" />
                      ATS & Farmacovigilância
                    </h3>
                    <p className="text-xs text-slate-500">
                      Avaliação de Custo-Efetividade de novos fármacos e notificação de queixas técnicas de medicamentos.
                    </p>
                    <div className="bg-white rounded border border-slate-100 p-2.5 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-600">Notificações Recentes RAM:</span>
                        <span className="text-indigo-600 font-bold">Lote L-ATO705 (Sob Suspeita)</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-600">Dossiês de Incorporação:</span>
                        <span className="text-slate-800 font-semibold">3 Dossiês Ativos</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveRnSubTab("ats_farmacovigilancia")}
                    className="mt-4 pt-2.5 border-t border-slate-100 text-xs font-semibold text-indigo-650 hover:text-indigo-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Ver Queixas e Estudos <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

              </div>

              {/* OUTRAS INICIATIVAS DO OBSERVATÓRIO */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">Serviços Auxiliares de Apoio</h4>
                    <p className="text-[11px] text-slate-500">Consulte nossa biblioteca de notas técnicas ou compile o demonstrativo de impacto social.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => setActiveRnSubTab("repositorio")}
                    className="flex-1 sm:flex-none text-center px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-all cursor-pointer"
                  >
                    Protocolos e Guias
                  </button>
                  <button 
                    onClick={() => setActiveRnSubTab("relatorio_impacto")}
                    className="flex-1 sm:flex-none text-center px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg text-[11px] transition-all cursor-pointer"
                  >
                    Relatório de Vidas
                  </button>
                </div>
              </div>
            </div>

            {/* AI FLOATING COMPONENT CALLOUT */}
            <div className="bg-slate-100 p-6 rounded-xl border border-slate-250/60 flex flex-col md:flex-row items-center justify-between gap-6 mt-2 shadow-sm">
              <div className="flex gap-4 items-center">
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-sm">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-base">Faça consultas preditivas ao Observatório</h3>
                  <p className="text-sm text-slate-600">
                    Nossa IA entende o modelo relacional e pode calcular desabastecimentos, propor transferências de lotes entre hospitais e gerar consultas SQL sob demanda.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsChatOpen(true);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-blue-500/10 transition-all flex items-center gap-2 cursor-pointer text-sm w-full md:w-auto justify-center font-sans"
              >
                Abrir Chat com IA
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
              
              {/* SUB-TAB 1: TAXA DE DESABASTECIMENTO */}
              {activeRnSubTab === "desabastecimento" && (
                <div className="space-y-6">
                  <TabelaDataset templateId="desabastecimento" />
                  <TabelaDataset templateId="pregoes" titulo="Acompanhamento de pregões" />
                  {/* Banner */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          Taxa de Desabastecimento no Estado do RN
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Monitoramento contínuo de indisponibilidade de insumos essenciais em toda a rede pública do RN.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 bg-red-50 border border-red-100 p-3 rounded-xl">
                        <TrendingDown className="h-5 w-5 text-red-600 shrink-0" />
                        <div>
                          <p className="text-[10px] font-mono uppercase text-red-600 font-bold">Taxa Estadual Atual</p>
                          <p className="text-2xl font-bold font-mono text-red-700">6.8%</p>
                          <p className="text-[9px] text-red-500 mt-0.5">Meta SESAP: &lt; 5.0% (Anterior: 14.5%)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grid das Regiões de Saúde */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Desempenho por Regiões de Saúde (SESAP-RN)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {REGIOES_SAUDE_RN.map((reg) => (
                        <div key={reg.id} className="border border-slate-100 p-3.5 rounded-xl hover:border-slate-200 transition-all bg-slate-50/50">
                          <p className="text-[10px] font-mono text-slate-400">{reg.id} • Sede: {reg.sede}</p>
                          <h4 className="font-semibold text-xs text-slate-800 mt-1 truncate">{reg.nome.split(" (")[0]}</h4>
                          
                          {/* Progress bar desabastecimento */}
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-slate-500">Desabastecimento</span>
                              <span className={`font-bold ${reg.taxaDesabastecimento > 8 ? 'text-red-600' : reg.taxaDesabastecimento > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {reg.taxaDesabastecimento}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  reg.taxaDesabastecimento > 8 ? 'bg-red-500' : reg.taxaDesabastecimento > 5 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(reg.taxaDesabastecimento * 8, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Eficiência de Compras (Tabela) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Eficiência de Pregões Consolidados (Consórcio Estadual)</h3>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono px-2 py-0.5 rounded-full font-semibold">Economia Geral: -22%</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-mono">
                            <th className="py-2 font-normal">Pregão / Item</th>
                            <th className="py-2 font-normal text-right">Preço Máximo Regulado (CMED)</th>
                            <th className="py-2 font-normal text-right">Preço de Fechamento Consórcio</th>
                            <th className="py-2 font-normal text-right text-emerald-600">Economia Unitária</th>
                            <th className="py-2 font-normal text-right">Volume Comprado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {[
                            { item: "Amoxicilina 500mg (Cápsula)", cmed: "R$ 0,82", fechamento: "R$ 0,58", economia: "29%", vol: "1.200.000 un." },
                            { item: "Losartana Potássica 50mg", cmed: "R$ 0,34", fechamento: "R$ 0,26", economia: "23%", vol: "5.000.000 un." },
                            { item: "Atorvastatina Cálcica 20mg", cmed: "R$ 2,45", fechamento: "R$ 1,98", economia: "19%", vol: "800.000 un." }
                          ].map((row, idx) => (
                            <tr key={idx} className="text-slate-700">
                              <td className="py-2.5 font-medium">{row.item}</td>
                              <td className="py-2.5 text-right font-mono text-slate-500">{row.cmed}</td>
                              <td className="py-2.5 text-right font-mono text-slate-800">{row.fechamento}</td>
                              <td className="py-2.5 text-right font-mono text-emerald-600 font-bold">-{row.economia}</td>
                              <td className="py-2.5 text-right font-mono text-slate-500">{row.vol}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Planning Context */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h4 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider mb-2">Estruturação & Integração de Desabastecimento no Sistema</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
                      <div>
                        <strong className="text-slate-800">Como Funciona no RN:</strong>
                        <p className="mt-1">
                          A taxa de desabastecimento é calculada diariamente cruzando dados dos sistemas locais das farmácias públicas de cada município (através do Hórus/SESAP-RN e sistemas próprios) com o consumo médio mensal projetado. Níveis abaixo de 15 dias de cobertura entram em atenção moderada, e abaixo de 7 dias, em status crítico.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-800">Como Agrega ao Sistema:</strong>
                        <p className="mt-1">
                          Esse módulo alimenta a fila de alertas em tempo real do sistema. O modelo relacional permite à IA correlacionar faltas municipais com excedentes no Almoxarifado Central (UNICAT) ou outros hospitais regionais próximos, propondo remanejamentos imediatos e automatizando minutas de transporte antes que ocorra a falta completa.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: CUSTO DA ASSISTÊNCIA FARMACÊUTICA */}
              {activeRnSubTab === "custos" && (
                <div className="space-y-6">
                  <TabelaDataset templateId="custos" />
                  {/* Banner */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                          <Coins className="h-5 w-5 text-emerald-600" />
                          Custos & Financiamento da Assistência Farmacêutica
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Análise orçamentária detalhada das três esferas de financiamento para provisão de fármacos ao RN.
                        </p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-2">
                        <Coins className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-[9px] text-slate-400 font-mono uppercase">Orçamento Anual Vigente</p>
                          <p className="text-xl font-bold font-mono text-slate-800">R$ 142.500.000</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Orçamento por Componentes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                      <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Distribuição por Categoria de Componente</h3>
                      <div className="space-y-4">
                        {CUSTOS_AF_RN.distribuicao.map((dist, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-slate-700">{dist.categoria}</span>
                              <span className="font-mono text-slate-500">R$ {(dist.valor / 1000000).toFixed(1)}M ({dist.percentual}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  idx === 0 ? "bg-blue-500" :
                                  idx === 1 ? "bg-purple-500" :
                                  idx === 2 ? "bg-emerald-500" : "bg-red-500"
                                }`}
                                style={{ width: `${dist.percentual}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Evolução Histórica (Custom SVG Chart) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                      <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Evolução Histórica de Gastos (R$)</h3>
                      
                      {/* Custom SVG Line Chart */}
                      <div className="h-44 w-full border-b border-l border-slate-200 relative flex items-end pb-5 pl-8 pr-2">
                        {/* Eixo Y labels */}
                        <div className="absolute left-1 top-2 text-[9px] font-mono text-slate-400 space-y-7">
                          <div>R$ 140M</div>
                          <div>R$ 120M</div>
                          <div>R$ 100M</div>
                        </div>
                        
                        {/* Bars / Lines represented graphically with Flex columns */}
                        <div className="w-full flex justify-between items-end h-full px-2">
                          {CUSTOS_AF_RN.historicoGasto.map((item, idx) => {
                            const ratio = item.total / 142500000;
                            const heightPercentage = Math.round(ratio * 100);
                            return (
                              <div key={idx} className="flex flex-col items-center gap-1.5 w-12">
                                <div className="text-[9px] font-bold font-mono text-slate-700">R$ {(item.total / 1000000).toFixed(0)}M</div>
                                <div 
                                  className="w-8 bg-blue-500/20 hover:bg-blue-500/30 transition-colors rounded-t border-t-2 border-blue-600 cursor-pointer"
                                  style={{ height: `${heightPercentage * 0.8}px` }}
                                ></div>
                                <div className="text-[9px] font-mono text-slate-500 mt-1">{item.ano}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Planning Context */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h4 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider mb-2">Estruturação & Integração de Custos no Sistema</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
                      <div>
                        <strong className="text-slate-800">Como Funciona no RN:</strong>
                        <p className="mt-1">
                          Os dados de custo são alimentados a partir de arquivos XML de notas fiscais de empenho e dados das atas de pregões públicos registrados pela UNICAT. O sistema calcula o custo médio de aquisição por princípio ativo e compara em tempo real com o preço teto estabelecido pela ANVISA (Tabela CMED) e as faturas de outros estados da região Nordeste.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-800">Como Agrega ao Sistema:</strong>
                        <p className="mt-1">
                          Esses dados financeiros se fundem ao modelo de monitoramento clínico para gerar relatórios automatizados de custo-efetividade e apoiar o comitê de finanças em negociações bilaterais de compra direta ou de judicialização, apontando quais licitações estão com as melhores margens e otimizando a distribuição financeira.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: QUALIDADE DOS SERVIÇOS */}
              {activeRnSubTab === "qualidade" && (
                <div className="space-y-6">
                  {/* Banner */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-blue-600" />
                          Qualidade dos Serviços Farmacêuticos no RN
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Indicadores de atendimento ao paciente, presença de farmacêutico e segurança térmica na cadeia do SUS.
                        </p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-sm shadow-sm">
                          {calculateQualityIndex()}%
                        </div>
                        <div>
                          <p className="text-[9px] text-blue-700 font-mono uppercase font-bold">Conformidade do Município</p>
                          <p className="text-xs font-semibold text-slate-800">Score de Acreditação</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">Dinâmico conforme checklist</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-mono uppercase">Presença Profissional</span>
                      <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{QUALIDADE_MEDIDAS_RN.presencaProfissional}%</p>
                      <p className="text-[9px] text-emerald-600 mt-1 font-mono">Farmacêuticos em Tempo Integral</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-mono uppercase">Cadeia de Frio</span>
                      <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{QUALIDADE_MEDIDAS_RN.cadeiaFrioConformidade}%</p>
                      <p className="text-[9px] text-emerald-600 mt-1 font-mono">Conformidade Térmica (IoT)</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-mono uppercase">Satisfação Ouvidoria</span>
                      <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{QUALIDADE_MEDIDAS_RN.satisfacaoUsuario}/10</p>
                      <p className="text-[9px] text-slate-500 mt-1 font-mono">Nota Geral de Avaliação SUS</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-mono uppercase">Tempo Médio Espera</span>
                      <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{QUALIDADE_MEDIDAS_RN.tempoEsperaMinutos}m</p>
                      <p className="text-[9px] text-emerald-600 mt-1 font-mono">Espera Média por Atendimento</p>
                    </div>
                  </div>

                  {/* Interactive Checklist Acreditação */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Checklist */}
                    <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                      <div>
                        <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Checklist Interativo de Requisitos de Credenciamento</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Marque ou desmarque os requisitos para auditar o impacto na conformidade da unidade do RN.</p>
                      </div>
                      
                      <div className="space-y-2 mt-3 overflow-y-auto max-h-[260px] pr-1.5">
                        {QUALIDADE_MEDIDAS_RN.requisitosAcreditacao.map((item) => (
                          <label 
                            key={item.id} 
                            className={`flex items-start gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                              qaScores[item.id] 
                                ? "bg-slate-50/50 border-blue-100 text-slate-800" 
                                : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={qaScores[item.id] || false}
                              onChange={(e) => {
                                setQaScores((prev) => ({ ...prev, [item.id]: e.target.checked }));
                              }}
                              className="mt-0.5 h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{item.item}</p>
                              <p className="text-[9px] font-mono mt-0.5 text-slate-400">
                                {item.obrigatorio ? (
                                  <span className="text-red-600 font-bold">Obrigatório</span>
                                ) : (
                                  <span className="text-slate-400 font-bold">Opcional (Acreditação Clínica)</span>
                                )}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Explication of Quality Scoring */}
                    <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                      <div className="space-y-3">
                        <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Nível de Maturidade Sanitária</h3>
                        <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                          <span className="text-[10px] text-slate-400 font-mono block">Índice da Farmácia</span>
                          <span className="text-5xl font-bold font-mono text-slate-900 block my-1">
                            {calculateQualityIndex()}%
                          </span>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono inline-block font-semibold ${
                            calculateQualityIndex() >= 80 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            calculateQualityIndex() >= 50 ? "bg-amber-50 text-amber-700 border border-amber-100" :
                            "bg-red-50 text-red-700 border border-red-100"
                          }`}>
                            {calculateQualityIndex() >= 80 ? "Maturidade Classe A (Acreditada)" :
                             calculateQualityIndex() >= 50 ? "Maturidade Classe B (Atenção)" :
                             "Maturidade Classe C (Inconforme)"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Unidades Classe A do RN recebem incentivo de co-financiamento estadual da SESAP pela manutenção de altos padrões clínicos.
                        </p>
                      </div>

                      <div className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
                        *O não cumprimento de itens obrigatórios reduz severamente o score e desativa temporariamente a auditoria de dispensação clínica automática.
                      </div>
                    </div>
                  </div>

                  {/* Planning Context */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h4 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider mb-2">Estruturação & Integração de Qualidade no Sistema</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
                      <div>
                        <strong className="text-slate-800">Como Funciona no RN:</strong>
                        <p className="mt-1">
                          A vigilância sanitária estadual e coordenações municipais de assistência farmacêutica auditam semestralmente as farmácias utilizando relatórios auto-declarados e leituras de sensores inteligentes de geladeira IoT e filas eletrônicas integradas. O score mede a segurança, rapidez e conformidade técnica geral.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-800">Como Agrega ao Sistema:</strong>
                        <p className="mt-1">
                          Ao integrar ao banco de dados relacional e ao pipeline do Observatório, o score de qualidade define quais farmácias estão habilitadas para receber medicamentos termo-sensíveis ou controlados de alto valor. Unidades com problemas de cadeia de frio (QA-01 desmarcado) são bloqueadas automaticamente para novos lotes biológicos.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 5: JUDICIALIZAÇÃO */}
              {activeRnSubTab === "judicializacao" && <Judicializacao />}

              {/* SUB-TAB: COMPARADOR TERRITORIAL */}
              {activeRnSubTab === "comparador" && <Comparador />}

              {/* SUB-TAB: ALERTAS SANITÁRIOS */}
              {activeRnSubTab === "alertas" && <AlertasSanitarios />}

              {/* SUB-TAB 6: PROGRAMAS GOVERNAMENTAIS */}
              {activeRnSubTab === "programas" && <ProgramasGovernamentais />}

              {/* SUB-TAB 7: ATS & FARMACOVIGILÂNCIA */}
              {activeRnSubTab === "ats_farmacovigilancia" && (
                <div className="space-y-6">
                  {/* Banner */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div>
                      <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-indigo-600" />
                        Avaliação de Tecnologias em Saúde (ATS)
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Dossiês de incorporação de novas tecnologias na lista estadual.
                      </p>
                    </div>
                  </div>

                  {/* ATS Dossiers */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Dossiês de ATS sob Avaliação no RN (Câmara Técnica Colegiada)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-mono">
                            <th className="py-2 font-normal">Fármaco Candidato</th>
                            <th className="py-2 font-normal">Uso Pretendido / Protocolo</th>
                            <th className="py-2 font-normal text-right">Custo Unitário Anual</th>
                            <th className="py-2 font-normal text-center">Status Parecer</th>
                            <th className="py-2 font-normal">Recomendação ATS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {ATS_DOSSIERS_RN.map((d) => (
                            <tr key={d.id} className="text-slate-700 hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 font-medium">
                                {d.tecnologia}
                                <span className="block text-[9px] text-slate-400 font-mono font-normal">Sol.: {d.solicitante}</span>
                              </td>
                              <td className="py-3 text-slate-500 max-w-[180px] truncate" title={d.indicacao}>{d.indicacao}</td>
                              <td className="py-3 text-right font-mono text-slate-600">R$ {d.custoAnualEstimado.toLocaleString()}</td>
                              <td className="py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${
                                  d.status === "Aprovado" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  d.status === "Em Análise" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                  "bg-red-50 text-red-700 border-red-200"
                                }`}>{d.status}</span>
                              </td>
                              <td className="py-3 text-slate-500 max-w-[200px] truncate" title={d.custoEfetividadeSugerido}>{d.custoEfetividadeSugerido}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* SUB-TAB 8: REPOSITÓRIO E EDUCAÇÃO */}
              {activeRnSubTab === "repositorio" && (
                <div className="space-y-6">
                  {/* Banner */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div>
                      <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-indigo-600" />
                        Repositório de Notas Técnicas, Protocolos Clínicos & Educação em Saúde
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Portal centralizado de diretrizes clínicas do SUS-RN, legislação estadual farmacêutica e guias de orientação para o uso racional de medicamentos.
                      </p>
                    </div>
                  </div>

                  {/* Search and Library Explorer */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    {/* Filters bar */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                      {/* Search Input */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Pesquisar notas técnicas, protocolos, guias clínicos..."
                          value={docSearch}
                          onChange={(e) => setDocSearch(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm font-mono"
                        />
                      </div>
                      {/* Document Type Filter Button Selector */}
                      <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1.5 md:pb-0">
                        {["All", "Nota Técnica", "PCDT", "Legislação", "Educação"].map((type) => (
                          <button
                            key={type}
                            onClick={() => setDocTypeFilter(type)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap cursor-pointer border transition-colors ${
                              docTypeFilter === type
                                ? "bg-blue-50 text-blue-600 border-blue-200"
                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-500"
                            }`}
                          >
                            {type === "All" ? "Ver Todos" : type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* List of documents matched */}
                    <div className="grid grid-cols-1 gap-4">
                      {REPOSITORIO_DOCUMENTOS_RN.filter(doc => {
                        const matchesSearch = doc.titulo.toLowerCase().includes(docSearch.toLowerCase()) || 
                                              doc.resumo.toLowerCase().includes(docSearch.toLowerCase()) || 
                                              doc.tags.some(tag => tag.toLowerCase().includes(docSearch.toLowerCase()));
                        if (docTypeFilter === "All") return matchesSearch;
                        return matchesSearch && doc.tipo === docTypeFilter;
                      }).length === 0 ? (
                        <div className="text-center py-8 text-slate-400 italic">
                          Nenhum documento localizado para os critérios informados. Tente outras palavras-chave.
                        </div>
                      ) : (
                        REPOSITORIO_DOCUMENTOS_RN.filter(doc => {
                          const matchesSearch = doc.titulo.toLowerCase().includes(docSearch.toLowerCase()) || 
                                                doc.resumo.toLowerCase().includes(docSearch.toLowerCase()) || 
                                                doc.tags.some(tag => tag.toLowerCase().includes(docSearch.toLowerCase()));
                          if (docTypeFilter === "All") return matchesSearch;
                          return matchesSearch && doc.tipo === docTypeFilter;
                        }).map((doc) => (
                          <div key={doc.id} className="border border-slate-100 rounded-xl p-5 hover:border-slate-200 hover:bg-slate-50/20 transition-all bg-slate-50/30">
                            <div className="flex items-center justify-between gap-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${
                                doc.tipo === "Nota Técnica" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                doc.tipo === "PCDT" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                doc.tipo === "Legislação" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                "bg-rose-50 text-rose-700 border-rose-200"
                              }`}>{doc.tipo}</span>
                              <span className="text-[10px] font-mono text-slate-400">Publicado em: {doc.dataPublicacao}</span>
                            </div>

                            <h4 className="font-display font-bold text-sm text-slate-900 mt-2 hover:text-blue-600 cursor-pointer">{doc.titulo}</h4>
                            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-mono">{doc.resumo}</p>
                            
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-[10px]">
                              <div className="flex flex-wrap gap-1">
                                {doc.tags.map((t, idx) => (
                                  <span key={idx} className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono text-[9px]">#{t}</span>
                                ))}
                              </div>
                              <span className="text-slate-400 font-mono">Autor: {doc.autor}</span>
                            </div>

                            {/* Detailed Content Drawer/Collapsible representation */}
                            <details className="mt-3 group">
                              <summary className="text-[10px] font-mono font-bold text-blue-600 cursor-pointer hover:underline list-none select-none flex items-center gap-1">
                                <span className="group-open:hidden">▼ Exibir Conteúdo Completo</span>
                                <span className="hidden group-open:inline">▲ Ocultar Conteúdo Completo</span>
                              </summary>
                              <div className="mt-3 p-4 bg-white border border-slate-100 rounded-lg text-xs leading-relaxed text-slate-700 overflow-x-auto shadow-inner prose prose-slate">
                                <ReactMarkdown>{doc.conteudo}</ReactMarkdown>
                              </div>
                            </details>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Planning Context */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h4 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider mb-2">Estruturação & Integração do Repositório Científico</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
                      <div>
                        <strong className="text-slate-800">Como Funciona no RN:</strong>
                        <p className="mt-1">
                          A comissão multidisciplinar de farmácia da SESAP-RN publica documentos, revisões de diretrizes de tratamento nacionais e guias de educação popular. O repositório unifica a base legal farmacêutica do estado para livre consulta e apoia as campanhas locais de educação em saúde e uso racional.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-800">Como Agrega ao Sistema:</strong>
                        <p className="mt-1">
                          Esse repositório de documentos é interpretado como um banco de conhecimento textual de referência (Vetor-BD). Quando médicos ou farmacêuticos consultam a IA Observadora, ela busca contextualmente estas notas técnicas estaduais para embasar suas respostas com as leis, portarias e critérios de fornecimento oficiais vigentes no RN.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 9: RELATÓRIO DE IMPACTO PÚBLICO */}
              {activeRnSubTab === "relatorio_impacto" && (
                <EmElaboracao titulo="Relatório de Impacto" texto="O relatório de impacto será elaborado com dados verificados e metodologia aberta. Os valores exibidos anteriormente eram ilustrativos e foram removidos." />
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

      {/* AUTH ERROR TROUBLESHOOTING MODAL */}
      {authError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-red-600">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h3 className="font-bold text-base text-slate-950 font-sans">
                  Falha na Autenticação com o Google
                </h3>
              </div>
              <button
                onClick={() => setAuthError(null)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-3.5 leading-relaxed font-sans">
              <p className="bg-red-50 text-red-800 p-3 rounded-lg border border-red-100 font-mono text-[11px] whitespace-pre-wrap">
                {authError}
              </p>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 text-[13px] flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">1</span>
                  Por que isso acontece?
                </h4>
                <p className="pl-6 text-slate-600">
                  O Google Sign-In exige domínios autorizados específicos nas configurações do seu console do Firebase. Como o AI Studio roda seu aplicativo em domínios dinâmicos e seguros (como <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">*.run.app</code>), é necessário adicioná-los.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 text-[13px] flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">2</span>
                  Como configurar no Console do Firebase (Passo a Passo):
                </h4>
                <ol className="list-decimal pl-11 space-y-1.5 text-slate-600">
                  <li>Acesse o <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5 font-semibold">Console do Firebase <ExternalLink className="h-3 w-3 inline" /></a> e selecione seu projeto.</li>
                  <li>No menu lateral, clique em <strong>Authentication</strong> e vá para a aba <strong>Settings</strong> (Configurações).</li>
                  <li>Na seção <strong>Authorized domains</strong> (Domínios Autorizados), clique em <strong>Add domain</strong> (Adicionar domínio).</li>
                  <li>Insira os seguintes domínios fornecidos pelo AI Studio:</li>
                </ol>

                <div className="pl-11 pt-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="font-mono text-[10px] text-slate-600 select-all">ais-dev-j7cw6em5ixzmaghdrmyqhd-475362525760.us-west2.run.app</span>
                    <button
                      onClick={() => handleCopy("ais-dev-j7cw6em5ixzmaghdrmyqhd-475362525760.us-west2.run.app", "dev-dom")}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer ml-2"
                    >
                      Copiar
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="font-mono text-[10px] text-slate-600 select-all">ais-pre-j7cw6em5ixzmaghdrmyqhd-475362525760.us-west2.run.app</span>
                    <button
                      onClick={() => handleCopy("ais-pre-j7cw6em5ixzmaghdrmyqhd-475362525760.us-west2.run.app", "pre-dom")}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer ml-2"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 text-[13px] flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">3</span>
                  Ativar o Provedor Google:
                </h4>
                <p className="pl-6 text-slate-600">
                  Na aba <strong>Sign-in method</strong> (Método de login), certifique-se de que o provedor <strong>Google</strong> está <strong>Ativado (Enabled)</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 text-[13px] flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">4</span>
                  Restrição de Iframe (Preview do AI Studio):
                </h4>
                <p className="pl-6 text-slate-600">
                  Muitos navegadores bloqueiam popups de autenticação quando abertos dentro de iframes. Para resolver isso facilmente, <strong>clique no ícone de "Abrir em nova aba" no canto superior direito do seu preview do AI Studio</strong>. No app aberto na nova aba, o login funcionará imediatamente!
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2.5 font-sans mt-2">
              <button
                onClick={() => setAuthError(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setAuthError(null);
                  handleGoogleSignIn();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-blue-500/10"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
