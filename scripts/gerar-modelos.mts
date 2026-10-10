// Gera as planilhas-modelo (.xlsx) em public/modelos a partir dos formatos em src/lib/templates.ts.
// Uso: npm run modelos
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { TEMPLATES, type TemplateDataset, type ColunaTemplate } from "../src/lib/templates.ts";

const SAIDA = path.resolve("public/modelos");
const AZUL = "FF1D4ED8";
const AZUL_ESCURO = "FF1E3A8A";
const LINHAS_VALIDACAO = 2000;

const rotuloCabecalho = (c: ColunaTemplate) => (c.obrigatoria ? `${c.rotulo} *` : c.rotulo);
const formatoTexto = (c: ColunaTemplate) =>
  c.tipo === "data" ? "Data (DD/MM/AAAA)"
  : c.tipo === "numero" ? "Número"
  : c.tipo === "opcao" ? `Lista: ${c.opcoes?.join(" / ")}`
  : "Texto";

function larguraColuna(c: ColunaTemplate): number {
  const base = Math.max(rotuloCabecalho(c).length + 4, c.tipo === "texto" ? 28 : 16);
  return Math.min(base, 48);
}

async function gerar(t: TemplateDataset) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Observatório da Assistência Farmacêutica do RN";

  // 1ª aba: dados (é a aba lida pelo sistema)
  const ws = wb.addWorksheet("Dados", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = t.colunas.map((c) => ({ key: c.id, width: larguraColuna(c) }));
  const cab = ws.getRow(1);
  cab.height = 30;
  t.colunas.forEach((c, i) => {
    const cell = cab.getCell(i + 1);
    cell.value = rotuloCabecalho(c);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: c.obrigatoria ? AZUL_ESCURO : AZUL } };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cell.border = { right: { style: "thin", color: { argb: "FFFFFFFF" } } };
    cell.note = { texts: [{ text: `${c.ajuda}\nFormato: ${formatoTexto(c)}${c.obrigatoria ? "\nObrigatório." : ""}` }] } as ExcelJS.Comment;
  });

  t.colunas.forEach((c, i) => {
    const col = ws.getColumn(i + 1);
    if (c.tipo === "data") col.numFmt = "dd/mm/yyyy";
    else if (c.tipo === "numero") col.numFmt = c.id === "ano" ? "0" : "#,##0.00";
    else col.numFmt = "@";
    for (let r = 2; r <= LINHAS_VALIDACAO; r++) {
      const cell = ws.getCell(r, i + 1);
      if (c.tipo === "opcao" && c.opcoes) {
        cell.dataValidation = {
          type: "list",
          allowBlank: !c.obrigatoria,
          formulae: [`"${c.opcoes.join(",")}"`],
          showErrorMessage: true,
          errorTitle: "Valor inválido",
          error: `Escolha uma opção da lista: ${c.opcoes.join(", ")}.`,
        };
      } else if (c.tipo === "numero") {
        cell.dataValidation = {
          type: "decimal",
          operator: "greaterThanOrEqual",
          formulae: [0],
          allowBlank: !c.obrigatoria,
          showErrorMessage: true,
          errorTitle: "Número inválido",
          error: "Digite apenas números (use vírgula para decimais).",
        };
      } else if (c.tipo === "data") {
        cell.dataValidation = {
          type: "date",
          operator: "greaterThan",
          formulae: [new Date(Date.UTC(2000, 0, 1))],
          allowBlank: !c.obrigatoria,
          showErrorMessage: true,
          errorTitle: "Data inválida",
          error: "Digite uma data no formato DD/MM/AAAA.",
        };
      }
    }
  });

  // 2ª aba: instruções (ignorada pelo sistema)
  const wi = wb.addWorksheet("Instruções");
  wi.columns = [{ width: 32 }, { width: 14 }, { width: 38 }, { width: 52 }, { width: 38 }];
  wi.mergeCells("A1:E1");
  wi.getCell("A1").value = `Planilha-modelo: ${t.titulo}`;
  wi.getCell("A1").font = { bold: true, size: 14, color: { argb: AZUL_ESCURO } };
  wi.getRow(1).height = 26;
  const passos = [
    t.descricao,
    "1. Preencha a aba \"Dados\": uma linha para cada registro, a partir da linha 2. Não altere a linha de títulos (linha 1).",
    "2. Colunas com * são obrigatórias. Onde houver lista, escolha uma opção na própria célula.",
    "3. Datas no formato DD/MM/AAAA. Números sem R$ nem pontos de milhar (use vírgula nos decimais).",
    "4. Salve como .xlsx e envie em Administração > Importar planilha. Esta aba de instruções é ignorada pelo sistema.",
  ];
  passos.forEach((p, i) => {
    wi.mergeCells(`A${i + 2}:E${i + 2}`);
    wi.getCell(`A${i + 2}`).value = p;
    wi.getCell(`A${i + 2}`).alignment = { wrapText: true, vertical: "top" };
    wi.getRow(i + 2).height = i === 0 ? 20 : 32;
  });
  const topo = passos.length + 3;
  ["Coluna", "Obrigatória", "Formato", "Como preencher", "Exemplo"].forEach((h, i) => {
    const cell = wi.getCell(topo, i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL } };
  });
  t.colunas.forEach((c, i) => {
    const r = topo + 1 + i;
    wi.getCell(r, 1).value = rotuloCabecalho(c);
    wi.getCell(r, 1).font = { bold: true };
    wi.getCell(r, 2).value = c.obrigatoria ? "Sim" : "Não";
    wi.getCell(r, 3).value = formatoTexto(c);
    wi.getCell(r, 4).value = c.ajuda;
    wi.getCell(r, 5).value = String(c.exemplo);
    for (let k = 1; k <= 5; k++) {
      wi.getCell(r, k).alignment = { wrapText: true, vertical: "top" };
      wi.getCell(r, k).border = { bottom: { style: "hair", color: { argb: "FFCBD5E1" } } };
    }
  });

  const arquivo = path.join(SAIDA, `${t.id}.xlsx`);
  await wb.xlsx.writeFile(arquivo);
  return arquivo;
}

fs.mkdirSync(SAIDA, { recursive: true });
for (const f of fs.readdirSync(SAIDA)) if (f.endsWith(".csv")) fs.unlinkSync(path.join(SAIDA, f));
for (const t of TEMPLATES) console.log("gerado:", await gerar(t));
