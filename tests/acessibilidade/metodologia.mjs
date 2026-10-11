import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

// Uso: node metodologia.mjs <url> [pasta-de-capturas]
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

  // Pelo menu superior
  await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Metodologia e glossário" }).click();
  ok(/Metodologia e glossário/.test(await p.title()), `${rotulo}: título da aba (${await p.title()})`);
  for (const h of ["Princípios", "De onde vêm os dados", "Como ler os dados", "Limites e cuidados", "Glossário"]) {
    ok(await p.getByRole("heading", { name: h, exact: true }).isVisible(), `${rotulo}: seção "${h}"`);
  }
  ok((await p.locator("#met-fontes table tbody tr").count()) >= 5, `${rotulo}: quadro de fontes com linhas`);

  // Âncora "Glossário" leva à seção
  await p.getByRole("navigation", { name: "Nesta página" }).getByRole("link", { name: "Glossário" }).click();
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => { const r = document.getElementById("met-glossario").getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; }), `${rotulo}: link interno leva ao glossário`);

  // Filtro do glossário
  const total = await p.locator("#met-glossario dt").count();
  await p.fill("#glossario-filtro", "preço");
  await p.waitForTimeout(200);
  const filtrados = await p.locator("#met-glossario dt").count();
  ok(total >= 25 && filtrados > 0 && filtrados < total, `${rotulo}: filtro reduz ${total} -> ${filtrados} termos`);
  await p.fill("#glossario-filtro", "xyzzyqq");
  ok(await p.getByText("Nenhum termo encontrado.").isVisible(), `${rotulo}: filtro sem resultado`);
  await p.fill("#glossario-filtro", "");

  if (pasta) await p.screenshot({ path: `${pasta}/metodologia-${rotulo}.png` });
  const larg = await p.evaluate(() => document.documentElement.scrollWidth);
  ok(larg <= viewport.width + 1, `${rotulo}: sem rolagem horizontal da página (${larg}px)`);
  const r = await new AxeBuilder({ page: p }).withTags(tags).analyze();
  ok(r.violations.length === 0, `${rotulo}: axe sem violações ${r.violations.map((v) => v.id + "(" + v.nodes.length + ")").join(",")}`);

  // Busca geral acha termo do glossário e leva à página
  await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Início" }).click();
  const campo = p.getByRole("searchbox", { name: "Buscar no site" });
  await campo.fill("CEAF");
  await p.waitForTimeout(400);
  const painel = p.locator("#busca-resultados");
  ok(await painel.getByText("Glossário", { exact: true }).first().isVisible(), `${rotulo}: busca geral acha termo do glossário`);
  await painel.locator("li", { hasText: "Glossário" }).first().getByRole("button", { name: "Ir para a seção" }).click();
  await p.waitForTimeout(400);
  ok(/Metodologia e glossário/.test(await p.title()), `${rotulo}: busca leva à página (${await p.title()})`);

  // Link no rodapé
  await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Início" }).click();
  await p.locator("footer").getByRole("button", { name: "Metodologia e glossário" }).click();
  ok(/Metodologia e glossário/.test(await p.title()), `${rotulo}: link do rodapé`);

  // Alto contraste
  await p.evaluate(() => localStorage.setItem("acessibilidade", JSON.stringify({ altoContraste: true })));
  await p.reload({ waitUntil: "load" });
  await p.waitForSelector("text=Estado dos dados", { timeout: 30000 });
  await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Metodologia e glossário" }).click();
  await p.waitForTimeout(300);
  const rc = await new AxeBuilder({ page: p }).withTags(tags).analyze();
  ok(rc.violations.length === 0, `${rotulo}: alto contraste, axe sem violações ${rc.violations.map((v) => v.id).join(",")}`);
  await ctx.close();
}
await b.close();
console.log(falhas ? `${falhas} falha(s)` : "Tudo certo");
process.exit(falhas ? 1 : 0);
