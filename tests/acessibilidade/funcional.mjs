import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:4173/";
const out = process.argv[3];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
const p = await ctx.newPage();
const falhas = [];
const ok = (cond, msg) => { console.log(cond ? "OK   " : "FALHA", msg); if (!cond) falhas.push(msg); };

await p.goto(base, { waitUntil: "load" });
await p.waitForSelector("text=Estado dos dados", { timeout: 30000 });
ok((await p.locator("html").getAttribute("lang")) === "pt-BR", "html lang = pt-BR");
ok((await p.title()).includes("Observatório"), `título da aba: "${await p.title()}"`);

// 1. Pular para o conteúdo (teclado)
await p.keyboard.press("Tab");
ok(await p.evaluate(() => document.activeElement?.textContent?.trim() === "Ir para o conteúdo"), "primeiro Tab foca 'Ir para o conteúdo'");
if (out) await p.screenshot({ path: `${out}/f-pular.png`, clip: { x: 0, y: 0, width: 700, height: 120 } });
await p.keyboard.press("Enter");
ok(await p.evaluate(() => document.activeElement?.id === "conteudo"), "Enter no link move o foco para o conteúdo");

// 2. Navegação por teclado + anúncio + título
await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Programas Governamentais" }).focus();
await p.keyboard.press("Enter");
await p.waitForTimeout(300);
ok((await p.title()).startsWith("Programas Governamentais"), `título muda ao navegar: "${await p.title()}"`);
ok(((await p.locator("[role=status].sr-only").first().textContent()) || "").includes("Programas Governamentais"), "região ao vivo anuncia a seção");
ok(await p.evaluate(() => document.activeElement?.id === "conteudo"), "foco vai para o conteúdo após navegar");
await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Início" }).click();
await p.waitForSelector("text=Estado dos dados");

// 3. Painel de acessibilidade
const botaoPainel = p.getByRole("button", { name: "Acessibilidade" });
await botaoPainel.click();
ok((await botaoPainel.getAttribute("aria-expanded")) === "true", "painel abre (aria-expanded=true)");
await p.getByRole("button", { name: "Aumentar o tamanho do texto" }).click();
await p.getByRole("button", { name: "Aumentar o tamanho do texto" }).click();
ok((await p.evaluate(() => document.documentElement.style.fontSize)) === "125%", "A+ duas vezes = 125%");
await p.getByRole("switch", { name: "Alto contraste" }).click();
ok(await p.evaluate(() => document.documentElement.classList.contains("alto-contraste")), "alto contraste aplicado na página");
ok((await p.getByRole("switch", { name: "Alto contraste" }).getAttribute("aria-checked")) === "true", "interruptor expõe aria-checked=true");
const fundo = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
const corSecao = await p.evaluate(() => getComputedStyle(document.querySelector("main section")).backgroundColor);
console.log("info: fundo do body =", fundo, "| primeira seção =", corSecao);
if (out) await p.screenshot({ path: `${out}/f-painel-contraste.png` });
await p.keyboard.press("Escape");
ok((await botaoPainel.getAttribute("aria-expanded")) === "false", "Esc fecha o painel");
ok(await p.evaluate(() => !!document.activeElement?.textContent?.includes("Acessibilidade")), "foco volta ao botão do painel");

// 4. Persistência
await p.reload({ waitUntil: "load" });
await p.waitForSelector("text=Estado dos dados");
ok(await p.evaluate(() => document.documentElement.classList.contains("alto-contraste") && document.documentElement.style.fontSize === "125%"), "preferências persistem após recarregar");
if (out) await p.screenshot({ path: `${out}/f-landing-contraste.png`, fullPage: true });

// 5. Espaçamento e fonte máxima
await p.getByRole("button", { name: "Acessibilidade" }).click();
for (let i = 0; i < 2; i++) await p.getByRole("button", { name: "Aumentar o tamanho do texto" }).click();
ok(await p.getByRole("button", { name: "Aumentar o tamanho do texto" }).isDisabled(), "A+ fica desabilitado no máximo (175%)");
await p.getByRole("switch", { name: "Espaçamento de texto" }).click();
await p.keyboard.press("Escape");
await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Indicadores" }).click();
await p.waitForSelector("text=Visão geral dos indicadores");
if (out) await p.screenshot({ path: `${out}/f-fonte-max.png` });
const rolagemHorizontal = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
ok(!rolagemHorizontal, "sem rolagem horizontal da página com 175% + espaçamento (reflow)");

// 6. Restaurar
await p.getByRole("button", { name: "Acessibilidade" }).click();
await p.getByRole("button", { name: "Restaurar padrões" }).click();
ok(await p.evaluate(() => document.documentElement.style.fontSize === "100%" && !document.documentElement.classList.contains("alto-contraste") && !document.documentElement.classList.contains("espacamento-texto")), "Restaurar padrões volta ao normal");
await p.keyboard.press("Escape");

// 7. Chat: teclado, foco, Esc
const botaoChat = p.getByRole("button", { name: "Abrir o assistente de perguntas" });
await botaoChat.focus();
await p.keyboard.press("Enter");
await p.waitForSelector("[role=dialog]");
ok(await p.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Sua pergunta"), "chat abre com foco no campo de pergunta");
for (let i = 0; i < 12; i++) await p.keyboard.press("Tab");
ok(await p.evaluate(() => !!document.activeElement?.closest("[role=dialog]")), "Tab não escapa da janela do chat (foco preso)");
await p.keyboard.press("Escape");
await p.waitForTimeout(200);
ok((await p.locator("[role=dialog]").count()) === 0, "Esc fecha o chat");
ok(await p.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Abrir o assistente de perguntas"), "foco volta ao botão do chat");

// 8. Libras
await p.getByRole("button", { name: "Acessibilidade" }).click();
await p.getByRole("switch", { name: "Tradução em Libras" }).click();
await p.waitForTimeout(4000);
const vlibras = await p.evaluate(() => ({ caixa: !!document.querySelector("[vw]"), botao: !!document.querySelector("[vw-access-button]"), script: !!document.querySelector("script[src*=vlibras]") }));
ok(vlibras.caixa && vlibras.botao && vlibras.script, `VLibras injetado: ${JSON.stringify(vlibras)}`);
if (out) await p.screenshot({ path: `${out}/f-libras.png` });

await b.close();
console.log(falhas.length ? `\n${falhas.length} falha(s)` : "\nTudo certo.");
