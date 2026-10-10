import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { TEMPLATES } from "./templates";

// A conta de super administração é fixa (também nas regras do Firestore): ela cadastra os demais usuários.
export const SUPER_ADMIN_EMAIL = "srfernandesaraujo@gmail.com";

// Cada permissão é o direito de publicar um conjunto de dados (id do conjunto).
export type Permissao = string;
export const PERMISSOES: { id: Permissao; rotulo: string }[] = TEMPLATES.map((t) => ({ id: t.id, rotulo: t.titulo }));
export const IDS_PERMISSAO = PERMISSOES.map((p) => p.id);

export type Papel = "admin" | "professor" | "estudante";

// Conjuntos iniciais de permissões por papel. Podem ser ajustados usuário a usuário.
export const PAPEIS: Record<Papel, { rotulo: string; descricao: string; permissoes: Permissao[] }> = {
  admin: {
    rotulo: "Administrador",
    descricao: "Publica todos os conjuntos de dados.",
    permissoes: [...IDS_PERMISSAO],
  },
  professor: {
    rotulo: "Professor",
    descricao: "Publica produção científica, custos e judicialização.",
    permissoes: ["producao_cientifica", "custos", "judicializacao"],
  },
  estudante: {
    rotulo: "Estudante",
    descricao: "Publica apenas produção científica.",
    permissoes: ["producao_cientifica"],
  },
};

export interface Usuario {
  email: string; // minúsculas; é o id do documento
  nome: string;
  papel: Papel;
  permissoes: Record<string, boolean>;
  ativo: boolean;
  criadoEm: string;
  criadoPor: string;
}

export interface Perfil {
  superadmin: boolean;
  papel: Papel | "superadmin" | null;
  nome: string;
  permissoes: Set<Permissao>;
}

export const SEM_PERFIL: Perfil = { superadmin: false, papel: null, nome: "", permissoes: new Set() };

export function podeEditar(perfil: Perfil | null, permissao: Permissao): boolean {
  return !!perfil && (perfil.superadmin || perfil.permissoes.has(permissao));
}

export function temAlgumAcesso(perfil: Perfil | null): boolean {
  return !!perfil && (perfil.superadmin || perfil.permissoes.size > 0);
}

export async function lerPerfil(email: string | null | undefined): Promise<Perfil> {
  if (!email) return SEM_PERFIL;
  const e = email.toLowerCase();
  if (e === SUPER_ADMIN_EMAIL) {
    return { superadmin: true, papel: "superadmin", nome: "Super administração", permissoes: new Set(IDS_PERMISSAO) };
  }
  try {
    const snap = await getDoc(doc(db, "users", e));
    if (!snap.exists()) return SEM_PERFIL;
    const u = snap.data() as Usuario;
    if (!u.ativo) return SEM_PERFIL;
    const permissoes = new Set(Object.entries(u.permissoes || {}).filter(([k, v]) => v && IDS_PERMISSAO.includes(k)).map(([k]) => k));
    return { superadmin: false, papel: u.papel, nome: u.nome, permissoes };
  } catch {
    return SEM_PERFIL;
  }
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => d.data() as Usuario).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function salvarUsuario(u: Usuario): Promise<void> {
  await setDoc(doc(db, "users", u.email), u);
}

export async function removerUsuario(email: string): Promise<void> {
  await deleteDoc(doc(db, "users", email));
}

export function permissoesDoPapel(papel: Papel): Record<string, boolean> {
  return Object.fromEntries(PAPEIS[papel].permissoes.map((p) => [p, true]));
}
