import fs from "fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";

const rules = fs.readFileSync(process.env.RULES_PATH, "utf8");
const env = await initializeTestEnvironment({ projectId: "demo-observatorio", firestore: { rules, host: "127.0.0.1", port: 8080 } });

const usuario = (email, papel, permissoes, ativo = true) => ({
  email, nome: "Fulano", papel, permissoes, ativo, criadoEm: "2026-10-10", criadoPor: "srfernandesaraujo@gmail.com",
});

await env.withSecurityRulesDisabled(async (ctx) => {
  const d = ctx.firestore();
  await setDoc(doc(d, "users", "admin@teste.com"), usuario("admin@teste.com", "admin", { custos: true, pregoes: true, desabastecimento: true, judicializacao: true, producao_cientifica: true, alertas_sanitarios: true, indicadores_municipais: true, municipios_regioes: true, repositorio_documentos: true }));
  await setDoc(doc(d, "users", "estudante@teste.com"), usuario("estudante@teste.com", "estudante", { producao_cientifica: true }));
  await setDoc(doc(d, "users", "inativo@teste.com"), usuario("inativo@teste.com", "admin", { custos: true }, false));
});

const ctxDe = (uid, email, verificado = true) => env.authenticatedContext(uid, { email, email_verified: verificado }).firestore();
const anon = env.unauthenticatedContext().firestore();
const superAdm = ctxDe("s", "SrFernandesAraujo@gmail.com");
const superNaoVerificado = ctxDe("s2", "srfernandesaraujo@gmail.com", false);
const admin = ctxDe("a", "admin@teste.com");
const estudante = ctxDe("e", "estudante@teste.com");
const inativo = ctxDe("i", "inativo@teste.com");
const estranho = ctxDe("x", "estranho@teste.com");

const meta = (id, email, over = {}) => ({
  templateId: id, versao: 1, fonte: "SESAP-RN", urlFonte: "", periodo: "2025", metodo: "planilha",
  totalLinhas: 2, blocos: 1, atualizadoEm: "2026-10-10T00:00:00.000Z", publicadoPor: email, ...over,
});
const novoUsuario = (over = {}) => usuario("novo@teste.com", "professor", { custos: true }, true) && { ...usuario("novo@teste.com", "professor", { custos: true }), ...over };

let falhas = 0;
async function t(nome, fn) {
  try { await fn(); console.log("OK   " + nome); } catch (e) { falhas++; console.log("FALHA " + nome + " - " + e.message.split("\n")[0]); }
}

// Leitura pública
await t("anônimo lê dataset", () => assertSucceeds(getDoc(doc(anon, "datasets", "custos"))));
await t("anônimo lê blocos", () => assertSucceeds(getDocs(collection(anon, "datasets", "custos", "chunks"))));
await t("anônimo NÃO escreve dataset", () => assertFails(setDoc(doc(anon, "datasets", "custos"), meta("custos", "x@x.com"))));

// Permissões por conjunto
await t("admin publica custos", () => assertSucceeds(setDoc(doc(admin, "datasets", "custos"), meta("custos", "admin@teste.com"))));
await t("admin grava bloco", () => assertSucceeds(setDoc(doc(admin, "datasets", "custos", "chunks", "1_0"), { versao: 1, indice: 0, linhas: [{ ano: 2025 }] })));
await t("admin apaga bloco antigo", () => assertSucceeds(deleteDoc(doc(admin, "datasets", "custos", "chunks", "1_0"))));
await t("admin NÃO apaga dataset", () => assertFails(deleteDoc(doc(admin, "datasets", "custos"))));
await t("estudante publica produção científica", () => assertSucceeds(setDoc(doc(estudante, "datasets", "producao_cientifica"), meta("producao_cientifica", "estudante@teste.com"))));
await t("estudante NÃO publica custos", () => assertFails(setDoc(doc(estudante, "datasets", "custos"), meta("custos", "estudante@teste.com"))));
await t("estudante NÃO grava bloco de custos", () => assertFails(setDoc(doc(estudante, "datasets", "custos", "chunks", "1_0"), { linhas: [] })));
await t("usuário inativo NÃO publica", () => assertFails(setDoc(doc(inativo, "datasets", "custos"), meta("custos", "inativo@teste.com"))));
await t("quem não está cadastrado NÃO publica", () => assertFails(setDoc(doc(estranho, "datasets", "custos"), meta("custos", "estranho@teste.com"))));
await t("e-mail não verificado NÃO publica", () => assertFails(setDoc(doc(ctxDe("n", "admin@teste.com", false), "datasets", "custos"), meta("custos", "admin@teste.com"))));
await t("super publica qualquer conjunto", () => assertSucceeds(setDoc(doc(superAdm, "datasets", "pregoes"), meta("pregoes", "srfernandesaraujo@gmail.com"))));
await t("super com e-mail não verificado NÃO publica", () => assertFails(setDoc(doc(superNaoVerificado, "datasets", "pregoes"), meta("pregoes", "srfernandesaraujo@gmail.com"))));
await t("NÃO falsifica publicadoPor", () => assertFails(setDoc(doc(admin, "datasets", "custos"), meta("custos", "fulano@x.com"))));
await t("NÃO publica sem fonte", () => assertFails(setDoc(doc(admin, "datasets", "custos"), meta("custos", "admin@teste.com", { fonte: "" }))));
await t("NÃO publica mais de 5000 linhas", () => assertFails(setDoc(doc(admin, "datasets", "custos"), meta("custos", "admin@teste.com", { totalLinhas: 5001 }))));
await t("NÃO grava bloco com mais de 400 linhas", () => assertFails(setDoc(doc(admin, "datasets", "custos", "chunks", "2_0"), { versao: 2, indice: 0, linhas: Array.from({ length: 401 }, () => ({})) })));

