import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  Landmark,
  MessageCircle,
  PackageX,
  ShieldAlert,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { TEMPLATES, lerDataset, lerMetadados, type Linha, type MetadadosDataset } from "../lib/datasets";
import { carregarMunicipiosRN, FONTE_IBGE } from "../lib/ibge";

export type Destino =
  | "indicadores"
  | "comparador"
  | "desabastecimento"
  | "alertas"
  | "programas"
  | "educacao"
  | "impacto"
  | "producao"
  | "assistente";

interface Atalho {
  destino: Destino;
  titulo: string;
  texto: string;
  icon: LucideIcon;
}

const PUBLICOS: { titulo: string; subtitulo: string; atalhos: Atalho[] }[] = [
  {
    titulo: "Para o cidadão",
    subtitulo: "Encontre seu medicamento e fique seguro",
    atalhos: [
      { destino: "programas", titulo: "Onde e como obter meu medicamento", texto: "Farmácia Popular e componentes básico, estratégico e especializado do SUS.", icon: Landmark },
      { destino: "alertas", titulo: "Alertas sanitários", texto: "Recolhimentos e suspensões de medicamentos divulgados pela Anvisa.", icon: ShieldAlert },
      { destino: "assistente", titulo: "Pergunte ao assistente", texto: "Respostas em linguagem simples, só com dados publicados e sempre com a fonte.", icon: MessageCircle },
    ],
  },
  {
    titulo: "Para gestores e profissionais de saúde",
    subtitulo: "Acompanhe e compare o território",
    atalhos: [
      { destino: "comparador", titulo: "Comparador territorial", texto: "Compare municípios do RN entre si, com a mediana do estado.", icon: BarChart3 },
      { destino: "desabastecimento", titulo: "Desabastecimento e pregões", texto: "Situação de abastecimento do componente especializado e pregões que a explicam.", icon: PackageX },
      { destino: "indicadores", titulo: "Todos os indicadores", texto: "Custos, judicialização, qualidade dos serviços e avaliação de tecnologias.", icon: Activity },
    ],
  },
  {
    titulo: "Para pesquisa e ensino",
    subtitulo: "Evidências e conhecimento",
    atalhos: [
      { destino: "producao", titulo: "Produção científica", texto: "Artigos, dissertações e produtos técnicos do projeto.", icon: FileText },
      { destino: "educacao", titulo: "Educação e repositório", texto: "Notas técnicas, protocolos, legislação e materiais educativos.", icon: BookOpen },
      { destino: "impacto", titulo: "Relatório de impacto", texto: "Prestação de contas pública, com dados verificados.", icon: Heart },
    ],
  },
];

