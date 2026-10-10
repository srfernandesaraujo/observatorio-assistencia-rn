import { useState } from "react";
import { Usuarios } from "./Usuarios";
import { SUPER_ADMIN_EMAIL, podeEditar, temAlgumAcesso, type Perfil } from "../lib/perfis";
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import {
  TEMPLATES,
  getTemplate,
  lerArquivo,
  publicarDataset,
  type Linha,
  type ResultadoLeitura,
  type TemplateDataset,
} from "../lib/datasets";

interface PropsImportar {
  email: string;
  permitidos: TemplateDataset[]; // conjuntos que esta pessoa pode publicar
}

// Importação de planilhas (a v1 não tem inserção manual de dados).
function ImportarDados({ email, permitidos }: PropsImportar) {
  const [templateId, setTemplateId] = useState(permitidos[0].id);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [leitura, setLeitura] = useState<ResultadoLeitura | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [fonte, setFonte] = useState("");
  const [urlFonte, setUrlFonte] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const template = getTemplate(templateId)!;

  const reiniciar = () => {
    setArquivo(null);
    setLeitura(null);
    setErro(null);
    setSucesso(null);
  };

  const aoEscolherArquivo = async (f: File | null) => {
    reiniciar();
    if (!f) return;
    setArquivo(f);
    try {
      setLeitura(await lerArquivo(f, template));
    } catch (e: any) {
      setErro(e?.message || "Não foi possível ler o arquivo.");
    }
  };

  const podePublicar =
    !!leitura && leitura.colunasAusentes.length === 0 && leitura.erros.length === 0 && leitura.linhas.length > 0 && fonte.trim().length > 0 && !publicando;

  const publicar = async () => {
    if (!leitura) return;
    setPublicando(true);
    setErro(null);
    try {
      const meta = await publicarDataset(template, leitura.linhas, { fonte, urlFonte, periodo }, email.toLowerCase());
      setSucesso(`Publicado: ${meta.totalLinhas} linhas (versão ${meta.versao}).`);
      setArquivo(null);
      setLeitura(null);
    } catch (e: any) {
      setErro(e?.message || "Falha ao publicar. Tente novamente.");
    } finally {
      setPublicando(false);
    }
  };

  const previa: Linha[] = leitura?.linhas.slice(0, 8) ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-blue-600" /> Importar planilha
          </h2>
          <p className="text-xs text-slate-500">
            Conectado como <strong>{email}</strong>. A importação substitui os dados do conjunto escolhido por uma nova versão.
          </p>

          <label className="block text-xs font-semibold text-slate-700">
            Conjunto de dados
            <select
              value={templateId}
              onChange={(e) => {
                setTemplateId(e.target.value);
                reiniciar();
              }}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white"
            >
              {permitidos.map((t) => (
                <option key={t.id} value={t.id}>{t.titulo}</option>
              ))}
            </select>
          </label>
          <p className="text-[11px] text-slate-500">{template.descricao}</p>
          <a href={`/modelos/${template.id}.xlsx`} download className="text-[11px] font-semibold text-blue-600 hover:underline">Baixar planilha-modelo (.xlsx)</a>
          <p className="text-[11px] text-slate-500">
            <strong>Colunas esperadas</strong> (cabeçalho na 1ª linha):{" "}
            {template.colunas.map((c) => `${c.id}${c.obrigatoria ? "*" : ""}`).join(", ")}. As datas aceitam AAAA-MM-DD ou DD/MM/AAAA.
          </p>

          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-5 cursor-pointer text-center">
            {arquivo ? <FileSpreadsheet className="h-8 w-8 text-blue-600" /> : <UploadCloud className="h-8 w-8 text-slate-400" />}
            <span className="text-xs text-slate-600">{arquivo ? arquivo.name : "Selecione um arquivo .csv ou .xlsx"}</span>
            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => aoEscolherArquivo(e.target.files?.[0] ?? null)} />
          </label>

          <div className="space-y-2">
            <input value={fonte} onChange={(e) => setFonte(e.target.value)} placeholder="Fonte (obrigatório). Ex.: SESAP-RN / CESAP"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" />
            <input value={urlFonte} onChange={(e) => setUrlFonte(e.target.value)} placeholder="Link da fonte (opcional)"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" />
            <input value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="Período dos dados. Ex.: 2025 ou jan–jun/2026"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" />
          </div>

          <button
            onClick={publicar}
            disabled={!podePublicar}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-lg cursor-pointer disabled:cursor-not-allowed"
          >
            {publicando ? "Publicando…" : "Publicar dados"}
          </button>
          {sucesso && (
            <p className="text-xs text-emerald-700 flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> {sucesso}</p>
          )}
          {erro && <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> {erro}</p>}
        </section>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Pré-visualização e validação</h3>
          {!leitura && <p className="text-xs text-slate-500">Escolha um arquivo para ver a validação antes de publicar.</p>}
          {leitura && (
            <>
              {leitura.colunasAusentes.length > 0 && (
                <p className="text-xs text-red-600">Colunas obrigatórias ausentes: {leitura.colunasAusentes.join(", ")}.</p>
              )}
              {leitura.colunasIgnoradas.length > 0 && (
                <p className="text-xs text-slate-500">Colunas ignoradas (não fazem parte do formato): {leitura.colunasIgnoradas.join(", ")}.</p>
              )}
              <p className="text-xs text-slate-700">
                <strong>{leitura.linhas.length}</strong> linhas válidas · <strong className={leitura.erros.length ? "text-red-600" : ""}>{leitura.erros.length}</strong> com erro
              </p>
              {leitura.erros.length > 0 && (
                <ul className="text-xs text-red-700 space-y-0.5 max-h-40 overflow-y-auto">
                  {leitura.erros.slice(0, 50).map((e) => (
                    <li key={e.linha}>Linha {e.linha}: {e.mensagem}</li>
                  ))}
                </ul>
              )}
              {leitura.erros.length > 0 && (
                <p className="text-[11px] text-slate-500">Corrija a planilha e envie novamente. Nada é publicado enquanto houver erros.</p>
              )}
              {previa.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-mono">
                        {template.colunas.map((c) => <th key={c.id} className="py-2 pr-3 font-normal whitespace-nowrap">{c.rotulo}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {previa.map((l, i) => (
                        <tr key={i} className="text-slate-700">
                          {template.colunas.map((c) => <td key={c.id} className="py-1.5 pr-3">{l[c.id] ?? "—"}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

interface Props {
  email: string;
  perfil: Perfil | null; // null = verificando
}

type Aba = "importar" | "usuarios";

// Área administrativa: importação de dados e (para a super administração) gestão de usuários.
export function Admin({ email, perfil }: Props) {
  const [aba, setAba] = useState<Aba>("importar");

  if (perfil === null) {
    return <p className="text-sm text-slate-500">Verificando permissões…</p>;
  }
  if (!temAlgumAcesso(perfil)) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-xl space-y-2">
        <p className="font-semibold text-amber-900 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" /> Acesso restrito
        </p>
        <p className="text-sm text-amber-900">
          A conta <strong>{email}</strong> não tem permissão de edição neste observatório. Peça o cadastro à coordenação do projeto.
        </p>
      </div>
    );
  }

  const permitidos = TEMPLATES.filter((t) => podeEditar(perfil, t.id));
  const abas: { id: Aba; rotulo: string }[] = [
    { id: "importar", rotulo: "Importar dados" },
    ...(perfil.superadmin ? [{ id: "usuarios" as Aba, rotulo: "Usuários e permissões" }] : []),
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-slate-200">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px cursor-pointer ${aba === a.id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>
      {aba === "importar" && (permitidos.length > 0
        ? <ImportarDados email={email} permitidos={permitidos} />
        : <p className="text-sm text-slate-500">Sua conta ainda não tem permissão para publicar nenhum conjunto de dados.</p>)}
      {aba === "usuarios" && perfil.superadmin && <Usuarios emailSuper={SUPER_ADMIN_EMAIL} />}
    </div>
  );
}
