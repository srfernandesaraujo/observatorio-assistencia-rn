import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

// Ferramenta para refatorações sem mudança visual: guarda o HTML, o título e o foco de cada tela (desktop e celular).
// Uso: node snapshot.mjs <url> <saida.json> antes e depois da mudança (rodando um build: npm run build; npx vite preview --port 4173),
// depois node comparar-snapshot.mjs antes.json depois.json. Duas fotos do mesmo código devem ser idênticas.
const [, , url, saida] = process.argv;
const nav = (p) => p.locator("nav[aria-label='Navegação principal']");
const telas = [
  ["inicio", async () => {}],
  ["producao", async (p) => nav(p).getByRole("button", { name: "Produção Científica" }).click()],
  ["programas", async (p) => nav(p).getByRole("button", { name: "Programas Governamentais" }).click()],
  ["repositorio", async (p) => nav(p).getByRole("button", { name: "Educação e Repositório" }).click()],
  ["impacto", async (p) => nav(p).getByRole("button", { name: "Relatório de Impacto" }).click()],
  ["metodologia", async (p) => nav(p).getByRole("button", { name: "Metodologia e glossário" }).click()],
  ...["Visão geral", "Comparador territorial", "Desabastecimento e pregões", "Alertas sanitários", "Preços de medicamentos (CMED)", "Registros de medicamentos (Anvisa)", "Custos e orçamento", "Judicialização", "Qualidade dos serviços", "ATS", "Dados abertos"].map((nome) => [
    "ind-" + nome,
    async (p) => { await nav(p).getByRole("button", { name: "Indicadores" }).click(); await p.locator("nav[aria-label='Seções de indicadores']").getByRole("button", { name: nome, exact: true }).click(); },
  ]),
  ["chat", async (p) => p.getByRole("button", { name: "Abrir o assistente de perguntas" }).click()],
  ["busca", async (p) => { await p.getByRole("searchbox", { name: "Buscar no site" }).fill("alertas"); }],
  ["atalho-landing", async (p) => p.getByRole("button", { name: /Onde consigo meu medicamento/ }).click()],
  ["rodape", async (p) => p.locator("footer").getByRole("button", { name: "Metodologia e glossário" }).click()],
];

const b = await chromium.launch();
const resultado = {};
for (const largura of [1366, 390]) {
  const ctx = await b.newContext({ viewport: { width: largura, height: 900 } });
  for (const [nome, acao] of telas) {
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: "load" });
    await p.waitForSelector("text=Estado dos dados", { timeout: 30000 });
    await acao(p);
    await p.waitForTimeout(2500);
    const info = await p.evaluate(() => ({
      html: document.body.innerHTML.replace(/<script[\s\S]*?<\/script>/g, "").replace(/id="[^"]*(:r[0-9a-z]+:|«)[^"]*"/g, ""),
      titulo: document.title,
      foco: document.activeElement ? document.activeElement.tagName + "#" + (document.activeElement.id || "") + "." + (document.activeElement.getAttribute("aria-label") || "") : "",
    }));
    resultado[`${largura}/${nome}`] = info;
    await p.close();
  }
  await ctx.close();
}
await b.close();
writeFileSync(saida, JSON.stringify(resultado));
console.log("telas fotografadas:", Object.keys(resultado).length);