function dataBR(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

interface Props {
  onNavigate: (d: Destino) => void;
}

export function Landing({ onNavigate }: Props) {
  const [totais, setTotais] = useState<{ municipios: number; populacao: number } | null>(null);
  const [metas, setMetas] = useState<Record<string, MetadadosDataset | null> | null>(null);
  const [alertas, setAlertas] = useState<Linha[]>([]);

  useEffect(() => {
    let ativo = true;
    carregarMunicipiosRN()
      .then((m) => ativo && setTotais({ municipios: m.length, populacao: m.reduce((s, x) => s + x.populacao, 0) }))
      .catch(() => {});
    Promise.all(TEMPLATES.map((t) => lerMetadados(t.id).catch(() => null)))
      .then((lista) => ativo && setMetas(Object.fromEntries(TEMPLATES.map((t, i) => [t.id, lista[i]]))))
      .catch(() => {});
    lerDataset("alertas_sanitarios")
      .then((r) => {
        if (ativo && r) setAlertas([...r.linhas].sort((a, b) => String(b.data).localeCompare(String(a.data))).slice(0, 3));
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const publicados = metas ? Object.values(metas).filter(Boolean).length : null;

  return (
    <div className="space-y-10">
      {/* Abertura */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white rounded-2xl p-8 md:p-10 shadow-sm">
        <p className="text-[0.75rem] font-mono uppercase tracking-wider text-blue-200 font-bold">Rio Grande do Norte</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl mt-2 max-w-3xl">Observatório da Assistência Farmacêutica</h2>
        <p className="text-sm md:text-base text-blue-100 mt-3 max-w-3xl leading-relaxed">
          Transparência de dados sobre o acesso a medicamentos no estado, para cidadãos, profissionais de saúde e gestores. Cada informação mostra sua fonte e a data de atualização.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => onNavigate("programas")} className="inline-flex items-center gap-2 bg-white text-blue-800 hover:bg-blue-50 text-sm font-semibold px-5 py-2.5 rounded-lg cursor-pointer">
            Onde consigo meu medicamento? <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={() => onNavigate("indicadores")} className="inline-flex items-center gap-2 border border-blue-300 text-white hover:bg-blue-800 text-sm font-semibold px-5 py-2.5 rounded-lg cursor-pointer">
            Ver indicadores
          </button>
        </div>
      </section>

      {/* Números reais */}
      <section aria-label="Panorama do estado" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Numero rotulo="Municípios" valor={totais ? totais.municipios.toLocaleString("pt-BR") : "…"} nota={`${FONTE_IBGE.rotulo}`} />
        <Numero rotulo="Habitantes" valor={totais ? totais.populacao.toLocaleString("pt-BR") : "…"} nota={`${FONTE_IBGE.rotulo}`} />
        <Numero rotulo="Conjuntos de dados publicados" valor={publicados === null ? "…" : `${publicados} de ${TEMPLATES.length}`} nota="Observatório" />
        <Numero rotulo="Alertas sanitários" valor={metas ? (metas["alertas_sanitarios"]?.totalLinhas ?? 0).toLocaleString("pt-BR") : "…"} nota="Anvisa" />
      </section>

      {/* Alertas recentes */}
      {alertas.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" /> Alertas recentes
            </h3>
            <button onClick={() => onNavigate("alertas")} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">Ver todos</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {alertas.map((a, i) => (
              <button key={i} onClick={() => onNavigate("alertas")} className="text-left bg-white border border-red-100 hover:border-red-300 rounded-xl p-4 shadow-sm cursor-pointer space-y-1">
                <p className="text-[0.75rem] font-mono text-slate-500">{dataBR(String(a.data))} · {String(a.tipo)}</p>
                <p className="text-sm font-semibold text-slate-900">{String(a.produto)}</p>
                <p className="text-xs text-slate-600">{String(a.motivo)}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Entradas por público */}
      <section className="space-y-7">
        {PUBLICOS.map((p) => (
          <div key={p.titulo} className="space-y-3">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">{p.titulo}</h3>
              <p className="text-xs text-slate-500">{p.subtitulo}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {p.atalhos.map(({ destino, titulo, texto, icon: Icon }) => (
                <button
                  key={destino}
                  onClick={() => onNavigate(destino)}
                  className="text-left bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md rounded-xl p-5 shadow-sm transition-all cursor-pointer"
                >
                  <Icon className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-sm text-slate-900 mt-3">{titulo}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{texto}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Transparência sobre os próprios dados */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900">Estado dos dados</h3>
          <p className="text-xs text-slate-500 mt-1">
            O observatório só exibe dados que tenham fonte identificada. Aqui está o que já foi publicado e quando foi atualizado.
          </p>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          {TEMPLATES.map((t) => {
            const meta = metas?.[t.id];
            return (
              <li key={t.id} className="flex items-start gap-2 text-xs">
                {meta ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> : <Clock className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />}
                <span className="text-slate-700">
                  <strong className="font-medium">{t.titulo}</strong>
                  <span className="block text-slate-500">
                    {metas === null ? "Verificando…" : meta ? `${meta.fonte} · atualizado em ${dataBR(meta.atualizadoEm)}` : "Aguardando dados da fonte"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-[0.75rem] text-slate-500">
          Demografia: {FONTE_IBGE.rotulo}. O observatório não exibe dados de exemplo: onde a fonte ainda não enviou informações, a seção informa que está aguardando.
        </p>
      </section>
    </div>
  );
}

function Numero({ rotulo, valor, nota }: { rotulo: string; valor: string; nota: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <p className="text-[0.75rem] text-slate-500">{rotulo}</p>
      <p className="font-display font-bold text-2xl text-slate-900 mt-0.5">{valor}</p>
      <p className="text-[0.75rem] text-slate-500 mt-0.5">{nota}</p>
    </div>
  );
}
