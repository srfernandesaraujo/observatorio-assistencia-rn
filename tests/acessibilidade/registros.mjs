import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

// Uso: node registros.mjs <url> [pasta-de-capturas]   (a URL precisa ter a rota /api: servidor local ou site publicado)
const base = process.argv[2] || "https://observatorio-rn.web.app/";
const pasta = process.argv[3];
let falhas = 0;
const ok = (cond, msg) => { console.log(cond ? "OK   " : "FALHA", msg); if (!cond) falhas++; };
const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"];

const b = await chromium.launch();
for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 800 }]) {
  const rotulo = `${viewport.width}px`;
  const ctx = await b.newContext({ viewport });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "load" });
  await p.waitForSelector("text=Estado dos dados", { timeout: 30000 });
  await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Indicadores" }).click();
  await p.getByRole("button", { name: "Registros de medicamentos (Anvisa)" }).first().click();
  ok(/Registros de medicamentos/.test(await p.title()), `${rotulo}: título da aba (${await p.title()})`);

  await p.fill("#reg-busca", "losartana");
  await p.waitForSelector("table", { timeout: 90000 });
  const linhas = await p.locator("table tbody tr").count();
  ok(linhas > 0, `${rotulo}: tabela com resultados (${linhas} linhas)`);
  const numeros = await p.locator("table tbody tr td:nth-child(5)").allTextContents();
  ok(new Set(numeros).size === numeros.length, `${rotulo}: um resultado por número de registro`);
  ok(await p.getByText(/Ter registro não significa/).isVisible(), `${rotulo}: aviso de que registro não é disponibilidade`);
  ok(await p.getByText(/Arquivo da Anvisa de \d{2}\/\d{2}\/\d{4}/).isVisible(), `${rotulo}: data do arquivo na fonte`);

  await p.selectOption("#reg-situacao", "Ativo");
  await p.waitForTimeout(1500);
  const sit = await p.locator("table tbody tr td:nth-child(4)").allTextContents();
  ok(sit.length > 0 && sit.every((t) => t.trim().startsWith("Ativo")), `${rotulo}: filtro Situação = Ativo (${sit.length} linhas)`);
  await p.selectOption("#reg-situacao", "");
  await p.selectOption("#reg-categoria", "Genérico");
  await p.waitForTimeout(1500);
  const cat = await p.locator("table tbody tr td:nth-child(3)").allTextContents();
  ok(cat.length > 0 && cat.every((t) => t.trim() === "Genérico"), `${rotulo}: filtro Categoria = Genérico (${cat.length} linhas)`);
  await p.selectOption("#reg-categoria", "");

  await p.fill("#reg-busca", "xyzzyqq");
  await p.waitForSelector("text=Nenhum registro encontrado", { timeout: 20000 });
  ok(true, `${rotulo}: mensagem de sem resultado`);

  await p.fill("#reg-busca", "dipirona");
  await p.waitForSelector("table", { timeout: 20000 });
  if (pasta) await p.screenshot({ path: `${pasta}/registros-${rotulo}.png` });
  const larg = await p.evaluate(() => document.documentElement.scrollWidth);
  ok(larg <= viewport.width + 1, `${rotulo}: sem rolagem horizontal da página (${larg}px)`);
  const r = await new AxeBuilder({ page: p }).withTags(tags).analyze();
  ok(r.violations.length === 0, `${rotulo}: axe sem violações ${r.violations.map((v) => v.id + "(" + v.nodes.length + ")").join(",")}`);

  // Busca geral
  const campo = p.getByRole("searchbox", { name: "Buscar no site" });
  await campo.fill("registro anvisa");
  await p.waitForTimeout(400);
  ok(await p.locator("#busca-resultados").getByText("Registros de medicamentos (Anvisa)").first().isVisible(), `${rotulo}: busca geral acha a seção`);

  // Alto contraste
  await p.evaluate(() => localStorage.setItem("acessibilidade", JSON.stringify({ altoContraste: true })));
  await p.reload({ waitUntil: "load" });
  await p.waitForSelector("text=Estado dos dados", { timeout: 30000 });
  await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Indicadores" }).click();
  await p.getByRole("button", { name: "Registros de medicamentos (Anvisa)" }).first().click();
  await p.fill("#reg-busca", "dipirona");
  await p.waitForSelector("table", { timeout: 30000 });
  const rc = await new AxeBuilder({ page: p }).withTags(tags).analyze();
  ok(rc.violations.length === 0, `${rotulo}: alto contraste, axe sem violações ${rc.violations.map((v) => v.id).join(",")}`);
  await ctx.close();
}
await b.close();
console.log(falhas ? `${falhas} falha(s)` : "Tudo certo");
process.exit(falhas ? 1 : 0);