// Cadastro de usuários
await t("super cadastra usuário", () => assertSucceeds(setDoc(doc(superAdm, "users", "novo@teste.com"), novoUsuario())));
await t("super lista usuários", () => assertSucceeds(getDocs(collection(superAdm, "users"))));
await t("super altera usuário", () => assertSucceeds(setDoc(doc(superAdm, "users", "novo@teste.com"), novoUsuario({ ativo: false }))));
await t("super remove usuário", () => assertSucceeds(deleteDoc(doc(superAdm, "users", "novo@teste.com"))));
await t("admin NÃO cadastra usuário", () => assertFails(setDoc(doc(admin, "users", "novo@teste.com"), novoUsuario())));
await t("admin NÃO se promove", () => assertFails(setDoc(doc(admin, "users", "admin@teste.com"), usuario("admin@teste.com", "admin", { custos: true, pregoes: true, desabastecimento: true, judicializacao: true, producao_cientifica: true, usuarios: true }))));
await t("estudante NÃO edita o próprio cadastro", () => assertFails(setDoc(doc(estudante, "users", "estudante@teste.com"), usuario("estudante@teste.com", "estudante", { custos: true }))));
await t("usuário lê o próprio cadastro", () => assertSucceeds(getDoc(doc(estudante, "users", "estudante@teste.com"))));
await t("usuário NÃO lê cadastro de outro", () => assertFails(getDoc(doc(estudante, "users", "admin@teste.com"))));
await t("usuário NÃO lista cadastros", () => assertFails(getDocs(collection(admin, "users"))));
await t("anônimo NÃO lê cadastro", () => assertFails(getDoc(doc(anon, "users", "admin@teste.com"))));
await t("super NÃO cria papel inválido", () => assertFails(setDoc(doc(superAdm, "users", "novo@teste.com"), novoUsuario({ papel: "superadmin" }))));
await t("super NÃO cria permissão desconhecida", () => assertFails(setDoc(doc(superAdm, "users", "novo@teste.com"), novoUsuario({ permissoes: { usuarios: true } }))));
await t("super NÃO cria e-mail com maiúsculas", () => assertFails(setDoc(doc(superAdm, "users", "Novo@Teste.com"), { ...novoUsuario(), email: "Novo@Teste.com" })));
await t("super cadastra usuário com permissão de alertas", () => assertSucceeds(setDoc(doc(superAdm, "users", "novo@teste.com"), novoUsuario({ permissoes: { alertas_sanitarios: true } }))));
await t("admin com permissão publica alertas", () => assertSucceeds(setDoc(doc(admin, "datasets", "alertas_sanitarios"), meta("alertas_sanitarios", "admin@teste.com"))));
await t("coleção desconhecida negada", () => assertFails(getDoc(doc(superAdm, "qualquer", "x"))));

await env.cleanup();
console.log(falhas === 0 ? "\nTodos os testes passaram." : `\n${falhas} teste(s) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
