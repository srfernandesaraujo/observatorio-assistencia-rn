import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { lerMetadados, type MetadadosDataset } from "../lib/datasets";

interface Secao {
  id: string;
  titulo: string;
  texto: string;
  dados?: string; // conjunto de dados que alimenta a seção
  aguarda?: string; // quando a seção depende de algo ainda não definido
  fixo?: string; // fonte que já alimenta a seção independentemente de planilhas
}

const SECOES: Secao[] = [
  { id: "comparador", titulo: "Comparador territorial", texto: "Compare municípios do RN, com dados demográficos do IBGE e indicadores publicados.", dados: "indicadores_municipais", fixo: "Demografia: IBGE, Censo Demográfico 2022" },
  { id: "desabastecimento", titulo: "Desabastecimento e pregões", texto: "Situação de abastecimento do componente especializado e pregões que ajudam a explicá-la.", dados: "desabastecimento" },
  { id: "alertas", titulo: "Alertas sanitários", texto: "Recolhimentos, suspensões e proibições de medicamentos divulgados pela Anvisa.", dados: "alertas_sanitarios" },
  { id: "custos", titulo: "Custos e orçamento", texto: "Série histórica anual de gastos por componente ou linha de cuidado.", dados: "custos" },
  { id: "judicializacao", titulo: "Judicialização", texto: "Número de processos de saúde concluídos por ano, a partir de fonte pública.", dados: "judicializacao" },
  { id: "qualidade", titulo: "Qualidade dos serviços", texto: "Maturidade sanitária medida com instrumentos validados.", aguarda: "Aguardando os instrumentos de qualidade e acreditação (SUAF)." },
  { id: "ats_farmacovigilancia", titulo: "Avaliação de tecnologias em saúde (ATS)", texto: "Análises de incorporação de tecnologias na lista estadual.", aguarda: "Em organização com a equipe de ATS." },
];

function dataBR(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

interface Props {
  onNavigate: (secao: string) => void;
}

// Visão geral dos indicadores: o que já tem dados publicados e o que ainda está em preparação.
export function VisaoGeral({ onNavigate }: Props) {
  const [metas, setMetas] = useState<Record<string, MetadadosDataset | null> | null>(null);

  useEffect(() => {
    let ativo = true;
    const ids = SECOES.map((s) => s.dados).filter((x): x is string => !!x);
    Promise.all(ids.map((id) => lerMetadados(id).catch(() => null))).then((lista) => {
      if (ativo) setMetas(Object.fromEntries(ids.map((id, i) => [id, lista[i]])));
    });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-1">
        <h2 className="text-lg font-display font-bold text-slate-900">Visão geral dos indicadores</h2>
        <p className="text-xs text-slate-500">
          Todo número exibido aqui vem de uma fonte identificada, com data de atualização. Onde a fonte ainda não enviou dados, a seção avisa em vez de mostrar números de exemplo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECOES.map((s) => {
          const meta = s.dados ? metas?.[s.dados] : null;
          return (
            <button key={s.id} onClick={() => onNavigate(s.id)} className="text-left bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 shadow-sm cursor-pointer space-y-2">
              <h3 className="font-semibold text-sm text-slate-900">{s.titulo}</h3>
              <p className="text-xs text-slate-500">{s.texto}</p>
              <p className="text-[0.75rem] flex items-center gap-1.5">
                {s.fixo ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /><span className="text-slate-600">{s.fixo}</span></>
                ) : s.aguarda ? (
                  <><Clock className="h-3.5 w-3.5 text-slate-300" /><span className="text-slate-500">{s.aguarda}</span></>
                ) : metas === null ? (
                  <span className="text-slate-500">Verificando…</span>
                ) : meta ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /><span className="text-slate-600">{meta.fonte} · atualizado em {dataBR(meta.atualizadoEm)}</span></>
                ) : (
                  <><Clock className="h-3.5 w-3.5 text-slate-300" /><span className="text-slate-500">Aguardando dados da fonte</span></>
                )}
              </p>
              <span className="text-[0.75rem] font-semibold text-blue-600 inline-flex items-center gap-1">Abrir <ArrowRight className="h-3 w-3" /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
