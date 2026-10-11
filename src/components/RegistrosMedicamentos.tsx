import { useEffect, useState } from "react";
import { Database, ExternalLink } from "lucide-react";

interface Registro {
  nome: string;
  principioAtivo: string;
  empresa: string;
  cnpj: string;
  registro: string;
  categoria: string;
  classe: string;
  situacao: "Ativo" | "Inativo" | "Parcial";
  linhas: number;
  linhasAtivas: number;
  vencimento: string;
  concessao: string;
}

interface Resposta {
  atualizadoEm: string | null;
  total: number;
  linhasNoArquivo: number;
  situacoes: { ativo: number; parcial: number; inativo: number };
  encontrados: number;
  resultados: Registro[];
}

const CATEGORIAS = ["Genérico", "Similar", "Novo", "Biológico", "Específico", "Fitoterápico", "Dinamizado", "Baixo risco", "Radiofármaco"];
const SITUACOES = ["Ativo", "Parcial", "Inativo"];
const URL_CONSULTA = "https://consultas.anvisa.gov.br/#/medicamentos/";
const URL_DADOS = "https://dados.anvisa.gov.br/dados/DADOS_ABERTOS_MEDICAMENTOS.csv";
const URL_DICIONARIO = "https://dados.anvisa.gov.br/dados/Documentacao_e_Dicionario_de_Dados_Registros_Validos_Medicamento_V1.pdf";

const numero = (n: number) => n.toLocaleString("pt-BR");
const caixaAlta = (s: string) => s.toLocaleLowerCase("pt-BR");

