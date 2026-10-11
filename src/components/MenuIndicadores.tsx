import { Activity, AlertTriangle, BarChart3, Coins, Download, FileCheck, Pill, RefreshCw, Scale, ShieldAlert, ShieldCheck, type LucideIcon } from "lucide-react";

const ITENS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "visao_geral", label: "Visão geral", icon: Activity },
  { id: "comparador", label: "Comparador territorial", icon: BarChart3 },
  { id: "desabastecimento", label: "Desabastecimento e pregões", icon: AlertTriangle },
  { id: "alertas", label: "Alertas sanitários", icon: ShieldAlert },
  { id: "cmed", label: "Preços de medicamentos (CMED)", icon: Pill },
  { id: "registros", label: "Registros de medicamentos (Anvisa)", icon: FileCheck },
  { id: "custos", label: "Custos e orçamento", icon: Coins },
  { id: "judicializacao", label: "Judicialização", icon: Scale },
  { id: "qualidade", label: "Qualidade dos serviços", icon: ShieldCheck },
  { id: "ats_farmacovigilancia", label: "ATS", icon: RefreshCw },
  { id: "dados_abertos", label: "Dados abertos", icon: Download },
];

interface Props {
  atual: string;
  aoEscolher: (id: string) => void;
}

// Barra lateral da área Indicadores.
export function MenuIndicadores({ atual, aoEscolher }: Props) {
  return (
    <nav aria-label="Seções de indicadores" className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1 z-20">
      <div className="pb-3 border-b border-slate-100 mb-3">
        <span className="text-[0.75rem] uppercase font-mono tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Indicadores</span>
        <p className="text-[0.75rem] text-slate-500 mt-2">Dados com fonte e data de atualização</p>
      </div>
      {ITENS.map((item) => (
        <button
          key={item.id}
          onClick={() => aoEscolher(item.id)}
          aria-current={atual === item.id ? "page" : undefined}
          className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-3 transition-all cursor-pointer border ${
            atual === item.id
              ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold shadow-sm"
              : "bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <item.icon className={`h-4 w-4 shrink-0 ${atual === item.id ? "text-blue-600" : "text-slate-500"}`} />
          <span className="min-w-0 break-words">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
