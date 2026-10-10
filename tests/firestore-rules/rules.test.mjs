import fs from "fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";

const rules = fs.readFileSync(process.env.RULES_PATH, "utf8");
const env = await initializeTestEnvironment({ projectId: "demo-observatorio", firestore: { rules, host: "127.0.0.1", port: 8080 } });

await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), "admins", "admin@teste.com"), { criadoEm: "2026-10-10" });
});

const anon = env.unauthenticatedContext().firestore();
const admin = env.authenticatedContext("u1", { email: "Admin@Teste.com", email_verified: true }).firestore();
const adminNaoVerificado = env.authenticatedContext("u2", { email: "admin@teste.com", email_verified: false }).firestore();
const outro = env.authenticatedContext("u3", { email: "outro@teste.com", email_verified: true }).firestore();

const meta = (over = {}) => ({
  templateId: "custos", versao: 1, fonte: "SESAP-RN", urlFonte: "", periodo: "2025", metodo: "planilha",
  totalLinhas: 2, blocos: 1, atualizadoEm: "2026-10-10T00:00:00.000Z", publicadoPor: "admin@teste.com", ...over,
});

let falhas = 0;
async function t(nome, fn) {
  try { await fn(); console.log("OK  ", nome); } catch (e) { falhas++; console.log("FALHA", nome, "-", e.message.split("\n")[0]); }
}

await t("anônimo lê dataset", () => assertSucceeds(getDoc(doc(anon, "datasets", "custos"))));
await t("anônimo lê blocos", () => assertSucceeds(getDocs(collection(anon, "datasets", "custos", "chunks"))));
await t("anônimo NÃO escreve dataset", () => assertFails(setDoc(doc(anon, "datasets", "custos"), meta())));
await t("admin escreve dataset", () => assertSucceeds(setDoc(doc(admin, "datasets", "custos"), meta())));
await t("admin escreve bloco", () => assertSucceeds(setDoc(doc(admin, "datasets", "custos", "chunks", "1_0"), { versao: 1, indice: 0, linhas: [{ ano: 2025 }] })));
await t("admin apaga bloco antigo", () => assertSucceeds(deleteDoc(doc(admin, "datasets", "custos", "chunks", "1_0"))));
await t("admin NÃO apaga dataset", () => assertFails(deleteDoc(doc(admin, "datasets", "custos"))));
await t("admin com e-mail não verificado NÃO escreve", () => assertFails(setDoc(doc(adminNaoVerificado, "datasets", "custos"), meta())));
await t("usuário comum NÃO escreve", () => assertFails(setDoc(doc(outro, "datasets", "custos"), meta({ publicadoPor: "outro@teste.com" }))));
await t("admin NÃO falsifica publicadoPor", () => assertFails(setDoc(doc(admin, "datasets", "custos"), meta({ publicadoPor: "fulano@x.com" }))));
await t("admin NÃO publica sem fonte", () => assertFails(setDoc(doc(admin, "datasets", "custos"), meta({ fonte: "" }))));
await t("admin NÃO publica mais de 5000 linhas", () => assertFails(setDoc(doc(admin, "datasets", "custos"), meta({ totalLinhas: 5001 }))));
await t("admin NÃO grava bloco com mais de 400 linhas", () => assertFails(setDoc(doc(admin, "datasets", "custos", "chunks", "2_0"), { versao: 2, indice: 0, linhas: Array.from({ length: 401 }, () => ({})) })));
await t("admin lê o próprio cadastro", () => assertSucceeds(getDoc(doc(admin, "admins", "admin@teste.com"))));
await t("usuário comum NÃO lê cadastro de outro", () => assertFails(getDoc(doc(outro, "admins", "admin@teste.com"))));
await t("anônimo NÃO lê cadastro", () => assertFails(getDoc(doc(anon, "admins", "admin@teste.com"))));
await t("admin NÃO escreve em /admins", () => assertFails(setDoc(doc(admin, "admins", "novo@teste.com"), { x: 1 })));
await t("coleção desconhecida negada", () => assertFails(getDoc(doc(admin, "qualquer", "x"))));

await env.cleanup();
console.log(falhas === 0 ? "\nTodos os testes passaram." : `\n${falhas} teste(s) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
