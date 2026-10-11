import { useEffect, useState } from "react";
import { Scale } from "lucide-react";
import { lerDataset, type MetadadosDataset } from "../lib/datasets";
import { SeloFonte } from "./SeloFonte";

// Processos de saúde concluídos no ano mais recente publicado (fonte pública, ex.: CNJ/DataJud).
export function Judicializacao() {
  const [meta, setMeta] = useState<MetadadosDataset | null>(null);
  const [ano, setAno] = useState<number | null>(null);
  const [processosConcluidosAno, setProcessos] = useState<number | null>(null);

  useEffect(() => {
    lerDataset("judicializacao")
      .then((r) => {
        if (!r || r.linhas.length === 0) return;
        const ultima = [...r.linhas].sort((a, b) => Number(b.ano) - Number(a.ano))[0];
        setMeta(r.meta);
        setAno(Number(ultima.ano));
        setProcessos(Number(ultima.processos_concluidos));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
          <Scale className="h-5 w-5 text-purple-600" />
          Judicialização de Medicamentos no RN
        </h2>
        <p className="text-xs text-slate-500 mt-1">Número de processos de saúde relacionados a medicamentos, a partir de fontes públicas.</p>
      </div>

      <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 max-w-sm">
        <p className="text-[0.75rem] font-mono uppercase text-purple-700 font-bold">Processos concluídos{ano ? ` em ${ano}` : ""}</p>
        {processosConcluidosAno === null ? (
          <>
            <p className="text-2xl font-bold font-mono text-purple-300 mt-1">—</p>
            <p className="text-[0.75rem] text-purple-700 mt-2">Aguardando dados de fonte pública (CNJ/DataJud).</p>
          </>
        ) : (
          <>
            <p className="text-3xl font-bold font-mono text-purple-800 mt-1">{processosConcluidosAno.toLocaleString("pt-BR")}</p>
            {meta && <div className="mt-3"><SeloFonte meta={meta} /></div>}
          </>
        )}
      </div>
    </div>
  );
}
