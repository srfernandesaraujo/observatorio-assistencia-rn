import { useEffect, useRef, useState } from "react";
import { AreaPrincipal } from "./components/AreaPrincipal";
import { AssistenteChat } from "./components/AssistenteChat";
import { Cabecalho } from "./components/Cabecalho";
import { ErroLogin } from "./components/ErroLogin";
import type { Destino } from "./components/Landing";
import { Rodape } from "./components/Rodape";
import type { Rota } from "./lib/busca";
import { CAMINHO_COMO_USAR, SECAO_INICIAL, TITULO_SITE, localDoAtalho, localDoMenuSuperior, nomeDaSecao, topNavAtual, type Aba, type Local, type TopNavId } from "./lib/navegacao";
import { useAutenticacao } from "./lib/useAutenticacao";

// O guia "Como usar" tem endereço próprio para ser compartilhado (observatorio-rn.web.app/como-usar).
const caminhoAtual = () => window.location.pathname.replace(/\/+$/, "");
const abreComoUsar = () => caminhoAtual() === CAMINHO_COMO_USAR;

export default function App() {
  const [aba, setAba] = useState<Aba>(abreComoUsar() ? "principal" : "inicio");
  const [sub, setSub] = useState<string>(abreComoUsar() ? "como_usar" : SECAO_INICIAL);
  const [chatAberto, setChatAberto] = useState(false);
  const [anuncio, setAnuncio] = useState("");
  const { usuario, perfil, erro: erroLogin, entrar, sair, fecharErro } = useAutenticacao();

  const mainRef = useRef<HTMLElement>(null);
  const primeiraNavegacao = useRef(true);

  const secaoAtual = nomeDaSecao(aba, sub);

  // Navegação interna (sem recarregar a página): atualiza o título da aba, avisa leitores de tela e move o foco ao conteúdo
  useEffect(() => {
    // mantém o endereço do navegador coerente: /como-usar só enquanto o guia está aberto
    if (aba === "principal" && sub === "como_usar") {
      if (caminhoAtual() !== CAMINHO_COMO_USAR) window.history.replaceState(null, "", CAMINHO_COMO_USAR);
    } else if (caminhoAtual() === CAMINHO_COMO_USAR) {
      window.history.replaceState(null, "", "/");
    }
    document.title = aba === "inicio" ? TITULO_SITE : `${secaoAtual} — ${TITULO_SITE}`;
    if (primeiraNavegacao.current) {
      primeiraNavegacao.current = false;
      return;
    }
    setAnuncio(`Você está em: ${secaoAtual}`);
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [aba, sub]);

  const ir = (l: Local | Rota) => {
    setAba(l.aba);
    if (l.sub) setSub(l.sub);
  };
  // Atalhos da página inicial: abrem uma seção específica de Indicadores, outra área ou o assistente.
  const abrirAtalho = (d: Destino) => (d === "assistente" ? setChatAberto(true) : ir(localDoAtalho(d)));
  const escolherMenu = (id: TopNavId) => ir(localDoMenuSuperior(id));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col antialiased">
      <a href="#conteudo" className="pular-link" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Ir para o conteúdo</a>
      <div role="status" aria-live="polite" className="sr-only">{anuncio}</div>

      <Cabecalho
        usuario={usuario}
        menuAtual={topNavAtual(aba, sub)}
        aoEscolherMenu={escolherMenu}
        aoBuscar={ir}
        aoEntrar={entrar}
        aoSair={sair}
      />

      <main id="conteudo" ref={mainRef} tabIndex={-1} className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
        <AreaPrincipal aba={aba} sub={sub} usuario={usuario} perfil={perfil} aoAbrirAtalho={abrirAtalho} aoMudarSub={setSub} />
      </main>

      <AssistenteChat aberto={chatAberto} aoAbrir={() => setChatAberto(true)} aoFechar={() => setChatAberto(false)} />

      <Rodape aoAbrirMetodologia={() => ir({ aba: "principal", sub: "metodologia" })} aoAbrirComoUsar={() => ir({ aba: "principal", sub: "como_usar" })} />

      {erroLogin && <ErroLogin mensagem={erroLogin} aoFechar={fecharErro} />}
    </div>
  );
}
