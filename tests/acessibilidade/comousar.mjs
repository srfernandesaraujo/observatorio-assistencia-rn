import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

// Uso: node comousar.mjs <url> [pasta-de-capturas]
const base = (process.argv[2] || "https://observatorio-rn.web.app/").replace(/\/+$/, "");
const pasta = process.argv[3];
let falhas = 0;
const ok = (cond, msg) => { console.log(cond ? "OK   " : "FALHA", msg); if (!cond) falhas++; };
const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"];
const nav = (p) => p.locator("nav[aria-label='Navegação principal']");

// Percorre a página para o carregamento preguiçoso das imagens acontecer
async function rolarTudo(p) {
  const altura = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < altura; y += 500) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(60); }
  await p.waitForTimeout(800);
  await p.evaluate(() => window.scrollTo(0, 0));
}

const b = await chromium.launch();
for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 800 }]) {
  const rotulo = `${viewport.width}px`;
  const ctx = await b.newContext({ viewport });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForSelector("text=Estado dos dados", { timeout: 30000 });

  // Pelo menu
  await nav(p).getByRole("button", { name: "Como usar" }).click();
  ok(/Como usar/.test(await p.title()), `${rotulo}: título da aba (${await p.title()})`);
  ok(new URL(p.url()).pathname === "/como-usar", `${rotulo}: endereço vira /como-usar (${new URL(p.url()).pathname})`);
  ok((await p.locator("main section[id]").count()) >= 14, `${rotulo}: etapas, lista de conferência e dúvidas presentes`);
  ok((await p.locator("main h3").count()) >= 14, `${rotulo}: títulos das seções`);

  // Imagens: todas com alt e carregadas
  await rolarTudo(p);
  const imgs = await p.$$eval("main img", (els) => els.map((i) => ({ alt: i.alt.length, ok: i.complete && i.naturalWidth > 0, src: i.src.split("/").pop() })));
  ok(imgs.length === 14, `${rotulo}: 14 capturas de tela na página (${imgs.length})`);
  ok(imgs.every((i) => i.alt > 20), `${rotulo}: todas as imagens com texto alternativo`);
  ok(imgs.every((i) => i.ok), `${rotulo}: todas as imagens carregaram ${imgs.filter((i) => !i.ok).map((i) => i.src).join(",")}`);

  // Índice leva à seção
  const indice = p.getByRole("navigation", { name: "Nesta página" });
  await indice.getByRole("link", { name: /Dúvidas frequentes/ }).click();
  await p.waitForTimeout(400);
  ok(await p.evaluate(() => { const r = document.getElementById("duvidas").getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; }), `${rotulo}: link do índice leva a Dúvidas frequentes`);

  // Pergunta frequente abre
  const pergunta = p.locator("#duvidas summary").first();
  await pergunta.click();
  ok(await p.locator("#duvidas details").first().evaluate((d) => d.open), `${rotulo}: pergunta frequente abre`);

  // Botão de imprimir existe e o modo de impressão esconde menu e rodapé
  ok(await p.getByRole("button", { name: /Imprimir/ }).isVisible(), `${rotulo}: botão Imprimir ou salvar em PDF`);
  await p.emulateMedia({ media: "print" });
  ok(!(await p.locator("header").first().isVisible()) && !(await p.locator("footer").isVisible()), `${rotulo}: impressão sem cabeçalho nem rodapé`);
  await p.emulateMedia({ media: "screen" });

  if (pasta) await p.screenshot({ path: `${pasta}/comousar-${rotulo}.png` });
  const larg = await p.evaluate(() => document.documentElement.scrollWidth);
  ok(larg <= viewport.width + 1, `${rotulo}: sem rolagem horizontal da página (${larg}px)`);
  const r = await new AxeBuilder({ page: p }).withTags(tags).analyze();
  ok(r.violations.length === 0, `${rotulo}: axe sem violações ${r.violations.map((v) => v.id + "(" + v.nodes.length + ")").join(",")}`);

  // Sair da página devolve o endereço para /
  await nav(p).getByRole("button", { name: "Início" }).click();
  ok(new URL(p.url()).pathname === "/", `${rotulo}: ao sair, o endereço volta para / (${new URL(p.url()).pathname})`);

  // Rodapé e busca geral
  await p.locator("footer").getByRole("button", { name: "Como usar" }).click();
  ok(/Como usar/.test(await p.title()), `${rotulo}: link do rodapé`);
  await nav(p).getByRole("button", { name: "Início" }).click();
  const campo = p.getByRole("searchbox", { name: "Buscar no site" });
  await campo.fill("passo a passo");
  await p.waitForTimeout(500);
  ok(await p.locator("#busca-resultados").getByText("Como usar").first().isVisible(), `${rotulo}: busca geral acha o guia`);

  // Alto contraste
  await p.evaluate(() => localStorage.setItem("acessibilidade", JSON.stringify({ altoContraste: true })));
  await p.reload({ waitUntil: "load" });
  await p.waitForSelector("text=Estado dos dados", { timeout: 30000 });
  await nav(p).getByRole("button", { name: "Como usar" }).click();
  await rolarTudo(p);
  const rc = await new AxeBuilder({ page: p }).withTags(tags).analyze();
  ok(rc.violations.length === 0, `${rotulo}: alto contraste, axe sem violações ${rc.violations.map((v) => v.id).join(",")}`);
  await ctx.close();

  // Endereço direto /como-usar (link compartilhado)
  const ctx2 = await b.newContext({ viewport });
  const p2 = await ctx2.newPage();
  await p2.goto(base + "/como-usar", { waitUntil: "load" });
  await p2.waitForSelector("text=Guia de uso", { timeout: 30000 });
  ok(/Como usar/.test(await p2.title()), `${rotulo}: endereço direto /como-usar abre o guia`);
  await ctx2.close();
}
await b.close();
console.log(falhas ? `${falhas} falha(s)` : "Tudo certo");
process.exit(falhas ? 1 : 0);
