import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

// Uso: node cmed.mjs <url> [pasta-de-capturas]   (a URL precisa ter a rota /api: servidor local ou site publicado)
const base = process.argv[2] || "https://observatorio-rn.web.app/";
const pasta = process.argv[3];
let falhas = 0;
const ok = (cond, msg) => { console.log(cond ? "OK   " : "FALHA", msg); if (!cond) falhas++; };

const b = await chromium.launch();
for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 800 }]) {
  const rotulo = `${viewport.width}px`;
  const ctx = await b.newContext({ viewport });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "load" });
  await p.waitForSelector("text=Estado dos dados", { timeout: 30000 });
  await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Indicadores" }).click();
  await p.getByRole("button", { name: "Preços de medicamentos (CMED)" }).first().click();
  ok(/CMED/.test(await p.title()), `${rotulo}: título da aba (${await p.title()})`);

  await p.fill("#cmed-busca", "losartana 50 mg");
  await p.waitForSelector("table", { timeout: 60000 });
  const linhas = await p.locator("table tbody tr").count();
  ok(linhas > 0, `${rotulo}: tabela com resultados (${linhas} linhas)`);
  ok(await p.getByText(/R\$\s?\d/).first().isVisible(), `${rotulo}: preços em reais`);
  ok(await p.getByText(/Arquivo da Anvisa de \d{2}\/\d{2}\/\d{4}/).isVisible(), `${rotulo}: data do arquivo na fonte`);

  await p.selectOption("#cmed-tipo", "Similar");
  await p.waitForTimeout(1500);
  const tipos = await p.locator("table tbody tr td:nth-child(4)").allTextContents();
  ok(tipos.length > 0 && tipos.every((t) => t.trim() === "Similar"), `${rotulo}: filtro por tipo (${new Set(tipos).size} tipo(s))`);
  await p.selectOption("#cmed-tipo", "");

  await p.fill("#cmed-busca", "xyzzyqq");
  await p.waitForSelector("text=Nenhum medicamento encontrado", { timeout: 20000 });
  ok(true, `${rotulo}: mensagem de sem resultado`);

  await p.fill("#cmed-busca", "dipirona");
  await p.waitForSelector("table", { timeout: 20000 });
  if (pasta) await p.screenshot({ path: `${pasta}/cmed-${rotulo}.png`, fullPage: false });
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  ok(r.violations.length === 0, `${rotulo}: axe sem violações ${r.violations.map((v) => v.id + "(" + v.nodes.length + ")").join(",")}`);
  const larguraPagina = await p.evaluate(() => document.documentElement.scrollWidth);
  ok(larguraPagina <= viewport.width + 1, `${rotulo}: sem rolagem horizontal da página (${larguraPagina}px)`);

  // Alto contraste
  await p.evaluate(() => localStorage.setItem("acessibilidade", JSON.stringify({ altoContraste: true })));
  await p.reload({ waitUntil: "load" });
  await p.waitForSelector("text=Estado dos dados", { timeout: 30000 });
  await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Indicadores" }).click();
  await p.getByRole("button", { name: "Preços de medicamentos (CMED)" }).first().click();
  await p.fill("#cmed-busca", "dipirona");
  await p.waitForSelector("table", { timeout: 20000 });
  const rc = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  ok(rc.violations.length === 0, `${rotulo}: alto contraste, axe sem violações ${rc.violations.map((v) => v.id).join(",")}`);
  await ctx.close();
}
await b.close();
console.log(falhas ? `${falhas} falha(s)` : "Tudo certo");
process.exit(falhas ? 1 : 0);
