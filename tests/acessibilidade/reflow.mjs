import { chromium } from "playwright";
const base = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 320, height: 700 } });
const secoes = [["Início", null], ["Indicadores", null], ["Programas Governamentais", null], ["Educação e Repositório", null], ["Produção Científica", null]];
let falhas = 0;
for (const prefs of [{}, { passoFonte: 3, espacamento: true }]) {
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "load" });
  await p.evaluate((x) => localStorage.setItem("acessibilidade", JSON.stringify(x)), prefs);
  await p.reload({ waitUntil: "load" });
  await p.waitForSelector("text=Estado dos dados", { timeout: 30000 });
  for (const [nome] of secoes) {
    await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: nome }).click();
    await p.waitForTimeout(3500);
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    const ok = r.sw <= r.cw + 1;
    if (!ok) falhas++;
    console.log(ok ? "OK   " : "FALHA", `${nome} @320px ${JSON.stringify(prefs)} scrollWidth=${r.sw}`);
  }
  await p.close();
}
await b.close();
console.log(falhas ? `${falhas} falha(s)` : "Reflow OK em 320px");
