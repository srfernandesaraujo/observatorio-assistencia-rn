// Preferências de acessibilidade do visitante, guardadas só no navegador dele (localStorage).

export interface Preferencias {
  passoFonte: number; // índice em PASSOS_FONTE
  altoContraste: boolean;
  espacamento: boolean; // espaçamento de texto ampliado
  reduzirMovimento: boolean;
  libras: boolean; // tradução em Libras (VLibras)
}

export const PASSOS_FONTE = [100, 112.5, 125, 150, 175];
export const CHAVE = "acessibilidade";

function consulta(q: string): boolean {
  try {
    return window.matchMedia(q).matches;
  } catch {
    return false;
  }
}

export function padrao(): Preferencias {
  return {
    passoFonte: 0,
    altoContraste: consulta("(prefers-contrast: more)"),
    espacamento: false,
    reduzirMovimento: consulta("(prefers-reduced-motion: reduce)"),
    libras: false,
  };
}

export function lerPreferencias(): Preferencias {
  const base = padrao();
  try {
    const guardado = localStorage.getItem(CHAVE);
    if (!guardado) return base;
    const p = JSON.parse(guardado) as Partial<Preferencias>;
    const passo = typeof p.passoFonte === "number" && p.passoFonte >= 0 && p.passoFonte < PASSOS_FONTE.length ? p.passoFonte : base.passoFonte;
    return {
      passoFonte: passo,
      altoContraste: typeof p.altoContraste === "boolean" ? p.altoContraste : base.altoContraste,
      espacamento: typeof p.espacamento === "boolean" ? p.espacamento : base.espacamento,
      reduzirMovimento: typeof p.reduzirMovimento === "boolean" ? p.reduzirMovimento : base.reduzirMovimento,
      libras: typeof p.libras === "boolean" ? p.libras : base.libras,
    };
  } catch {
    return base;
  }
}

export function guardarPreferencias(p: Preferencias): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p));
  } catch {
    // sem armazenamento: a preferência vale só nesta visita
  }
}

// Aplica as preferências na página: o tamanho do texto escala todo o site porque os tamanhos são em rem.
export function aplicarPreferencias(p: Preferencias): void {
  const html = document.documentElement;
  html.style.fontSize = `${PASSOS_FONTE[p.passoFonte]}%`;
  html.classList.toggle("alto-contraste", p.altoContraste);
  html.classList.toggle("espacamento-texto", p.espacamento);
  html.classList.toggle("reduzir-movimento", p.reduzirMovimento);
  html.classList.toggle("libras-desligado", !p.libras);
}

// ---- VLibras (tradutor de Libras do governo federal), carregado só se o usuário pedir ----

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => unknown };
  }
}

let vlibrasIniciado = false;

export function iniciarVLibras(): void {
  if (vlibrasIniciado || document.querySelector("[vw]")) return;
  vlibrasIniciado = true;
  const caixa = document.createElement("div");
  caixa.setAttribute("vw", "");
  caixa.className = "enabled";
  caixa.innerHTML =
    '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
  document.body.appendChild(caixa);
  const script = document.createElement("script");
  script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
  script.onload = () => {
    try {
      if (window.VLibras) new window.VLibras.Widget("https://vlibras.gov.br/app");
    } catch (e) {
      console.warn("VLibras indisponível:", e);
    }
  };
  script.onerror = () => {
    vlibrasIniciado = false;
    caixa.remove();
  };
  document.body.appendChild(script);
}
