import type { User as UsuarioFirebase } from "firebase/auth";
import { Layers, Home, Activity, FileText, Calendar, User, Heart, Map, Settings, BookOpen, BookText, Key, type LucideIcon } from "lucide-react";
import { BuscaGeral } from "./BuscaGeral";
import { PainelAcessibilidade } from "./PainelAcessibilidade";
import type { Rota } from "../lib/busca";
import type { TopNavId } from "../lib/navegacao";

const ITENS_MENU: { id: TopNavId; label: string; icon: LucideIcon }[] = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "indicadores", label: "Indicadores", icon: Activity },
  { id: "programas", label: "Programas Governamentais", icon: Map },
  { id: "educacao", label: "Educação e Repositório", icon: BookOpen },
  { id: "impacto", label: "Relatório de Impacto", icon: Heart },
  { id: "producao", label: "Produção Científica", icon: FileText },
  { id: "metodologia", label: "Metodologia e glossário", icon: BookText },
];
const ITEM_ADMIN = { id: "admin" as TopNavId, label: "Administração", icon: Settings };

interface Props {
  usuario: UsuarioFirebase | null;
  menuAtual: TopNavId;
  aoEscolherMenu: (id: TopNavId) => void;
  aoBuscar: (rota: Rota) => void;
  aoEntrar: () => void;
  aoSair: () => void;
}

// Parte fixa do topo: identidade do site, busca, acessibilidade, acesso administrativo e menu principal.
export function Cabecalho({ usuario, menuAtual, aoEscolherMenu, aoBuscar, aoEntrar, aoSair }: Props) {
  const itens = usuario ? [...ITENS_MENU, ITEM_ADMIN] : ITENS_MENU;
  return (
    <div className="lg:sticky lg:top-0 z-40">
      {/* HEADER / BRAND AREA */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 min-w-0 max-w-full">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/10">
            <Layers className="h-5 w-5 text-white stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl tracking-tight text-slate-900 flex flex-wrap items-center gap-x-2">
              Observatório da Assistência Farmacêutica
              <span className="text-[0.75rem] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/50">
                EM DESENVOLVIMENTO
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-sans">
              Transparência de dados da assistência farmacêutica no Rio Grande do Norte
            </p>
          </div>
        </div>

        {/* METADATA INFO */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
          <BuscaGeral onIr={aoBuscar} />
          <PainelAcessibilidade />
          <div className="hidden sm:block h-5 w-px bg-slate-300" />
          {usuario ? (
            <div className="flex items-center gap-2">
              {usuario.photoURL ? (
                <img
                  src={usuario.photoURL}
                  alt={usuario.displayName || "Usuário"}
                  referrerPolicy="no-referrer"
                  className="h-5 w-5 rounded-full border border-teal-500"
                />
              ) : (
                <User className="h-3.5 w-3.5 text-teal-600" />
              )}
              <span className="text-slate-700 font-medium break-all max-w-[12rem]">
                {usuario.displayName || usuario.email}
              </span>
              <button
                onClick={aoSair}
                className="text-xs font-bold text-red-700 hover:text-red-900 ml-1.5 hover:underline cursor-pointer"
                aria-label="Sair da conta"
              >
                Sair
              </button>
            </div>
          ) : (
            <button
              onClick={aoEntrar}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-bold px-3 py-1 rounded-lg text-[0.75rem] transition-all cursor-pointer shadow-sm hover:shadow"
            >
              <Key className="h-3.5 w-3.5" aria-hidden="true" />
              Acesso administrativo
            </button>
          )}
          <div className="hidden sm:block h-3 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>{new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <nav className="bg-white px-6 py-2 border-b border-slate-200 flex overflow-x-auto gap-1 scrollbar-none shadow-sm font-sans" aria-label="Navegação principal">
        {itens.map((item) => (
          <button
            key={item.id}
            onClick={() => aoEscolherMenu(item.id)}
            aria-current={menuAtual === item.id ? "page" : undefined}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap border ${
              menuAtual === item.id
                ? "bg-blue-50 text-blue-600 border-blue-100 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