// Consulta de medicamentos registrados na Anvisa (dados abertos), lida pelo servidor do Observatório.
export function RegistrosMedicamentos() {
  const [consulta, setConsulta] = useState("");
  const [situacao, setSituacao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState<"inicio" | "carregando" | "erro" | "ok">("inicio");
  const [erro, setErro] = useState("");
  const [resp, setResp] = useState<Resposta | null>(null);

  const termo = consulta.trim();
  useEffect(() => {
    if (termo.length < 3) {
      setEstado("inicio");
      setResp(null);
      return;
    }
    const controle = new AbortController();
    setEstado("carregando");
    const espera = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: termo });
        if (situacao) params.set("situacao", situacao);
        if (categoria) params.set("categoria", categoria);
        const r = await fetch(`/api/registros?${params}`, { signal: controle.signal });
        const dados = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(dados.erro || "Não foi possível consultar os registros agora.");
        setResp(dados as Resposta);
        setEstado("ok");
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErro(e?.message || "Não foi possível consultar os registros agora.");
        setEstado("erro");
      }
    }, 450);
    return () => {
      clearTimeout(espera);
      controle.abort();
    };
  }, [termo, situacao, categoria]);

  const dataArquivo = resp?.atualizadoEm ? new Date(resp.atualizadoEm).toLocaleDateString("pt-BR") : null;
  const resumo =
    estado === "ok" && resp
      ? resp.encontrados === 0
        ? "Nenhum registro encontrado."
        : `${numero(resp.encontrados)} ${resp.encontrados === 1 ? "registro encontrado" : "registros encontrados"}${resp.encontrados > resp.resultados.length ? `; mostrando os ${resp.resultados.length} primeiros` : ""}.`
      : "";

  const campo = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div>
        <h2 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Registros de medicamentos (Anvisa)</h2>
        <p className="mt-2 text-xs text-slate-700">
          Consulte se um medicamento tem registro na Anvisa, qual empresa detém o registro e até quando vale. <strong>Ter registro não significa que o medicamento esteja disponível no SUS ou em estoque.</strong>
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="reg-busca" className="block text-xs font-medium text-slate-700 mb-1">Medicamento, princípio ativo, empresa, CNPJ ou nº do registro</label>
          <input
            id="reg-busca"
            type="search"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            autoComplete="off"
            placeholder="Ex.: losartana"
            className={`w-full ${campo} placeholder-slate-500`}
          />
        </div>
        <div>
          <label htmlFor="reg-categoria" className="block text-xs font-medium text-slate-700 mb-1">Categoria</label>
          <select id="reg-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} className={campo}>
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="reg-situacao" className="block text-xs font-medium text-slate-700 mb-1">Situação</label>
          <select id="reg-situacao" value={situacao} onChange={(e) => setSituacao(e.target.value)} className={campo}>
            <option value="">Todas</option>
            {SITUACOES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {estado === "carregando" ? "Consultando os registros da Anvisa…" : estado === "erro" ? erro : resumo}
      </div>

      {estado === "inicio" && <p className="text-xs text-slate-600">Digite ao menos 3 letras para consultar. Acentos e maiúsculas não importam.</p>}
      {estado === "carregando" && <p className="text-xs text-slate-600">Consultando os registros da Anvisa… a primeira consulta pode levar até meio minuto.</p>}
      {estado === "erro" && <p className="text-xs text-red-700" role="alert">{erro}</p>}

      {estado === "ok" && resp && (
        <>
          <p className="text-xs text-slate-700">{resumo}</p>
          {resp.resultados.length > 0 && (
            <>
              <div className="overflow-x-auto max-h-[32rem]" tabIndex={0} role="region" aria-label="Tabela de registros (use as setas para rolar)">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 font-mono">
                      <th scope="col" className="py-2 pr-3 font-normal">Medicamento</th>
                      <th scope="col" className="py-2 pr-3 font-normal">Empresa detentora</th>
                      <th scope="col" className="py-2 pr-3 font-normal">Categoria</th>
                      <th scope="col" className="py-2 pr-3 font-normal">Situação</th>
                      <th scope="col" className="py-2 pr-3 font-normal whitespace-nowrap">Nº do registro</th>
                      <th scope="col" className="py-2 pr-3 font-normal whitespace-nowrap">Concedido em</th>
                      <th scope="col" className="py-2 font-normal whitespace-nowrap">Vencimento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resp.resultados.map((r) => (
                      <tr key={r.registro} className="align-top text-slate-700">
                        <th scope="row" className="py-2 pr-3 font-semibold text-slate-900 text-left">
                          {r.nome}
                          {r.principioAtivo && caixaAlta(r.principioAtivo) !== caixaAlta(r.nome) && <span className="block font-normal text-slate-600">{r.principioAtivo}</span>}
                          {r.classe && <span className="block font-normal text-slate-600">{caixaAlta(r.classe)}</span>}
                        </th>
                        <td className="py-2 pr-3">
                          {r.empresa || "—"}
                          {r.cnpj && <span className="block text-slate-600">CNPJ {r.cnpj}</span>}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">{r.categoria || "—"}</td>
                        <td className="py-2 pr-3">
                          {r.situacao}
                          {r.situacao === "Parcial" && <span className="block text-slate-600">ativo em {r.linhasAtivas} de {r.linhas} linhas</span>}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">{r.registro}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{r.concessao || "—"}</td>
                        <td className="py-2 whitespace-nowrap">{r.vencimento || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <dl className="space-y-1 text-xs text-slate-600">
                <div><dt className="inline font-semibold text-slate-700">Situação: </dt><dd className="inline">é a que a Anvisa informa em cada linha do arquivo, e o dicionário de dados da Anvisa não detalha esse campo. “Parcial” indica que o mesmo registro tem linhas ativas e inativas.</dd></div>
                <div><dt className="inline font-semibold text-slate-700">Registro: </dt><dd className="inline">autorização da Anvisa para comercializar o medicamento. Mostramos um resultado por número de registro.</dd></div>
              </dl>
              <p className="text-xs text-slate-600">
                Para confirmar um registro, consulte a fonte oficial.{" "}
                <a href={URL_CONSULTA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 py-1 font-semibold text-blue-700 hover:underline">
                  Consulta da Anvisa <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </p>
            </>
          )}
        </>
      )}

      <p className="text-[0.75rem] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-slate-100 pt-3">
        <Database className="h-3.5 w-3.5" aria-hidden="true" />
        <span><strong className="text-slate-700">Fonte:</strong> Anvisa, Portal de Dados Abertos (produtos registrados, medicamentos)</span>
        {dataArquivo && <span>· Arquivo da Anvisa de {dataArquivo}</span>}
        {resp && <span>· {numero(resp.total)} registros ({numero(resp.linhasNoArquivo)} linhas no arquivo)</span>}
        <span>· Coleta automática, atualizada mensalmente pela Anvisa</span>
        <a href={URL_DADOS} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 py-1.5 text-blue-700 hover:underline">
          Baixar o arquivo completo <ExternalLink className="h-3 w-3" aria-hidden="true" /><span className="sr-only"> (abre em nova aba)</span>
        </a>
        <a href={URL_DICIONARIO} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 py-1.5 text-blue-700 hover:underline">
          Dicionário de dados <ExternalLink className="h-3 w-3" aria-hidden="true" /><span className="sr-only"> (abre em nova aba)</span>
        </a>
      </p>
    </section>
  );
}
