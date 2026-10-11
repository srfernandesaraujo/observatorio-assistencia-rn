import { useMemo, useState } from "react";
import { FONTES, GLOSSARIO } from "../content/metodologia";
import { normalizar } from "../lib/texto";

const SECOES = [
  { id: "met-principios", rotulo: "Princípios" },
  { id: "met-fontes", rotulo: "De onde vêm os dados" },
  { id: "met-leitura", rotulo: "Como ler os dados" },
  { id: "met-limites", rotulo: "Limites e cuidados" },
  { id: "met-glossario", rotulo: "Glossário" },
];

const titulo = "font-semibold text-sm text-slate-900";
const paragrafo = "text-sm text-slate-700 leading-relaxed";

// Metodologia (de onde vêm os dados e como são tratados) e glossário de termos.
export function Metodologia() {
  const [filtro, setFiltro] = useState("");
  const termos = useMemo(() => [...GLOSSARIO].sort((a, b) => a.termo.localeCompare(b.termo, "pt-BR")), []);
  const visiveis = useMemo(() => {
    const palavras = normalizar(filtro).split("_").filter(Boolean);
    if (palavras.length === 0) return termos;
    return termos.filter((t) => {
      const alvo = normalizar(`${t.termo} ${t.definicao}`);
      return palavras.every((p) => alvo.includes(p));
    });
  }, [termos, filtro]);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Metodologia e glossário</h2>
        <p className={paragrafo}>
          Esta página explica de onde vêm as informações do Observatório, como elas são tratadas e o que significam os termos usados no site.
        </p>
        <nav aria-label="Nesta página">
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {SECOES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="inline-block py-1 text-sm font-medium text-blue-700 hover:underline">{s.rotulo}</a>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <section id="met-principios" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 scroll-mt-40">
        <h3 className={titulo}>Princípios</h3>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700 leading-relaxed">
          <li><strong>Só dado com fonte.</strong> Toda informação mostra de onde vem e quando foi atualizada. Onde ainda não há dado, o site diz “aguardando dados da fonte”. Não usamos dados de exemplo.</li>
          <li><strong>Fonte oficial e aberta.</strong> Quando existe uma base pública, usamos essa base e indicamos o link para conferir.</li>
          <li><strong>Sem interpretação escondida.</strong> Os valores são mostrados como a fonte os informa. Quando calculamos algo (por exemplo, um valor por 10 mil habitantes), isso aparece escrito na tela.</li>
          <li><strong>Informação, não orientação clínica.</strong> O Observatório não substitui o farmacêutico nem o médico.</li>
        </ul>
      </section>

      <section id="met-fontes" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 scroll-mt-40">
        <h3 className={titulo}>De onde vêm os dados</h3>
        <p className={paragrafo}>O quadro mostra a fonte de cada área do site e como a informação chega até aqui.</p>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Quadro de fontes (use as setas para rolar)">
          <table className="w-full min-w-[40rem] text-left border-collapse text-xs">
            <caption className="sr-only">Fonte, forma de coleta e atualização de cada área do Observatório</caption>
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-mono">
                <th scope="col" className="py-2 pr-3 font-normal">Área do site</th>
                <th scope="col" className="py-2 pr-3 font-normal">Fonte</th>
                <th scope="col" className="py-2 pr-3 font-normal">Como chega ao site</th>
                <th scope="col" className="py-2 font-normal">Atualização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FONTES.map((f) => (
                <tr key={f.secao} className="align-top text-slate-700">
                  <th scope="row" className="py-2.5 pr-3 text-left font-semibold text-slate-900">{f.secao}</th>
                  <td className="py-2.5 pr-3">{f.fonte}</td>
                  <td className="py-2.5 pr-3">{f.comoChega}</td>
                  <td className="py-2.5">{f.atualizacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="met-leitura" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 scroll-mt-40">
        <h3 className={titulo}>Como ler os dados</h3>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700 leading-relaxed">
          <li><strong>Selo de fonte.</strong> Cada tabela traz a fonte, o período a que o dado se refere (quando informado), a data de atualização e se a coleta é automática ou por planilha. “Atualizado em” é a data em que o dado foi publicado no Observatório, que pode ser posterior à data do fato.</li>
          <li><strong>Planilhas são conferidas antes de publicar.</strong> O sistema verifica campos obrigatórios, números, datas, nomes oficiais de município (lista do IBGE) e se os links começam com http ou https. Se houver erro, nada é publicado. Uma nova publicação substitui o conjunto anterior.</li>
          <li><strong>Valores por 10 mil habitantes.</strong> No Comparador territorial, indicadores que são contagens podem ser mostrados por 10 mil habitantes, dividindo o valor do município pela população do Censo 2022 do IBGE e multiplicando por 10 mil. Isso permite comparar municípios de tamanhos diferentes.</li>
          <li><strong>Registros da Anvisa.</strong> O arquivo da Anvisa repete o mesmo registro em várias linhas, que só diferem na situação. O Observatório mostra um resultado por número de registro e indica “Parcial” quando há linhas ativas e inativas. Repetimos a situação como a Anvisa informa, sem interpretar.</li>
          <li><strong>Dados abertos.</strong> Os conjuntos publicados podem ser baixados em CSV ou JSON na seção Dados abertos, de Indicadores. Ao reutilizar, cite a fonte original de cada conjunto.</li>
          <li><strong>Preços da CMED.</strong> São preços máximos regulados, por apresentação do medicamento, e não os preços efetivamente praticados. Mostramos o preço de fábrica (PF) sem impostos e com ICMS 0%, e o preço máximo ao consumidor (PMC) com ICMS 0%. A tabela completa, com outras alíquotas de ICMS, está na fonte oficial.</li>
        </ul>
      </section>

      <section id="met-limites" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 scroll-mt-40">
        <h3 className={titulo}>Limites e cuidados</h3>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700 leading-relaxed">
          <li><strong>Projeto em desenvolvimento.</strong> Algumas seções ainda aguardam dados oficiais e estão sinalizadas como “em elaboração” ou “aguardando dados”.</li>
          <li><strong>A qualidade do dado depende da fonte.</strong> O Observatório confere o formato, mas não corrige nem completa o que a fonte informou.</li>
          <li><strong>Assistente de perguntas.</strong> Ele responde com base nos dados publicados aqui e cita a fonte, mas, por ser inteligência artificial, pode errar ou resumir demais. Confira a fonte indicada. A pergunta é enviada a um serviço de inteligência artificial do Google para gerar a resposta: <strong>não escreva dados pessoais nem informações de saúde suas ou de outras pessoas</strong>.</li>
          <li><strong>Decisões de saúde.</strong> Para uso de medicamentos, procure o farmacêutico ou o médico. Para saber onde e como obter um medicamento, confirme com o serviço de saúde ou com a SESAP-RN.</li>
        </ul>
      </section>

      <section id="met-glossario" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 scroll-mt-40">
        <h3 className={titulo}>Glossário</h3>
        <div>
          <label htmlFor="glossario-filtro" className="block text-xs font-medium text-slate-700 mb-1">Filtrar termos</label>
          <input
            id="glossario-filtro"
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            autoComplete="off"
            placeholder="Ex.: preço, CEAF, pregão"
            className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <p role="status" aria-live="polite" className="text-xs text-slate-600">
          {filtro.trim() ? (visiveis.length === 0 ? "Nenhum termo encontrado." : `${visiveis.length} ${visiveis.length === 1 ? "termo" : "termos"}.`) : `${termos.length} termos.`}
        </p>
        <dl className="divide-y divide-slate-100">
          {visiveis.map((t) => (
            <div key={t.termo} className="py-2.5">
              <dt className="text-sm font-semibold text-slate-900">{t.termo}</dt>
              <dd className="mt-0.5 text-sm text-slate-700 leading-relaxed">{t.definicao}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
