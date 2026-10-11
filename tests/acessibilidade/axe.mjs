import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const base = process.argv[2] || "https://observatorio-rn.web.app/";
const modo = process.argv[3] || "padrao"; // "padrao" ou "contraste"
const b = await chromium.launch();

const paginas = [
  ["inicio", async () => {}],
  ["indicadores-visao", async (p) => p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Indicadores" }).click()],
  ["comparador", async (p) => { await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Indicadores" }).click(); await p.getByRole("button", { name: "Comparador territorial" }).first().click(); await p.waitForSelector("text=Dados dos municípios", { timeout: 20000 }); }],
  ["alertas", async (p) => { await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Indicadores" }).click(); await p.getByRole("button", { name: "Alertas sanitários" }).first().click(); }],
  ["programas", async (p) => p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Programas Governamentais" }).click()],
  ["repositorio", async (p) => p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Educação e Repositório" }).click()],
  ["producao", async (p) => p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Produção Científica" }).click()],
  ["chat", async (p) => p.getByRole("button", { name: "Abrir o assistente de perguntas" }).click()],
];

const resumo = {};
for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 800 }]) {
  const ctx = await b.newContext({ viewport });
  for (const [nome, acao] of paginas) {
    const p = await ctx.newPage();
    await p.goto(base, { waitUntil: "load" });
    await p.waitForSelector("text=Estado dos dados", { timeout: 30000 });
    if (modo === "contraste") await p.evaluate(() => localStorage.setItem("acessibilidade", JSON.stringify({ altoContraste: true }))).then(() => p.reload({ waitUntil: "load" })).then(() => p.waitForSelector("text=Estado dos dados", { timeout: 30000 }));
    try { await acao(p); } catch (e) { console.log("ação falhou:", nome, e.message.split("\n")[0]); }
    await p.waitForTimeout(1500);
    const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
    for (const v of r.violations) {
      const k = `${v.id} [${v.impact}]`;
      resumo[k] ??= { descricao: v.help, ocorrencias: 0, exemplos: new Set(), paginas: new Set() };
      resumo[k].ocorrencias += v.nodes.length;
      resumo[k].paginas.add(`${nome}@${viewport.width}`);
      for (const n of v.nodes.slice(0, 2)) resumo[k].exemplos.add(n.target.join(" ").slice(0, 90));
    }
    await p.close();
  }
  await ctx.close();
}
await b.close();
const ordem = { critical: 0, serious: 1, moderate: 2, minor: 3 };
const linhas = Object.entries(resumo).sort((a, b) => ordem[a[0].match(/\[(\w+)\]/)[1]] - ordem[b[0].match(/\[(\w+)\]/)[1]]);
for (const [k, v] of linhas) console.log(`\n${k}: ${v.descricao}\n  ocorrências: ${v.ocorrencias} | páginas: ${[...v.paginas].slice(0, 6).join(", ")}${v.paginas.size > 6 ? "…" : ""}\n  ex.: ${[...v.exemplos].slice(0, 3).join(" ; ")}`);
console.log(linhas.length === 0 ? "\nSem violações." : `\nTotal de regras violadas: ${linhas.length}`);
