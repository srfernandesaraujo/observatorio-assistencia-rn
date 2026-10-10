import { Activity, BookOpen, FileText, Landmark, ArrowRight } from "lucide-react";

export type Destino = "indicadores" | "programas" | "educacao" | "producao";

const CARDS: { id: Destino; titulo: string; texto: string; icon: typeof Activity }[] = [
  { id: "indicadores", titulo: "Indicadores", texto: "Desabastecimento, custos, qualidade dos serviços, judicialização e ATS no Rio Grande do Norte.", icon: Activity },
  { id: "programas", titulo: "Programas Governamentais", texto: "Onde e como obter medicamentos pelo SUS: Farmácia Popular, componentes básico, estratégico e especializado.", icon: Landmark },
  { id: "educacao", titulo: "Educação e Repositório", texto: "Notas técnicas, protocolos, legislação e materiais educativos sobre assistência farmacêutica.", icon: BookOpen },
  { id: "producao", titulo: "Produção Científica", texto: "Artigos, dissertações e produtos técnicos desenvolvidos a partir do observatório.", icon: FileText },
];

export function Landing({ onNavigate }: { onNavigate: (d: Destino) => void }) {
  return (
    <div className="space-y-8">
      <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <p className="text-[11px] font-mono uppercase tracking-wider text-blue-600 font-bold">Rio Grande do Norte</p>
        <h2 className="font-display font-bold text-3xl text-slate-900 mt-2">Observatório da Assistência Farmacêutica</h2>
        <p className="text-sm text-slate-600 mt-3 max-w-3xl leading-relaxed">
          Um centro de transparência de dados para profissionais de saúde, gestores e cidadãos. Reunimos informações
          sobre o acesso a medicamentos no estado, com a fonte e a data de atualização de cada dado.
        </p>
        <button
          onClick={() => onNavigate("indicadores")}
          className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg cursor-pointer"
        >
          Ver indicadores <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CARDS.map(({ id, titulo, texto, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="text-left bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 shadow-sm transition-colors cursor-pointer"
          >
            <Icon className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900 mt-3">{titulo}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{texto}</p>
          </button>
        ))}
      </section>
    </div>
  );
}
