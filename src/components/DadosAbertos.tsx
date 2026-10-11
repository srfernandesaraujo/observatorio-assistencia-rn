import { useEffect, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { TEMPLATES, lerMetadados, type MetadadosDataset } from "../lib/datasets";
import { baixarConjunto } from "../lib/exportar";

const URL_CMED_CSV = "https://dados.anvisa.gov.br/dados/TA_PRECO_MEDICAMENTO.csv";

function dataBR(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

// Dados abertos: baixar em CSV ou JSON os conjuntos já publicados pelo Observatório.
export function DadosAbertos() {
  const [metas, setMetas] = useState<Record<string, MetadadosDataset | null> | null>(null);
  const [baixando, setBaixando] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    let ativo = true;
    Promise.all(TEMPLATES.map((t) => lerMetadados(t.id).catch(() => null))).then((lista) => {
      if (ativo) setMetas(Object.fromEntries(TEMPLATES.map((t, i) => [t.id, lista[i]])));
    });
    return () => {
      ativo = false;
    };
  }, []);

  const baixar = async (id: string, formato: "csv" | "json") => {
    const template = TEMPLATES.find((t) => t.id === id);
    if (!template) return;
    setBaixando(`${id}-${formato}`);
    setAviso("");
    try {
      await baixarConjunto(template, formato);
      setAviso(`Arquivo de “${template.titulo}” em ${formato.toUpperCase()} baixado.`);
    } catch (e: any) {
      setAviso(e?.message || "Não foi possível baixar agora. Tente novamente.");
    } finally {
      setBaixando(null);
    }
  };

  const botao = "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold";

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Dados abertos</h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Baixe os conjuntos de dados publicados pelo Observatório para usar em planilhas, análises ou pesquisas. Cada arquivo traz a fonte e a data de atualização do conjunto. Conjuntos ainda sem dados não têm arquivo.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700 leading-relaxed">
          <li><strong>CSV:</strong> colunas separadas por ponto e vírgula, texto em UTF-8, datas no formato AAAA-MM-DD e números com ponto decimal.</li>
          <li><strong>JSON:</strong> traz, além dos dados, a descrição das colunas, a fonte, o período e a data de atualização.</li>
          <li>Ao reutilizar os dados, cite a fonte original de cada conjunto.</li>
        </ul>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="font-semibold text-sm text-slate-900">Conjuntos do Observatório</h3>
        <div role="status" aria-live="polite" className="text-xs text-slate-700 min-h-4">{aviso}</div>
        {metas === null ? (
          <p className="text-xs text-slate-600">Carregando…</p>
        ) : (
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Conjuntos de dados para baixar (use as setas para rolar)">
            <table className="w-full min-w-[40rem] text-left border-collapse text-xs">
              <caption className="sr-only">Conjuntos de dados, situação e arquivos para baixar</caption>
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-mono">
                  <th scope="col" className="py-2 pr-3 font-normal">Conjunto</th>
                  <th scope="col" className="py-2 pr-3 font-normal">Fonte e atualização</th>
                  <th scope="col" className="py-2 pr-3 font-normal text-right">Linhas</th>
                  <th scope="col" className="py-2 font-normal">Baixar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {TEMPLATES.map((t) => {
                  const meta = metas[t.id];
                  const publicado = !!meta && meta.totalLinhas > 0;
                  return (
                    <tr key={t.id} className="align-top text-slate-700">
                      <th scope="row" className="py-3 pr-3 text-left font-semibold text-slate-900">
                        {t.titulo}
                        <span className="block font-normal text-slate-600">{t.descricao}</span>
                      </th>
                      <td className="py-3 pr-3">
                        {publicado ? (
                          <>
                            {meta!.fonte}
                            <span className="block text-slate-600">
                              {meta!.periodo ? `${meta!.periodo} · ` : ""}Atualizado em {dataBR(meta!.atualizadoEm)}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-600">Aguardando dados da fonte</span>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-right whitespace-nowrap">{publicado ? meta!.totalLinhas.toLocaleString("pt-BR") : "—"}</td>
                      <td className="py-3">
                        {publicado ? (
                          <div className="flex flex-wrap gap-2">
                            {(["csv", "json"] as const).map((f) => (
                              <button
                                key={f}
                                type="button"
                                onClick={() => baixar(t.id, f)}
                                disabled={baixando !== null}
                                aria-label={`Baixar ${t.titulo} em ${f.toUpperCase()}`}
                                className={`${botao} border-blue-700 text-blue-700 hover:bg-blue-50 disabled:opacity-60 cursor-pointer disabled:cursor-wait`}
                              >
                                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                                {f.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
        <h3 className="font-semibold text-sm text-slate-900">Outras fontes abertas usadas no site</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>
            <strong>Preços de medicamentos (CMED/Anvisa):</strong> a tabela completa é publicada pela própria Anvisa.{" "}
            <a href={URL_CMED_CSV} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 py-1 font-semibold text-blue-700 hover:underline">
              Baixar na fonte <ExternalLink className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </li>
          <li>
            <strong>População, área e densidade (IBGE, Censo 2022):</strong> consultadas ao vivo na API pública do IBGE.{" "}
            <a href="https://sidra.ibge.gov.br/tabela/4714" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 py-1 font-semibold text-blue-700 hover:underline">
              Ver na fonte <ExternalLink className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
