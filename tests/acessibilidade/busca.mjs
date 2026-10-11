import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

// Uso: node busca.mjs <url> [pasta-de-capturas]
const base = process.argv[2] || "https://observatorio-rn.web.app/";
const pasta = process.argv[3];
let falhas = 0;
const ok = (cond, msg) => { console.log(cond ? "OK   " : "FALHA", msg); if (!cond) falhas++; };

const b = await chromium.launch();
for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 800 }]) {
  const rotulo = `${viewport.width}px`;
  const p = await (await b.newContext({ viewport })).newPage();
  await p.goto(base, { waitUntil: "load" });
  await p.waitForSelector("text=Estado dos dados", { timeout: 30000 });

  const campo = p.getByRole("searchbox", { name: "Buscar no site" });
  const painel = p.locator("#busca-resultados");
  ok(await campo.isVisible(), `${rotulo}: campo de busca visível no cabeçalho`);
  ok(!(await painel.count()), `${rotulo}: painel fechado antes de digitar`);

  await campo.fill("FARMACIA popular");
  await p.waitForTimeout(400);
  ok(await painel.getByText("Farmácia Popular do Brasil").first().isVisible(), `${rotulo}: acha programa sem diferenciar acento/maiúscula`);

  await campo.fill("xyzzyqq");
  await p.waitForSelector("text=Nenhum resultado para", { timeout: 20000 }).catch(() => {});
  ok(await painel.getByText("Nenhum resultado para").first().isVisible(), `${rotulo}: mensagem de sem resultado`);

  await campo.fill("alertas");
  await p.waitForTimeout(400);
  const caixa = await painel.boundingBox();
  ok(caixa && caixa.x >= 0 && caixa.x + caixa.width <= viewport.width, `${rotulo}: painel dentro da tela (${caixa && Math.round(caixa.x)}..${caixa && Math.round(caixa.x + caixa.width)})`);
  if (pasta) await p.screenshot({ path: `${pasta}/busca-${rotulo}.png` });
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  ok(r.violations.length === 0, `${rotulo}: axe sem violações ${r.violations.map((v) => v.id).join(",")}`);

  await campo.press("Tab"); // vai do campo ao primeiro item dos resultados
  ok(await p.evaluate(() => !!document.activeElement?.closest("#busca-resultados")), `${rotulo}: Tab entra nos resultados`);
  await p.keyboard.press("Escape");
  ok(!(await painel.count()), `${rotulo}: Esc fecha o painel`);
  ok(await p.evaluate(() => document.activeElement?.id === "busca-campo"), `${rotulo}: foco volta ao campo`);

  await campo.click(); // com o texto ainda no campo, clicar reabre os resultados
  await p.waitForTimeout(300);
  await painel.getByRole("button", { name: "Ir para a seção" }).first().click();
  await p.waitForTimeout(500);
  ok(!(await painel.count()), `${rotulo}: painel fecha ao escolher resultado`);
  ok(/Alertas sanitários/.test(await p.title()), `${rotulo}: navegou (título: ${await p.title()})`);
  ok((await campo.inputValue()) === "", `${rotulo}: campo limpo depois de navegar`);

  await campo.fill("programas");
  await p.mouse.click(5, 400);
  ok(!(await painel.count()), `${rotulo}: clique fora fecha`);
  await p.close();
}
await b.close();
console.log(falhas ? `${falhas} falha(s)` : "Tudo certo");
process.exit(falhas ? 1 : 0);
