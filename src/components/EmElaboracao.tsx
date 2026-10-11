import { Hourglass } from "lucide-react";

export function EmElaboracao({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center space-y-2">
      <Hourglass className="h-6 w-6 text-slate-500 mx-auto" />
      <h2 className="font-display font-bold text-lg text-slate-900">{titulo}</h2>
      <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">{texto}</p>
    </div>
  );
}
