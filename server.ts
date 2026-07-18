import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  MEDICAMENTOS_MOCK,
  INSTITUICOES_MOCK,
  ESTOQUES_MOCK,
  MOVIMENTACOES_MOCK,
  Estoque,
  Movimentacao
} from "./src/data.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Habilitar processamento de JSON no body das requisições
  app.use(express.json());

  // --- API ENDPOINTS RESTFUL ---

  // 1. Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // 2. Consulta de Indicadores do Dashboard Geral
  app.get("/api/dashboard/stats", (req, res) => {
    try {
      const totalMedicamentos = MEDICAMENTOS_MOCK.length;
      const totalInstituicoes = INSTITUICOES_MOCK.length;

      // Calcular o número de estoques em nível crítico (dias de cobertura < 15) ou desabastecidos (0)
      let desabastecidosCount = 0;
      let criticosCount = 0;

      ESTOQUES_MOCK.forEach((est) => {
        if (est.quantidade === 0) {
          desabastecidosCount++;
        } else {
          const diasCobertura = est.quantidade / (est.demanda_mensal / 30);
          if (diasCobertura < 15) {
            criticosCount++;
          }
        }
      });

      // Total de movimentações registradas
      const totalMovimentacoes = MOVIMENTACOES_MOCK.length;

      res.json({
        totalMedicamentos,
        totalInstituicoes,
        desabastecidosCount,
        criticosCount,
        totalMovimentacoes,
        alertaTotal: desabastecidosCount + criticosCount
      });
    } catch (error: any) {
      res.status(500).json({ error: "Erro ao calcular estatísticas", details: error.message });
    }
  });

  // 3. Consulta de Indicadores de Desabastecimento (Risco e Cobertura)
  app.get("/api/dashboard/stock-alerts", (req, res) => {
    try {
      const alerts = ESTOQUES_MOCK.map((est) => {
        const med = MEDICAMENTOS_MOCK.find((m) => m.id === est.medicamento_id);
        const inst = INSTITUICOES_MOCK.find((i) => i.id === est.instituicao_id);

        const diasCobertura = est.quantidade === 0 ? 0 : est.quantidade / (est.demanda_mensal / 30);
        
        let nivelRisco: "Desabastecido" | "Crítico" | "Moderado" | "Baixo" = "Baixo";
        if (est.quantidade === 0) {
          nivelRisco = "Desabastecido";
        } else if (diasCobertura < 15) {
          nivelRisco = "Crítico";
        } else if (diasCobertura < 30) {
          nivelRisco = "Moderado";
        }

        // Verificar proximidade de vencimento (data fictícia do sistema: 2026-07-17)
        let proximoVencimento = false;
        if (est.validade !== "N/A") {
          const dataValidade = new Date(est.validade);
          const dataAtual = new Date("2026-07-17");
          const diffTempo = dataValidade.getTime() - dataAtual.getTime();
          const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
          if (diffDias >= 0 && diffDias <= 30) {
            proximoVencimento = true;
          }
        }

        return {
          id: est.id,
          medicamento: med?.nome || "Desconhecido",
          principio_ativo: med?.principio_ativo || "Desconhecido",
          atc: med?.atc || "Desconhecido",
          unidade: inst?.nome || "Desconhecida",
          tipo_unidade: inst?.tipo || "Desconhecido",
          quantidade: est.quantidade,
          demanda_mensal: est.demanda_mensal,
          lote: est.lote,
          validade: est.validade,
          dias_cobertura: Math.round(diasCobertura * 10) / 10,
          nivel_risco: nivelRisco,
          alerta_vencimento: proximoVencimento
        };
      });

      // Ordenar por gravidade do risco (Desabastecido > Crítico > Moderado > Baixo)
      const ordemRisco = { "Desabastecido": 0, "Crítico": 1, "Moderado": 2, "Baixo": 3 };
      alerts.sort((a, b) => ordemRisco[a.nivel_risco] - ordemRisco[b.nivel_risco]);

      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ error: "Erro ao buscar alertas de estoque", details: error.message });
    }
  });

  // 4. Consulta de Movimentações Recentes
  app.get("/api/dashboard/recent-transactions", (req, res) => {
    try {
      const transactions = MOVIMENTACOES_MOCK.map((mov) => {
        const med = MEDICAMENTOS_MOCK.find((m) => m.id === mov.medicamento_id);
        const inst = INSTITUICOES_MOCK.find((i) => i.id === mov.instituicao_id);

        return {
          id: mov.id,
          medicamento: med?.nome || "Desconhecido",
          principio_ativo: med?.principio_ativo || "Desconhecido",
          unidade: inst?.nome || "Desconhecida",
          tipo: mov.tipo,
          quantidade: mov.quantidade,
          lote: mov.lote,
          data: mov.data,
          responsavel: mov.responsavel,
          destino_origem: mov.destino_origem
        };
      });

      // Ordenar por data decrescente
      transactions.sort((a, b) => b.data.localeCompare(a.data));

      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: "Erro ao buscar movimentações", details: error.message });
    }
  });

  // 5. Explorador de Dados Relacionais Brutos
  app.get("/api/dashboard/data-explorer", (req, res) => {
    res.json({
      medicamentos: MEDICAMENTOS_MOCK,
      instituicoes: INSTITUICOES_MOCK,
      estoques: ESTOQUES_MOCK,
      movimentacoes: MOVIMENTACOES_MOCK
    });
  });

  // 6. Rota para Ingestão de Dados (Simulação de ETL)
  app.post("/api/ingestion/upload", (req, res) => {
    try {
      const { fileName, fileSize, recordsCount, dataType } = req.body;

      if (!fileName || !recordsCount || !dataType) {
        return res.status(400).json({ error: "Parâmetros de ingestão inválidos." });
      }

      // Log operacional simulando o pipeline ETL em tempo real
      const logs = [
        `[${new Date().toISOString()}] [ETL-EXTRACT] Iniciando ingestão do arquivo "${fileName}" (${(fileSize / 1024).toFixed(2)} KB).`,
        `[${new Date().toISOString()}] [ETL-EXTRACT] Identificado formato correspondente a: ${dataType.toUpperCase()}.`,
        `[${new Date().toISOString()}] [ETL-EXTRACT] Extraídos com sucesso ${recordsCount} registros brutos.`,
        `[${new Date().toISOString()}] [ETL-TRANSFORM] Iniciando validação sintática e semântica de integridade.`,
        `[${new Date().toISOString()}] [ETL-TRANSFORM] Cruzando dados com Cadastro Nacional de Medicamentos (Anvisa) e CNES.`,
        `[${new Date().toISOString()}] [ETL-TRANSFORM] Calculando médias móveis e demanda mensal projetada...`,
        `[${new Date().toISOString()}] [ETL-LOAD] Gravando alterações nas tabelas de Estoque (estoques) e Histórico (movimentacoes).`,
        `[${new Date().toISOString()}] [ETL-SUCCESS] Carga concluída com sucesso. 0 erros de integridade referencial.`
      ];

      res.json({
        success: true,
        fileName,
        recordsProcessed: recordsCount,
        timestamp: new Date().toISOString(),
        logs
      });
    } catch (error: any) {
      res.status(500).json({ error: "Falha na simulação de ingestão", details: error.message });
    }
  });

  // 7. Rota de Inteligência Artificial para Consulta em Linguagem Natural
  app.post("/api/ai/query", async (req, res) => {
    try {
      const { query, geminiApiKey } = req.body;

      if (!query) {
        return res.status(400).json({ error: "A pergunta (query) é obrigatória." });
      }

      // Obter chave de API
      let apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
      if (apiKey === "MY_GEMINI_API_KEY" || !apiKey || apiKey.trim() === "") {
        return res.json({
          response: `**[Nota Operacional - Modo Offline/Sem Chave]**\n\nIdentificamos que a chave de API do Gemini não está configurada no painel de Secrets ou contém o valor padrão.\n\nContudo, como um assistente especialista estruturado, aqui está o comportamento esperado para a sua pergunta: *"${query}"*:\n\n1. **Identificação da Unidade e Medicamento**: O sistema mapearia os termos da pergunta.\n2. **Execução SQL Equivalente**:\n   \`\`\`sql\n   SELECT m.nome, i.nome, e.quantidade, e.demanda_mensal, \n          ROUND(e.quantidade / (e.demanda_mensal / 30.0), 1) as dias_cobertura\n   FROM estoques e\n   JOIN medicamentos m ON e.medicamento_id = m.id\n   JOIN instituicoes i ON e.instituicao_id = i.id\n   WHERE m.nome ILIKE '%insulina%'\n     OR i.nome ILIKE '%Asa Norte%';\n   \`\`\`\n3. **Resposta Analítica**: A insulina no HRAN (Hospital Regional da Asa Norte) está atualmente com **Estoques Críticos** (150 unidades contra demanda mensal de 1200), restando apenas **3,7 dias de cobertura**. Há risco eminente de desabastecimento total se uma nova transferência ou compra não for concluída esta semana.\n\n*Por favor, adicione uma chave Gemini API válida em **Configurações > Gerenciamento de Credenciais** para obter a geração de insights do modelo em tempo real.*`
        });
      }

      // Inicializar o cliente Gemini de forma Lazy (com cabeçalho de telemetria obrigatório)
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Contexto relacional estruturado enviado como System Instruction para guiar o modelo
      const systemInstruction = `
Você é o Assistente Virtual Inteligente do "Observatório da Assistência Farmacêutica", um sistema especializado em monitoramento de estoques públicos, prevenção de desabastecimentos de medicamentos e otimização da cadeia de suprimentos farmacêuticos do SUS.

Abaixo está o esquema relacional do banco de dados e os dados reais contidos nas tabelas atualmente. Utilize EXCLUSIVAMENTE estes dados para responder às perguntas do usuário com precisão cirúrgica, atuando como um Engenheiro de Software Sênior e Especialista em Saúde Coletiva.

### ESQUEMA DO BANCO DE DADOS (PostgreSQL / Relacional)
1. Tabela "medicamentos":
   - id: VARCHAR (PK) - Ex: "MED-001"
   - nome: VARCHAR - Nome completo comercial/descritivo
   - principio_ativo: VARCHAR - Princípio ativo do fármaco
   - atc: VARCHAR - Classificação ATC (Anatomical Therapeutic Chemical)
   - registro_anvisa: VARCHAR - Registro ANVISA de 13 dígitos
   - dosagem: VARCHAR - Concentração/Dosagem
   - apresentacao: VARCHAR - Forma farmacêutica e embalagem

2. Tabela "instituicoes":
   - id: VARCHAR (PK) - Ex: "INST-001"
   - nome: VARCHAR - Nome da unidade hospitalar ou administrativa
   - tipo: VARCHAR - Tipo de estabelecimento ("Hospital", "UPA", "Farmácia de Alto Custo", "Almoxarifado", "UBS")
   - cidade: VARCHAR - Cidade de localização
   - uf: VARCHAR(2) - Estado

3. Tabela "estoques":
   - id: VARCHAR (PK) - Ex: "EST-001"
   - medicamento_id: VARCHAR (FK -> medicamentos.id)
   - instituicao_id: VARCHAR (FK -> instituicoes.id)
   - quantidade: INTEGER - Quantidade física em estoque atualmente
   - lote: VARCHAR - Código do lote
   - validade: DATE - Data de vencimento (Formato YYYY-MM-DD)
   - demanda_mensal: INTEGER - Média de consumo mensal da unidade para este item

4. Tabela "movimentacoes":
   - id: VARCHAR (PK)
   - medicamento_id: VARCHAR (FK -> medicamentos.id)
   - instituicao_id: VARCHAR (FK -> instituicoes.id)
   - tipo: VARCHAR - "Entrada", "Saída", "Dispensação", "Transferência"
   - quantidade: INTEGER - Quantidade movimentada
   - lote: VARCHAR
   - data: TIMESTAMP - Data da ocorrência (YYYY-MM-DD HH:mm:ss)
   - responsavel: VARCHAR - Nome do profissional responsável
   - destino_origem: VARCHAR - Informações de origem/destino da transação

### REGRAS DE NEGÓCIO DE DESABASTECIMENTO:
- Dias de Cobertura (Autonomia) = quantidade / (demanda_mensal / 30.0)
- Nível de Risco de Desabastecimento:
  - Se quantidade = 0: "DESABASTECIDO" (Alerta máximo!)
  - Se Dias de Cobertura < 15: Risco "CRÍTICO" (Risco iminente de desabastecimento)
  - Se Dias de Cobertura entre 15 e 29.9: Risco "MODERADO" (Requer monitoramento)
  - Se Dias de Cobertura >= 30: Risco "BAIXO" (Estoque saudável)
- Alerta de Vencimento: Se a validade estiver a menos de 30 dias da data atual do sistema (Considere hoje como: 2026-07-17).

### DADOS REAIS ATUAIS (FORMATO JSON):
- Medicamentos: ${JSON.stringify(MEDICAMENTOS_MOCK)}
- Instituicoes: ${JSON.stringify(INSTITUICOES_MOCK)}
- Estoques: ${JSON.stringify(ESTOQUES_MOCK)}
- Movimentações: ${JSON.stringify(MOVIMENTACOES_MOCK)}

### DIRETRIZES DE RESPOSTA:
1. Responda em Português do Brasil de forma extremamente clara, profissional e analítica.
2. Sempre que apropriado, monte pequenas tabelas em Markdown comparando estoques, demanda, dias de cobertura e riscos.
3. Se o usuário perguntar sobre o risco de desabastecimento, faça as contas matemáticas e mostre os resultados exatos (ex: "X dias de cobertura, configurando risco CRÍTICO").
4. Forneça o comando SQL correspondente que o desenvolvedor usaria no PostgreSQL para obter essa informação real do banco de dados, enriquecendo o caráter técnico da plataforma.
5. Seja proativo e sugira ações práticas, como "Recomenda-se transferência de X unidades do Almoxarifado Central (MED-XXX) para sanar o desabastecimento imediato na UPA Sobradinho".
`.trim();

      // Fazer chamada ao Gemini utilizando o SDK moderno @google/genai
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: query,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3, // Menor temperatura para respostas lógicas e focadas nos dados
        }
      });

      res.json({
        response: response.text || "Não foi possível gerar um insight com base na pergunta."
      });
    } catch (error: any) {
      console.error("Erro na rota Gemini:", error);
      res.status(500).json({ error: "Erro ao processar requisição de IA", details: error.message });
    }
  });

  // --- CONFIGURAÇÃO DO VITE E SERVIÇO DE ATIVOS ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Observatório Backend] Servidor rodando na porta ${PORT}`);
  });
}

startServer();
