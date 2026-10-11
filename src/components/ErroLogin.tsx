import { AlertTriangle, X } from "lucide-react";

interface Props {
  mensagem: string;
  aoFechar: () => void;
}

// Aviso de falha no login com Google.
export function ErroLogin({ mensagem, aoFechar }: Props) {
  return (
    <div role="alertdialog" aria-modal="true" aria-label="Falha no login" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-red-600">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <h3 className="font-bold text-base text-slate-950">Não foi possível entrar</h3>
          </div>
          <button onClick={aoFechar} aria-label="Fechar" className="text-slate-500 hover:text-slate-600 p-1 rounded-lg cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">{mensagem}</p>
        <div className="flex justify-end">
          <button onClick={aoFechar} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer">Fechar</button>
        </div>
      </div>
    </div>
  );
}
