import { useEffect, useState } from "react";
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase";
import { lerPerfil, type Perfil } from "./perfis";

// Login com Google (acesso administrativo): usuário atual, perfil de acesso (null = verificando) e mensagem de erro de login.
export function useAutenticacao() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, async (user) => {
      setUsuario(user);
      setPerfil(null);
      if (user) setPerfil(await lerPerfil(user.email));
    });
    return () => cancelar();
  }, []);

  const entrar = async () => {
    setErro(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (primeiroErro: any) {
      let error = primeiroErro;
      if (error?.code === "auth/popup-blocked" || error?.code === "auth/operation-not-supported-in-this-environment") {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (erroRedirect: any) {
          error = erroRedirect;
        }
      }
      console.error("Erro durante o login com o Google:", error);
      const code = error.code || "unknown";

      let msg = "Ocorreu um erro ao realizar o login com o Google.";
      if (code === "auth/unauthorized-domain") {
        msg = "Este endereço ainda não está autorizado para login. Avise a coordenação do projeto.";
      } else if (code === "auth/popup-blocked") {
        msg = "O popup de login foi bloqueado pelo seu navegador. Por favor, permita popups para este site e clique em entrar novamente.";
      } else if (code === "auth/operation-not-supported-in-this-environment") {
        msg = "Seu navegador não permitiu abrir a janela de login. Abra o site em uma aba normal e tente novamente.";
      } else if (code === "auth/configuration-not-found" || code === "auth/admin-restricted-operation" || code === "auth/unsupported-provider") {
        msg = "O login com Google não está disponível no momento. Avise a coordenação do projeto.";
      } else if (error.message) {
        msg = `Erro (${code}): ${error.message}`;
      }
      setErro(msg);
    }
  };

  const sair = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao deslogar do Firebase:", error);
    }
  };

  return { usuario, perfil, erro, entrar, sair, fecharErro: () => setErro(null) };
}
