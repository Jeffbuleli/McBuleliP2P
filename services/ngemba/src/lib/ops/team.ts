/** Équipe du hackathon. Chacun peut prendre un cas. Le devoir dit qui commence. */
export type JuryMember = {
  id: string;
  name: string;
  email: string;
  duty: string;
  env: string;
};

export const JURY_TEAM: JuryMember[] = [
  {
    id: "jeff",
    name: "Jeff Buleli",
    email: "mcbuleli@gmail.com",
    duty: "Coordination. Vous confirmez qui prend le cas.",
    env: "NGEMBA_OPS_TOKEN_JEFF",
  },
  {
    id: "jeremie",
    name: "Jérémie Kimbiya",
    email: "jeremiekimbiya@gmail.com",
    duty: "VBG et protection. Vous prenez violence, enfant et maison.",
    env: "NGEMBA_OPS_TOKEN_JEREMIE",
  },
  {
    id: "joyce",
    name: "Joyce Dahudi",
    email: "jdahudi@gmail.com",
    duty: "SOS. Vous prenez le danger immédiat.",
    env: "NGEMBA_OPS_TOKEN_JOYCE",
  },
  {
    id: "timothe",
    name: "Timothée S.",
    email: "timtshiey@gmail.com",
    duty: "Témoin. Vous lisez le résumé et répondez en premier.",
    env: "NGEMBA_OPS_TOKEN_TIMOTHE",
  },
];

/** Après le hackathon, seul Jeff reçoit les alertes par courriel. */
const ALERT_EMAIL_IDS = new Set(["jeff"]);

export function juryEmails(): string[] {
  return JURY_TEAM.filter((member) => ALERT_EMAIL_IDS.has(member.id)).map(
    (member) => member.email,
  );
}
