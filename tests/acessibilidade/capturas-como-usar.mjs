import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Gera as capturas de tela usadas na seção "Como usar" (public/guia-imagens/*.jpg) a partir do site publicado.
// Uso: node capturas-como-usar.mjs [url]   (padrão: https://observatorio-rn.web.app/)
// Refazer sempre que uma tela mostrada no guia mudar; depois conferir cada imagem a olho e republicar o site.
const base = process.argv[2] || "https://observatorio-rn.web.app/";
const saida = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "guia-imagens");
mkdirSync(saida, { recursive: true });

const nav = (p) => p.locator("nav[aria-label='Navegação principal']");
const menu = (p, nome) => p.locator("nav[aria-label='Seções de indicadores']").getByRole("button", { name: nome, exact: true });
const topo = (p) => p.evaluate(() => window.scrollTo(0, 0));
const foto = async (p, nome) => { await p.waitForTimeout(700); await p.screenshot({ path: join(saida, nome), type: "jpeg", quality: 82 }); console.log("ok", nome); };

const b = await chromium.launch();

async function abrir(largura = 1280, altura = 800) {
  const ctx = await b.newContext({ viewport: { width: largura, height: altura }, locale: "pt-BR" });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "load" });
  await p.waitForSelector("text=Estado dos dados", { timeout: 30000 });
  await p.waitForSelector("text=Municípios", { timeout: 30000 });
  await p.waitForTimeout(1500);
  return p;
}
async function indicadores(p, nome) {
  await nav(p).getByRole("button", { name: "Indicadores" }).click();
  await menu(p, nome).click();
}

// 1. Página inicial
let p = await abrir();
await foto(p, "01-inicio.jpg");

// 2. Busca
await p.getByRole("searchbox", { name: "Buscar no site" }).fill("preço");
await p.waitForSelector("#busca-resultados", { timeout: 20000 });
await p.waitForFunction(() => !document.querySelector("#busca-resultados")?.textContent?.includes("Carregando"), null, { timeout: 30000 });
await foto(p, "02-busca.jpg");

// 3. Preços (CMED)
await p.reload({ waitUntil: "load" });
await p.waitForSelector("text=Estado dos dados");
await indicadores(p, "Preços de medicamentos (CMED)");
await p.fill("#cmed-busca", "losartana 50 mg");
await p.waitForSelector("table tbody tr", { timeout: 90000 });
await topo(p);
await foto(p, "03-precos-cmed.jpg");

// 4. Registros (Anvisa)
await menu(p, "Registros de medicamentos (Anvisa)").click();
await p.fill("#reg-busca", "losartana");
await p.waitForSelector("table tbody tr", { timeout: 120000 });
await topo(p);
await foto(p, "04-registros-anvisa.jpg");

// 5. Visão geral dos indicadores (estado dos dados)
await menu(p, "Visão geral").click();
await p.waitForTimeout(1500);
await topo(p);
await foto(p, "05-visao-geral.jpg");

// 6. Comparador territorial
await menu(p, "Comparador territorial").click();
await p.waitForSelector("text=Dados dos municípios", { timeout: 30000 });
await p.waitForTimeout(1500);
await topo(p);
await foto(p, "06-comparador.jpg");

// 7. Programas governamentais
await nav(p).getByRole("button", { name: "Programas Governamentais" }).click();
await p.waitForTimeout(1000);
await topo(p);
await foto(p, "07-programas.jpg");

// 8. Repositório
await nav(p).getByRole("button", { name: "Educação e Repositório" }).click();
await p.waitForTimeout(2500);
await topo(p);
await foto(p, "08-repositorio.jpg");

// 9. Dados abertos (tabela com os botões CSV e JSON à vista)
await indicadores(p, "Dados abertos");
await p.waitForSelector("table tbody tr", { timeout: 30000 });
await p.locator("table tbody tr", { hasText: "Repositório de documentos" }).evaluate((el) => el.scrollIntoView({ block: "center" }));
await foto(p, "09-dados-abertos.jpg");

// 10. Metodologia (quadro de fontes)
await nav(p).getByRole("button", { name: "Metodologia e glossário" }).click();
await p.getByRole("heading", { name: "De onde vêm os dados", exact: true }).evaluate((el) => el.scrollIntoView({ block: "start" }));
await p.evaluate(() => window.scrollBy(0, -230));
await foto(p, "10-metodologia.jpg");

// 11. Assistente
await nav(p).getByRole("button", { name: "Início" }).click();
await topo(p);
await p.getByRole("button", { name: "Abrir o assistente de perguntas" }).click();
await foto(p, "11-assistente.jpg");
await p.keyboard.press("Escape");

// 12. Acessibilidade
await p.getByRole("button", { name: /Acessibilidade/ }).first().click();
await foto(p, "12-acessibilidade.jpg");
await p.context().close();

// 13. No celular
p = await abrir(390, 844);
await p.getByRole("searchbox", { name: "Buscar no site" }).scrollIntoViewIfNeeded();
await foto(p, "13-celular-inicio.jpg");
await p.locator("nav[aria-label='Navegação principal']").getByRole("button", { name: "Indicadores" }).click();
await p.locator("nav[aria-label='Seções de indicadores']").getByRole("button", { name: "Preços de medicamentos (CMED)", exact: true }).click();
await p.fill("#cmed-busca", "dipirona");
await p.waitForSelector("table tbody tr", { timeout: 90000 });
await p.getByRole("heading", { name: /Consulta de preços de medicamentos/i }).evaluate((el) => el.scrollIntoView({ block: "start" }));
await p.evaluate(() => window.scrollBy(0, -12));
await foto(p, "14-celular-precos.jpg");
await p.context().close();

await b.close();
console.log("capturas em", saida);
