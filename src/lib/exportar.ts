import Papa from "papaparse";
import { lerDataset, type Linha, type MetadadosDataset } from "./datasets";
import type { TemplateDataset } from "./templates";

// Exportação dos conjuntos publicados: CSV (separado por ponto e vírgula, UTF-8 com BOM, como os dados abertos brasileiros)
// e JSON com a descrição das colunas e a procedência. O CSV usa os identificadores das colunas no cabeçalho
// e datas AAAA-MM-DD, então pode ser enviado de volta pela importação da Administração.

export function gerarCsv(template: TemplateDataset, linhas: Linha[]): string {
  const colunas = template.colunas.map((c) => c.id);
  const dados = linhas.map((l) => colunas.map((c) => l[c] ?? ""));
  // escapeFormulae protege quem abre o arquivo em planilha: textos que começam com = + - @ não viram fórmula.
  const csv = Papa.unparse({ fields: colunas, data: dados }, { delimiter: ";", newline: "\r\n", escapeFormulae: true });
  return "﻿" + csv;
}

export function gerarJson(template: TemplateDataset, meta: MetadadosDataset, linhas: Linha[]): string {
  return JSON.stringify(
    {
      conjunto: template.id,
      titulo: template.titulo,
      descricao: template.descricao,
      fonte: meta.fonte,
      urlFonte: meta.urlFonte || null,
      periodo: meta.periodo || null,
      atualizadoEm: meta.atualizadoEm,
      metodo: meta.metodo,
      totalLinhas: linhas.length,
      colunas: template.colunas.map((c) => ({ id: c.id, rotulo: c.rotulo, tipo: c.tipo, ...(c.opcoes ? { opcoes: c.opcoes } : {}) })),
      dados: linhas,
    },
    null,
    2
  );
}

function salvar(nome: string, conteudo: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// Lê o conjunto publicado e baixa no formato escolhido.
export async function baixarConjunto(template: TemplateDataset, formato: "csv" | "json"): Promise<void> {
  const lido = await lerDataset(template.id);
  if (!lido || lido.linhas.length === 0) throw new Error("Este conjunto ainda não tem dados publicados.");
  const dia = lido.meta.atualizadoEm.slice(0, 10);
  const base = `observatorio-rn-${template.id}-${dia}`;
  if (formato === "csv") salvar(`${base}.csv`, gerarCsv(template, lido.linhas), "text/csv;charset=utf-8");
  else salvar(`${base}.json`, gerarJson(template, lido.meta, lido.linhas), "application/json;charset=utf-8");
}
