import { useEffect, useState } from "react";
import { UserPlus, Pencil, Trash2, Save, X, Users } from "lucide-react";
import {
  PAPEIS,
  PERMISSOES,
  listarUsuarios,
  permissoesDoPapel,
  removerUsuario,
  salvarUsuario,
  type Papel,
  type Usuario,
} from "../lib/perfis";

interface Props {
  emailSuper: string;
}

const emBranco = (): Usuario => ({
  email: "",
  nome: "",
  papel: "estudante",
  permissoes: permissoesDoPapel("estudante"),
  ativo: true,
  criadoEm: "",
  criadoPor: "",
});

// Painel exclusivo da super administração: cadastra usuários, define o papel e as permissões de cada um.
export function Usuarios({ emailSuper }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [form, setForm] = useState<Usuario | null>(null);
  const [editando, setEditando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = () =>
    listarUsuarios()
      .then(setUsuarios)
      .catch(() => setErro("Não foi possível carregar os usuários."));

  useEffect(() => {
    carregar();
  }, []);

  const novo = () => {
    setForm(emBranco());
    setEditando(false);
    setErro(null);
  };

  const editar = (u: Usuario) => {
    setForm({ ...u, permissoes: { ...u.permissoes } });
    setEditando(true);
    setErro(null);
  };

  const mudarPapel = (papel: Papel) => {
    if (!form) return;
    setForm({ ...form, papel, permissoes: permissoesDoPapel(papel) });
  };

  const alternar = (id: string) => {
    if (!form) return;
    const permissoes = { ...form.permissoes };
    if (permissoes[id]) delete permissoes[id];
    else permissoes[id] = true;
    setForm({ ...form, permissoes });
  };

  const salvar = async () => {
    if (!form) return;
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErro("Informe um e-mail válido.");
    if (email === emailSuper) return setErro("Essa conta já é a super administração.");
    if (!form.nome.trim()) return setErro("Informe o nome.");
    if (!editando && usuarios?.some((u) => u.email === email)) return setErro("Esse e-mail já está cadastrado. Use Editar.");
    setSalvando(true);
    setErro(null);
    try {
      await salvarUsuario({
        ...form,
        email,
        nome: form.nome.trim(),
        criadoEm: form.criadoEm || new Date().toISOString(),
        criadoPor: form.criadoPor || emailSuper,
      });
      setForm(null);
      await carregar();
    } catch {
      setErro("Não foi possível salvar. Verifique a conexão e tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const alternarAtivo = async (u: Usuario) => {
    try {
      await salvarUsuario({ ...u, ativo: !u.ativo });
      await carregar();
    } catch {
      setErro("Não foi possível alterar o status.");
    }
  };

  const remover = async (u: Usuario) => {
    if (!window.confirm(`Remover ${u.nome} (${u.email})? A pessoa perde todo o acesso de edição.`)) return;
    try {
      await removerUsuario(u.email);
      await carregar();
    } catch {
      setErro("Não foi possível remover.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" /> Usuários e permissões
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Cadastre pessoas pelo e-mail da conta Google. Cada pessoa só pode publicar os conjuntos de dados marcados para ela.
              A super administração ({emailSuper}) tem acesso total e não precisa de cadastro.
            </p>
          </div>
          <button onClick={novo} className="shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer">
            <UserPlus className="h-4 w-4" /> Novo usuário
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-600">
          {(Object.keys(PAPEIS) as Papel[]).map((p) => (
            <p key={p} className="bg-slate-50 border border-slate-100 rounded-lg p-2">
              <strong className="text-slate-800">{PAPEIS[p].rotulo}:</strong> {PAPEIS[p].descricao}
            </p>
          ))}
        </div>
        {erro && !form && <p className="text-xs text-red-600">{erro}</p>}
      </section>

      {form && (
        <section className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-sm text-slate-900">{editando ? "Editar usuário" : "Novo usuário"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-xs font-semibold text-slate-700">
              E-mail (conta Google)
              <input
                value={form.email}
                disabled={editando}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nome@exemplo.com"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs disabled:bg-slate-50"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Nome
              <input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Papel
              <select
                value={form.papel}
                onChange={(e) => mudarPapel(e.target.value as Papel)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white"
              >
                {(Object.keys(PAPEIS) as Papel[]).map((p) => (
                  <option key={p} value={p}>{PAPEIS[p].rotulo}</option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="space-y-1.5">
            <legend className="text-xs font-semibold text-slate-700">Pode publicar dados de:</legend>
            <p className="text-[11px] text-slate-500">Ao trocar o papel, as caixas voltam ao padrão do papel. Depois você pode ajustar caso a caso.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {PERMISSOES.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={!!form.permissoes[p.id]} onChange={() => alternar(p.id)} />
                  {p.rotulo}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
            Acesso ativo
          </label>

          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <button onClick={salvar} disabled={salvando} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer">
              <Save className="h-4 w-4" /> {salvando ? "Salvando…" : "Salvar"}
            </button>
            <button onClick={() => setForm(null)} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer">
              <X className="h-4 w-4" /> Cancelar
            </button>
          </div>
        </section>
      )}

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        {usuarios === null && <p className="text-xs text-slate-400">Carregando…</p>}
        {usuarios && usuarios.length === 0 && <p className="text-xs text-slate-500">Nenhum usuário cadastrado ainda.</p>}
        {usuarios && usuarios.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-mono">
                  <th className="py-2 pr-3 font-normal">Nome</th>
                  <th className="py-2 pr-3 font-normal">E-mail</th>
                  <th className="py-2 pr-3 font-normal">Papel</th>
                  <th className="py-2 pr-3 font-normal">Pode publicar</th>
                  <th className="py-2 pr-3 font-normal">Status</th>
                  <th className="py-2 font-normal text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usuarios.map((u) => (
                  <tr key={u.email} className="text-slate-700 align-top">
                    <td className="py-2.5 pr-3 font-medium">{u.nome}</td>
                    <td className="py-2.5 pr-3">{u.email}</td>
                    <td className="py-2.5 pr-3">{PAPEIS[u.papel]?.rotulo ?? u.papel}</td>
                    <td className="py-2.5 pr-3 text-slate-500">
                      {PERMISSOES.filter((p) => u.permissoes?.[p.id]).map((p) => p.rotulo.split(" (")[0]).join(", ") || "—"}
                    </td>
                    <td className="py-2.5 pr-3">
                      <button onClick={() => alternarAtivo(u)} className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${u.ativo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`} title="Clique para alternar">
                        {u.ativo ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => editar(u)} className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer" title="Editar"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remover(u)} className="p-1 text-slate-500 hover:text-red-600 cursor-pointer" title="Remover"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
