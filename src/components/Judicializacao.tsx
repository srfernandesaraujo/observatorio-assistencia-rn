import { Scale } from "lucide-react";

interface Props {
  // Processos judiciais de saúde concluídos no ano; null enquanto a fonte pública (CNJ/DataJud) não estiver integrada.
  processosConcluidosAno: number | null;
  ano: number;
}

export function Judicializacao({ processosConcluidosAno, ano }: Props) {
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
        <p className="text-[10px] font-mono uppercase text-purple-700 font-bold">Processos concluídos em {ano}</p>
        {processosConcluidosAno === null ? (
          <>
            <p className="text-2xl font-bold font-mono text-purple-300 mt-1">—</p>
            <p className="text-[11px] text-purple-700 mt-2">Aguardando integração com fonte pública (CNJ/DataJud).</p>
          </>
        ) : (
          <p className="text-3xl font-bold font-mono text-purple-800 mt-1">{processosConcluidosAno.toLocaleString("pt-BR")}</p>
        )}
      </div>
    </div>
  );
}
