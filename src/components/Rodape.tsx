interface Props {
  aoAbrirMetodologia: () => void;
  aoAbrirComoUsar: () => void;
}

export function Rodape({ aoAbrirMetodologia, aoAbrirComoUsar }: Props) {
  return (
    <footer className="print:hidden mt-auto border-t border-slate-200 py-6 px-6 bg-white text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl w-full mx-auto">
      <div>
        <span>© 2026 Observatório da Assistência Farmacêutica do RN • Dados com fonte e data de atualização</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono">
        <button type="button" onClick={aoAbrirComoUsar} className="py-1.5 text-blue-700 hover:underline cursor-pointer">Como usar</button>
        <button type="button" onClick={aoAbrirMetodologia} className="py-1.5 text-blue-700 hover:underline cursor-pointer">Metodologia e glossário</button>
        <span>Projeto em desenvolvimento</span>
      </div>
    </footer>
  );
}
