import { useEffect, useState } from "react";
import { Database, ExternalLink } from "lucide-react";

interface PrecoCmed {
  produto: string;
  substancia: string;
  apresentacao: string;
  laboratorio: string;
  registro: string;
  tipo: string;
  tarja: string;
  restricaoHospitalar: string;
  cap: string;
  pfSemImpostos: number | null;
  pf0: number | null;
  pmc0: number | null;
}

interface Resposta {
  atualizadoEm: string | null;
  lidoEm: string;
  total: number;
  encontrados: number;
  resultados: PrecoCmed[];
}

const TIPOS = ["Genérico", "Similar", "Novo", "Biológico", "Específico", "Fitoterápico", "Radiofármaco"];
const URL_PRECOS = "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos";
const URL_DADOS = "https://dados.anvisa.gov.br/dados/TA_PRECO_MEDICAMENTO.csv";

const reais = (v: number | null) => (v === null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
const minusculas = (s: string) => s.toLocaleLowerCase("pt-BR");

// Consulta de preços máximos de medicamentos (tabela da CMED, dados abertos da Anvisa), lida pelo servidor do Observatório.
export function ConsultaCmed() {
  const [consulta, setConsulta] = useState("");
  const [tipo, setTipo] = useState("");
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
        const r = await fetch(`/api/cmed?q=${encodeURIComponent(termo)}${tipo ? `&tipo=${encodeURIComponent(tipo)}` : ""}`, { signal: controle.signal });
        const dados = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(dados.erro || "Não foi possível consultar a tabela da CMED agora.");
        setResp(dados as Resposta);
        setEstado("ok");
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErro(e?.message || "Não foi possível consultar a tabela da CMED agora.");
        setEstado("erro");
      }
    }, 450);
    return () => {
      clearTimeout(espera);
      controle.abort();
    };
  }, [termo, tipo]);

  const dataTabela = resp?.atualizadoEm ? new Date(resp.atualizadoEm).toLocaleDateString("pt-BR") : null;
  const resumo =
    estado === "ok" && resp
      ? resp.encontrados === 0
        ? "Nenhum medicamento encontrado."
        : `${resp.encontrados} ${resp.encontrados === 1 ? "apresentação encontrada" : "apresentações encontradas"}${resp.encontrados > resp.resultados.length ? `; mostrando as ${resp.resultados.length} primeiras` : ""}.`
      : "";

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div>
        <h2 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Consulta de preços de medicamentos (CMED)</h2>
        <p className="mt-2 text-xs text-slate-700">
          Preços máximos regulados pela Câmara de Regulação do Mercado de Medicamentos. Úteis para conferir se um preço de compra (como o de um pregão) está dentro do teto. <strong>Não são os preços efetivamente praticados.</strong>
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="cmed-busca" className="block text-xs font-medium text-slate-700 mb-1">Medicamento, princípio ativo, laboratório ou registro</label>
          <input
            id="cmed-busca"
            type="search"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            autoComplete="off"
            placeholder="Ex.: losartana 50 mg"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label htmlFor="cmed-tipo" className="block text-xs font-medium text-slate-700 mb-1">Tipo de produto</label>
          <select
            id="cmed-tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Todos</option>
            {TIPOS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {estado === "carregando" ? "Consultando a tabela da CMED…" : estado === "erro" ? erro : resumo}
      </div>

      {estado === "inicio" && <p className="text-xs text-slate-600">Digite ao menos 3 letras para consultar. Acentos e maiúsculas não importam.</p>}
      {estado === "carregando" && <p className="text-xs text-slate-600">Consultando a tabela da CMED… a primeira consulta pode levar alguns segundos.</p>}
      {estado === "erro" && <p className="text-xs text-red-700" role="alert">{erro}</p>}

      {estado === "ok" && resp && (
        <>
          <p className="text-xs text-slate-700">{resumo}</p>
          {resp.resultados.length > 0 && (
            <>
              <div className="overflow-x-auto max-h-[32rem]" tabIndex={0} role="region" aria-label="Tabela de preços (use as setas para rolar)">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 font-mono">
                      <th scope="col" className="py-2 pr-3 font-normal">Medicamento</th>
                      <th scope="col" className="py-2 pr-3 font-normal">Apresentação</th>
                      <th scope="col" className="py-2 pr-3 font-normal">Laboratório</th>
                      <th scope="col" className="py-2 pr-3 font-normal">Tipo</th>
                      <th scope="col" className="py-2 pr-3 font-normal text-right whitespace-nowrap">PF sem impostos</th>
                      <th scope="col" className="py-2 pr-3 font-normal text-right whitespace-nowrap">PF (ICMS 0%)</th>
                      <th scope="col" className="py-2 pr-3 font-normal text-right whitespace-nowrap">PMC (ICMS 0%)</th>
                      <th scope="col" className="py-2 font-normal">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resp.resultados.map((r, i) => {
                      const obs = [r.cap === "Sim" ? "Sujeito ao CAP" : "", r.restricaoHospitalar === "Sim" ? "Restrição hospitalar" : "", /^tarja (?!sem)/i.test(r.tarja) ? r.tarja : ""].filter(Boolean);
                      return (
                        <tr key={`${r.registro}-${i}`} className="align-top text-slate-700">
                          <th scope="row" className="py-2 pr-3 font-semibold text-slate-900 text-left">
                            {r.produto}
                            {r.substancia && minusculas(r.substancia) !== minusculas(r.produto) && <span className="block font-normal text-slate-600">{r.substancia}</span>}
                          </th>
                          <td className="py-2 pr-3">{r.apresentacao || "—"}</td>
                          <td className="py-2 pr-3">{r.laboratorio || "—"}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{r.tipo || "—"}</td>
                          <td className="py-2 pr-3 text-right whitespace-nowrap">{reais(r.pfSemImpostos)}</td>
                          <td className="py-2 pr-3 text-right whitespace-nowrap">{reais(r.pf0)}</td>
                          <td className="py-2 pr-3 text-right whitespace-nowrap">{reais(r.pmc0)}</td>
                          <td className="py-2 min-w-[9rem]">{obs.length ? obs.join("; ") : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <dl className="space-y-1 text-xs text-slate-600">
                <div><dt className="inline font-semibold text-slate-700">PF (preço de fábrica): </dt><dd className="inline">teto de venda do fabricante a farmácias e distribuidores.</dd></div>
                <div><dt className="inline font-semibold text-slate-700">PMC (preço máximo ao consumidor): </dt><dd className="inline">teto de venda ao público nas farmácias.</dd></div>
                <div><dt className="inline font-semibold text-slate-700">CAP: </dt><dd className="inline">coeficiente de adequação de preço, um desconto sobre o PF aplicado em vendas ao governo nos produtos sujeitos a ele.</dd></div>
              </dl>
              <p className="text-xs text-slate-600">Os valores mostrados são os de ICMS 0% e sem impostos. A tabela da CMED traz também os valores por alíquota de ICMS; para eles e para as regras de compras públicas, consulte a fonte oficial.</p>
            </>
          )}
        </>
      )}

      <p className="text-[0.75rem] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-slate-100 pt-3">
        <Database className="h-3.5 w-3.5" aria-hidden="true" />
        <span><strong className="text-slate-700">Fonte:</strong> CMED/Anvisa, Portal de Dados Abertos</span>
        {dataTabela && <span>· Arquivo da Anvisa de {dataTabela}</span>}
        {resp && <span>· {resp.total.toLocaleString("pt-BR")} apresentações na tabela</span>}
        <span>· Coleta automática</span>
        <a href={URL_PRECOS} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 py-1.5 text-blue-700 hover:underline">
          Ver fonte <ExternalLink className="h-3 w-3" aria-hidden="true" /><span className="sr-only"> (abre em nova aba)</span>
        </a>
        <a href={URL_DADOS} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 py-1.5 text-blue-700 hover:underline">
          Baixar a tabela completa <ExternalLink className="h-3 w-3" aria-hidden="true" /><span className="sr-only"> (abre em nova aba)</span>
        </a>
      </p>
    </section>
  );
}
