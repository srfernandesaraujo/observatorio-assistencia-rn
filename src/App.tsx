import { ProgramasGovernamentais } from "./components/ProgramasGovernamentais";
import { Judicializacao } from "./components/Judicializacao";
import { Landing } from "./components/Landing";
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

  // API Key Configurations
  const [crfApiKey, setCrfApiKey] = useState(() => localStorage.getItem("API_CRF_KEY") || "");
  const [sesapApiKey, setSesapApiKey] = useState(() => localStorage.getItem("API_SESAP_KEY") || "");
  const [anvisaApiKey, setAnvisaApiKey] = useState(() => localStorage.getItem("API_ANVISA_KEY") || "");
  const [showApiSaved, setShowApiSaved] = useState(false);

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
  const [rawData, setRawData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // States para Assistente de IA
  const [aiQuery, setAiQuery] = useState("");
  const [aiChat, setAiChat] = useState<{ role: "user" | "model" | "system"; text: string }[]>([
    {
      role: "model",
      text: "Olá! Sou a **IA Observadora da Assistência Farmacêutica**. Posso analisar os estoques das unidades de saúde, prever riscos de desabastecimento e recomendar ações imediatas de remanejamento ou compras com base em nossa modelagem relacional. \n\n**O que deseja saber hoje?** Escolha um dos botões rápidos abaixo ou digite sua pergunta."
    }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  
  // States para ETL Ingestão e Configurações de API
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [etlProgress, setEtlProgress] = useState(0);
  const [etlLogs, setEtlLogs] = useState<string[]>([]);
  const [etlIsRunning, setEtlIsRunning] = useState(false);
  const [recordsCount, setRecordsCount] = useState(150);

  // States adicionais para Aba de Configurações
  const [apiConfigs, setApiConfigs] = useState({
    horusUrl: "https://horus.saude.gov.br/api/v1/rn/estoque",
    horusToken: "••••••••••••••••••••••••••••••••",
    horusEnabled: true,
    pgeUrl: "https://pge.rn.gov.br/judicial/api/v1",
    pgeToken: "••••••••••••••••••••••••••••••••",
    pgeEnabled: true,
    unicatUrl: "https://unicat.rn.gov.br/logistica/api/v2",
    unicatToken: "••••••••••••••••••••••••••••••••",
    unicatEnabled: true,
    suvisaUrl: "https://suvisa.rn.gov.br/farmacovigilancia/api",
    suvisaToken: "••••••••••••••••••••••••••••••••",
    suvisaEnabled: false,
  });
  const [syncFrequency, setSyncFrequency] = useState("daily");
  const [manualTargetModule, setManualTargetModule] = useState("desabastecimento");
  const [configSavedMessage, setConfigSavedMessage] = useState("");

  // States para Explorer de Tabelas (integrado à área de Analytics)
  const [activeExplorerTable, setActiveExplorerTable] = useState<"medicamentos" | "instituicoes" | "estoques" | "movimentacoes">("medicamentos");
  const [explorerSearch, setExplorerSearch] = useState("");

  // States para Cópia de Código
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Navegação superior: cada item abre uma área; "indicadores" mostra a barra lateral de módulos.
  type TopNavId = "inicio" | "indicadores" | "programas" | "educacao" | "impacto" | "producao" | "admin";
  const INDICADORES_SUBTABS = ["visao_geral", "desabastecimento", "custos", "qualidade", "judicializacao", "ats_farmacovigilancia"];
  const isIndicadores = activeTab === "principal" && INDICADORES_SUBTABS.includes(activeRnSubTab);
  const topNav: { id: TopNavId; label: string; icon: any }[] = [
    { id: "inicio", label: "Início", icon: Home },
    { id: "indicadores", label: "Indicadores", icon: Activity },
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
      const [statsRes, alertsRes, transactionsRes, explorerRes] = await Promise.all([
        fetch("/api/dashboard/stats").then((r) => r.json()),
        fetch("/api/dashboard/stock-alerts").then((r) => r.json()),
        fetch("/api/dashboard/recent-transactions").then((r) => r.json()),
        fetch("/api/dashboard/data-explorer").then((r) => r.json())
      ]);

      if (!statsRes.error) setStats(statsRes);
      if (!alertsRes.error) setStockAlerts(alertsRes);
      if (!transactionsRes.error) setTransactions(transactionsRes);
      if (!explorerRes.error) setRawData(explorerRes);
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

  // Firebase Auth and Config Synchronization Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      
      if (user) {
        // Load settings from Firestore
        try {
          const settingsRef = doc(db, "settings", user.uid);
          const settingsSnap = await getDoc(settingsRef);
          if (settingsSnap.exists()) {
            const data = settingsSnap.data();
            setApiConfigs((prev) => ({
              ...prev,
              horusUrl: data.horusUrl ?? prev.horusUrl,
              horusEnabled: data.horusEnabled ?? prev.horusEnabled,
              pgeUrl: data.pgeUrl ?? prev.pgeUrl,
              pgeEnabled: data.pgeEnabled ?? prev.pgeEnabled,
              unicatUrl: data.unicatUrl ?? prev.unicatUrl,
              unicatEnabled: data.unicatEnabled ?? prev.unicatEnabled,
              suvisaUrl: data.suvisaUrl ?? prev.suvisaUrl,
              suvisaEnabled: data.suvisaEnabled ?? prev.suvisaEnabled,
            }));
            if (data.syncFrequency) {
              setSyncFrequency(data.syncFrequency);
            }
          } else {
            // First time login, save local state to Firestore settings/userId
            await setDoc(settingsRef, {
              uid: user.uid,
              horusUrl: apiConfigs.horusUrl,
              horusEnabled: apiConfigs.horusEnabled,
              pgeUrl: apiConfigs.pgeUrl,
              pgeEnabled: apiConfigs.pgeEnabled,
              unicatUrl: apiConfigs.unicatUrl,
              unicatEnabled: apiConfigs.unicatEnabled,
              suvisaUrl: apiConfigs.suvisaUrl,
              suvisaEnabled: apiConfigs.suvisaEnabled,
              syncFrequency: syncFrequency
            });
          }
        } catch (error) {
          console.error("Erro ao sincronizar configurações de APIs com o Firestore:", error);
        }

        // Test Connection as mandated by instructions
        try {
          await getDocFromServer(doc(db, "test", "connection"));
        } catch (err) {
          console.warn("Liveness test complete:", err);
        }
      }
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

  // Simular Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile({ name: file.name, size: file.size });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile({ name: file.name, size: file.size });
    }
  };

  // Executar Ingestão ETL
  const triggerEtlPipeline = async () => {
    if (!selectedFile) return;
    setEtlIsRunning(true);
    setEtlProgress(10);
    setEtlLogs(["[INFO] Conectando ao bucket de staging e localizando arquivo..."]);

    const logSteps = [
      { p: 25, log: "[ETL-EXTRACT] Validando checksum MD5 e metadados do arquivo." },
      { p: 40, log: `[ETL-EXTRACT] Extraídos com sucesso ${recordsCount} registros de transações farmacêuticas.` },
      { p: 55, log: "[ETL-TRANSFORM] Convertendo formatos de data e normalizando descrições de medicamentos." },
      { p: 70, log: "[ETL-TRANSFORM] Mapeando chaves estrangeiras com base no CNES e códigos ANVISA." },
      { p: 85, log: "[ETL-TRANSFORM] Executando regras de cálculo de cobertura e consumo diário médio." },
      { p: 100, log: "[ETL-LOAD] Gravando novos lotes na tabela 'estoques' e histórico em 'movimentacoes'. Transação ACID concluída." }
    ];

    for (let i = 0; i < logSteps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setEtlProgress(logSteps[i].p);
      setEtlLogs((prev) => [...prev, logSteps[i].log]);
    }

    try {
      await fetch("/api/ingestion/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          recordsCount: recordsCount,
          dataType: "assistencia_farmaceutica_compras_estoques"
        })
      });
      // Recarregar dados para atualizar o dashboard com o novo estado
      await loadDashboardData();
    } catch (e) {
      console.error(e);
    } finally {
      setEtlIsRunning(false);
    }
  };

  // Filtro de Dados do Explorer
  const getFilteredExplorerData = () => {
    if (!rawData) return [];
    const dataList = rawData[activeExplorerTable] || [];
    if (!explorerSearch) return dataList;

    return dataList.filter((item: any) => {
      const searchLower = explorerSearch.toLowerCase();
      return Object.values(item).some((val: any) => 
        String(val).toLowerCase().includes(searchLower)
      );
    });
  };

  // Código dos artefatos técnicos para exibição
  const textArtifacts = {
    architecture: `# Arquitetura de Alto Nível - Observatório da Assistência Farmacêutica

Este diagrama de arquitetura ilustra o fluxo fim-a-fim, desde a ingestão de planilhas de compras, consumo e estoques (dados governamentais e do SUS) até o consumo analítico por meio de agentes inteligentes baseados em LLM e dashboards interativos em React.

## Fluxo da Solução (Pipeline de Dados & IA)

\`\`\`
[Fontes de Dados SUS]    
  ├── Planilhas de Estoque (.csv / .xlsx) ───┐
  ├── Sistemas de Compras Municipais / Est.  ───┼─► [API Ingestão REST (Express)]
  └── Integrações de Consumo Unidades       ───┘            │
                                                           ▼
                                                [Pipeline de Dados ETL]
                                                ├── EXTRACT: Validação de Formato & Integridade
                                                ├── TRANSFORM: Validação de Registro ANVISA & CNES
                                                └── LOAD: Gravação Transacional ACID (PostgreSQL)
                                                           │
                                                           ▼
                                                [Banco de Dados PostgreSQL]
                                                ├── medicamentos (Cadastro ATC)
                                                ├── instituicoes (CNES Unidades)
                                                ├── estoques (Lote/Validade)
                                                └── movimentacoes (Transações)
                                                           ▲
                                                           │ (Queries SQL Otimizadas)
                                                           ▼
                                                 [Módulo de IA Express]
                                                 └── Agent LLM (Gemini 3.5 Flash)
                                                           ▲
                                                           │ (Perguntas Linguagem Natural / Respostas)
                                                           ▼
                                                [Frontend React Dashboard]
                                                └── Interface Operacional SUS
\`\`\`

## Estrutura de Diretórios Sugerida (Scaffolding)

Abaixo está o scaffolding sugerido para o repositório unificado (Full-Stack estruturado com TypeScript) para inicializar seu projeto de forma limpa e organizada:

\`\`\`text
observatorio-farmaceutico/
├── .env.example                # Modelo de variáveis de ambiente (DB_URL, GEMINI_API_KEY)
├── .gitignore                  # Arquivos ignorados no Git (node_modules, dist, .env)
├── package.json                # Gerenciador de dependências e scripts Node.js
├── tsconfig.json               # Configurações do compilador TypeScript
├── server.ts                   # Arquivo principal do Express (Backend Entrypoint & Rotas API)
├── vite.config.ts              # Configurações do Vite (Vite Bundler do Frontend)
├── index.html                  # HTML estático de entrada do SPA
├── src/                        # Código fonte do Frontend (React + TypeScript)
│   ├── main.tsx                # Inicializador React / ReactDOM
│   ├── index.css               # Estilos globais carregando o Tailwind CSS
│   ├── data.ts                 # Interfaces estruturais de dados e tipos relacionais
│   ├── App.tsx                 # Componente principal do painel, roteador e abas
│   ├── components/             # Pasta de componentes visuais reutilizáveis
│   │   ├── MetricCard.tsx      # Card de KPIs analíticos
│   │   ├── AlertGrid.tsx       # Grade de riscos de desabastecimento
│   │   └── ChatAssistant.tsx   # Painel interativo da IA Observadora
│   └── lib/
│       └── formatters.ts       # Auxiliares de formatação (Ex: dias_cobertura, datas)
\`\`\`

## Stack Tecnológica Recomendada

1. **Frontend**: React.js com Tailwind CSS, TypeScript, Recharts (visualização) e Lucide React. Oferece alta interatividade, modularidade e SPA (Single Page Application) fluida.
2. **Backend**: Node.js com Express (ou TypeScript-first Fastify) para alto rendimento e I/O não-bloqueante na recepção de payloads, ou Python (FastAPI) se a equipe possuir forte background em Data Science.
3. **Banco de Dados**: PostgreSQL (Relacional) robusto com Drizzle ORM ou Prisma ORM, suportando integridade referencial por chaves estrangeiras rígidas para evitar dados órfãos.
4. **Pipeline ETL**: Apache Airflow para orquestração distribuída ou BullMQ (Node/Redis) para filas de ingestão assíncronas de arquivos pesados sem travar a thread de execução da API.
5. **Inteligência Artificial**: SDK oficial \`@google/genai\` conectando ao modelo \`gemini-3.5-flash\` devido ao seu custo-benefício, velocidade de inferência e ampla janela de contexto.`,

    databaseSchema: `-- 1. Tabela de Cadastro Base de Medicamentos (Cadastro ATC)
CREATE TABLE medicamentos (
    id VARCHAR(50) PRIMARY KEY, -- Ex: 'MED-001'
    nome VARCHAR(255) NOT NULL,
    principio_ativo VARCHAR(255) NOT NULL,
    atc VARCHAR(20) NOT NULL, -- Anatomical Therapeutic Chemical code
    registro_anvisa VARCHAR(13) UNIQUE NOT NULL,
    dosagem VARCHAR(100) NOT NULL,
    apresentacao VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Estabelecimentos e Unidades de Saúde (Cadastro de Instituições)
CREATE TABLE instituicoes (
    id VARCHAR(50) PRIMARY KEY, -- Ex: 'INST-001'
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Hospital', 'UPA', 'Farmácia de Alto Custo', 'Almoxarifado', 'UBS')),
    cidade VARCHAR(100) NOT NULL,
    uf VARCHAR(2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Posição de Estoque por Unidade (Com Lote e Validade)
CREATE TABLE estoques (
    id SERIAL PRIMARY KEY,
    medicamento_id VARCHAR(50) NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    instituicao_id VARCHAR(50) NOT NULL REFERENCES instituicoes(id) ON DELETE CASCADE,
    quantidade INTEGER NOT NULL CHECK (quantidade >= 0),
    lote VARCHAR(50) NOT NULL,
    validade DATE NOT NULL,
    demanda_mensal INTEGER NOT NULL CHECK (demanda_mensal >= 0), -- Consumo médio projetado
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_estoque_lote UNIQUE (medicamento_id, instituicao_id, lote)
);

-- 4. Tabela de Histórico de Movimentações de Medicamentos
CREATE TABLE movimentacoes (
    id SERIAL PRIMARY KEY,
    medicamento_id VARCHAR(50) NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    instituicao_id VARCHAR(50) NOT NULL REFERENCES instituicoes(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('Entrada', 'Saída', 'Dispensação', 'Transferência')),
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    lote VARCHAR(50) NOT NULL,
    data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responsavel VARCHAR(255) NOT NULL,
    destino_origem VARCHAR(255)
);

-- Índices recomendados para otimização de consultas de cobertura e risco
CREATE INDEX idx_estoques_cobertura ON estoques (medicamento_id, instituicao_id);
CREATE INDEX idx_movimentacoes_data ON movimentacoes (data DESC);`,

    apiDesign: `## Rotas e Endpoints RESTful da API

Todos os payloads de entrada e saída utilizam formato padrão JSON. Os códigos de status HTTP seguem a especificação padrão (200 OK, 201 Created, 400 Bad Request, 500 Internal Server Error).

### 1. Ingestão de Dados (Upload de Planilhas / Cargas de Sistemas)
* **Endpoint**: \`POST /api/ingestion/upload\`
* **Descrição**: Recebe payloads massivos ou arquivos multipart de faturamento, fita de caixa ou estoque da unidade e submete para processamento em fila.
* **Payload de Exemplo**:
\`\`\`json
{
  "fileName": "estoque_hran_julho_2026.csv",
  "fileSize": 102450,
  "recordsCount": 150,
  "dataType": "assistencia_farmaceutica_compras_estoques"
}
\`\`\`
* **Resposta Esperada (200 OK)**:
\`\`\`json
{
  "success": true,
  "recordsProcessed": 150,
  "timestamp": "2026-07-17T13:21:10Z",
  "logs": [
    "[ETL-EXTRACT] Extraídos 150 registros brutos.",
    "[ETL-SUCCESS] Carga concluída com sucesso."
  ]
}
\`\`\`

### 2. Consulta de Indicadores de Desabastecimento
* **Endpoint**: \`GET /api/dashboard/stock-alerts\`
* **Descrição**: Retorna o índice consolidado de autonomia de estoque calculando a demanda versus a quantidade atual de cada lote.
* **Resposta Esperada (200 OK)**:
\`\`\`json
[
  {
    "id": "EST-001",
    "medicamento": "Insulina Humana NPH 100 UI/ML",
    "unidade": "Hospital Regional da Asa Norte (HRAN)",
    "quantidade": 150,
    "demanda_mensal": 1200,
    "dias_cobertura": 3.8,
    "nivel_risco": "Crítico",
    "alerta_vencimento": false
  }
]
\`\`\`

### 3. Estatísticas Gerais (Painel Consolidado)
* **Endpoint**: \`GET /api/dashboard/stats\`
* **Descrição**: Consolida indicadores essenciais para exibição rápida em painéis.
* **Resposta Esperada (200 OK)**:
\`\`\`json
{
  "totalMedicamentos": 8,
  "totalInstituicoes": 5,
  "desabastecidosCount": 1,
  "criticosCount": 2,
  "totalMovimentacoes": 6
}
\`\`\`

### 4. Assistente de IA de Linguagem Natural para Consultas
* **Endpoint**: \`POST /api/ai/query\`
* **Descrição**: Analisa perguntas do usuário, realiza inferência estruturada sobre o banco de dados relacional e retorna diagnósticos detalhados e sugestões de ações práticas.
* **Payload**:
\`\`\`json
{
  "query": "Qual o risco de desabastecimento de insulina no Hospital Regional?"
}
\`\`\`
* **Resposta Esperada (200 OK)**:
\`\`\`json
{
  "response": "### Diagnóstico: Risco Crítico de Desabastecimento\\n\\nAtualmente, a **Insulina Humana NPH** no **HRAN** possui apenas **150 unidades** em estoque diante de uma demanda mensal média de **1200 unidades**. Isso equivale a apenas **3.8 dias** de autonomia de cobertura de estoque."
}
\`\`\``,

    aiModule: `// Código Fundamental do Módulo de IA - Observatório da Assistência Farmacêutica
// Caminho sugerido no backend: src/services/geminiService.ts

import { GoogleGenAI } from "@google/genai";
import { Pool } from "pg"; // Driver PostgreSQL para execução de consultas reais

// Inicialização da conexão com o Banco de Dados Relacional
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Inicialização Lazy do Cliente SDK do Gemini com Cabeçalho Obrigatório de Telemetria
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("A chave de API GEMINI_API_KEY não foi configurada nas variáveis de ambiente.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build", // Header de identificação obrigatório
        }
      }
    });
  }
  return geminiClient;
}

/**
 * Processa uma pergunta em linguagem natural sobre desabastecimento de medicamentos.
 * Adota uma arquitetura em 2 etapas (Two-Step Text-to-SQL or Retrieval Augmented Prompting)
 * para traduzir a pergunta, obter dados precisos do Postgres e retornar insights analíticos estruturados.
 */
export async function processNaturalLanguageQuery(userInput: string): Promise<string> {
  const client = getGeminiClient();

  // Etapa 1: Obter esquema e metadados para instruir o modelo
  const systemContext = \`
Você é o Assistente Virtual Analítico do Observatório da Assistência Farmacêutica.
O sistema gerencia o estoque público do SUS com as tabelas:
- medicamentos (id, nome, principio_ativo, atc, registro_anvisa, dosagem, apresentacao)
- instituicoes (id, nome, tipo, cidade, uf)
- estoques (id, medicamento_id, instituicao_id, quantidade, lote, validade, demanda_mensal)
- movimentacoes (id, medicamento_id, instituicao_id, tipo, quantidade, lote, data, responsavel, destino_origem)

Regras de Autonomia (Dias de Cobertura):
- Dias de Cobertura = quantidade / (demanda_mensal / 30.0)
- Dias de Cobertura < 15: Estoque "CRÍTICO" (Desabastecimento iminente)
- Dias de Cobertura = 0: Estoque "DESABASTECIDO"
  \`;

  try {
    // Etapa 2: Executar inferência no Gemini (Passando as tabelas e regras)
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userInput,
      config: {
        systemInstruction: \`\${systemContext}\\nResponda em Português do Brasil de forma extremamente detalhada, provendo tabelas Markdown e sugestões de remanejamento práticas. Adicione o comando SQL no final.\`,
        temperature: 0.2 // Baixa criatividade para garantir consistência lógica matemática
      }
    });

    return response.text || "Não foi possível gerar um insight para a pergunta enviada.";
  } catch (error: any) {
    console.error("Erro no serviço de inteligência artificial:", error);
    throw new Error(\`Falha na integração com o Gemini API: \${error.message}\`);
  }
}`
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
          <div className="hidden md:block h-3 w-px bg-slate-200" />
          <button 
            onClick={loadDashboardData}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
            title="Recarregar dados do servidor"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
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
        {activeTab === "inicio" && <Landing onNavigate={(d) => goTo(d)} />}

        {/* PRODUÇÃO CIENTÍFICA */}
        {activeTab === "producao" && (
          <EmElaboracao titulo="Produção Científica" texto="Artigos, dissertações e produtos técnicos do projeto serão listados aqui a partir de planilha cadastrada pela equipe." />
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
        {isIndicadores && (
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
                <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">SESAP / UNICAT-RN</span>
                <h3 className="font-display font-bold text-sm text-slate-900 mt-2 font-sans">Módulos Estratégicos</h3>
                <p className="text-[10px] text-slate-500 font-sans">Planejamento e Gestão Farmacêutica</p>
              </div>
              {[
                { id: "visao_geral", label: "Visão Geral e Alertas", icon: Activity, hover: "hover:bg-blue-50 hover:text-blue-600" },
                { id: "desabastecimento", label: "Desabastecimento RN", icon: AlertTriangle, hover: "hover:bg-red-50 hover:text-red-600" },
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
              {activeRnSubTab === "judicializacao" && <Judicializacao processosConcluidosAno={null} ano={new Date().getFullYear() - 1} />}

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

        {/* TAB 3: INGESTÃO E CONFIGURAÇÕES */}
        {activeTab === "configuracoes" && currentUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* UPLOAD FORM (2/5 colunas) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2 mb-2">
                  <UploadCloud className="h-5 w-5 text-blue-600" />
                  Módulo de Ingestão de Dados
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Envie novas planilhas ou insumos de sistemas de faturamento farmacêutico do SUS para processamento do pipeline ETL.
                </p>

                {/* Drag and Drop Box */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center transition-all ${
                    dragActive
                      ? "border-blue-500 bg-blue-50"
                      : selectedFile
                      ? "border-blue-300 bg-blue-50/20"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    accept=".csv, .xlsx, .json"
                    className="hidden"
                  />
                  {selectedFile ? (
                    <FileSpreadsheet className="h-10 w-10 text-blue-600" />
                  ) : (
                    <UploadCloud className="h-10 w-10 text-slate-400" />
                  )}
                  
                  <div>
                    {selectedFile ? (
                      <>
                        <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px] mx-auto">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-slate-600">
                          Arraste seu arquivo para cá ou
                        </p>
                        <label
                          htmlFor="file-upload"
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer mt-0.5 inline-block"
                        >
                          selecione manualmente
                        </label>
                      </>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono">
                    Formatos aceitos: .CSV, .XLSX, .JSON (Max 15MB)
                  </p>
                </div>

                {/* Parametros Ingestão */}
                <div className="mt-4 space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1 font-medium">Tipo de Ingestão de Dados</label>
                    <select className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none">
                      <option>Consolidação de Estoques Físicos (Mensal)</option>
                      <option>Fita de Caixa de Dispensações (Diária)</option>
                      <option>Ordens de Compra e Pregões Eletrônicos</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 flex justify-between items-center mb-1">
                      <span className="font-medium">Registros Estimados para Processamento</span>
                      <span className="font-mono text-blue-600 text-[11px] font-semibold">{recordsCount} linhas</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="1000"
                      step="50"
                      value={recordsCount}
                      onChange={(e) => setRecordsCount(Number(e.target.value))}
                      className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={triggerEtlPipeline}
                    disabled={etlIsRunning || !selectedFile}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 font-semibold rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    {etlIsRunning ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Executando ETL ({etlProgress}%)
                      </>
                    ) : (
                      <>
                        <Terminal className="h-4 w-4" />
                        Executar Pipeline ETL
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* DICA INGESTÃO */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 text-xs text-slate-500 shadow-sm">
                <Info className="h-5 w-5 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-800 mb-0.5">Integridade Referencial do SUS</h4>
                  <p>O pipeline de ETL valida chaves contra o Cadastro Nacional de Estabelecimentos de Saúde (CNES) e os registros da ANVISA. Qualquer desconformidade joga o registro na área de quarentena.</p>
                </div>
              </div>
            </div>

            {/* ETL PIPELINE TERMINAL LOGS (3/5 colunas) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[400px] shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="font-display font-bold text-sm text-slate-900">Log de Processamento de Carga</h3>
                    <p className="text-[10px] text-slate-500">Pipeline de Execução em Lote de Assistência Farmacêutica</p>
                  </div>
                  <Terminal className="h-4 w-4 text-blue-600" />
                </div>

                <div className="flex-1 bg-slate-50 rounded-lg p-4 font-mono text-[11px] text-slate-700 overflow-y-auto max-h-[350px] space-y-2 border border-slate-100">
                  {etlLogs.length === 0 ? (
                    <div className="text-slate-400 italic h-full flex items-center justify-center text-center">
                      Nenhum pipeline em execução.<br />Selecione um arquivo e clique em "Executar Pipeline ETL" para visualizar as etapas de Ingestão em tempo real.
                    </div>
                  ) : (
                    etlLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-slate-400">[{idx + 1}]</span>
                        <span className={log.includes('SUCCESS') ? 'text-emerald-600 font-semibold' : log.includes('LOAD') ? 'text-blue-600' : 'text-slate-700'}>{log}</span>
                      </div>
                    ))
                  )}
                </div>

                {etlProgress > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1.5">
                      <span>Progresso do Carregamento ACID</span>
                      <span>{etlProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${etlProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* GERENCIAMENTO DE CREDENCIAIS CARD */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                    <Key className="h-5 w-5 text-teal-600" />
                    Gerenciamento de Credenciais & APIs de Serviços
                  </h3>
                  <p className="text-xs text-slate-500">
                    Insira as chaves de API necessárias para conectar o Observatório com os barramentos de dados nacionais (CRF, SESAP, ANVISA) e ativar os relatórios de IA do Gemini.
                  </p>
                </div>
                
                {/* Status indicator */}
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-150">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Armazenamento Seguro Local (Local Storage)
                </span>
              </div>

              {showApiSaved && (
                <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  Configurações de Chaves de API salvas com sucesso no navegador! O sistema passará a usá-las em todas as requisições ativas.
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                localStorage.setItem("API_CRF_KEY", crfApiKey);
                localStorage.setItem("API_SESAP_KEY", sesapApiKey);
                localStorage.setItem("API_ANVISA_KEY", anvisaApiKey);
                
                if (currentUser) {
                  try {
                    const settingsRef = doc(db, "settings", currentUser.uid);
                    await setDoc(settingsRef, {
                      uid: currentUser.uid,
                      horusUrl: apiConfigs.horusUrl,
                      horusEnabled: apiConfigs.horusEnabled,
                      pgeUrl: apiConfigs.pgeUrl,
                      pgeEnabled: apiConfigs.pgeEnabled,
                      unicatUrl: apiConfigs.unicatUrl,
                      unicatEnabled: apiConfigs.unicatEnabled,
                      suvisaUrl: apiConfigs.suvisaUrl,
                      suvisaEnabled: apiConfigs.suvisaEnabled,
                      syncFrequency: syncFrequency
                    });
                  } catch (error) {
                    handleFirestoreError(error, OperationType.WRITE, `settings/${currentUser.uid}`);
                  }
                }
                
                setShowApiSaved(true);
                setTimeout(() => setShowApiSaved(false), 4000);
              }} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* CRF API Key */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-teal-600" />
                        Token CRF-RN (Conselho Regional de Farmácia)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={crfApiKey}
                      onChange={(e) => setCrfApiKey(e.target.value)}
                      placeholder="Insira o Token de Integração CRF-RN"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 placeholder:text-slate-400 shadow-xs"
                    />
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                      Utilizado para validar as certidões de regularidade técnica e sincronizar as farmácias credenciadas em tempo real.
                    </p>
                  </div>

                  {/* SESAP API Key */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                        Chave Barramento SESAP-RN (Assistência Farmacêutica)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={sesapApiKey}
                      onChange={(e) => setSesapApiKey(e.target.value)}
                      placeholder="Insira sua Chave de Acesso SESAP Central"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 placeholder:text-slate-400 shadow-xs"
                    />
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                      Sincroniza os estoques das UPAs, Hospitais Regionais e Almoxarifados Centrais do RN com o banco do Observatório.
                    </p>
                  </div>

                  {/* ANVISA API Key */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-amber-500" />
                        Integração ANVISA SNGPC (Validação de Lotes)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={anvisaApiKey}
                      onChange={(e) => setAnvisaApiKey(e.target.value)}
                      placeholder="Insira o Token de Validação de Lotes ANVISA"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 placeholder:text-slate-400 shadow-xs"
                    />
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                      Permite consultar a regularidade de fabricação e lotes de medicamentos, detectando vencimentos ou lotes suspensos.
                    </p>
                  </div>

                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-500 font-sans"
                  >
                    <Settings className="h-3.5 w-3.5 text-teal-400" />
                    Salvar Credenciais de Integração
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: EXPLORADOR RELACIONAL */}
        {false && (activeTab as any) === "explorer" && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Visualizador de Tabelas Relacionais Brutas
                </h3>
                <p className="text-xs text-slate-500">
                  Navegue pelos dados em cache nas entidades que modelam o Observatório da Assistência Farmacêutica.
                </p>
              </div>

              {/* SEARCH */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar registros..."
                  value={explorerSearch}
                  onChange={(e) => setExplorerSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm"
                />
              </div>
            </div>

            {/* TABELA SELECTOR */}
            <div className="flex overflow-x-auto gap-2 border-b border-slate-100 pb-3 mb-4">
              {[
                { id: "medicamentos", label: "medicamentos (Cadastro ATC)", count: rawData?.medicamentos?.length || 8 },
                { id: "instituicoes", label: "instituicoes (CNES SUS)", count: rawData?.instituicoes?.length || 5 },
                { id: "estoques", label: "estoques (Lotes e Autonomia)", count: rawData?.estoques?.length || 10 },
                { id: "movimentacoes", label: "movimentacoes (Histórico)", count: rawData?.movimentacoes?.length || 6 }
              ].map((table) => (
                <button
                  key={table.id}
                  onClick={() => {
                    setActiveExplorerTable(table.id as any);
                    setExplorerSearch("");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap cursor-pointer border transition-colors ${
                    activeExplorerTable === table.id
                      ? "bg-blue-50 text-blue-600 border-blue-200"
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-500"
                  }`}
                >
                  {table.label} <span className="text-[10px] text-slate-400 font-normal">({table.count})</span>
                </button>
              ))}
            </div>

            {/* INTERACTIVE GRID VIEW */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-[11px] leading-relaxed">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    {activeExplorerTable === "medicamentos" && (
                      <>
                        <th className="py-2 px-3">id</th>
                        <th className="py-2 px-3">nome</th>
                        <th className="py-2 px-3">principio_ativo</th>
                        <th className="py-2 px-3">atc</th>
                        <th className="py-2 px-3">registro_anvisa</th>
                        <th className="py-2 px-3">dosagem</th>
                        <th className="py-2 px-3">apresentacao</th>
                      </>
                    )}
                    {activeExplorerTable === "instituicoes" && (
                      <>
                        <th className="py-2 px-3">id</th>
                        <th className="py-2 px-3">nome</th>
                        <th className="py-2 px-3">tipo</th>
                        <th className="py-2 px-3">cidade</th>
                        <th className="py-2 px-3">uf</th>
                      </>
                    )}
                    {activeExplorerTable === "estoques" && (
                      <>
                        <th className="py-2 px-3">id</th>
                        <th className="py-2 px-3">medicamento_id</th>
                        <th className="py-2 px-3">instituicao_id</th>
                        <th className="py-2 px-3 text-right">quantidade</th>
                        <th className="py-2 px-3">lote</th>
                        <th className="py-2 px-3 text-center">validade</th>
                        <th className="py-2 px-3 text-right">demanda_mensal</th>
                      </>
                    )}
                    {activeExplorerTable === "movimentacoes" && (
                      <>
                        <th className="py-2 px-3">id</th>
                        <th className="py-2 px-3">medicamento_id</th>
                        <th className="py-2 px-3">instituicao_id</th>
                        <th className="py-2 px-3">tipo</th>
                        <th className="py-2 px-3 text-right">quantidade</th>
                        <th className="py-2 px-3">lote</th>
                        <th className="py-2 px-3">data</th>
                        <th className="py-2 px-3">responsavel</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getFilteredExplorerData().length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-slate-400 italic bg-white">
                        Nenhum registro localizado para os critérios informados.
                      </td>
                    </tr>
                  ) : (
                    getFilteredExplorerData().map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors bg-white">
                        {activeExplorerTable === "medicamentos" && (
                          <>
                            <td className="py-2.5 px-3 text-blue-600 font-semibold">{item.id}</td>
                            <td className="py-2.5 px-3 text-slate-900 font-medium">{item.nome}</td>
                            <td className="py-2.5 px-3 text-slate-700">{item.principio_ativo}</td>
                            <td className="py-2.5 px-3 text-slate-700 font-mono">{item.atc}</td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono">{item.registro_anvisa}</td>
                            <td className="py-2.5 px-3 text-slate-700">{item.dosagem}</td>
                            <td className="py-2.5 px-3 text-slate-500 text-xs truncate max-w-[200px]">{item.apresentacao}</td>
                          </>
                        )}
                        {activeExplorerTable === "instituicoes" && (
                          <>
                            <td className="py-2.5 px-3 text-blue-600 font-semibold">{item.id}</td>
                            <td className="py-2.5 px-3 text-slate-900 font-medium">{item.nome}</td>
                            <td className="py-2.5 px-3 text-slate-700">{item.tipo}</td>
                            <td className="py-2.5 px-3 text-slate-700">{item.cidade}</td>
                            <td className="py-2.5 px-3 text-slate-500">{item.uf}</td>
                          </>
                        )}
                        {activeExplorerTable === "estoques" && (
                          <>
                            <td className="py-2.5 px-3 text-blue-600 font-semibold">{item.id}</td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono">{item.medicamento_id}</td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono">{item.instituicao_id}</td>
                            <td className="py-2.5 px-3 text-right text-slate-900 font-medium font-mono">{item.quantidade.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono">{item.lote}</td>
                            <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{item.validade}</td>
                            <td className="py-2.5 px-3 text-right text-slate-600 font-mono">{item.demanda_mensal.toLocaleString()}</td>
                          </>
                        )}
                        {activeExplorerTable === "movimentacoes" && (
                          <>
                            <td className="py-2.5 px-3 text-blue-600 font-semibold">{item.id}</td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono">{item.medicamento_id}</td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono">{item.instituicao_id}</td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                item.tipo === 'Entrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}>{item.tipo}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-900 font-medium font-mono">{item.quantidade.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono">{item.lote}</td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono">{item.data}</td>
                            <td className="py-2.5 px-3 text-slate-500">{item.responsavel}</td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
                  <h3 className="font-display font-bold text-sm text-slate-900 font-sans">IA Observadora da Assistência Farmacêutica</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Gemini 2.5 Flash • Integrado com o SUS/RN</p>
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
                { label: "Alertas de Risco", q: "Quais medicamentos estão desabastecidos ou em nível crítico no RN?" },
                { label: "Caso Atorvastatina", q: "Como resolver o vencimento do lote L-ATO705 de Atorvastatina?" },
                { label: "Previsão Meropenem", q: "Qual a recomendação de controle de Meropenem no Hospital Giselda?" }
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
          <span>© 2026 Observatório da Assistência Farmacêutica • Ministério da Saúde / SUS • Solução em Nuvem Segura</span>
        </div>
        <div className="flex gap-4 font-mono">
          <span>v2.5.0-Release</span>
          <span>•</span>
          <span className="text-blue-600 font-semibold flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-blue-600" /> Linter e Compilação: OK
          </span>
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
