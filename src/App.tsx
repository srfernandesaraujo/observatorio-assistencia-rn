import { useState, useEffect, useRef, useMemo } from "react";
import {
  Layers,
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
  MONITORAMENTO_ANTIMICROBIANOS_RN,
  JUDICIALIZACAO_RN,
  ATS_DOSSIERS_RN,
  INCIDENTES_FARMACOVIGILANCIA_RN,
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

export const DENSIDADE_CRF_RN: Record<string, { populacao: number; totalFarmacias: number; densidade: number; colorClass: string; hexColor: string; description: string }> = {
  "REG-I": {
    populacao: 420000,
    totalFarmacias: 245,
    densidade: 5.83,
    colorClass: "bg-yellow-500 text-yellow-950 border-yellow-300",
    hexColor: "#facc15",
    description: "Abastecimento moderado. Cobertura intermediária centralizada em São José de Mipibu."
  },
  "REG-II": {
    populacao: 480000,
    totalFarmacias: 380,
    densidade: 7.92,
    colorClass: "bg-rose-500 text-rose-100 border-rose-300",
    hexColor: "#f43f5e",
    description: "Boa cobertura comercial e pública na região de Mossoró, tendência de crescimento."
  },
  "REG-III": {
    populacao: 160000,
    totalFarmacias: 68,
    densidade: 4.25,
    colorClass: "bg-teal-500 text-teal-100 border-teal-300",
    hexColor: "#0d9488",
    description: "Densidade baixa. Alerta de assistência farmacêutica para pequenos municípios da região."
  },
  "REG-IV": {
    populacao: 290000,
    totalFarmacias: 195,
    densidade: 6.72,
    colorClass: "bg-orange-500 text-orange-100 border-orange-300",
    hexColor: "#f97316",
    description: "Cobertura adequada, bem consolidada e descentralizada na região do Seridó potiguar."
  },
  "REG-V": {
    populacao: 150000,
    totalFarmacias: 58,
    densidade: 3.87,
    colorClass: "bg-sky-500 text-sky-100 border-sky-300",
    hexColor: "#0ea5e9",
    description: "Vulnerabilidade média. Desertos farmacêuticos localizados em áreas eminentemente rurais."
  },
  "REG-VI": {
    populacao: 210000,
    totalFarmacias: 72,
    densidade: 3.43,
    colorClass: "bg-blue-600 text-blue-100 border-blue-400",
    hexColor: "#2563eb",
    description: "Crítico. Menor densidade farmacêutica do estado do RN, alto risco de deserto farmacêutico."
  },
  "REG-VII": {
    populacao: 1350000,
    totalFarmacias: 1280,
    densidade: 9.48,
    colorClass: "bg-red-600 text-red-100 border-red-400",
    hexColor: "#dc2626",
    description: "Saturação comercial elevada. Altíssima densidade na Região Metropolitana de Natal."
  },
  "REG-VIII": {
    populacao: 140000,
    totalFarmacias: 65,
    densidade: 4.64,
    colorClass: "bg-emerald-500 text-emerald-100 border-emerald-300",
    hexColor: "#10b981",
    description: "Cobertura limítrofe no vale do Açu, dependência acentuada do suporte farmacêutico público."
  }
};

export interface FarmaciaPlat {
  id: string;
  nome: string;
  endereco: string;
  tipo: "Pública" | "Privada";
  cidade: string;
  regiaoId: string;
  lon: number;
  lat: number;
  telefone: string;
  funcionamento: string;
  crfStatus: "Ativa" | "Regular" | "Pendente";
}

export const FARMACIAS_RN: FarmaciaPlat[] = [
  // Metropolitana (REG-VII) - Red
  { id: "F-MET-01", nome: "Unicat Central de Natal", endereco: "Av. Rio Branco, 600 - Cidade Alta, Natal - RN", tipo: "Pública", cidade: "Natal", regiaoId: "REG-VII", lon: -35.2094, lat: -5.7945, telefone: "(84) 3232-6360", funcionamento: "Seg a Sex: 07:00h às 17:00h", crfStatus: "Ativa" },
  { id: "F-MET-02", nome: "Drogasil Tirol", endereco: "Av. Hermes da Fonseca, 900 - Tirol, Natal - RN", tipo: "Privada", cidade: "Natal", regiaoId: "REG-VII", lon: -35.2050, lat: -5.7980, telefone: "(84) 3344-1212", funcionamento: "Todos os dias: 24h", crfStatus: "Ativa" },
  { id: "F-MET-03", nome: "Drogasil Ponta Negra", endereco: "Av. Eng. Roberto Freire, 2500 - Ponta Negra, Natal - RN", tipo: "Privada", cidade: "Natal", regiaoId: "REG-VII", lon: -35.2150, lat: -5.8150, telefone: "(84) 3344-1515", funcionamento: "Todos os dias: 07:00h às 23:00h", crfStatus: "Ativa" },
  { id: "F-MET-04", nome: "Drogaria Globo Cohabinal", endereco: "Av. Castor Vieira Régis, 142 - Cohabinal, Parnamirim - RN", tipo: "Privada", cidade: "Parnamirim", regiaoId: "REG-VII", lon: -35.2628, lat: -5.9156, telefone: "(84) 3645-8899", funcionamento: "Todos os dias: 07:00h às 22:00h", crfStatus: "Regular" },
  { id: "F-MET-05", nome: "Farmácia Básica Municipal Macaíba", endereco: "Rua Dr. Pedro Matos, 45 - Centro, Macaíba - RN", tipo: "Pública", cidade: "Macaíba", regiaoId: "REG-VII", lon: -35.3539, lat: -5.8583, telefone: "(84) 3271-1122", funcionamento: "Seg a Sex: 08:00h às 17:00h", crfStatus: "Ativa" },
  { id: "F-MET-06", nome: "Drogasil Extremoz", endereco: "Rua Pedro Vasconcelos, 110 - Centro, Extremoz - RN", tipo: "Privada", cidade: "Extremoz", regiaoId: "REG-VII", lon: -35.2347, lat: -5.7061, telefone: "(84) 3279-4545", funcionamento: "Seg a Sáb: 07:00h às 22:00h", crfStatus: "Regular" },
  { id: "F-MET-07", nome: "Pague Menos Centro Parnamirim", endereco: "Av. Brigadeiro Everaldo Breves, 210 - Centro, Parnamirim - RN", tipo: "Privada", cidade: "Parnamirim", regiaoId: "REG-VII", lon: -35.2700, lat: -5.9220, telefone: "(84) 3645-1212", funcionamento: "Todos os dias: 07:00h às 23:00h", crfStatus: "Ativa" },
  
  // Mossoró (REG-II) - Rose
  { id: "F-MOS-01", nome: "Unicat Regional Mossoró", endereco: "Av. Alberto Maranhão, 2125 - Centro, Mossoró - RN", tipo: "Pública", cidade: "Mossoró", regiaoId: "REG-II", lon: -37.3438, lat: -5.1881, telefone: "(84) 3315-3210", funcionamento: "Seg a Sex: 07:00h às 13:00h", crfStatus: "Ativa" },
  { id: "F-MOS-02", nome: "Drogasil Centro Mossoró", endereco: "Rua Coronel Gurgel, 150 - Centro, Mossoró - RN", tipo: "Privada", cidade: "Mossoró", regiaoId: "REG-II", lon: -37.3480, lat: -5.1820, telefone: "(84) 3314-8844", funcionamento: "Todos os dias: 24h", crfStatus: "Ativa" },
  { id: "F-MOS-03", nome: "Pague Menos Nova Betânia", endereco: "Av. João da Escóssia, 1100 - Nova Betânia, Mossoró - RN", tipo: "Privada", cidade: "Mossoró", regiaoId: "REG-II", lon: -37.3550, lat: -5.1950, telefone: "(84) 3312-4000", funcionamento: "Todos os dias: 07:00h às 23:00h", crfStatus: "Ativa" },
  { id: "F-MOS-04", nome: "Drogaria Globo Areia Branca", endereco: "Rua Coronel Liberalino, 180 - Centro, Areia Branca - RN", tipo: "Privada", cidade: "Areia Branca", regiaoId: "REG-II", lon: -37.1369, lat: -4.9561, telefone: "(84) 3332-1515", funcionamento: "Todos os dias: 07:00h às 22:00h", crfStatus: "Regular" },
  { id: "F-MOS-05", nome: "Farmácia Básica de Apodi", endereco: "Rua Governador Dix-Sept Rosado, 300 - Centro, Apodi - RN", tipo: "Pública", cidade: "Apodi", regiaoId: "REG-II", lon: -37.7961, lat: -5.6617, telefone: "(84) 3333-2112", funcionamento: "Seg a Sex: 07:30h às 13:30h", crfStatus: "Ativa" },
  { id: "F-MOS-06", nome: "Drogasil Baraúna", endereco: "Av. Jerônimo Rosado, 50 - Centro, Baraúna - RN", tipo: "Privada", cidade: "Baraúna", regiaoId: "REG-II", lon: -37.6214, lat: -5.0792, telefone: "(84) 3320-1122", funcionamento: "Seg a Sáb: 07:00h às 21:00h", crfStatus: "Pendente" },

  // Caicó (REG-IV) - Orange
  { id: "F-CAI-01", nome: "Unicat Regional Caicó", endereco: "Av. Coronel Martiniano, 1050 - Centro, Caicó - RN", tipo: "Pública", cidade: "Caicó", regiaoId: "REG-IV", lon: -37.0974, lat: -6.4584, telefone: "(84) 3421-6060", funcionamento: "Seg a Sex: 07:00h às 13:00h", crfStatus: "Ativa" },
  { id: "F-CAI-02", nome: "Drogasil Caicó", endereco: "Rua Olegário Vale, 420 - Centro, Caicó - RN", tipo: "Privada", cidade: "Caicó", regiaoId: "REG-IV", lon: -37.0900, lat: -6.4500, telefone: "(84) 3421-2525", funcionamento: "Todos os dias: 07:00h às 22:00h", crfStatus: "Ativa" },
  { id: "F-CAI-03", nome: "Farmácia Municipal de Currais Novos", endereco: "Av. Coronel José Bezerra, 45 - Centro, Currais Novos - RN", tipo: "Pública", cidade: "Currais Novos", regiaoId: "REG-IV", lon: -36.5147, lat: -6.2608, telefone: "(84) 3431-2244", funcionamento: "Seg a Sex: 07:30h às 17:00h", crfStatus: "Ativa" },
  { id: "F-CAI-04", nome: "Pague Menos Currais Novos", endereco: "Av. Teotônio Freire, 280 - Centro, Currais Novos - RN", tipo: "Privada", cidade: "Currais Novos", regiaoId: "REG-IV", lon: -36.5200, lat: -6.2550, telefone: "(84) 3431-1515", funcionamento: "Seg a Sáb: 07:00h às 22:00h", crfStatus: "Ativa" },
  { id: "F-CAI-05", nome: "Farmácia Básica de Jucurutu", endereco: "Rua Dr. Seridó, 10 - Centro, Jucurutu - RN", tipo: "Pública", cidade: "Jucurutu", regiaoId: "REG-IV", lon: -37.2519, lat: -6.0339, telefone: "(84) 3429-2110", funcionamento: "Seg a Sex: 08:00h às 13:00h", crfStatus: "Regular" },
  { id: "F-CAI-06", nome: "Farmácia Santana Parelhas", endereco: "Av. Mauro Medeiros, 120 - Centro, Parelhas - RN", tipo: "Privada", cidade: "Parelhas", regiaoId: "REG-IV", lon: -36.6547, lat: -6.6881, telefone: "(84) 3471-2233", funcionamento: "Todos os dias: 07:00h às 21:00h", crfStatus: "Regular" },

  // São José de Mipibu (REG-I) - Yellow
  { id: "F-MIP-01", nome: "Unicat Regional São José de Mipibu", endereco: "Rua Senador Georgino Avelino, 110 - Centro, São José de Mipibu - RN", tipo: "Pública", cidade: "São José de Mipibu", regiaoId: "REG-I", lon: -35.2384, lat: -6.0751, telefone: "(84) 3273-3030", funcionamento: "Seg a Sex: 07:00h às 13:00h", crfStatus: "Ativa" },
  { id: "F-MIP-02", nome: "Drogasil Mipibu", endereco: "Av. Moizaniel de Carvalho, 300 - Centro, São José de Mipibu - RN", tipo: "Privada", cidade: "São José de Mipibu", regiaoId: "REG-I", lon: -35.2420, lat: -6.0800, telefone: "(84) 3273-1515", funcionamento: "Seg a Sáb: 07:00h às 22:00h", crfStatus: "Ativa" },
  { id: "F-MIP-03", nome: "Drogaria Globo Goianinha", endereco: "Rua Dr. João Carlos, 140 - Centro, Goianinha - RN", tipo: "Privada", cidade: "Goianinha", regiaoId: "REG-I", lon: -35.2117, lat: -6.2667, telefone: "(84) 3243-2211", funcionamento: "Todos os dias: 07:00h às 22:00h", crfStatus: "Regular" },
  { id: "F-MIP-04", nome: "Farmácia Básica de Nova Cruz", endereco: "Rua 13 de Maio, 80 - Centro, Nova Cruz - RN", tipo: "Pública", cidade: "Nova Cruz", regiaoId: "REG-I", lon: -35.4144, lat: -6.4778, telefone: "(84) 3281-2311", funcionamento: "Seg a Sex: 08:00h às 17:00h", crfStatus: "Ativa" },
  { id: "F-MIP-05", nome: "Farmácia Popular Canguaretama", endereco: "Rua Dr. Almir Freire, 50 - Centro, Canguaretama - RN", tipo: "Privada", cidade: "Canguaretama", regiaoId: "REG-I", lon: -35.1275, lat: -6.3800, telefone: "(84) 3241-1234", funcionamento: "Seg a Sáb: 07:30h às 21:00h", crfStatus: "Regular" },

  // Açu (REG-VIII) - Green
  { id: "F-ACU-01", nome: "Farmácia Básica Municipal de Açu", endereco: "Rua Coronel José Vicente, 280 - Centro, Açu - RN", tipo: "Pública", cidade: "Açu", regiaoId: "REG-VIII", lon: -36.9135, lat: -5.5707, telefone: "(84) 3331-2020", funcionamento: "Seg a Sex: 07:00h às 17:00h", crfStatus: "Ativa" },
  { id: "F-ACU-02", nome: "Pague Menos Centro Açu", endereco: "Av. Senador João Câmara, 120 - Centro, Açu - RN", tipo: "Privada", cidade: "Açu", regiaoId: "REG-VIII", lon: -36.9200, lat: -5.5750, telefone: "(84) 3331-4040", funcionamento: "Todos os dias: 07:00h às 22:00h", crfStatus: "Ativa" },
  { id: "F-ACU-03", nome: "Drogaria Globo Macau", endereco: "Av. Centenário, 250 - Centro, Macau - RN", tipo: "Privada", cidade: "Macau", regiaoId: "REG-VIII", lon: -36.6344, lat: -5.1150, telefone: "(84) 3521-1212", funcionamento: "Todos os dias: 07:00h às 22:00h", crfStatus: "Regular" },
  { id: "F-ACU-04", nome: "Farmácia Básica de Angicos", endereco: "Rua Aristófanes Fernandes, 12 - Centro, Angicos - RN", tipo: "Pública", cidade: "Angicos", regiaoId: "REG-VIII", lon: -36.6067, lat: -5.6656, telefone: "(84) 3531-2110", funcionamento: "Seg a Sex: 08:00h às 12:00h", crfStatus: "Regular" },

  // João Câmara (REG-III) - Teal
  { id: "F-JCA-01", nome: "Unicat Regional João Câmara", endereco: "Rua Jerônimo Câmara, 80 - Centro, João Câmara - RN", tipo: "Pública", cidade: "João Câmara", regiaoId: "REG-III", lon: -35.8115, lat: -5.5312, telefone: "(84) 3262-2323", funcionamento: "Seg a Sex: 07:00h às 13:00h", crfStatus: "Ativa" },
  { id: "F-JCA-02", nome: "Drogasil João Câmara", endereco: "Av. Antônio Severiano, 450 - Centro, João Câmara - RN", tipo: "Privada", cidade: "João Câmara", regiaoId: "REG-III", lon: -35.8200, lat: -5.5400, telefone: "(84) 3262-1111", funcionamento: "Seg a Sáb: 07:00h às 22:00h", crfStatus: "Ativa" },
  { id: "F-JCA-03", nome: "Farmácia Municipal de Touros", endereco: "Rua Dr. Mário Ribeiro, 10 - Centro, Touros - RN", tipo: "Pública", cidade: "Touros", regiaoId: "REG-III", lon: -35.4614, lat: -5.1989, telefone: "(84) 3263-2212", funcionamento: "Seg a Sex: 08:00h às 14:00h", crfStatus: "Ativa" },
  { id: "F-JCA-04", nome: "Farmácia do Trabalhador Guamaré", endereco: "Rua Monsenhor José Tibúrcio, 80 - Centro, Guamaré - RN", tipo: "Privada", cidade: "Guamaré", regiaoId: "REG-III", lon: -36.3150, lat: -5.1067, telefone: "(84) 3525-4545", funcionamento: "Todos os dias: 07:00h às 21:00h", crfStatus: "Regular" },

  // Santa Cruz (REG-V) - Sky Blue
  { id: "F-SCR-01", nome: "Unicat Regional Santa Cruz", endereco: "Rua Dr. Pedro Medeiros, 215 - Centro, Santa Cruz - RN", tipo: "Pública", cidade: "Santa Cruz", regiaoId: "REG-V", lon: -36.0224, lat: -6.2230, telefone: "(84) 3291-3939", funcionamento: "Seg a Sex: 07:00h às 13:00h", crfStatus: "Ativa" },
  { id: "F-SCR-02", nome: "Drogasil Santa Cruz", endereco: "Rua Getúlio Vargas, 110 - Centro, Santa Cruz - RN", tipo: "Privada", cidade: "Santa Cruz", regiaoId: "REG-V", lon: -36.0300, lat: -6.2300, telefone: "(84) 3291-1122", funcionamento: "Todos os dias: 07:00h às 22:00h", crfStatus: "Ativa" },
  { id: "F-SCR-03", nome: "Farmácia Central de Lajes", endereco: "Av. Getúlio Vargas, 20 - Centro, Lajes - RN", tipo: "Pública", cidade: "Lajes", regiaoId: "REG-V", lon: -36.2464, lat: -5.7000, telefone: "(84) 3532-2244", funcionamento: "Seg a Sex: 08:00h às 14:00h", crfStatus: "Regular" },

  // Pau dos Ferros (REG-VI) - Deep Blue
  { id: "F-PDF-01", nome: "Unicat Regional Pau dos Ferros", endereco: "Rua Getúlio Vargas, 145 - Centro, Pau dos Ferros - RN", tipo: "Pública", cidade: "Pau dos Ferros", regiaoId: "REG-VI", lon: -38.2043, lat: -6.1119, telefone: "(84) 3351-2244", funcionamento: "Seg a Sex: 07:00h às 13:00h", crfStatus: "Ativa" },
  { id: "F-PDF-02", nome: "Drogaria Central Pau dos Ferros", endereco: "Av. da Independência, 850 - Centro, Pau dos Ferros - RN", tipo: "Privada", cidade: "Pau dos Ferros", regiaoId: "REG-VI", lon: -38.2100, lat: -6.1150, telefone: "(84) 3351-3000", funcionamento: "Seg a Sáb: 07:00h às 22:00h", crfStatus: "Ativa" },
  { id: "F-PDF-03", nome: "Farmácia DrogaVila Patu", endereco: "Rua Quintino Bocaiúva, 50 - Centro, Patu - RN", tipo: "Privada", cidade: "Patu", regiaoId: "REG-VI", lon: -37.6353, lat: -6.1089, telefone: "(84) 3361-2211", funcionamento: "Todos os dias: 07:00h às 21:00h", crfStatus: "Regular" },
  { id: "F-PDF-04", nome: "Farmácia Básica de Alexandria", endereco: "Rua Noé de Sousa, 15 - Centro, Alexandria - RN", tipo: "Pública", cidade: "Alexandria", regiaoId: "REG-VI", lon: -38.0161, lat: -6.4164, telefone: "(84) 3381-1212", funcionamento: "Seg a Sex: 08:00h às 12:00h", crfStatus: "Regular" }
];

export function getRegionPath(id: string): string {
  switch (id) {
    case "REG-VI": // Pau dos Ferros
      return "M 40 130 C 42 160, 38 180, 40 200 C 70 205, 110 210, 140 215 C 135 185, 132 155, 140 125 C 105 127, 75 129, 40 130 Z";
    case "REG-II": // Mossoró
      return "M 40 130 C 75 129, 105 127, 140 125 C 145 100, 150 75, 160 50 C 120 52, 80 55, 40 60 Z";
    case "REG-VIII": // Açu
      return "M 160 50 C 150 75, 145 100, 140 125 C 180 123, 230 121, 280 120 C 275 95, 278 70, 280 45 C 240 46, 200 48, 160 50 Z";
    case "REG-IV": // Caicó
      return "M 140 125 C 180 123, 230 121, 280 120 C 278 150, 282 180, 280 210 C 250 215, 225 170, 210 170 C 195 170, 170 210, 140 215 C 132 155, 135 185, 140 125 Z";
    case "REG-III": // João Câmara
      return "M 280 45 C 330 42, 390 38, 460 40 C 465 65, 468 90, 470 110 C 420 112, 350 115, 280 120 C 278 70, 275 95, 280 45 Z";
    case "REG-V": // Santa Cruz
      return "M 280 120 C 310 119, 340 118, 370 117 C 375 150, 372 185, 370 220 C 335 222, 305 215, 280 210 C 282 180, 278 150, 280 120 Z";
    case "REG-VII": // Metropolitana / Natal
      return "M 370 117 C 400 116, 430 114, 470 110 C 475 120, 485 130, 490 140 C 450 142, 410 135, 370 117 Z";
    case "REG-I": // São José de Mipibu
      return "M 370 117 C 410 135, 450 142, 490 140 C 485 170, 480 200, 475 225 C 440 223, 400 221, 370 220 C 372 185, 375 150, 370 117 Z";
    default:
      return "";
  }
}

export const REGIONAL_SEDES = [
  { id: "REG-VII", name: "Metropolitana", lon: -35.2094, lat: -5.7945 },
  { id: "REG-I", name: "São José de Mipibu", lon: -35.2384, lat: -6.0751 },
  { id: "REG-III", name: "João Câmara", lon: -35.8115, lat: -5.5312 },
  { id: "REG-V", name: "Santa Cruz", lon: -36.0224, lat: -6.2230 },
  { id: "REG-IV", name: "Caicó", lon: -37.0974, lat: -6.4584 },
  { id: "REG-VIII", name: "Açu", lon: -36.9135, lat: -5.5707 },
  { id: "REG-II", name: "Mossoró", lon: -37.3438, lat: -5.1881 },
  { id: "REG-VI", name: "Pau dos Ferros", lon: -38.2043, lat: -6.1119 }
];

export function getRegionForMunicipality(name: string, defaultId: string): string {
  const n = name.toLowerCase().trim();
  if (n === "apodi" || n === "caraúbas" || n === "caraubas" || n === "felipe guerra") return "REG-II";
  if (n === "macau" || n === "guamaré" || n === "guamare" || n === "pendências" || n === "pendencias") return "REG-VIII";
  if (n === "touros" || n === "pureza" || n === "são miguel do gostoso" || n === "sao miguel do gostoso") return "REG-III";
  if (n === "lajes" || n === "pedro avelino") return "REG-V";
  if (n === "patu" || n === "martins" || n === "almino afonso") return "REG-VI";
  if (n === "currais novos" || n === "parelhas" || n === "acari" || n === "jardim do seridó" || n === "jardim do serido") return "REG-IV";
  return defaultId;
}

export function getGeometryCentroid(geometry: any): [number, number] {
  if (!geometry) return [0, 0];
  const { type, coordinates } = geometry;
  let sumLon = 0;
  let sumLat = 0;
  let count = 0;

  if (type === "Polygon") {
    const ring = coordinates[0];
    if (ring) {
      ring.forEach((coord: any) => {
        sumLon += coord[0];
        sumLat += coord[1];
        count++;
      });
    }
  } else if (type === "MultiPolygon") {
    coordinates.forEach((poly: any) => {
      const ring = poly[0];
      if (ring) {
        ring.forEach((coord: any) => {
          sumLon += coord[0];
          sumLat += coord[1];
          count++;
        });
      }
    });
  }

  return count > 0 ? [sumLon / count, sumLat / count] : [0, 0];
}

export function getSvgPath(geometry: any, projectFn: (lon: number, lat: number) => [number, number]): string {
  if (!geometry) return "";
  const { type, coordinates } = geometry;
  if (type === "Polygon") {
    return coordinates
      .map((ring: any) => {
        return "M " + ring.map((coord: any) => {
          const [px, py] = projectFn(coord[0], coord[1]);
          return `${px.toFixed(1)},${py.toFixed(1)}`;
        }).join(" L ") + " Z";
      })
      .join(" ");
  } else if (type === "MultiPolygon") {
    return coordinates
      .map((polygonCoords: any) => {
        return polygonCoords
          .map((ring: any) => {
            return "M " + ring.map((coord: any) => {
              const [px, py] = projectFn(coord[0], coord[1]);
              return `${px.toFixed(1)},${py.toFixed(1)}`;
            }).join(" L ") + " Z";
          })
          .join(" ");
      })
      .join(" ");
  }
  return "";
}

export function getThermalDiscomfortColor(name: string): { fill: string; temp: string } {
  if (!name) return { fill: "#eab308", temp: "24,8 °C" };
  const norm = name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // 24.1 °C (Blue)
  if (norm === "florania" || norm === "cruzeta") {
    return { fill: "#1d4ed8", temp: "24,1 °C" };
  }
  // 24.4 °C (Green)
  if (
    norm === "caico" ||
    norm === "currais novos" ||
    norm === "parelhas" ||
    norm === "jucurutu" ||
    norm === "ceara-mirim" ||
    norm === "extremoz"
  ) {
    return { fill: "#15803d", temp: "24,4 °C" };
  }
  // 24.8 °C (Yellow)
  if (
    norm === "joao camara" ||
    norm === "touros" ||
    norm === "santa cruz" ||
    norm === "lajes" ||
    norm === "angicos"
  ) {
    return { fill: "#eab308", temp: "24,8 °C" };
  }
  // 25.1 °C (Orange)
  if (
    norm === "natal" ||
    norm === "parnamirim" ||
    norm === "macaiba" ||
    norm === "sao goncalo do amarante" ||
    norm === "sao jose de mipibu" ||
    norm === "goianinha" ||
    norm === "canguaretama" ||
    norm === "nova cruz" ||
    norm === "patu" ||
    norm === "alexandria"
  ) {
    return { fill: "#f97316", temp: "25,1 °C" };
  }
  // 25.8 °C (Red)
  if (
    norm === "mossoro" ||
    norm === "apodi" ||
    norm === "barauna" ||
    norm === "areia branca" ||
    norm === "macau" ||
    norm === "guamare" ||
    norm === "acu" ||
    norm === "pau dos ferros"
  ) {
    return { fill: "#dc2626", temp: "25,8 °C" };
  }

  return { fill: "#eab308", temp: "24,8 °C" };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"principal" | "configuracoes" | "analytics">("principal");
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

  // States para a Simulação Interativa do Analytics
  const [simSourceRegion, setSimSourceRegion] = useState("1");
  const [simDestRegion, setSimDestRegion] = useState("3");
  const [simMedication, setSimMedication] = useState("Insulina NPH");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // States para o mapa dinâmico GeoJSON do RN
  const [rnGeoJson, setRnGeoJson] = useState<any>(null);
  const [isLoadingMap, setIsLoadingMap] = useState<boolean>(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [hoveredMunicipality, setHoveredMunicipality] = useState<any>(null);

  useEffect(() => {
    setIsLoadingMap(true);
    fetch("/rn-municipalities.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Falha ao carregar o mapa do RN.");
        }
        return res.json();
      })
      .then((data) => {
        setRnGeoJson(data);
        setIsLoadingMap(false);
      })
      .catch((err) => {
        console.error("Erro carregando GeoJSON:", err);
        setMapError(err.message || "Erro desconhecido ao carregar o mapa.");
        setIsLoadingMap(false);
      });
  }, []);

  // Geographic projection helper to map Lon/Lat to SVG viewBox coordinates [600, 260]
  // RN boundaries: Longitude: ~ -38.6 to -34.9, Latitude: ~ -4.8 to -6.9
  const projection = useMemo(() => {
    return {
      project: (lon: number, lat: number): [number, number] => {
        const minLon = -38.6;
        const maxLon = -34.9;
        const minLat = -6.9; // South limit
        const maxLat = -4.8; // North limit

        // Scale factors
        const width = 600;
        const height = 260;
        
        // Add padding to keep geometries beautifully centered with margins
        const paddingLeft = 30;
        const paddingRight = 30;
        const paddingTop = 25;
        const paddingBottom = 25;

        const scaleX = (width - paddingLeft - paddingRight) / (maxLon - minLon);
        // In GIS, north (maxLat) is up, but in SVG y goes down, so we subtract
        const scaleY = (height - paddingTop - paddingBottom) / (maxLat - minLat);

        // Map longitude to x
        const x = paddingLeft + (lon - minLon) * scaleX;
        // Map latitude to y
        const y = paddingTop + (maxLat - lat) * scaleY;

        return [x, y];
      }
    };
  }, []);

  // States para Módulos de Planejamento do RN
  const [selectedRegionId, setSelectedRegionId] = useState<string>("REG-VII");
  const [mapViewMode, setMapViewMode] = useState<"heatmap" | "solid">("heatmap");
  const [pharmacySearchQuery, setPharmacySearchQuery] = useState<string>("");
  const [pharmacyTypeFilter, setPharmacyTypeFilter] = useState<"All" | "Pública" | "Privada">("All");
  const [selectedPharmacy, setSelectedPharmacy] = useState<FarmaciaPlat | null>(null);
  const [simulationLog, setSimulationLog] = useState<string>("");

  const filteredPharmacies = FARMACIAS_RN.filter((pharm) => {
    const matchesSearch = 
      pharm.nome.toLowerCase().includes(pharmacySearchQuery.toLowerCase()) ||
      pharm.cidade.toLowerCase().includes(pharmacySearchQuery.toLowerCase()) ||
      pharm.endereco.toLowerCase().includes(pharmacySearchQuery.toLowerCase());
    const matchesType = pharmacyTypeFilter === "All" || pharm.tipo === pharmacyTypeFilter;
    return matchesSearch && matchesType;
  });
  const [qaScores, setQaScores] = useState<Record<string, boolean>>({
    "QA-01": true,
    "QA-02": true,
    "QA-03": false,
    "QA-04": true,
    "QA-05": true,
    "QA-06": true,
    "QA-07": false,
  });
  const [fvList, setFvList] = useState<any[]>(INCIDENTES_FARMACOVIGILANCIA_RN);
  const [fvForm, setFvForm] = useState({
    medicamento: "Amoxicilina 500mg",
    lote: "L-AMX401",
    reacaoAdversa: "",
    gravidade: "Moderada" as "Leve" | "Moderada" | "Grave",
    unidadeNotificante: "Hospital Regional Walfredo Gurgel"
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

  // States para Analytics / Cruzamento de Dados
  const [activeAnalyticsView, setActiveAnalyticsView] = useState<"judicial_vs_ats" | "desabastecimento_vs_frio" | "antimicrobianos_vs_resistencia" | "economia_geral">("judicial_vs_ats");

  // States para Explorer de Tabelas (integrado à área de Analytics)
  const [activeExplorerTable, setActiveExplorerTable] = useState<"medicamentos" | "instituicoes" | "estoques" | "movimentacoes">("medicamentos");
  const [explorerSearch, setExplorerSearch] = useState("");

  // States para Cópia de Código
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Real-time sync for Pharmacovigilance reports
  useEffect(() => {
    if (!currentUser) {
      setFvList(INCIDENTES_FARMACOVIGILANCIA_RN);
      return;
    }

    const q = query(collection(db, "pharmacovigilance"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports: any[] = [];
      snapshot.forEach((doc) => {
        reports.push(doc.data());
      });
      const firestoreIds = new Set(reports.map(r => r.id));
      const uniqueStatic = INCIDENTES_FARMACOVIGILANCIA_RN.filter(item => !firestoreIds.has(item.id));
      
      // Sort newest from Firestore first
      reports.sort((a, b) => b.data.localeCompare(a.data));
      setFvList([...reports, ...uniqueStatic]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "pharmacovigilance");
    });

    return () => unsubscribe();
  }, [currentUser]);

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

  const handleFvDelete = async (reportId: string, createdBy: string, status: string) => {
    if (!currentUser) return;
    if (createdBy !== currentUser.uid) {
      alert("Você só pode deletar notificações criadas por você.");
      return;
    }
    if (status !== "Em Investigação") {
      alert("Apenas notificações 'Em Investigação' podem ser deletadas.");
      return;
    }
    try {
      await deleteDoc(doc(db, "pharmacovigilance", reportId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `pharmacovigilance/${reportId}`);
    }
  };

  // Manipular Cópia de Código
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- FUNÇÕES DE SIMULAÇÃO DOS MÓDULOS DO RN ---

  // 1. Simular Varredura e Alerta de Desabastecimento no RN
  const runActiveMonitoringSimulation = (drugId: string) => {
    setSimulationLog("Iniciando varredura em tempo real no banco de dados da UNICAT/SESAP-RN...\n");
    setTimeout(() => {
      setSimulationLog((prev) => prev + `[INFO] Sincronizado com os estoques das 8 Regiões de Saúde do RN.\n`);
    }, 400);
    setTimeout(() => {
      if (drugId === "MED-002") {
        setSimulationLog(
          (prev) =>
            prev +
            `[ALERTA MÁXIMO] Amoxicilina 500mg (MED-002) está com ESTOQUE ZERADO na UPA Sobradinho!\n[METRIC] Demanda Mensal: 2.500 un. | Estoque: 0 un. | Autonomia: 0 dias.\n`
        );
      } else {
        setSimulationLog(
          (prev) =>
            prev +
            `[ALERTA CRÍTICO] Insulina Humana NPH 100 UI (MED-001) com autonomia crítica no HRAN.\n[METRIC] Demanda Mensal: 1.200 un. | Estoque: 150 un. | Autonomia: 3.75 dias.\n`
        );
      }
    }, 900);
    setTimeout(() => {
      setSimulationLog((prev) => prev + `[IA OBSERVADORA] Buscando lotes excedentes ou margem de segurança no RN...\n`);
    }, 1400);
    setTimeout(() => {
      if (drugId === "MED-002") {
        setSimulationLog(
          (prev) =>
            prev +
            `[SOLUÇÃO LOCALIZADA] Encontrado lote excedente de 85.000 un. (L-AMX401) no Almoxarifado Central (SES-DF) com validade saudável (2027-04-10).\n[AÇÃO COMPLETA] Gerando proposta de remanejamento emergencial de 4.000 unidades para restabelecer autonomia de 48 dias na UPA Sobradinho.\n[SUCCESS] Minuta de guia de transporte emitida e enviada para aprovação do coordenador regional!`
        );
      } else {
        setSimulationLog(
          (prev) =>
            prev +
            `[SOLUÇÃO LOCALIZADA] Encontrado lote excedente de 4.500 un. (L-INS882) na Farmácia de Alto Custo - Asa Sul com validade para 2026-11-20.\n[AÇÃO COMPLETA] Gerando proposta de remanejamento emergencial de 750 unidades para suprir o HRAN (Garantindo +18 dias de cobertura imediata).\n[SUCCESS] Alerta de remanejamento seguro enviado para o WhatsApp do farmacêutico responsável!`
        );
      }
    }, 2000);
  };

  // 2. Submeter Notificação de Farmacovigilância
  const handleFvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fvForm.reacaoAdversa.trim()) return;

    const reportId = `FV-${Math.floor(100 + Math.random() * 900)}`;
    const nuevoIncidente = {
      id: reportId,
      medicamento: fvForm.medicamento,
      lote: fvForm.lote,
      reacaoAdversa: fvForm.reacaoAdversa,
      gravidade: fvForm.gravidade,
      unidadeNotificante: fvForm.unidadeNotificante,
      data: new Date().toISOString().split("T")[0],
      status: "Em Investigação" as const,
      createdBy: currentUser ? currentUser.uid : "offline_guest"
    };

    if (currentUser) {
      try {
        const reportRef = doc(db, "pharmacovigilance", reportId);
        await setDoc(reportRef, nuevoIncidente);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `pharmacovigilance/${reportId}`);
      }
    } else {
      setFvList((prev) => [nuevoIncidente, ...prev]);
    }
    setFvForm((prev) => ({ ...prev, reacaoAdversa: "" }));
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
                PROTÓTIPO ATIVO
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-sans">
              Sistema de Gestão de Suprimentos Farmacêuticos, Ingestão de Dados e Previsão Baseada em IA
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
              Conectar com Google
            </button>
          )}
          <div className="hidden sm:block h-3 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>17 de Julho, 2026</span>
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
      <nav className="bg-white px-6 py-2 border-b border-slate-200 flex overflow-x-auto gap-1 scrollbar-none sticky top-[73px] z-30 shadow-sm font-sans">
        <button
          onClick={() => {
            setActiveTab("principal");
            setActiveRnSubTab("visao_geral");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap border ${
            activeTab === "principal"
              ? "bg-blue-50 text-blue-600 border-blue-100 shadow-sm font-semibold"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent"
          }`}
        >
          <Layers className="h-4 w-4 text-blue-600" />
          Painel Principal (Gestão do RN)
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap border ${
            activeTab === "analytics"
              ? "bg-blue-50 text-blue-600 border-blue-100 shadow-sm font-semibold"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent"
          }`}
        >
          <BarChart3 className="h-4 w-4 text-purple-600" />
          Analytics & Cruzamento de Dados
        </button>

        <button
          onClick={() => setActiveTab("configuracoes")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap border ${
            activeTab === "configuracoes"
              ? "bg-blue-50 text-blue-600 border-blue-100 shadow-sm font-semibold"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent"
          }`}
        >
          <Settings className="h-4 w-4 text-slate-600" />
          Configurações & Ingestão Manual
        </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">

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

        {/* TAB 1: PAINEL PRINCIPAL (SIDEBAR + CONTEÚDO) */}
        {!loading && activeTab === "principal" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start font-sans">
            
            {/* SIDEBAR SUB-TABS SELECTOR (ALWAYS VISIBLE) */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1 md:sticky md:top-[140px] z-20 font-sans">
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
                { id: "antimicrobianos", label: "Gestão Antimicrobianos", icon: Cpu, hover: "hover:bg-amber-50 hover:text-amber-600" },
                { id: "judicializacao", label: "Índice Judicialização", icon: Scale, hover: "hover:bg-purple-50 hover:text-purple-600" },
                { id: "mapa", label: "Mapa de Distribuição", icon: Map, hover: "hover:bg-teal-50 hover:text-teal-600" },
                { id: "ats_farmacovigilancia", label: "ATS & Vigilância", icon: RefreshCw, hover: "hover:bg-indigo-50 hover:text-indigo-600" },
                { id: "repositorio", label: "Repositório & Educação", icon: BookOpen, hover: "hover:bg-slate-100 hover:text-slate-800" },
                { id: "relatorio_impacto", label: "Relatório de Impacto", icon: Heart, hover: "hover:bg-rose-50 hover:text-rose-600" }
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
            <div className="lg:col-span-3 space-y-6">
              
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

                {/* 4. ANTIMICROBIANOS */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">Vigilância Clínica</span>
                      <span className="text-[10px] font-mono text-slate-400">OMS / ANVISA</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                      <Cpu className="h-4 w-4 text-amber-500" />
                      Gestão Antimicrobianos
                    </h3>
                    <p className="text-xs text-slate-500">
                      Consumo em Dose Diária Definida (DDD) e controle de superbactérias resistentes no RN.
                    </p>
                    <div className="bg-white rounded border border-slate-100 p-2.5 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-600">Consumo Metronidazol:</span>
                        <span className="font-semibold text-slate-800">12.4 DDD</span>
                      </div>
                      <div className="text-[9px] text-amber-600 font-mono bg-amber-50/30 px-1.5 py-1 rounded border border-amber-100/50 mt-1 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 bg-amber-500 rounded-full shrink-0"></span>
                        HRAN: Uso de Carbapenêmicos +14%
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveRnSubTab("antimicrobianos")}
                    className="mt-4 pt-2.5 border-t border-slate-100 text-xs font-semibold text-amber-650 hover:text-amber-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Ver Gráficos Antimicrobianos <ArrowRight className="h-3 w-3" />
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

                  {/* Interactive Simulator Card */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                          <Sliders className="h-4 w-4 text-blue-600" />
                          Simulador de Varredura por IA
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Simule como o sistema automatizado processa e resolve desabastecimentos na rede.
                        </p>
                        
                        <div className="mt-4 space-y-3">
                          <label className="block text-[11px] font-mono text-slate-400 uppercase">Selecione o Insumo Crítico</label>
                          <div className="space-y-2">
                            <button
                              onClick={() => runActiveMonitoringSimulation("MED-002")}
                              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs flex justify-between items-center transition-colors cursor-pointer"
                            >
                              <div>
                                <p className="font-semibold text-slate-800">Amoxicilina 500mg</p>
                                <p className="text-[10px] text-red-500 font-mono mt-0.5">Estoque ZERADO na UPA Sobradinho</p>
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                            </button>

                            <button
                              onClick={() => runActiveMonitoringSimulation("MED-001")}
                              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs flex justify-between items-center transition-colors cursor-pointer"
                            >
                              <div>
                                <p className="font-semibold text-slate-800">Insulina Humana NPH</p>
                                <p className="text-[10px] text-amber-500 font-mono mt-0.5">Estoques Críticos no HRAN</p>
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-slate-100 pt-3 text-[10px] text-slate-400 italic">
                        Clique em um dos insumos acima para disparar os fluxos automáticos da IA Observadora.
                      </div>
                    </div>

                    <div className="md:col-span-3 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col h-[280px]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Terminal className="h-4 w-4 text-emerald-400" />
                          <span className="text-[11px] font-mono text-slate-300 font-semibold">Console de Resolução de Desabastecimento</span>
                        </div>
                        <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded">ONLINE</span>
                      </div>
                      <div className="flex-1 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1.5 leading-relaxed scrollbar-none">
                        {simulationLog ? (
                          simulationLog.split("\n").map((line, i) => (
                            <p 
                              key={i} 
                              className={
                                line.includes("[ALERTA") ? "text-red-400 font-semibold" :
                                line.includes("[SUCCESS") ? "text-emerald-400 font-semibold" :
                                line.includes("[IA") ? "text-blue-400 font-semibold" :
                                line.includes("[ALERTA CRÍTICO]") ? "text-amber-400 font-semibold" :
                                "text-slate-300"
                              }
                            >
                              {line}
                            </p>
                          ))
                        ) : (
                          <div className="text-slate-500 h-full flex flex-col items-center justify-center text-center">
                            <span>Aguardando comando de simulação operacional...<br />Selecione um Insumo Crítico ao lado para iniciar.</span>
                          </div>
                        )}
                      </div>
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

              {/* SUB-TAB 4: ANTIMICROBIANOS */}
              {activeRnSubTab === "antimicrobianos" && (
                <div className="space-y-6">
                  {/* Banner */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                          <Cpu className="h-5 w-5 text-amber-500 animate-pulse" />
                          Gerenciamento e Controle de Antimicrobianos (Stewardship)
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Vigilância de uso de antibióticos de uso restrito, monitoramento de resistência bacteriana e consumo DDD.
                        </p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Redução de Uso Irracional</p>
                        <p className="text-xl font-bold font-mono text-amber-600">-{MONITORAMENTO_ANTIMICROBIANOS_RN.reducaoDispensacaoInadequada}%</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Sob protocolo Stewardship-RN</p>
                      </div>
                    </div>
                  </div>

                  {/* DDD e Resistência Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* DDD List */}
                    <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                      <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Consumo de Meropenem (Dose Diária Definida - DDD)</h3>
                      <div className="space-y-4">
                        {MONITORAMENTO_ANTIMICROBIANOS_RN.dddMeropenemHospitais.map((h, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-xs font-medium text-slate-700">{h.hospital}</p>
                            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                              <span>DDD Atual: <strong>{h.ddd}</strong></span>
                              <span>Teto Seguro: {h.limiteMax}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full ${h.ddd > h.limiteMax ? 'bg-red-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min((h.ddd / h.limiteMax) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Alertas de Resistência Bacteriana */}
                    <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                      <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Vigilância Epidemiológica de Superbactérias Ativas</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-mono">
                              <th className="py-2 font-normal">Patógeno Monitorado</th>
                              <th className="py-2 font-normal">Unidade Foco</th>
                              <th className="py-2 font-normal text-center">Amostras Positivas</th>
                              <th className="py-2 font-normal text-right">Tendência</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {MONITORAMENTO_ANTIMICROBIANOS_RN.alertasResistencia.map((alerta) => (
                              <tr key={alerta.id} className="text-slate-700">
                                <td className="py-2.5 font-medium">{alerta.patogeno}</td>
                                <td className="py-2.5 text-slate-500">{alerta.hospital}</td>
                                <td className="py-2.5 text-center font-mono text-slate-900 font-semibold">{alerta.amostrasGerais}</td>
                                <td className="py-2.5 text-right font-mono">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    alerta.tendencia === 'Aumento' ? 'bg-red-50 text-red-700 border border-red-100' :
                                    alerta.tendencia === 'Estável' ? 'bg-slate-100 text-slate-600' :
                                    'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  }`}>{alerta.tendencia}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Planning Context */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h4 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider mb-2">Estruturação & Integração do Controle de Antimicrobianos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
                      <div>
                        <strong className="text-slate-800">Como Funciona no RN:</strong>
                        <p className="mt-1">
                          A CCIH (Comissão de Controle de Infecção Hospitalar) de hospitais como o Giselda Trigueiro e Walfredo Gurgel insere prescrições de antimicrobianos restritos na plataforma. Farmacêuticos clínicos avaliam a adequabilidade da indicação e a dosagem em relação aos dados de culturas microbiológicas locais antes de liberar o fármaco.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-800">Como Agrega ao Sistema:</strong>
                        <p className="mt-1">
                          Os dados de DDD são compilados em relatórios que ajudam o Ministério da Saúde e a ANVISA no combate à resistência. O sistema gera automaticamente alertas de sobreconsumo e cruza com painéis bacteriológicos para detectar precocemente possíveis surtos por bactérias multirresistentes nas enfermarias estaduais.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 5: JUDICIALIZAÇÃO */}
              {activeRnSubTab === "judicializacao" && (
                <div className="space-y-6">
                  {/* Banner */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                          <Scale className="h-5 w-5 text-purple-600" />
                          Índice de Judicialização de Medicamentos no RN
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Gestão de demandas judiciais de saúde, acompanhamento de custos de sequestro e fármacos de alto custo fora da RENAME.
                        </p>
                      </div>
                      <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl text-right">
                        <p className="text-[10px] font-mono uppercase text-purple-700 font-bold">Bloqueios Judiciais 2026</p>
                        <p className="text-xl font-bold font-mono text-purple-800">R$ 18.500.000</p>
                        <span className="text-[9px] text-purple-600 font-mono">1.842 ações ativas</span>
                      </div>
                    </div>
                  </div>

                  {/* Fármacos Judicializados Tabela */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                    <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Principais Fármacos Motivadores de Ações Judiciais no RN</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-mono">
                            <th className="py-2 font-normal">Fármaco (Princípio Ativo)</th>
                            <th className="py-2 font-normal">Indicação Médica Comum</th>
                            <th className="py-2 font-normal text-right">Preço Unitário</th>
                            <th className="py-2 font-normal text-center">Processos Ativos</th>
                            <th className="py-2 font-normal text-right">Gasto Anual Estimado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {JUDICIALIZACAO_RN.map((item) => (
                            <tr key={item.id} className="text-slate-700 hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 font-medium">
                                {item.nome}
                                <span className="block text-[10px] text-slate-400 font-mono font-normal">{item.principio_ativo}</span>
                              </td>
                              <td className="py-3 text-slate-500 max-w-[200px] truncate" title={item.indicacao}>{item.indicacao}</td>
                              <td className="py-3 text-right font-mono text-slate-600">R$ {item.precoUnitario.toLocaleString()}</td>
                              <td className="py-3 text-center font-mono font-bold text-slate-900">{item.casosAtivos}</td>
                              <td className="py-3 text-right font-mono text-purple-600 font-bold">R$ {item.custoAnualEstimado.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Planning Context */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h4 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider mb-2">Estruturação & Integração de Judicialização no Sistema</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
                      <div>
                        <strong className="text-slate-800">Como Funciona no RN:</strong>
                        <p className="mt-1">
                          A judicialização é monitorada de forma coordenada com a Procuradoria Geral do Estado (PGE) para identificar demandas recorrentes por novos fármacos e racionalizar o estoque público.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-800">Como Agrega ao Sistema:</strong>
                        <p className="mt-1">
                          Esses dados guiam a tomada de decisão para novas compras estatais e auxiliam a comissão de farmácia do RN a analisar se os fármacos judicializados devem ser incorporados formalmente à lista regular.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 6: MAPA DE DISTRIBUIÇÃO */}
              {activeRnSubTab === "mapa" && (
                <div className="space-y-6">
                  {/* Banner */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                          <Map className="h-5 w-5 text-teal-600" />
                          Mapa Temático e Distribuição de Farmácias (CRF-RN)
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Distribuição territorial e densidade de estabelecimentos farmacêuticos (públicos e privados) por habitante nas Regiões de Saúde.
                        </p>
                      </div>
                      <div className="bg-teal-50 border border-teal-150 rounded-xl p-3 flex items-center gap-2.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-teal-600 animate-pulse"></div>
                        <span className="text-xs font-mono font-bold text-teal-800">Dados Integrados CRF-RN & SESAP-RN</span>
                      </div>
                    </div>
                  </div>

                  {/* Bento Details Panel (No bad SVG Map!) */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Regional Directory & Pharmacy Directory */}
                    <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 space-y-5 shadow-sm flex flex-col">
                      
                      {/* Header and Search Filters */}
                      <div className="space-y-3 pb-3 border-b border-slate-100">
                        <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
                          <div>
                            <span className="text-[10px] font-mono text-teal-600 uppercase font-bold tracking-wider">Diretório de Distribuição Regional</span>
                            <h3 className="font-bold text-sm text-slate-800">Monitoramento Integrado de Cobertura</h3>
                          </div>
                          
                          {/* Selector */}
                          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium gap-0.5">
                            <span className="px-2.5 py-1 text-slate-700 bg-white rounded-md shadow-xs font-semibold flex items-center gap-1.5">
                              <Building className="h-3.5 w-3.5 text-teal-600" />
                              Filtros Integrados
                            </span>
                          </div>
                        </div>

                        {/* Search and Type Filters */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="relative sm:col-span-2">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="text"
                              value={pharmacySearchQuery}
                              onChange={(e) => setPharmacySearchQuery(e.target.value)}
                              placeholder="Buscar farmácia pelo nome, cidade ou endereço..."
                              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-800"
                            />
                            {pharmacySearchQuery && (
                              <button
                                onClick={() => setPharmacySearchQuery("")}
                                className="absolute right-2.5 top-2.5 hover:text-slate-600 text-slate-400"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>

                          <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-xs">
                            <button
                              onClick={() => setPharmacyTypeFilter("All")}
                              className={`flex-1 py-1 text-center rounded transition-all font-medium ${
                                pharmacyTypeFilter === "All" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Todas
                            </button>
                            <button
                              onClick={() => setPharmacyTypeFilter("Pública")}
                              className={`flex-1 py-1 text-center rounded transition-all font-medium ${
                                pharmacyTypeFilter === "Pública" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Públicas
                            </button>
                            <button
                              onClick={() => setPharmacyTypeFilter("Privada")}
                              className={`flex-1 py-1 text-center rounded transition-all font-medium ${
                                pharmacyTypeFilter === "Privada" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Privadas
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Regional Blocks */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Regiões de Saúde do RN (Selecione para detalhar)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {REGIOES_SAUDE_RN.map((reg) => {
                            const isSelected = selectedRegionId === reg.id;
                            const densityInfo = DENSIDADE_CRF_RN[reg.id];
                            // Percentage for progress bar
                            const percent = Math.min((densityInfo.densidade / 10) * 100, 100);
                            
                            return (
                              <div
                                key={reg.id}
                                onClick={() => {
                                  setSelectedRegionId(reg.id);
                                  setSelectedPharmacy(null);
                                }}
                                className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 hover:shadow-xs flex flex-col justify-between ${
                                  isSelected
                                    ? "bg-teal-50/30 border-teal-500 ring-1 ring-teal-500/30"
                                    : "bg-slate-50 hover:bg-slate-100/80 border-slate-200"
                                }`}
                              >
                                <div className="flex justify-between items-start gap-1.5 mb-1.5">
                                  <div>
                                    <h5 className="font-bold text-xs text-slate-800 leading-tight">{reg.nome}</h5>
                                    <p className="text-[10px] text-slate-400 font-mono">Sede: {reg.sede}</p>
                                  </div>
                                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 border ${densityInfo.colorClass}`}>
                                    {densityInfo.densidade} / 10k
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                                    <span>Cobertura Territorial</span>
                                    <span>{reg.farmaciasPublicas} públicas / {densityInfo.totalFarmacias} totais</span>
                                  </div>
                                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-1.5 rounded-full transition-all duration-300 ${
                                        densityInfo.densidade < 5 ? "bg-red-500" :
                                        densityInfo.densidade < 7 ? "bg-amber-500" : "bg-emerald-500"
                                      }`}
                                      style={{ width: `${percent}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Filtered Pharmacy list directory inside the card */}
                      <div className="space-y-2 pt-3 border-t border-slate-100 flex-1 flex flex-col justify-between min-h-[180px]">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                              {pharmacySearchQuery ? "Resultados da Busca" : `Estabelecimentos na ${REGIOES_SAUDE_RN.find(r => r.id === selectedRegionId)?.nome}`}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-500">
                              Encontrados: <strong className="text-slate-800">{filteredPharmacies.length}</strong>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                            {filteredPharmacies.length === 0 ? (
                              <div className="col-span-2 py-6 text-center text-xs text-slate-400 italic">
                                Nenhuma farmácia encontrada para os critérios informados.
                              </div>
                            ) : (
                              filteredPharmacies.map((pharm) => {
                                const isSelected = selectedPharmacy?.id === pharm.id;
                                const isPublic = pharm.tipo === "Pública";
                                return (
                                  <div
                                    key={pharm.id}
                                    onClick={() => {
                                      setSelectedPharmacy(pharm);
                                      setSelectedRegionId(pharm.regiaoId);
                                    }}
                                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2 ${
                                      isSelected
                                        ? "bg-teal-50 border-teal-400 shadow-xs font-medium"
                                        : "bg-white hover:bg-slate-50 border-slate-200"
                                    }`}
                                  >
                                    <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                                      isPublic ? "bg-blue-500" : "bg-rose-500"
                                    }`} />
                                    <div className="truncate">
                                      <p className="text-[11px] font-semibold text-slate-800 truncate leading-tight">{pharm.nome}</p>
                                      <p className="text-[9px] text-slate-400 font-mono truncate">{pharm.cidade} • CRF: {pharm.crfStatus}</p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Small footer with visual colors legend */}
                        <div className="pt-3 border-t border-slate-150 flex flex-wrap gap-x-4 gap-y-1.5 items-center justify-between text-[9px] text-slate-500 font-mono">
                          <div className="flex gap-3">
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500"></span> F. Pública</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500"></span> F. Privada</span>
                          </div>
                          <div className="flex gap-3">
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Alta Cobertura</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500"></span> Média Cobertura</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500"></span> Baixa Cobertura</span>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Interactive Sidebar Detail Panel */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4">
                      
                      {/* Toggle view: Region Stats vs Pharmacy details */}
                      <div className="space-y-4 flex-1">
                        
                        {/* Profile Header */}
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Detalhamento Assistencial
                          </span>
                          {selectedPharmacy && (
                            <button
                              onClick={() => setSelectedPharmacy(null)}
                              className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-0.5"
                            >
                              <X className="h-3 w-3" /> Ver Regional
                            </button>
                          )}
                        </div>

                        {/* CASE A: Selected Pharmacy Profile Card */}
                        {selectedPharmacy ? (
                          <div className="space-y-4 animate-fadeIn">
                            {/* Pharmacy Identification */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 space-y-3.5">
                              <div className="flex items-start gap-2.5">
                                <div className={`p-2 rounded-lg mt-0.5 ${
                                  selectedPharmacy.tipo === "Pública" ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                }`}>
                                  <Building className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="font-display font-bold text-sm text-slate-900 leading-snug">{selectedPharmacy.nome}</h4>
                                  <div className="flex gap-1.5 mt-1 items-center">
                                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                      selectedPharmacy.tipo === "Pública" ? "bg-blue-100 text-blue-800" : "bg-rose-100 text-rose-800"
                                    }`}>
                                      {selectedPharmacy.tipo}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">CRF-RN:</span>
                                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                      selectedPharmacy.crfStatus === "Ativa" ? "bg-emerald-100 text-emerald-800" :
                                      selectedPharmacy.crfStatus === "Regular" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                                    }`}>
                                      {selectedPharmacy.crfStatus}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Pharmacy Metadata details */}
                              <div className="space-y-2.5 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-semibold text-slate-800">Endereço Georreferenciado:</p>
                                    <p className="text-[11px] text-slate-500 leading-tight">{selectedPharmacy.endereco}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Phone className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-semibold text-slate-800">Telefone para contato:</p>
                                    <p className="text-[11px] font-mono text-slate-500">{selectedPharmacy.telefone}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-semibold text-slate-800">Funcionamento:</p>
                                    <p className="text-[11px] text-slate-500">{selectedPharmacy.funcionamento}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Linked health authority regional card */}
                            <div className="border border-slate-100 rounded-lg p-3 bg-teal-50/20 text-xs">
                              <h5 className="font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                                <Info className="h-3.5 w-3.5 text-teal-600" />
                                Vínculo com Regional de Saúde:
                              </h5>
                              {REGIOES_SAUDE_RN.filter(r => r.id === selectedPharmacy.regiaoId).map(reg => (
                                <div key={reg.id} className="space-y-1 text-[11px]">
                                  <p>Pertence à <strong className="text-slate-800">{reg.nome}</strong>, com sede em <strong>{reg.sede}</strong>.</p>
                                  <p className="text-slate-500">Esta regional atende {reg.municipios} municípios e possui uma densidade global de {DENSIDADE_CRF_RN[reg.id].densidade} estabelecimentos para cada 10.000 habitantes.</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          
                          /* CASE B: Region Statistics & Diagnosis Card (Default) */
                          REGIOES_SAUDE_RN.filter(r => r.id === selectedRegionId).map((reg) => {
                            const densityData = DENSIDADE_CRF_RN[reg.id];
                            return (
                              <div key={reg.id} className="space-y-4 animate-fadeIn">
                                <div>
                                  <div className="flex justify-between items-start">
                                    <h3 className="font-display font-bold text-base text-slate-900">{reg.nome}</h3>
                                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${densityData.colorClass}`}>
                                      Densidade: {densityData.densidade}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">Sede Administrativa: <strong>{reg.sede}</strong></p>
                                </div>

                                {/* Regional stats parameters */}
                                <div className="divide-y divide-slate-100 text-xs">
                                  <div className="py-2 flex justify-between">
                                    <span className="text-slate-500">Municípios Abrangidos</span>
                                    <span className="font-mono font-semibold text-slate-800">{reg.municipios}</span>
                                  </div>
                                  <div className="py-2 flex justify-between">
                                    <span className="text-slate-500">População Regional</span>
                                    <span className="font-mono font-semibold text-slate-800">{densityData.populacao.toLocaleString()} hab</span>
                                  </div>
                                  <div className="py-2 flex justify-between bg-slate-50/50 px-1 rounded">
                                    <span className="text-slate-700 font-medium">Farmácias Totais (CRF-RN)</span>
                                    <span className="font-mono font-bold text-slate-900">{densityData.totalFarmacias}</span>
                                  </div>
                                  <div className="py-2 flex justify-between">
                                    <span className="text-slate-500">Farmácias Públicas SESAP</span>
                                    <span className="font-mono font-semibold text-slate-800">{reg.farmaciasPublicas}</span>
                                  </div>
                                  <div className="py-2 flex justify-between bg-teal-50/40 px-1 rounded">
                                    <span className="text-teal-900 font-semibold">Proporção por 10k Hab</span>
                                    <span className="font-mono font-bold text-teal-700">{densityData.densidade} / 10k hab</span>
                                  </div>
                                  <div className="py-2 flex justify-between">
                                    <span className="text-slate-500">Taxa de Desabastecimento</span>
                                    <span className={`font-mono font-bold ${
                                      reg.taxaDesabastecimento > 8 ? "text-red-600" :
                                      reg.taxaDesabastecimento > 5 ? "text-amber-600" : "text-emerald-600"
                                    }`}>{reg.taxaDesabastecimento}%</span>
                                  </div>
                                  <div className="py-2 flex justify-between">
                                    <span className="text-slate-500">Casos de Judicialização</span>
                                    <span className="font-mono font-semibold text-purple-600">{reg.casosJudicializacao} casos</span>
                                  </div>
                                  <div className="py-2 space-y-1">
                                    <span className="text-slate-500 block">Itens com Estoque Crítico</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {reg.estoqueCriticoItens.map((item, i) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-red-50 border border-red-100 text-red-700 text-[10px] rounded font-mono font-medium">{item}</span>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Regional Diagnoses */}
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-[10px] text-slate-600 space-y-1">
                                  <p className="font-bold text-slate-700 flex items-center gap-1">
                                    <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                    Diagnóstico Assistencial Regional:
                                  </p>
                                  <p className="text-[11px] italic leading-snug">{densityData.description}</p>
                                  <p className="text-[9px] text-slate-400 mt-1">Contato SESAP: {reg.coordenador} ({reg.contato})</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Matching results quick selection area */}
                      {pharmacySearchQuery && (
                        <div className="pt-3 border-t border-slate-150 space-y-2 max-h-[140px] overflow-y-auto">
                          <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Farmácias Correspondentes ({filteredPharmacies.length})</p>
                          <div className="space-y-1.5">
                            {filteredPharmacies.slice(0, 5).map((pharm) => (
                              <button
                                key={pharm.id}
                                onClick={() => {
                                  setSelectedPharmacy(pharm);
                                  setSelectedRegionId(pharm.regiaoId);
                                }}
                                className={`w-full text-left p-1.5 rounded text-[11px] border flex justify-between items-center transition-all ${
                                  selectedPharmacy?.id === pharm.id
                                    ? "bg-teal-50 border-teal-300 text-teal-800 font-medium"
                                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                }`}
                              >
                                <span className="truncate pr-2 font-medium">{pharm.nome} ({pharm.cidade})</span>
                                <span className="text-[9px] font-mono px-1 rounded bg-white text-slate-500 border border-slate-200 shrink-0">{pharm.tipo}</span>
                              </button>
                            ))}
                            {filteredPharmacies.length > 5 && (
                              <p className="text-[9px] text-slate-400 italic text-center">E mais {filteredPharmacies.length - 5} estabelecimentos encontrados...</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RANKING SECTION (New Section requested by user) */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-teal-600" />
                        Ranking de Densidade de Farmácias por Habitante no RN (CRF-RN)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Relação completa das 8 Regiões de Saúde ordenada das maiores densidades (zonas de alta cobertura) para as menores (vulnerabilidades assistenciais).
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: Maiores Densidades */}
                      <div className="border border-slate-100 rounded-xl p-4 bg-emerald-50/20 space-y-3">
                        <h4 className="font-mono text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                          Maiores Densidades (Melhor Acesso)
                        </h4>
                        <div className="space-y-2.5">
                          {Object.entries(DENSIDADE_CRF_RN)
                            .map(([id, d]) => ({ id, ...d, name: REGIOES_SAUDE_RN.find(r => r.id === id)?.nome || "" }))
                            .sort((a, b) => b.densidade - a.densidade)
                            .slice(0, 4)
                            .map((item, index) => (
                              <div 
                                key={item.id} 
                                onClick={() => setSelectedRegionId(item.id)}
                                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                                  selectedRegionId === item.id 
                                    ? "bg-white border-emerald-300 ring-2 ring-emerald-500/10 shadow-sm" 
                                    : "bg-white/60 border-slate-150 hover:bg-white hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                                    {index + 1}º
                                  </span>
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{item.name.split(" (")[0]}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">Sede: {REGIOES_SAUDE_RN.find(r => r.id === item.id)?.sede}</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs font-bold font-mono text-emerald-700">{item.densidade} / 10k hab</p>
                                  <span className="text-[9px] text-slate-400 font-mono">{item.totalFarmacias} farmácias</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Right: Menores Densidades */}
                      <div className="border border-slate-100 rounded-xl p-4 bg-red-50/20 space-y-3">
                        <h4 className="font-mono text-[10px] font-bold text-red-800 uppercase tracking-wider flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                          Menores Densidades (Risco de Deserto)
                        </h4>
                        <div className="space-y-2.5">
                          {Object.entries(DENSIDADE_CRF_RN)
                            .map(([id, d]) => ({ id, ...d, name: REGIOES_SAUDE_RN.find(r => r.id === id)?.nome || "" }))
                            .sort((a, b) => a.densidade - b.densidade)
                            .slice(0, 4)
                            .map((item, index) => (
                              <div 
                                key={item.id} 
                                onClick={() => setSelectedRegionId(item.id)}
                                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                                  selectedRegionId === item.id 
                                    ? "bg-white border-red-300 ring-2 ring-red-500/10 shadow-sm" 
                                    : "bg-white/60 border-slate-150 hover:bg-white hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="h-5 w-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                                    {8 - index}º
                                  </span>
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{item.name.split(" (")[0]}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">Sede: {REGIOES_SAUDE_RN.find(r => r.id === item.id)?.sede}</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs font-bold font-mono text-red-600">{item.densidade} / 10k hab</p>
                                  <span className="text-[9px] text-slate-400 font-mono">{item.totalFarmacias} farmácias</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Planning Context */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h4 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider mb-2">Estruturação & Integração da Distribuição Territorial</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
                      <div>
                        <strong className="text-slate-800">Como Funciona no RN:</strong>
                        <p className="mt-1">
                          A distribuição geográfica é orientada pelas 8 Regiões de Saúde planejadas pela SESAP-RN. O mapeamento centraliza as informações de almoxarifados regionais (Geralmente acoplados às sedes como Mossoró, Caicó e Pau dos Ferros) e monitora a densidade de farmácias básicas municipais.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-800">Como Agrega ao Sistema:</strong>
                        <p className="mt-1">
                          Funciona como uma camada de georreferenciamento de dados. Ao correlacionar o estoque relacional com a distância física e rotas logísticas estaduais, a inteligência artificial planeja rotas otimizadas para furgões de entrega climatizada, evitando que "desertos farmacêuticos" se formem em regiões longínquas do oeste potiguar.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 7: ATS & FARMACOVIGILÂNCIA */}
              {activeRnSubTab === "ats_farmacovigilancia" && (
                <div className="space-y-6">
                  {/* Banner */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div>
                      <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-indigo-600" />
                        Avaliação de Tecnologias em Saúde (ATS) & Farmacovigilância
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Dossiês de incorporação de novas tecnologias médicas na lista estadual e canal direto para notificação de eventos adversos (RAM).
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

                  {/* Pharmacovigilance & Form */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Event reporting form */}
                    <form onSubmit={handleFvSubmit} className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                      <div>
                        <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                          <Plus className="h-4 w-4 text-blue-600" />
                          Notificar RAM (Evento Adverso)
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Registre eventos adversos ou desvios de lotes identificados na sua unidade de saúde.</p>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="space-y-1">
                          <label className="block text-slate-500">Medicamento Suspeito</label>
                          <select 
                            value={fvForm.medicamento}
                            onChange={(e) => setFvForm(prev => ({ ...prev, medicamento: e.target.value }))}
                            className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 p-2 text-xs rounded-lg text-slate-800 focus:outline-none"
                          >
                            <option value="Amoxicilina 500mg">Amoxicilina 500mg</option>
                            <option value="Insulina Humana NPH 100 UI">Insulina Humana NPH 100 UI</option>
                            <option value="Losartana Potássica 50mg">Losartana Potássica 50mg</option>
                            <option value="Atorvastatina Cálcica 20mg">Atorvastatina Cálcica 20mg</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="block text-slate-500">Nº do Lote</label>
                            <input 
                              type="text"
                              value={fvForm.lote}
                              onChange={(e) => setFvForm(prev => ({ ...prev, lote: e.target.value }))}
                              className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 p-2 text-xs rounded-lg font-mono text-slate-800 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-slate-500">Gravidade</label>
                            <select 
                              value={fvForm.gravidade}
                              onChange={(e) => setFvForm(prev => ({ ...prev, gravidade: e.target.value as any }))}
                              className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 p-2 text-xs rounded-lg text-slate-800 focus:outline-none"
                            >
                              <option value="Leve">Leve</option>
                              <option value="Moderada">Moderada</option>
                              <option value="Grave">Grave</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-slate-500">Descrição da Reação Reclamada</label>
                          <textarea 
                            value={fvForm.reacaoAdversa}
                            onChange={(e) => setFvForm(prev => ({ ...prev, reacaoAdversa: e.target.value }))}
                            placeholder="Descreva sintomas apresentados pelo paciente..."
                            className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 p-2 text-xs rounded-lg h-20 text-slate-800 focus:outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow transition-all"
                        >
                          Emitir Notificação de Alerta
                        </button>
                      </div>
                    </form>

                    {/* Vigilance Feed */}
                    <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Feed Integrado de Vigilância de RAM (SUVISA-RN / VigiMed)</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Alertas e investigações ativas de reações adversas na rede SUS.</p>
                      </div>

                      <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1.5 flex-1 mt-3">
                        {fvList.map((fv) => (
                          <div key={fv.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50/50 relative hover:border-slate-200 transition-all">
                            <div className="absolute right-3 top-3 flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${
                                fv.status === 'Alerta Emitido' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' :
                                fv.status === 'Em Investigação' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>{fv.status}</span>
                              {currentUser && fv.createdBy === currentUser.uid && fv.status === 'Em Investigação' && (
                                <button
                                  onClick={() => handleFvDelete(fv.id, fv.createdBy, fv.status)}
                                  className="text-slate-400 hover:text-red-500 transition-colors p-0.5 hover:bg-slate-100 rounded cursor-pointer"
                                  title="Remover notificação"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono font-bold">Ref: {fv.id} • Lote: {fv.lote} • Notificado em: {fv.data}</p>
                            <h4 className="font-semibold text-xs text-slate-800 mt-1">{fv.medicamento}</h4>
                            <p className="text-xs text-slate-600 mt-1 italic">"{fv.reacaoAdversa}"</p>
                            <div className="flex items-center justify-between text-[9px] font-mono mt-2 pt-1 border-t border-slate-100 text-slate-400">
                              <span>Unidade: {fv.unidadeNotificante}</span>
                              <span className={`font-bold ${fv.gravidade === 'Grave' ? 'text-red-600' : fv.gravidade === 'Moderada' ? 'text-amber-600' : 'text-slate-500'}`}>Gravidade: {fv.gravidade}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Planning Context */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h4 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider mb-2">Estruturação & Integração de ATS e Vigilância</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
                      <div>
                        <strong className="text-slate-800">Como Funciona no RN:</strong>
                        <p className="mt-1">
                          A equipe de farmacovigilância investiga desvios de qualidade sanitária e reações incomuns notificadas nas unidades hospitalares e UBS do RN. O comitê de ATS (Avaliação de Tecnologias em Saúde) realiza análises independentes de custo-efetividade e impacto orçamentário sobre novos fármacos para embasar políticas públicas baseadas em evidências.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-800">Como Agrega ao Sistema:</strong>
                        <p className="mt-1">
                          As notificações de RAM integram-se diretamente ao banco relacional. Se um lote específico (ex: L-INS984) acumula relatos recorrentes de perda de eficácia ou reação severa, a IA ativa um alerta vermelho geral e bloqueia imediatamente as ordens de dispensação desse lote em todo o território estadual, prevenindo danos coletivos.
                        </p>
                      </div>
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
                <div className="space-y-6">
                  {/* Banner */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div>
                      <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                        <Heart className="h-5 w-5 text-rose-500" />
                        Prestação de Contas Pública & Impacto Social
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Gere relatórios oficiais demonstrativos da economia de dinheiro público e do índice estimado de vidas salvas pela eficiência logística no RN.
                      </p>
                    </div>
                  </div>

                  {/* Config & Generator Forms */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Configurations form panel */}
                    <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Parâmetros do Demonstrativo</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">Selecione o período e as estratégias logísticas que deseja auditar no relatório.</p>
                        </div>

                        <div className="space-y-3.5 text-xs">
                          <div className="space-y-1">
                            <label className="block text-slate-500">Período de Referência</label>
                            <select 
                              value={reportPeriod}
                              onChange={(e) => setReportPeriod(e.target.value)}
                              className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 p-2 text-xs rounded-lg text-slate-800 focus:outline-none"
                            >
                              <option value="2026-S1">1º Semestre de 2026 (Parcial)</option>
                              <option value="2025-FY">Ano Completo de 2025 (Histórico)</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-slate-400 font-mono text-[10px] uppercase">Filtro de Iniciativas de Economia</label>
                            
                            <label className="flex items-center gap-2.5 p-2 rounded border border-slate-100 hover:bg-slate-50 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={reportConfig.biddingConsolidation}
                                onChange={(e) => setReportConfig(prev => ({ ...prev, biddingConsolidation: e.target.checked }))}
                                className="h-3.5 w-3.5 text-blue-600 rounded border-slate-300"
                              />
                              <span className="text-[11px] text-slate-700">Licitações Centralizadas UNICAT</span>
                            </label>

                            <label className="flex items-center gap-2.5 p-2 rounded border border-slate-100 hover:bg-slate-50 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={reportConfig.logisticsOptimization}
                                onChange={(e) => setReportConfig(prev => ({ ...prev, logisticsOptimization: e.target.checked }))}
                                className="h-3.5 w-3.5 text-blue-600 rounded border-slate-300"
                              />
                              <span className="text-[11px] text-slate-700">Otimizações Logísticas de IA</span>
                            </label>

                            <label className="flex items-center gap-2.5 p-2 rounded border border-slate-100 hover:bg-slate-50 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={reportConfig.judicialDeterrence}
                                onChange={(e) => setReportConfig(prev => ({ ...prev, judicialDeterrence: e.target.checked }))}
                                className="h-3.5 w-3.5 text-blue-600 rounded border-slate-300"
                              />
                              <span className="text-[11px] text-slate-700">Deterrença de Ações Judiciais</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleGenerateReport}
                        disabled={isGeneratingReport || (!reportConfig.biddingConsolidation && !reportConfig.logisticsOptimization && !reportConfig.judicialDeterrence)}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-lg text-xs cursor-pointer shadow transition-all mt-5"
                      >
                        {isGeneratingReport ? "Calculando impacto financeiro..." : "Compilar Relatório de Impacto"}
                      </button>
                    </div>

                    {/* Report Output Panel */}
                    <div className="md:col-span-3 bg-slate-50 rounded-xl border border-slate-200 p-5 min-h-[300px] flex flex-col items-center justify-center relative shadow-inner">
                      {isGeneratingReport ? (
                        <div className="text-center space-y-3 animate-pulse text-slate-500">
                          <RefreshCw className="h-8 w-8 text-rose-500 animate-spin mx-auto" />
                          <p className="text-xs font-mono">Processando algoritmos matemáticos e epidemiológicos do SUS-RN...</p>
                        </div>
                      ) : generatedReport ? (
                        /* Beautiful official-looking certificate report */
                        <div className="w-full bg-white border border-slate-300 p-6 rounded-lg relative overflow-hidden shadow-md flex flex-col justify-between h-full border-t-[8px] border-t-rose-600">
                          {/* Top Heading banner */}
                          <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-100">
                            <div>
                              <span className="text-[8px] font-mono uppercase bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded font-bold">Documento Oficial</span>
                              <h4 className="font-display font-bold text-xs text-slate-900 mt-1">{generatedReport.titulo}</h4>
                              <p className="text-[9px] text-slate-400 mt-0.5">{generatedReport.subtitulo} • <strong>{generatedReport.periodo}</strong></p>
                            </div>
                            <span className="text-[9px] font-mono text-slate-400 font-bold">Cód: {generatedReport.chaveAutenticidade.split("-")[1]}</span>
                          </div>

                          {/* Computed Metrics */}
                          <div className="grid grid-cols-2 gap-4 my-5 bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-inner">
                            <div className="text-center border-r border-slate-200">
                              <span className="text-[10px] text-slate-500 font-mono uppercase block">Recursos Públicos Poupados</span>
                              <span className="text-xl md:text-2xl font-bold font-mono text-emerald-600 block my-1">
                                R$ {generatedReport.economia.toLocaleString("pt-BR")}
                              </span>
                              <span className="text-[9px] text-slate-400 block font-mono">Eficiência Logística Acumulada</span>
                            </div>
                            <div className="text-center">
                              <span className="text-[10px] text-slate-500 font-mono uppercase block">Vidas Estimadas Salvas</span>
                              <span className="text-xl md:text-2xl font-bold font-mono text-rose-600 block my-1 flex items-center justify-center gap-1">
                                <Heart className="h-4 w-4 text-rose-500 fill-rose-500 animate-bounce" />
                                {generatedReport.vidas} vidas
                              </span>
                              <span className="text-[9px] text-slate-400 block font-mono">Com base em continuidade terapêutica</span>
                            </div>
                          </div>

                          {/* List of breakdown items */}
                          <div className="space-y-2 mb-5">
                            <p className="text-[10px] font-mono text-slate-400 uppercase">Detalhamento das Contribuições de Impacto:</p>
                            {generatedReport.detalhes.map((det: any, idx: number) => (
                              <div key={idx} className="text-xs border-l-2 border-l-rose-500 pl-3 py-0.5">
                                <p className="font-bold text-slate-800">{det.area} <span className="font-mono text-slate-400 text-[10px]">(+R$ {(det.economia / 1000000).toFixed(2)}M / {det.vidasEstimadas} Vidas)</span></p>
                                <p className="text-[11px] text-slate-500 mt-0.5">{det.impacto}</p>
                              </div>
                            ))}
                          </div>

                          {/* Footer Signatures */}
                          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-400 gap-3 font-mono">
                            <div className="text-center sm:text-left">
                              <p className="font-bold text-slate-500">SISTEMA INTEGRADO OBSERVATÓRIO SUS-RN</p>
                              <p>Chave de Validade: {generatedReport.chaveAutenticidade}</p>
                            </div>
                            <div className="text-center sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 w-full sm:w-auto">
                              <p className="font-bold text-slate-500">PARECER TÉCNICO REGISTRADO EM:</p>
                              <p>{generatedReport.dataGeracao}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 space-y-2 p-6 max-w-xs">
                          <FileSpreadsheet className="h-10 w-10 text-slate-300 mx-auto" />
                          <p className="text-xs">Nenhum demonstrativo ativo para o período selecionado.</p>
                          <p className="text-[11px] text-slate-400 italic">Configure as iniciativas de impacto ao lado e clique em "Compilar Relatório" para iniciar o processamento analítico de dados públicos.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Planning Context */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h4 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider mb-2">Estruturação & Integração do Cálculo de Impacto</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
                      <div>
                        <strong className="text-slate-800">Como Funciona no RN:</strong>
                        <p className="mt-1">
                          A economia financeira é calculada pela diferença de preços históricos da UNICAT contra os pregões consolidados estaduais, somada ao descarte de lotes vencidos evitado. O indicador de vidas salvas é modelado a partir de algoritmos epidemiológicos que medem a continuidade do suprimento de fármacos vitais (Insulinas, Oncológicos e Anti-hipertensivos), estimando as internações críticas evitadas pela retenção da adesão terapêutica no RN.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-800">Como Agrega ao Sistema:</strong>
                        <p className="mt-1">
                          Consiste na principal vitrine de prestação de contas públicas. Ela traduz as otimizações frias de estoque relacional do banco de dados em valor humano e financeiro palpável, servindo para embasamento de relatórios de gestão junto a órgãos fiscalizadores (como o Tribunal de Contas do Estado - TCE-RN) e informando o cidadão sobre o retorno do imposto recolhido em serviços de saúde eficientes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB: ANALYTICS & CRUZAMENTO DE DADOS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            
            {/* Header / Banner */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Módulo Avançado de Analytics & Cruzamento de Indicadores (SESAP vs CRF-RN)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-sans">
                    Painel inteligente para cruzamento de dados de densidade farmacêutica do CRF, estoques da SESAP-RN e mandados judiciais ativos para identificação de vulnerabilidades regionais.
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-150 rounded-xl p-3 flex items-center gap-2.5">
                  <Activity className="h-4 w-4 text-purple-600 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-purple-800">Motor de Previsões e Rebalanceamento</span>
                </div>
              </div>
            </div>

            {/* KPI Bento Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Desperdício Evitado</p>
                  <h3 className="font-display font-bold text-lg text-slate-900 mt-0.5 font-sans">R$ 145.230,00</h3>
                  <span className="text-[9px] text-emerald-650 font-semibold flex items-center gap-1 font-sans">
                    <TrendingUp className="h-3 w-3 text-emerald-600" /> +18.4% vs 2025
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Tempo Resposta Judicial</p>
                  <h3 className="font-display font-bold text-lg text-slate-900 mt-0.5 font-sans">4,2 Dias</h3>
                  <span className="text-[9px] text-emerald-650 font-semibold flex items-center gap-1 font-sans">
                    <TrendingDown className="h-3 w-3 text-emerald-600" /> -7.8 dias de redução
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Acurácia de Inventário</p>
                  <h3 className="font-display font-bold text-lg text-slate-900 mt-0.5 font-sans">98,7%</h3>
                  <span className="text-[9px] text-slate-500 font-semibold flex items-center gap-1 font-sans">
                    Auditado CRF-RN Central
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Rupturas Críticas SESAP</p>
                  <h3 className="font-display font-bold text-lg text-slate-900 mt-0.5 font-sans">14 Medicamentos</h3>
                  <span className="text-[9px] text-rose-600 font-semibold flex items-center gap-1 font-sans">
                    Filtro: Autonomia &lt; 15 dias
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Section: Infographics & Bar Chart and Correlation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* CORRELATION CHART: Densidade CRF vs Alertas de Judicialização */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-purple-600 uppercase tracking-wider">Análise de Causa Raiz</span>
                  <h3 className="font-display font-bold text-sm text-slate-900">Correlação: Densidade de Farmácias vs Ações Judiciais (por 10k Hab)</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-sans">
                    Demonstração de que a escassez de estabelecimentos farmacêuticos (dados CRF-RN) correlaciona diretamente com o aumento de litígios por medicamentos.
                  </p>
                </div>

                {/* SVG/HTML Visual Comparison Bar Chart */}
                <div className="space-y-3 pt-2">
                  {[
                    { reg: "1ª Região - São José de Mipibu", dens: 3.2, jud: 1.8, color: "bg-emerald-500", colorJud: "bg-blue-400" },
                    { reg: "2ª Região - Mossoró", dens: 6.8, jud: 1.1, color: "bg-emerald-500", colorJud: "bg-blue-400" },
                    { reg: "3ª Região - João Câmara", dens: 2.1, jud: 3.5, color: "bg-amber-500", colorJud: "bg-red-500" },
                    { reg: "4ª Região - Caicó", dens: 4.5, jud: 1.4, color: "bg-emerald-500", colorJud: "bg-blue-400" },
                    { reg: "5ª Região - Santa Cruz", dens: 2.9, jud: 2.8, color: "bg-amber-500", colorJud: "bg-orange-500" },
                    { reg: "6ª Região - Pau dos Ferros", dens: 1.9, jud: 4.8, color: "bg-red-500", colorJud: "bg-red-500" },
                    { reg: "7ª Região - Metropolitana (Sede)", dens: 8.4, jud: 0.9, color: "bg-emerald-500", colorJud: "bg-blue-400" },
                    { reg: "8ª Região - Açú", dens: 1.5, jud: 5.2, color: "bg-red-500", colorJud: "bg-red-500" }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                      <div className="flex justify-between text-[11px] font-sans">
                        <span className="font-bold text-slate-800">{item.reg}</span>
                        <div className="flex gap-3 text-[10px] font-mono text-slate-500">
                          <span className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${item.color}`}></span>Densidade: {item.dens}</span>
                          <span className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${item.colorJud}`}></span>Judicial: {item.jud}</span>
                        </div>
                      </div>
                      
                      {/* Dual progress bars representing the index */}
                      <div className="space-y-1">
                        {/* Cobertura Farmácias */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-slate-400 w-16 shrink-0 text-right">Cobertura CRF:</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${(item.dens / 10) * 100}%` }}></div>
                          </div>
                        </div>
                        {/* Litígio Judicial */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-slate-400 w-16 shrink-0 text-right">Judicialização:</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className={`${item.colorJud} h-2 rounded-full transition-all duration-500`} style={{ width: `${(item.jud / 6) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-slate-600 flex gap-2 font-sans">
                  <Info className="h-4 w-4 text-blue-500 shrink-0" />
                  <p>
                    <strong className="text-slate-800 font-sans">Conclusão de Auditoria Técnica:</strong> Regiões com densidade inferior a 2,5 farmácias por 10.000 habitantes (como Açú e Pau dos Ferros) apresentam um aumento de até 280% no ajuizamento de ações civis públicas de saúde, devido à falta de pontos descentralizados de dispensação e distribuição regular.
                  </p>
                </div>
              </div>

              {/* INTERACTIVE REMANEJAMENTO SIMULATOR */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-teal-600 uppercase tracking-wider">Simulador Inteligente</span>
                    <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5 font-sans">
                      <Sliders className="h-4.5 w-4.5 text-teal-600" />
                      Calculadora de Remanejamento & Mitigação de Falhas
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-sans">
                      Simule o impacto financeiro e logístico de transferir lotes excedentes ou de baixo giro para regiões em colapso assistencial.
                    </p>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    setIsSimulating(true);
                    
                    setTimeout(() => {
                      setIsSimulating(false);
                      // Calculate mock results based on selections
                      const sourceNum = parseInt(simSourceRegion);
                      const destNum = parseInt(simDestRegion);
                      const isSame = simSourceRegion === simDestRegion;
                      
                      setSimResult({
                        valid: !isSame,
                        med: simMedication,
                        from: `Região ${simSourceRegion}ª`,
                        to: `Região ${simDestRegion}ª`,
                        units: 1400,
                        autonomySource: { before: 140, after: 110 },
                        autonomyDest: { before: 8, after: 62 },
                        savings: 1400 * 32.50,
                        freightCost: 350.00,
                        routeRisk: sourceNum > 4 ? "MÉDIO (BR-101/Sul)" : "BAIXO (BR-304/Leste)"
                      });
                    }, 1200);
                  }} className="space-y-4 pt-1 font-sans">
                    
                    {/* Medication */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Selecione o Insumo Crítico:</label>
                      <select
                        value={simMedication}
                        onChange={(e) => setSimMedication(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:bg-white text-slate-800 focus:outline-none"
                      >
                        <option value="Insulina NPH">Insulina NPH (Frascos • Rede Fria)</option>
                        <option value="Atorvastatina 20mg">Atorvastatina 20mg (Comprimidos)</option>
                        <option value="Meropenem 1g">Meropenem 1g (Frasco-ampola • Oncológico)</option>
                        <option value="Clonazepam 2mg">Clonazepam 2mg (Medicamento Controlado)</option>
                      </select>
                    </div>

                    {/* Source and Destination */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Região de Origem (Excedente):</label>
                        <select
                          value={simSourceRegion}
                          onChange={(e) => setSimSourceRegion(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 py-1.5 focus:bg-white text-slate-800 font-sans focus:outline-none"
                        >
                          <option value="7">7ª Região (Metropolitana)</option>
                          <option value="2">2ª Região (Mossoró)</option>
                          <option value="4">4ª Região (Caicó)</option>
                          <option value="1">1ª Região (São José de Mipibu)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Região de Destino (Déficit):</label>
                        <select
                          value={simDestRegion}
                          onChange={(e) => setSimDestRegion(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 py-1.5 focus:bg-white text-slate-800 font-sans focus:outline-none"
                        >
                          <option value="8">8ª Região (Açú)</option>
                          <option value="6">6ª Região (Pau dos Ferros)</option>
                          <option value="3">3ª Região (João Câmara)</option>
                          <option value="5">5ª Região (Santa Cruz)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSimulating}
                      className="w-full bg-purple-650 hover:bg-purple-700 text-white font-bold text-xs py-2 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 font-sans"
                    >
                      {isSimulating ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Simulando Rebalanceamento de Carga...
                        </>
                      ) : (
                        <>
                          <Cpu className="h-3.5 w-3.5" />
                          Simular Transferência Física
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Simulation Output */}
                <div className="mt-4 flex-1 flex flex-col justify-center">
                  {simResult ? (
                    !simResult.valid ? (
                      <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold text-center font-sans">
                        Erro na Simulação: A Região de Origem e a Região de Destino não podem ser iguais. Por favor, selecione regiões distintas.
                      </div>
                    ) : (
                      <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3 font-sans animate-fadeIn">
                        <div className="flex justify-between items-center pb-2 border-b border-purple-100">
                          <span className="text-[10px] font-mono font-bold text-purple-700 uppercase tracking-wider">Resultado da Simulação</span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-250 font-bold">RECOMENDADO</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block">Origem ({simResult.from}):</span>
                            <span className="font-bold text-slate-800 font-mono">
                              Autonomia: {simResult.autonomySource.before}d → {simResult.autonomySource.after}d
                            </span>
                            <span className="text-[9px] text-slate-500 block">(Estoque Seguro)</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block">Destino ({simResult.to}):</span>
                            <span className="font-bold text-emerald-600 font-mono font-sans">
                              Autonomia: {simResult.autonomyDest.before}d → {simResult.autonomyDest.after}d
                            </span>
                            <span className="text-[9px] text-emerald-600 font-semibold block font-sans">(Crise Evitada!)</span>
                          </div>
                        </div>

                        <div className="border-t border-purple-100/50 pt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block font-sans">Lotes Remanejados:</span>
                            <strong className="text-slate-700 font-mono">{simResult.units} Unidades</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-sans">Rota Logística:</span>
                            <strong className="text-slate-700 font-mono">{simResult.routeRisk}</strong>
                          </div>
                          <div className="col-span-2 bg-white/80 border border-purple-100 p-2 rounded-lg flex items-center justify-between text-xs mt-1 font-sans">
                            <span className="text-slate-500 font-semibold">Economia p/ Cofre Público:</span>
                            <strong className="text-emerald-700 font-mono font-bold font-sans">R$ {simResult.savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 italic text-xs h-full flex flex-col justify-center items-center gap-1 font-sans">
                      <Sliders className="h-6 w-6 text-slate-300" />
                      Selecione os parâmetros e clique em "Simular Transferência Física" para projetar a mitigação de desabastecimento em tempo real.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* PROCESS FLOW INFOGRAPHIC: Pipeline de Dados */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 animate-fadeIn">
              <div>
                <span className="text-[10px] font-mono font-bold text-purple-600 uppercase tracking-wider">Infográfico de Governança de Dados</span>
                <h3 className="font-display font-bold text-sm text-slate-900 font-sans">Como os dados se integram no Observatório da Assistência Farmacêutica</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-sans">
                  Fluxo contínuo desde o faturamento do hospital até a inteligência preditiva do Gemini.
                </p>
              </div>

              {/* Horizontal / Responsive Step Process Flow */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                
                {/* Step 1 */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 relative flex flex-col gap-2">
                  <div className="absolute -top-3 left-4 h-6 w-6 rounded-full bg-blue-650 text-white flex items-center justify-center font-mono font-bold text-xs shadow-md">1</div>
                  <div className="flex items-center gap-2 mt-1">
                    <UploadCloud className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                    <h4 className="font-bold text-xs text-slate-800 font-sans">Ingestão (SESAP)</h4>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                    Carregamento de planilhas de faturamento das UPAs, estoques centrais e inventários de almoxarifados do RN no formato ACID.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 relative flex flex-col gap-2">
                  <div className="absolute -top-3 left-4 h-6 w-6 rounded-full bg-teal-650 text-white flex items-center justify-center font-mono font-bold text-xs shadow-md">2</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Building className="h-4.5 w-4.5 text-teal-600 shrink-0" />
                    <h4 className="font-bold text-xs text-slate-800 font-sans">Enriquecimento CRF-RN</h4>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                    Associação do georreferenciamento e densidade populacional das farmácias registradas para verificar barreiras geográficas locais.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 relative flex flex-col gap-2">
                  <div className="absolute -top-3 left-4 h-6 w-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-mono font-bold text-xs shadow-md">3</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Sliders className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                    <h4 className="font-bold text-xs text-slate-800 font-sans">Validação ANVISA</h4>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                    Cruzamento dos códigos de barras e lotes de medicamentos com as restrições e portarias federais de eficácia e vencimento do SNGPC.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 relative flex flex-col gap-2">
                  <div className="absolute -top-3 left-4 h-6 w-6 rounded-full bg-purple-650 text-white flex items-center justify-center font-mono font-bold text-xs shadow-md">4</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Sparkles className="h-4.5 w-4.5 text-purple-600 shrink-0" />
                    <h4 className="font-bold text-xs text-slate-800 font-sans">Diagnóstico Gemini</h4>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                    A IA analisa a série temporal de desabastecimento e propõe decisões de remanejamento, resolvendo processos judiciais de alto custo.
                  </p>
                </div>

              </div>
            </div>

            {/* PREDICTIVE RISK COMPARISON TABLE */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-purple-600 uppercase tracking-wider">Cruzamento de Dados & Riscos Cruzados</span>
                  <h3 className="font-display font-bold text-sm text-slate-900 font-sans">Previsão Epidemiológica de Desabastecimento e Alertas de Judicialização</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-sans">
                    Monitoramento preditivo baseado no giro real SESAP-RN e mandados judiciais em andamento no Tribunal de Justiça do RN.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-150">
                  Último Cálculo: Hoje às 07:42 • Canal Real-time
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-slate-150 bg-slate-50 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3 font-sans">Medicamento</th>
                      <th className="py-3 px-3 font-sans">Hospital de Impacto</th>
                      <th className="py-3 px-3 text-center font-sans">Giro Mensal</th>
                      <th className="py-3 px-3 text-center font-sans">Estoque Atual</th>
                      <th className="py-3 px-3 text-center font-sans">Autonomia Estimada</th>
                      <th className="py-3 px-3 text-center font-sans">Ações Judiciais Ativas</th>
                      <th className="py-3 px-3 font-sans">Risco de Multa/Bloqueio</th>
                      <th className="py-3 px-3 text-right font-sans">Recomendação de Remanejamento Sugerido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {[
                      {
                        med: "Insulina NPH Frascos",
                        hosp: "Hospital Giselda Trigueiro (Natal)",
                        giro: 420,
                        stock: 120,
                        autonomy: "9 Dias (Crítico)",
                        colorAut: "text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded",
                        cases: 14,
                        risk: "ALTÍSSIMO • R$ 5.000/dia",
                        riskColor: "text-red-700 font-semibold bg-red-50 px-1.5 py-0.5 rounded-md border border-red-200",
                        rem: "Remanejar 300 frascos de Mossoró"
                      },
                      {
                        med: "Meropenem 1g Ampolas",
                        hosp: "Hospital Deoclécio Marques (Parnamirim)",
                        giro: 180,
                        stock: 450,
                        autonomy: "75 Dias (Seguro)",
                        colorAut: "text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded",
                        cases: 3,
                        risk: "BAIXO • Sem multas iminentes",
                        riskColor: "text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-200",
                        rem: "Estoque excedentário seguro"
                      },
                      {
                        med: "Atorvastatina 20mg Comprimidos",
                        hosp: "Polo Central UNICAT (Natal)",
                        giro: 15400,
                        stock: 3100,
                        autonomy: "6 Dias (Crítico)",
                        colorAut: "text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded",
                        cases: 34,
                        risk: "CRÍTICO • Bloqueio de Contas",
                        riskColor: "text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200 animate-pulse",
                        rem: "Aguardando liberação lote ANVISA"
                      },
                      {
                        med: "Clonazepam 2mg Comprimidos",
                        hosp: "Hospital Regional Tarcísio Maia (Mossoró)",
                        giro: 850,
                        stock: 2100,
                        autonomy: "74 Dias (Seguro)",
                        colorAut: "text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded",
                        cases: 2,
                        risk: "MÍNIMO • Sem litígios",
                        riskColor: "text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-200",
                        rem: "Sincronizado via SNGPC"
                      },
                      {
                        med: "Tenofovir 300mg Comprimidos",
                        hosp: "Hospital Regional Lindolfo Gomes (Açú)",
                        giro: 340,
                        stock: 80,
                        autonomy: "7 Dias (Crítico)",
                        colorAut: "text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded",
                        cases: 9,
                        risk: "ALTO • Multas diárias",
                        riskColor: "text-orange-700 font-semibold bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-200",
                        rem: "Remanejar 150 comp de Caicó"
                      }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-800">{row.med}</td>
                        <td className="py-3 px-3 text-slate-650">{row.hosp}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600">{row.giro.toLocaleString()}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600">{row.stock.toLocaleString()}</td>
                        <td className="py-3 px-3 text-center text-xs font-mono">
                          <span className={row.colorAut}>{row.autonomy}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">{row.cases}</td>
                        <td className="py-3 px-3 text-xs">
                          <span className={row.riskColor}>{row.risk}</span>
                        </td>
                        <td className="py-3 px-3 text-right text-purple-600 font-bold text-xs font-mono">{row.rem}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: INGESTÃO E CONFIGURAÇÕES */}
        {activeTab === "configuracoes" && (
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
