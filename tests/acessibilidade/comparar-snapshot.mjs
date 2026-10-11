import { readFileSync } from "node:fs";

// Compara duas fotografias de snapshot.mjs e mostra onde o HTML, o título ou o foco mudaram.
const [, , arqA, arqB] = process.argv;
const a = JSON.parse(readFileSync(arqA, "utf8"));
const b = JSON.parse(readFileSync(arqB, "utf8"));
let dif = 0;
for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
  if (!a[k] || !b[k]) { dif++; console.log("só em um dos lados:", k); continue; }
  const partes = [];
  if (a[k].html !== b[k].html) {
    const x = a[k].html, y = b[k].html;
    let i = 0;
    while (i < x.length && x[i] === y[i]) i++;
    partes.push(`HTML difere a partir do caractere ${i}: antes «${x.slice(Math.max(0, i - 40), i + 80)}» depois «${y.slice(Math.max(0, i - 40), i + 80)}»`);
  }
  if (a[k].titulo !== b[k].titulo) partes.push(`título: «${a[k].titulo}» -> «${b[k].titulo}»`);
  if (a[k].foco !== b[k].foco) partes.push(`foco: «${a[k].foco}» -> «${b[k].foco}»`);
  if (partes.length) { dif++; console.log("DIFERENTE:", k, "\n  " + partes.join("\n  ")); }
}
console.log(`${Object.keys(a).length} telas comparadas, ${dif} com diferença`);
process.exit(dif ? 1 : 0);
