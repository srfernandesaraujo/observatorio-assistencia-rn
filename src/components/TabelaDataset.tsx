import { useEffect, useState } from "react";
import { getTemplate, lerDataset, type Linha, type MetadadosDataset } from "../lib/datasets";
import { SeloFonte } from "./SeloFonte";

interface Props {
  templateId: string;
  titulo?: string;
}

// Mostra um conjunto de dados publicado (com selo de fonte) ou o aviso "aguardando dados".
export function TabelaDataset({ templateId, titulo }: Props) {
  const template = getTemplate(templateId);
  const [estado, setEstado] = useState<"carregando" | "vazio" | "erro" | "ok">("carregando");
  const [meta, setMeta] = useState<MetadadosDataset | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>([]);

  useEffect(() => {
    let ativo = true;
    lerDataset(templateId)
      .then((r) => {
        if (!ativo) return;
        if (!r) return setEstado("vazio");
        setMeta(r.meta);
        setLinhas(r.linhas);
        setEstado("ok");
      })
      .catch(() => ativo && setEstado("erro"));
    return () => {
      ativo = false;
    };
  }, [templateId]);

  if (!template) return null;
  const colunas = template.colunas;

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
      <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">{titulo ?? template.titulo}</h3>
      {estado === "carregando" && <p className="text-xs text-slate-400">Carregando…</p>}
      {estado === "erro" && <p className="text-xs text-red-600">Não foi possível carregar os dados agora.</p>}
      {estado === "vazio" && (
        <p className="text-xs text-slate-500">Aguardando dados oficiais. Esta seção será preenchida quando a fonte for integrada.</p>
      )}
      {estado === "ok" && meta && (
        <>
          <SeloFonte meta={meta} />
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-mono">
                  {colunas.map((c) => (
                    <th key={c.id} className="py-2 pr-3 font-normal whitespace-nowrap">{c.rotulo}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {linhas.map((l, i) => (
                  <tr key={i} className="text-slate-700">
                    {colunas.map((c) => (
                      <td key={c.id} className="py-2 pr-3">
                        {l[c.id] === null || l[c.id] === undefined
                          ? "—"
                          : c.tipo === "numero"
                          ? Number(l[c.id]).toLocaleString("pt-BR")
                          : String(l[c.id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
