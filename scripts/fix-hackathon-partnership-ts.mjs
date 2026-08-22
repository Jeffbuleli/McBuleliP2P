#!/usr/bin/env node
/** Patch partnership TS email builders for single-day event. */
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "src/lib/email/partnership");
const REPLACEMENTS = [
  [/28–29 Août 2026/g, "28 Août 2026"],
  [/28-29 août 2026/gi, "28 août 2026"],
  [/28 & 29 août 2026/gi, "28 août 2026"],
  [/2 Jours/g, "1 journée"],
  [/2 jours/g, "1 journée"],
  [/2 journees/gi, "1 journée"],
  [/2 Journées/g, "1 journée"],
  [/PROGRAMME \(2 JOURS\)/g, "PROGRAMME (1 JOURNÉE)"],
  [/Programme \(2 Jours\)/g, "Programme (1 journée)"],
  [/Format : Jour 1 bootcamp · Jour 2 compétition, pitch jury, prix\./g,
    "Format : 1 journée - bootcamp Vibe Coding, build, pitch jury et prix."],
  [/Format : Jour 1 bootcamp · Jour 2 hackathon, pitch jury, prix\./g,
    "Format : 1 journée - bootcamp Vibe Coding, build, pitch jury et prix."],
  [/sur 2 jours intensifs/g, "sur 1 journée intensive"],
  [/bootcamp 1 jour ou 2 jours \+ hackathon/g, "programme 1 journée (bootcamp + hackathon)"],
  [/Jour 1, Jour 2, ou flexible/g, "créneau matin ou flexible"],
  [/Jour 1 \/ Jour 2 \/ flexible/g, "créneau matin ou flexible"],
  [/vendredi 28 et samedi 29 août 2026/g, "vendredi 28 août 2026"],
  [/ven\. 28 &amp; sam\. 29 août 2026/g, "ven. 28 août 2026"],
  [/Confirmer l'accueil de l'événement les 28-29 août 2026/g,
    "Confirmer l'accueil de l'événement le 28 août 2026"],
];

const DROP =
  /^\s*["`-].*(?:29 Août|29 août|13 août|Jour 2|Samedi Build & Demo Day).*["`],?\s*$/;

let n = 0;
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith(".ts")) continue;
  const file = path.join(dir, name);
  let text = fs.readFileSync(file, "utf8");
  const orig = text;
  for (const [a, b] of REPLACEMENTS) text = text.replace(a, b);
  text = text
    .split("\n")
    .filter((line) => !DROP.test(line))
    .join("\n");
  if (text !== orig) {
    fs.writeFileSync(file, text);
    n++;
    console.log("patched", name);
  }
}
console.log(`${n} TS file(s) patched.`);
