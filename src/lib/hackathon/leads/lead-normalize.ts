/**
 * Email + field hygiene for hackathon lead import.
 */

import {
  canonicalEmailForDedup,
  fixKnownEmailDomainTypo,
  isRetiredOrSystemEmail,
  normalizeAuthEmail,
} from "@/lib/auth/email-normalize";

/** Practical email shape check (not full RFC). */
const EMAIL_RE =
  /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

export function isValidLeadEmail(raw: string): boolean {
  const email = normalizeAuthEmail(raw);
  if (!email || email.length > 255) return false;
  if (isRetiredOrSystemEmail(email)) return false;
  if (!EMAIL_RE.test(email)) return false;
  const at = email.lastIndexOf("@");
  const domain = email.slice(at + 1);
  if (!domain.includes(".")) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  return true;
}

export function normalizeLeadEmail(raw: string): {
  email: string;
  emailCanonical: string;
  valid: boolean;
  typoFixed: boolean;
} {
  const { email, fixed } = fixKnownEmailDomainTypo(raw);
  const normalized = normalizeAuthEmail(email);
  const valid = isValidLeadEmail(normalized);
  return {
    email: normalized,
    emailCanonical: valid
      ? canonicalEmailForDedup(normalized)
      : canonicalEmailForDedup(normalized || raw),
    valid,
    typoFixed: fixed,
  };
}

export function cleanText(raw: unknown, max = 200): string {
  if (raw == null) return "";
  return String(raw).replace(/\s+/g, " ").trim().slice(0, max);
}

export function parseSkills(raw: unknown): string[] {
  if (raw == null || raw === "") return [];
  if (Array.isArray(raw)) {
    return raw
      .map((s) => cleanText(s, 80))
      .filter(Boolean)
      .slice(0, 40);
  }
  return String(raw)
    .split(/[,;|/]+/)
    .map((s) => cleanText(s, 80))
    .filter(Boolean)
    .slice(0, 40);
}

export function parseExperienceYears(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.round(raw);
    return n >= 0 && n <= 60 ? n : null;
  }
  const m = String(raw).match(/(\d{1,2})/);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 0 && n <= 60 ? n : null;
}

export function splitFullName(full: string): {
  firstName: string;
  lastName: string;
} {
  const parts = cleanText(full, 160).split(" ").filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}

/** Map flexible CSV/XLSX headers → canonical field keys. */
const HEADER_ALIASES: Record<string, string> = {
  firstname: "firstName",
  first_name: "firstName",
  prenom: "firstName",
  prénom: "firstName",
  givenname: "firstName",
  given_name: "firstName",
  lastname: "lastName",
  last_name: "lastName",
  nom: "lastName",
  surname: "lastName",
  familyname: "lastName",
  family_name: "lastName",
  fullname: "fullName",
  full_name: "fullName",
  name: "fullName",
  nomcomplet: "fullName",
  "nom complet": "fullName",
  email: "email",
  "e-mail": "email",
  mail: "email",
  courriel: "email",
  phone: "phone",
  telephone: "phone",
  téléphone: "phone",
  tel: "phone",
  mobile: "phone",
  whatsapp: "phone",
  linkedin: "linkedinUrl",
  linkedinurl: "linkedinUrl",
  linkedin_url: "linkedinUrl",
  "linkedin url": "linkedinUrl",
  company: "company",
  entreprise: "company",
  societe: "company",
  société: "company",
  organisation: "company",
  organization: "company",
  jobtitle: "jobTitle",
  job_title: "jobTitle",
  titre: "jobTitle",
  poste: "jobTitle",
  profession: "jobTitle",
  role: "jobTitle",
  title: "jobTitle",
  location: "location",
  city: "location",
  ville: "location",
  localisation: "location",
  skills: "skills",
  competences: "skills",
  compétences: "skills",
  skill: "skills",
  experience: "experienceYears",
  experienceyears: "experienceYears",
  experience_years: "experienceYears",
  expérience: "experienceYears",
  annees: "experienceYears",
  années: "experienceYears",
  source: "source",
  notes: "notes",
  note: "notes",
  comment: "notes",
  commentaire: "notes",
  consent: "consent",
  consentement: "consent",
  status: "statusHint",
};

export function normalizeHeader(raw: string): string | null {
  const key = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  // Rebuild lookup without accents for French keys already listed
  const compact = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return (
    HEADER_ALIASES[raw.trim().toLowerCase()] ??
    HEADER_ALIASES[compact] ??
    HEADER_ALIASES[key] ??
    null
  );
}

export type LeadImportRawRow = Record<string, unknown>;

export type NormalizedLeadDraft = {
  firstName: string;
  lastName: string;
  email: string;
  emailCanonical: string;
  emailValid: boolean;
  typoFixed: boolean;
  phone: string | null;
  linkedinUrl: string | null;
  company: string | null;
  jobTitle: string | null;
  location: string | null;
  skills: string[];
  experienceYears: number | null;
  source: string;
  notes: string | null;
  consent: boolean | null;
};

export function draftFromRawRow(
  raw: LeadImportRawRow,
  defaultSource: string,
): NormalizedLeadDraft {
  const get = (k: string) => raw[k];

  let firstName = cleanText(get("firstName"), 80);
  let lastName = cleanText(get("lastName"), 80);
  if ((!firstName || !lastName) && get("fullName")) {
    const split = splitFullName(String(get("fullName")));
    if (!firstName) firstName = split.firstName;
    if (!lastName) lastName = split.lastName;
  }
  if (!firstName && lastName) {
    firstName = lastName;
    lastName = "";
  }

  const emailNorm = normalizeLeadEmail(cleanText(get("email"), 255));
  const linkedin = cleanText(get("linkedinUrl"), 500);
  const consentRaw = get("consent");
  let consent: boolean | null = null;
  if (consentRaw != null && String(consentRaw).trim() !== "") {
    const c = String(consentRaw).trim().toLowerCase();
    consent = ["1", "true", "yes", "oui", "y", "ok"].includes(c);
  }

  return {
    firstName: firstName || "Prospect",
    lastName,
    email: emailNorm.email,
    emailCanonical: emailNorm.emailCanonical,
    emailValid: emailNorm.valid,
    typoFixed: emailNorm.typoFixed,
    phone: cleanText(get("phone"), 40) || null,
    linkedinUrl: linkedin || null,
    company: cleanText(get("company"), 160) || null,
    jobTitle: cleanText(get("jobTitle"), 160) || null,
    location: cleanText(get("location"), 160) || null,
    skills: parseSkills(get("skills")),
    experienceYears: parseExperienceYears(get("experienceYears")),
    source: cleanText(get("source"), 64) || defaultSource,
    notes: cleanText(get("notes"), 2000) || null,
    consent,
  };
}
