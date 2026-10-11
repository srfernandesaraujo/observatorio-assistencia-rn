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

  await p.getByRole("button", { name: "Buscar" }).click();
  const dialogo = p.getByRole("dialog", { name: "Buscar no Observatório" });
  ok(await dialogo.isVisible(), `${rotulo}: janela abre`);
  ok(await p.evaluate(() => document.activeElement?.id === "busca-campo"), `${rotulo}: foco vai para o campo`);

  await p.fill("#busca-campo", "FARMACIA popular");
  await p.waitForTimeout(400);
  ok(await dialogo.getByText("Farmácia Popular do Brasil").first().isVisible(), `${rotulo}: acha programa sem diferenciar acento/maiúscula`);

  await p.fill("#busca-campo", "xyzzyqq"); await p.waitForSelector("text=Nenhum resultado para", { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(300);
  ok(await dialogo.getByText("Nenhum resultado para").first().isVisible(), `${rotulo}: mensagem de sem resultado`);

  await p.fill("#busca-campo", "alertas");
  await p.waitForTimeout(400);
  if (pasta) await p.screenshot({ path: `${pasta}/busca-${rotulo}.png` });
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  ok(r.violations.length === 0, `${rotulo}: axe sem violações ${r.violations.map((v) => v.id).join(",")}`);

  await dialogo.getByRole("button", { name: "Ir para a seção" }).first().click();
  await p.waitForTimeout(500);
  ok(!(await dialogo.isVisible()), `${rotulo}: janela fecha ao escolher resultado`);
  ok(/Alertas sanitários/.test(await p.title()), `${rotulo}: navegou (título: ${await p.title()})`);

  await p.getByRole("button", { name: "Buscar" }).click();
  await p.keyboard.press("Escape");
  await p.waitForTimeout(200);
  ok(!(await dialogo.isVisible()), `${rotulo}: Esc fecha`);
  ok(await p.evaluate(() => document.activeElement?.textContent?.includes("Buscar")), `${rotulo}: foco volta ao botão`);
  await p.close();
}
await b.close();
console.log(falhas ? `${falhas} falha(s)` : "Tudo certo");
process.exit(falhas ? 1 : 0);
