#!/usr/bin/env node
/**
 * Align static partnership/broadcast email drafts with single-day event (28 Aug 2026).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIRS = [
  path.join(ROOT, "content/email-partnership"),
  path.join(ROOT, "content/email-broadcasts"),
];

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
  [/Day 1: Vibe Coding bootcamp/g, "One day: Vibe Coding bootcamp, build & awards"],
  [/• Jour 1 : bootcamp Vibe Coding/g, "• Bootcamp Vibe Coding, build & Mini Demo Day"],
  [/• Day 1: Vibe Coding bootcamp/g, "• Vibe Coding bootcamp, build & Mini Demo Day"],
  [/Jour 1, Jour 2, ou flexible/g, "créneau matin ou flexible"],
  [/Jour 1 \/ Jour 2 \/ flexible/g, "créneau matin ou flexible"],
  [/atelier Jour 1 \/ Jour 2 \/ flexible/g, "créneau atelier ou flexible"],
  [/sur 2 jours intensifs/g, "sur 1 journée intensive"],
  [/les 2 jours/g, "le jour J"],
  [/both days/g, "event day"],
];

const DROP_LINE =
  /Jour 2|Day 2:|29 Août|29 août|13 août 2026|Samedi Build & Demo Day|Day 2: Hackathon|• Jour 2|• Day 2/i;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(html|txt|md)$/i.test(name)) out.push(p);
  }
  return out;
}

let changed = 0;
for (const dir of DIRS) {
  for (const file of walk(dir)) {
    let text = fs.readFileSync(file, "utf8");
    const original = text;
    for (const [from, to] of REPLACEMENTS) {
      text = text.replace(from, to);
    }
    text = text
      .split("\n")
      .filter((line) => !DROP_LINE.test(line))
      .join("\n");
    if (text !== original) {
      fs.writeFileSync(file, text);
      changed++;
      console.log("updated", path.relative(ROOT, file));
    }
  }
}
console.log(`Done. ${changed} file(s) updated.`);
