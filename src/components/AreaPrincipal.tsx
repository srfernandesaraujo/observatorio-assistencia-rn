import type { User as UsuarioFirebase } from "firebase/auth";
import { Admin } from "./Admin";
import { AlertasSanitarios } from "./AlertasSanitarios";
import { Comparador } from "./Comparador";
import { ConsultaCmed } from "./ConsultaCmed";
import { DadosAbertos } from "./DadosAbertos";
import { EmElaboracao } from "./EmElaboracao";
import { Judicializacao } from "./Judicializacao";
import { Landing, type Destino } from "./Landing";
import { MenuIndicadores } from "./MenuIndicadores";
import { Metodologia } from "./Metodologia";
import { ProgramasGovernamentais } from "./ProgramasGovernamentais";
import { RegistrosMedicamentos } from "./RegistrosMedicamentos";
import { Repositorio } from "./Repositorio";
import { TabelaDataset } from "./TabelaDataset";
import { VisaoGeral } from "./VisaoGeral";
import type { Perfil } from "../lib/perfis";
import { ehIndicadores, type Aba } from "../lib/navegacao";

interface Props {
  aba: Aba;
  sub: string;
  usuario: UsuarioFirebase | null;
  perfil: Perfil | null;
  aoAbrirAtalho: (d: Destino) => void;
  aoMudarSub: (id: string) => void;
}

// Conteúdo da página, conforme a área (aba) e a seção (sub) atuais. Fica dentro do <main> do App.
export function AreaPrincipal({ aba, sub, usuario, perfil, aoAbrirAtalho, aoMudarSub }: Props) {
  const indicadores = ehIndicadores(aba, sub);
  return (
    <>
      {/* INÍCIO: LANDING PAGE INSTITUCIONAL */}
      {aba === "inicio" && <Landing onNavigate={aoAbrirAtalho} />}

      {/* PRODUÇÃO CIENTÍFICA */}
      {aba === "producao" && <TabelaDataset templateId="producao_cientifica" titulo="Produção Científica" />}

      {/* ÁREAS DO SITE: INDICADORES (COM BARRA LATERAL), PROGRAMAS, REPOSITÓRIO E IMPACTO */}
      {aba === "principal" && (
        <div className={`grid grid-cols-1 gap-6 items-start font-sans ${indicadores ? "lg:grid-cols-[minmax(15rem,20rem)_minmax(0,1fr)]" : ""}`}>
          {indicadores && <MenuIndicadores atual={sub} aoEscolher={aoMudarSub} />}

          <div className="space-y-6 min-w-0">
            {sub === "visao_geral" && <VisaoGeral onNavigate={aoMudarSub} />}
            {sub === "comparador" && <Comparador />}
            {sub === "desabastecimento" && (
              <div className="space-y-6">
                <TabelaDataset templateId="desabastecimento" />
                <TabelaDataset templateId="pregoes" titulo="Acompanhamento de pregões" />
              </div>
            )}
            {sub === "alertas" && <AlertasSanitarios />}
            {sub === "cmed" && <ConsultaCmed />}
            {sub === "registros" && <RegistrosMedicamentos />}
            {sub === "custos" && <TabelaDataset templateId="custos" />}
            {sub === "judicializacao" && <Judicializacao />}
            {sub === "qualidade" && (
              <EmElaboracao titulo="Qualidade dos serviços" texto="Esta seção usará instrumentos validados de qualidade e acreditação, em definição com a SUAF. Nenhum dado de exemplo é exibido enquanto isso." />
            )}
            {sub === "ats_farmacovigilancia" && (
              <EmElaboracao titulo="Avaliação de tecnologias em saúde (ATS)" texto="As análises de ATS estão em organização com a equipe responsável e serão publicadas com fonte e data." />
            )}
            {sub === "dados_abertos" && <DadosAbertos />}
            {sub === "programas" && <ProgramasGovernamentais />}
            {sub === "repositorio" && <Repositorio />}
            {sub === "metodologia" && <Metodologia />}
            {sub === "relatorio_impacto" && (
              <EmElaboracao titulo="Relatório de impacto" texto="O relatório de impacto será elaborado com dados verificados e metodologia aberta." />
            )}
          </div>
        </div>
      )}

      {/* ADMINISTRAÇÃO: IMPORTAÇÃO DE PLANILHAS */}
      {aba === "configuracoes" && usuario && <Admin email={usuario.email || ""} perfil={perfil} />}
    </>
  );
}
