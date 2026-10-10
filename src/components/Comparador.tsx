import { useEffect, useMemo, useState } from "react";
import { BarChart3, ExternalLink, Plus, X, Info } from "lucide-react";
import { carregarMunicipiosRN, FONTE_IBGE, type MunicipioIBGE } from "../lib/ibge";
import { lerDataset, type Linha, type MetadadosDataset } from "../lib/datasets";
import {
  INDICADORES_IBGE,
  construirIndicadores,
  formatarValor,
  montarComparacao,
  regioesPorCodigo,
  valorDoMunicipio,
  type IndicadorMunicipal,
} from "../lib/comparador";
import { SeloFonte } from "./SeloFonte";

const MAX_SELECIONADOS = 5;
const INICIAIS = ["Natal", "Mossoró", "Parnamirim"];

// Comparador territorial: município x município x mediana do RN x mediana da região de saúde.
export function Comparador() {
  const [municipios, setMunicipios] = useState<MunicipioIBGE[] | null>(null);
  const [erroIbge, setErroIbge] = useState(false);
  const [linhasInd, setLinhasInd] = useState<Linha[]>([]);
  const [metaInd, setMetaInd] = useState<MetadadosDataset | null>(null);
  const [linhasReg, setLinhasReg] = useState<Linha[]>([]);
  const [metaReg, setMetaReg] = useState<MetadadosDataset | null>(null);

  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [indicadorId, setIndicadorId] = useState("ibge:populacao");
  const [ano, setAno] = useState<number | null>(null);
  const [porDezMil, setPorDezMil] = useState(false);
  const [adicionar, setAdicionar] = useState("");

  useEffect(() => {
    let ativo = true;
    carregarMunicipiosRN()
      .then((m) => {
        if (!ativo) return;
        setMunicipios(m);
        setSelecionados(INICIAIS.map((n) => m.find((x) => x.nome === n)?.codigo).filter((c): c is string => !!c));
      })
      .catch(() => ativo && setErroIbge(true));
    lerDataset("indicadores_municipais")
      .then((r) => {
        if (!ativo || !r) return;
        setLinhasInd(r.linhas);
        setMetaInd(r.meta);
      })
      .catch(() => {});
    lerDataset("municipios_regioes")
      .then((r) => {
        if (!ativo || !r) return;
        setLinhasReg(r.linhas);
        setMetaReg(r.meta);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const { indicadores, naoReconhecidos } = useMemo(() => {
    if (!municipios) return { indicadores: [] as IndicadorMunicipal[], naoReconhecidos: [] as string[] };
    const c = construirIndicadores(municipios, linhasInd);
    return { indicadores: [...INDICADORES_IBGE(municipios), ...c.indicadores], naoReconhecidos: c.naoReconhecidos };
  }, [municipios, linhasInd]);

  const regioes = useMemo(() => (municipios ? regioesPorCodigo(municipios, linhasReg) : new Map<string, string>()), [municipios, linhasReg]);

  const indicador = indicadores.find((i) => i.id === indicadorId) ?? indicadores[0];
  const anoAtual = indicador ? (ano !== null && indicador.anos.includes(ano) ? ano : indicador.anos[0]) : null;

  const barras = useMemo(() => {
    if (!municipios || !indicador || anoAtual === null) return [];
    return montarComparacao({ municipios, selecionados, indicador, ano: anoAtual, porDezMil: porDezMil && indicador.permitePorHabitante, regioes });
  }, [municipios, selecionados, indicador, anoAtual, porDezMil, regioes]);

  if (erroIbge) {
    return <p className="text-sm text-red-600 bg-white border border-slate-200 rounded-xl p-6">Não foi possível carregar a lista de municípios do IBGE agora. Tente novamente em instantes.</p>;
  }
  if (!municipios || !indicador || anoAtual === null) {
    return <p className="text-sm text-slate-400">Carregando municípios…</p>;
  }

  const usaPorHabitante = porDezMil && indicador.permitePorHabitante;
  const maximo = Math.max(1, ...barras.map((b) => b.valor ?? 0));
  const disponiveis = municipios.filter((m) => !selecionados.includes(m.codigo));
  const unidadeExibida = usaPorHabitante ? `${indicador.unidade || "valor"} por 10 mil hab.` : indicador.unidade;

  const adicionarMunicipio = (codigo: string) => {
    if (!codigo || selecionados.length >= MAX_SELECIONADOS) return;
    setSelecionados([...selecionados, codigo]);
    setAdicionar("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-1">
        <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" /> Comparador territorial
        </h2>
        <p className="text-xs text-slate-500">
          Compare até {MAX_SELECIONADOS} municípios do RN entre si, com a mediana do estado e, quando disponível, a mediana da região de saúde.
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-1.5">Municípios</p>
          <div className="flex flex-wrap gap-1.5 items-center">
            {selecionados.map((c) => {
              const m = municipios.find((x) => x.codigo === c);
              return (
                <span key={c} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                  {m?.nome}
                  <button onClick={() => setSelecionados(selecionados.filter((x) => x !== c))} className="cursor-pointer hover:text-blue-900" aria-label={`Remover ${m?.nome}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
            {selecionados.length < MAX_SELECIONADOS && (
              <span className="inline-flex items-center gap-1">
                <select
                  value={adicionar}
                  onChange={(e) => adicionarMunicipio(e.target.value)}
                  aria-label="Adicionar município"
                  className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white max-w-[200px]"
                >
                  <option value="">Adicionar município…</option>
                  {disponiveis.map((m) => (
                    <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                  ))}
                </select>
                <Plus className="h-3.5 w-3.5 text-slate-400" />
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-xs font-semibold text-slate-700 md:col-span-2">
            Indicador
            <select
              value={indicador.id}
              onChange={(e) => {
                setIndicadorId(e.target.value);
                setAno(null);
              }}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white"
            >
              <optgroup label="Demografia (IBGE)">
                {indicadores.filter((i) => i.origem === "ibge").map((i) => (
                  <option key={i.id} value={i.id}>{i.nome}</option>
                ))}
              </optgroup>
              {indicadores.some((i) => i.origem === "dataset") && (
                <optgroup label="Assistência farmacêutica">
                  {indicadores.filter((i) => i.origem === "dataset").map((i) => (
                    <option key={i.id} value={i.id}>{i.nome}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Ano
            <select value={anoAtual} onChange={(e) => setAno(Number(e.target.value))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white">
              {indicador.anos.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
        </div>

        {indicador.permitePorHabitante && (
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input type="checkbox" checked={porDezMil} onChange={(e) => setPorDezMil(e.target.checked)} />
            Mostrar por 10 mil habitantes (compara municípios de tamanhos diferentes)
          </label>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold text-sm text-slate-900">
            {indicador.nome} <span className="text-slate-400 font-normal">({anoAtual})</span>
          </h3>
          {unidadeExibida && <span className="text-[11px] text-slate-500 font-mono">{unidadeExibida}</span>}
        </div>

        {selecionados.length === 0 ? (
          <p className="text-xs text-slate-500">Escolha ao menos um município para comparar.</p>
        ) : (
          <ul className="space-y-2.5">
            {barras.map((b, i) => (
              <li key={i}>
                <div className="flex items-baseline justify-between text-xs mb-1 gap-3">
                  <span className={b.tipo === "referencia" ? "text-slate-500 italic" : "font-medium text-slate-800"}>
                    {b.rotulo}
                    {b.detalhe && <span className="text-[10px] text-slate-400 font-normal not-italic"> · {b.detalhe}</span>}
                  </span>
                  <span className="font-mono text-slate-700 shrink-0">{formatarValor(b.valor, usaPorHabitante ? 2 : 1)}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden" role="img" aria-label={`${b.rotulo}: ${formatarValor(b.valor)}`}>
                  <div
                    className={`h-full rounded-full ${b.tipo === "referencia" ? "bg-slate-400" : "bg-blue-600"}`}
                    style={{ width: `${b.valor === null ? 0 : Math.max(1, (b.valor / maximo) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="pt-2 border-t border-slate-100 space-y-1">
          {indicador.origem === "ibge" ? (
            <p className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-1.5">
              <strong className="text-slate-700">Fonte:</strong> {FONTE_IBGE.rotulo}
              <a href={FONTE_IBGE.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-blue-600 hover:underline">
                Ver fonte <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          ) : (
            metaInd && <SeloFonte meta={metaInd} />
          )}
          {regioes.size > 0 && metaReg ? (
            <p className="text-[11px] text-slate-500">Regiões de saúde: {metaReg.fonte}, atualizado em {new Date(metaReg.atualizadoEm).toLocaleDateString("pt-BR")}.</p>
          ) : (
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="h-3 w-3" /> A comparação por região de saúde aparece quando o vínculo oficial município-região for publicado.
            </p>
          )}
          {naoReconhecidos.length > 0 && (
            <p className="text-[11px] text-amber-700">
              Atenção: {naoReconhecidos.length} nome(s) de município no arquivo importado não foram reconhecidos e ficaram fora da comparação: {naoReconhecidos.slice(0, 5).join(", ")}
              {naoReconhecidos.length > 5 ? "…" : ""}.
            </p>
          )}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
        <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">Dados dos municípios (IBGE, Censo 2022)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-mono">
                <th className="py-2 pr-3 font-normal">Município</th>
                <th className="py-2 pr-3 font-normal">Região de saúde</th>
                <th className="py-2 pr-3 font-normal text-right">População</th>
                <th className="py-2 pr-3 font-normal text-right">Área (km²)</th>
                <th className="py-2 pr-3 font-normal text-right">Densidade (hab/km²)</th>
                <th className="py-2 font-normal text-right">{indicador.nome}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {selecionados.map((c) => {
                const m = municipios.find((x) => x.codigo === c)!;
                return (
                  <tr key={c} className="text-slate-700">
                    <td className="py-2 pr-3 font-medium">{m.nome}</td>
                    <td className="py-2 pr-3 text-slate-500">{regioes.get(c) ?? "—"}</td>
                    <td className="py-2 pr-3 text-right font-mono">{formatarValor(m.populacao)}</td>
                    <td className="py-2 pr-3 text-right font-mono">{formatarValor(m.areaKm2)}</td>
                    <td className="py-2 pr-3 text-right font-mono">{formatarValor(m.densidade)}</td>
                    <td className="py-2 text-right font-mono">{formatarValor(valorDoMunicipio(indicador, anoAtual, m, usaPorHabitante), usaPorHabitante ? 2 : 1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
