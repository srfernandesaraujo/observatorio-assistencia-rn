import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

// Uso: node dadosabertos.mjs <url> [pasta-de-capturas]
// Baixa de verdade os arquivos do conjunto publicado e confere o conteúdo.
const base = process.argv[2] || "https://observatorio-rn.web.app/";
const pasta = process.argv[3];
let falhas = 0;
const ok = (cond, msg) => { console.log(cond ? "OK   " : "FALHA", msg); if (!cond) falhas++; };
const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"];

const b = await chromium.launch();
for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 800 }]) {
  const rotulo = `${viewport.width}px`;
  const ctx = await b.newContext({ viewport, acceptDownloads: true });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "load" });
  await p.waitForSelector("text=Estado dos dados", { timeout: 30000 });
  await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Indicadores" }).click();
  await p.getByRole("button", { name: "Dados abertos" }).first().click();
  ok(/Dados abertos/.test(await p.title()), `${rotulo}: título da aba (${await p.title()})`);
  await p.waitForSelector("table tbody tr", { timeout: 30000 });
  ok((await p.locator("table tbody tr").count()) === 9, `${rotulo}: 9 conjuntos listados`);

  const botoesCsv = p.getByRole("button", { name: /^Baixar .* em CSV$/ });
  const publicados = await botoesCsv.count();
  ok(publicados >= 1, `${rotulo}: ${publicados} conjunto(s) publicado(s) com botão de download`);
  ok((await p.getByText("Aguardando dados da fonte").count()) === 9 - publicados, `${rotulo}: os demais mostram "aguardando dados"`);

  // Os dois botões ficam lado a lado (mesma altura na tela), sem quebrar para baixo
  const linhaRepo = p.locator("table tbody tr", { hasText: "Repositório de documentos" });
  const boxCsv = await linhaRepo.getByRole("button", { name: /em CSV$/ }).boundingBox();
  const boxJson = await linhaRepo.getByRole("button", { name: /em JSON$/ }).boundingBox();
  ok(!!boxCsv && !!boxJson && Math.abs(boxCsv.y - boxJson.y) < 2 && boxJson.x > boxCsv.x, `${rotulo}: botões CSV e JSON lado a lado`);

  // Download do repositório (16 linhas publicadas)
  const [dlCsv] = await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: "Baixar Repositório de documentos em CSV" }).click()]);
  const caminhoCsv = await dlCsv.path();
  const csv = readFileSync(caminhoCsv, "utf8");
  const linhas = csv.replace(/^﻿/, "").trim().split(/\r\n/);
  ok(/^observatorio-rn-repositorio_documentos-\d{4}-\d{2}-\d{2}\.csv$/.test(dlCsv.suggestedFilename()), `${rotulo}: nome do arquivo (${dlCsv.suggestedFilename()})`);
  ok(csv.startsWith("﻿"), `${rotulo}: CSV com BOM UTF-8`);
  ok(linhas[0] === "titulo;tipo;orgao;data_publicacao;resumo;link", `${rotulo}: cabeçalho do CSV (${linhas[0]})`);
  ok(linhas.length >= 2, `${rotulo}: CSV com ${linhas.length - 1} linhas de dados`);
  ok(/ç|ã|é/.test(csv), `${rotulo}: acentos preservados`);

  const [dlJson] = await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: "Baixar Repositório de documentos em JSON" }).click()]);
  const json = JSON.parse(readFileSync(await dlJson.path(), "utf8"));
  ok(json.conjunto === "repositorio_documentos" && json.dados.length === json.totalLinhas && json.totalLinhas === linhas.length - 1, `${rotulo}: JSON coerente com o CSV (${json.totalLinhas} linhas)`);
  ok(json.colunas.length === 6 && !!json.fonte && !!json.atualizadoEm, `${rotulo}: JSON traz colunas, fonte e data`);
  ok(await p.getByText(/baixado\./).first().isVisible(), `${rotulo}: aviso de download concluído`);

  if (pasta) await p.screenshot({ path: `${pasta}/dadosabertos-${rotulo}.png` });
  const larg = await p.evaluate(() => document.documentElement.scrollWidth);
  ok(larg <= viewport.width + 1, `${rotulo}: sem rolagem horizontal da página (${larg}px)`);
  const r = await new AxeBuilder({ page: p }).withTags(tags).analyze();
  ok(r.violations.length === 0, `${rotulo}: axe sem violações ${r.violations.map((v) => v.id + "(" + v.nodes.length + ")").join(",")}`);

  // Busca geral
  const campo = p.getByRole("searchbox", { name: "Buscar no site" });
  await campo.fill("baixar csv");
  await p.waitForTimeout(400);
  ok(await p.locator("#busca-resultados").getByText("Dados abertos").first().isVisible(), `${rotulo}: busca geral acha a seção`);

  // Alto contraste
  await p.evaluate(() => localStorage.setItem("acessibilidade", JSON.stringify({ altoContraste: true })));
  await p.reload({ waitUntil: "load" });
  await p.waitForSelector("text=Estado dos dados", { timeout: 30000 });
  await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Indicadores" }).click();
  await p.getByRole("button", { name: "Dados abertos" }).first().click();
  await p.waitForSelector("table tbody tr", { timeout: 30000 });
  const rc = await new AxeBuilder({ page: p }).withTags(tags).analyze();
  ok(rc.violations.length === 0, `${rotulo}: alto contraste, axe sem violações ${rc.violations.map((v) => v.id).join(",")}`);
  await ctx.close();
}
await b.close();
console.log(falhas ? `${falhas} falha(s)` : "Tudo certo");
process.exit(falhas ? 1 : 0);
