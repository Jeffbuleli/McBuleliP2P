import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export type SurveyAnswers = {
  concern: string | null;
  firstHelp: string | null;
  alertUseful: string | null;
  communityNeed: string | null;
  place: string | null;
  note: string | null;
};

export type SurveyRecord = {
  id: string;
  createdAt: string;
  locale: string;
  answers: SurveyAnswers;
};

const FILE = path.join(process.cwd(), "data", "surveys.json");

function readAll(): SurveyRecord[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    const raw = JSON.parse(fs.readFileSync(FILE, "utf8")) as SurveyRecord[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function saveSurvey(input: {
  locale: string;
  answers: SurveyAnswers;
}): SurveyRecord {
  const row: SurveyRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    locale: input.locale,
    answers: input.answers,
  };
  const all = readAll();
  all.push(row);
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(all));
  return row;
}
