import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Printer } from "lucide-react";
import { CHECKLIST, ETAPAS, PERGUNTAS } from "../content/comoUsar";

const caixa = "bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 scroll-mt-48 print:break-inside-avoid-page";
const textoCorpo = "text-sm text-slate-700 leading-relaxed";

const INDICE = [
  ...ETAPAS.map((e, i) => ({ id: e.id, rotulo: `${i + 1}. ${e.titulo}` })),
  { id: "checklist", rotulo: "Lista de conferência" },
  { id: "duvidas", rotulo: "Dúvidas frequentes" },
];

// Guia "Como usar": passo a passo do site, com capturas de tela reais (public/guia-imagens), lista de conferência e perguntas frequentes.
export function ComoUsar() {
  const [ativa, setAtiva] = useState("");

  // Destaca no índice a seção que está na tela
  useEffect(() => {
    const secoes = INDICE.map((i) => document.getElementById(i.id)).filter((s): s is HTMLElement => !!s);
    if (typeof IntersectionObserver === "undefined") return;
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setAtiva(e.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 }
    );
    secoes.forEach((s) => observador.observe(s));
    return () => observador.disconnect();
  }, []);

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
        <p className="text-[0.75rem] font-mono uppercase tracking-wider text-blue-200 font-bold">Guia de uso</p>
        <h2 className="font-display font-bold text-2xl md:text-3xl max-w-3xl">Como usar o Observatório: encontre, confira a fonte e baixe os dados.</h2>
        <p className="text-sm md:text-base text-blue-100 max-w-3xl leading-relaxed">
          Passo a passo, com as telas reais do site, para buscar informações, consultar preços e registros de medicamentos, comparar municípios, baixar dados e ajustar o site às suas necessidades.
        </p>
        <ul className="flex flex-wrap gap-2 text-xs" aria-label="Resumo do guia">
          <li className="rounded-full border border-blue-300 px-3 py-1"><strong>{ETAPAS.length}</strong> etapas</li>
          <li className="rounded-full border border-blue-300 px-3 py-1">sem cadastro</li>
          <li className="rounded-full border border-blue-300 px-3 py-1">funciona no celular</li>
          <li className="rounded-full border border-blue-300 px-3 py-1">cada dado mostra a fonte</li>
        </ul>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 print:hidden">
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 bg-white text-blue-800 hover:bg-blue-50 text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">
            <Printer className="h-4 w-4" aria-hidden="true" /> Imprimir ou salvar em PDF
          </button>
          <span className="text-xs text-blue-100">Endereço deste guia: <strong className="text-white">observatorio-rn.web.app/como-usar</strong></span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)] gap-6 items-start">
        <nav aria-label="Nesta página" className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm lg:sticky lg:top-48 print:hidden">
          <p className="text-[0.75rem] uppercase font-mono tracking-wider font-bold text-blue-700 mb-2">Nesta página</p>
          <ul className="space-y-0.5">
            {INDICE.map((i) => (
              <li key={i.id}>
                <a
                  href={`#${i.id}`}
                  aria-current={ativa === i.id ? "location" : undefined}
                  className={`block rounded-lg px-2 py-1.5 text-xs hover:bg-slate-50 hover:text-slate-900 ${ativa === i.id ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600"}`}
                >
                  {i.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6 min-w-0">
          {ETAPAS.map((etapa, n) => (
            <section key={etapa.id} id={etapa.id} className={caixa} aria-labelledby={`${etapa.id}-titulo`}>
              <div>
                <p className="text-[0.75rem] font-mono uppercase tracking-wider font-bold text-blue-700">Etapa {n + 1}</p>
                <h3 id={`${etapa.id}-titulo`} className="font-display font-bold text-lg text-slate-900 mt-0.5">{etapa.titulo}</h3>
                <p className={`${textoCorpo} mt-2`}>{etapa.intro}</p>
              </div>

              <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-700 leading-relaxed marker:font-semibold marker:text-blue-700">
                {etapa.passos.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>

              <div className="flex flex-wrap gap-4">
                {etapa.imagens.map((img) => (
                  <figure key={img.arquivo} className={`m-0 print:break-inside-avoid ${img.largura < 600 ? "w-full sm:w-[calc(50%-0.5rem)] max-w-[22rem]" : "w-full"}`}>
                    <img
                      src={`/guia-imagens/${img.arquivo}`}
                      alt={img.alt}
                      width={img.largura}
                      height={img.altura}
                      loading="lazy"
                      className="w-full h-auto rounded-lg border border-slate-300 shadow-sm"
                    />
                    <figcaption className="mt-2 text-xs text-slate-600 leading-relaxed">{img.legenda}</figcaption>
                  </figure>
                ))}
              </div>

              {etapa.cartoes && (
                <div className={`grid grid-cols-1 gap-3 ${etapa.cartoes.length > 1 ? "md:grid-cols-2" : ""}`}>
                  {etapa.cartoes.map((c) => (
                    <article key={c.titulo} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <h4 className="text-sm font-semibold text-slate-900">{c.titulo}</h4>
                      <p className="mt-1 text-sm text-slate-700 leading-relaxed">{c.texto}</p>
                    </article>
                  ))}
                </div>
              )}

              {etapa.aviso && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="flex items-start gap-2 text-sm text-amber-900 leading-relaxed">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      <strong>{etapa.aviso.titulo}</strong> {etapa.aviso.texto}
                    </span>
                  </p>
                </div>
              )}
            </section>
          ))}

          <section id="checklist" className={caixa} aria-labelledby="checklist-titulo">
            <div>
              <p className="text-[0.75rem] font-mono uppercase tracking-wider font-bold text-blue-700">Antes de usar o que encontrou</p>
              <h3 id="checklist-titulo" className="font-display font-bold text-lg text-slate-900 mt-0.5">Lista de conferência</h3>
              <p className={`${textoCorpo} mt-2`}>Use esta lista para usar as informações com segurança.</p>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 leading-relaxed">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-700" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="duvidas" className={caixa} aria-labelledby="duvidas-titulo">
            <div>
              <p className="text-[0.75rem] font-mono uppercase tracking-wider font-bold text-blue-700">Dúvidas frequentes</p>
              <h3 id="duvidas-titulo" className="font-display font-bold text-lg text-slate-900 mt-0.5">Se algo não estiver claro</h3>
            </div>
            <div className="divide-y divide-slate-100 border-y border-slate-100">
              {PERGUNTAS.map((p) => (
                <details key={p.pergunta} className="group py-1">
                  <summary className="cursor-pointer list-none py-2 text-sm font-semibold text-slate-900 flex items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
                    <span>{p.pergunta}</span>
                    <span aria-hidden="true" className="text-blue-700 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                  </summary>
                  <p className="pb-3 text-sm text-slate-700 leading-relaxed">{p.resposta}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
