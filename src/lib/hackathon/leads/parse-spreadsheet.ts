/**
 * Parse CSV / XLSX buffers into row objects for lead import.
 * CSV: zero dependency. XLSX: optional `xlsx` package.
 */

import { normalizeHeader, type LeadImportRawRow } from "./lead-normalize";

function detectDelimiter(headerLine: string): "," | ";" | "\t" {
  const counts = {
    ",": (headerLine.match(/,/g) ?? []).length,
    ";": (headerLine.match(/;/g) ?? []).length,
    "\t": (headerLine.match(/\t/g) ?? []).length,
  };
  if (counts["\t"] >= counts[","] && counts["\t"] >= counts[";"]) return "\t";
  if (counts[";"] > counts[","]) return ";";
  return ",";
}

/** RFC4180-ish CSV line parser (handles quotes). */
function parseCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === delimiter) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function parseCsvToRawRows(text: string): {
  rows: LeadImportRawRow[];
  headers: string[];
  errors: string[];
} {
  const errors: string[] = [];
  const cleaned = stripBom(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], headers: [], errors: ["empty_file"] };
  }

  const delimiter = detectDelimiter(lines[0]!);
  const headerCells = parseCsvLine(lines[0]!, delimiter);
  const mapped = headerCells.map((h) => normalizeHeader(h));
  if (!mapped.some((h) => h === "email") && !mapped.some((h) => h === "fullName")) {
    // still allow if any email-like column failed alias — require email mapping
  }
  if (!mapped.includes("email")) {
    errors.push("missing_email_column");
  }

  const headers = headerCells;
  const rows: LeadImportRawRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]!, delimiter);
    const row: LeadImportRawRow = {};
    for (let c = 0; c < mapped.length; c++) {
      const key = mapped[c];
      if (!key) continue;
      const val = (cells[c] ?? "").trim();
      if (val === "") continue;
      if (key === "skills" && row.skills) {
        row.skills = `${String(row.skills)};${val}`;
      } else {
        row[key] = val;
      }
    }
    if (Object.keys(row).length === 0) continue;
    rows.push(row);
  }

  return { rows, headers, errors };
}

export async function parseSpreadsheetBuffer(args: {
  filename: string;
  buffer: Buffer;
}): Promise<{
  rows: LeadImportRawRow[];
  headers: string[];
  errors: string[];
  format: "csv" | "xlsx";
}> {
  const name = args.filename.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(args.buffer, { type: "buffer", cellDates: false });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) {
        return {
          rows: [],
          headers: [],
          errors: ["empty_workbook"],
          format: "xlsx",
        };
      }
      const sheet = wb.Sheets[sheetName]!;
      const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(
        sheet,
        { header: 1, defval: "", raw: false },
      ) as unknown as (string | number | null)[][];
      if (!matrix.length) {
        return {
          rows: [],
          headers: [],
          errors: ["empty_sheet"],
          format: "xlsx",
        };
      }
      const headerCells = (matrix[0] ?? []).map((c) => String(c ?? "").trim());
      const mapped = headerCells.map((h) => normalizeHeader(h));
      const errors: string[] = [];
      if (!mapped.includes("email")) errors.push("missing_email_column");
      const rows: LeadImportRawRow[] = [];
      for (let i = 1; i < matrix.length; i++) {
        const cells = matrix[i] ?? [];
        const row: LeadImportRawRow = {};
        let empty = true;
        for (let c = 0; c < mapped.length; c++) {
          const key = mapped[c];
          if (!key) continue;
          const val = String(cells[c] ?? "").trim();
          if (!val) continue;
          empty = false;
          row[key] = val;
        }
        if (!empty) rows.push(row);
      }
      return { rows, headers: headerCells, errors, format: "xlsx" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "xlsx_parse_failed";
      if (/Cannot find module|ERR_MODULE_NOT_FOUND/i.test(msg)) {
        return {
          rows: [],
          headers: [],
          errors: ["xlsx_package_missing"],
          format: "xlsx",
        };
      }
      return {
        rows: [],
        headers: [],
        errors: [`xlsx_parse_failed:${msg}`],
        format: "xlsx",
      };
    }
  }

  const text = args.buffer.toString("utf8");
  const parsed = parseCsvToRawRows(text);
  return { ...parsed, format: "csv" };
}
