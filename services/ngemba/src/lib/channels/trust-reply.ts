import type { AlertSessionRecord } from "@/lib/sessions/types";

type Source = AlertSessionRecord["source"];

type Opening = {
  now: string;
  school: string;
  witness: string;
  sos: string;
};

const OPENING: Record<string, Opening> = {
  fr: {
    now: "Je vous crois. Là, c'est grave. Une personne de l'équipe reprend cet échange. Si vous le pouvez, mettez-vous en lieu sûr. Vous pouvez continuer à écrire ici.",
    school:
      "Bonjour. Ici Ngemba. Vous pouvez parler de violences, à la maison ou ailleurs, sans donner votre nom et sans tout raconter. Je comprends d'abord, puis je vous oriente. L'équipe n'est appelée que si c'est vraiment grave. Qu'est-ce qui se passe ?",
    witness:
      "Merci. Restez à distance, ne vous approchez pas. Décrivez ce que vous voyez, sans vous mettre en danger. L'équipe n'est appelée que si la situation l'exige.",
    sos: "Je suis avec vous. Vous n'avez pas à tout raconter d'un coup. Dites ce qui se passe, avec vos mots. Je pose une question à la fois. L'équipe n'est appelée que si cela devient vraiment grave.",
  },
  en: {
    now: "I believe you. This is serious right now. Someone from the team is taking over. If you can, move somewhere safer. You can keep writing here.",
    school:
      "Hello. This is Ngemba. You can talk about violence, at home or elsewhere, without giving your name and without telling everything. I listen first, then I guide you. The team is called only if it is truly serious. What is happening?",
    witness:
      "Thank you. Stay back and do not approach. Describe what you see without putting yourself in danger. The team is called only if the situation requires it.",
    sos: "I am with you. You do not have to tell everything at once. Say what is happening, in your own words. I ask one question at a time. The team is called only if this becomes truly serious.",
  },
  ln: {
    now: "Nandimi yo. Sikoyo ezali makasi. Moto ya ekipi azwi likambo. Soki okoki, kende na esika ya kimia. Okoki kokoba kokoma awa.",
    school:
      "Mbote. Nazali Ngemba. Oloba na makama, na ndako to na esika mosusu, nkombo ezali te, oyebisa nionso te. Nokutana liboso, nsima nakotinda yo. Ekipi ebengami kaka soki ezali makasi mpenza. Nini ezali koleka?",
    witness:
      "Matondi. Tikala mosika, kokende pene te. Yebisa oyo omoni, kasi kota na likama te. Ekipi ebengami kaka soki esengeli.",
    sos: "Nazali na yo. Oyebisa nionso mbala moko te. Yebisa oyo ezali koleka, na maloba na yo. Natuni motuna moko moko. Ekipi ebengami kaka soki ezali makasi mpenza.",
  },
  sw: {
    now: "Nakusadiki. Hii ni hatari sasa. Mtu wa timu anachukua mazungumzo. Ukiweza, nenda mahali salama. Unaweza kuendelea kuandika hapa.",
    school:
      "Habari. Mimi ni Ngemba. Unaweza kuongea kuhusu vurugu, nyumbani au kwingine, bila kutoa jina na bila kusema yote. Nasikiliza kwanza, kisha nakuelekeza. Timu inaitwa tu ikiwa ni hatari sana. Nini kinaendelea?",
    witness:
      "Asante. Kaa mbali, usikaribie. Eleza unachokiona bila kujiweka hatarini. Timu inaitwa tu ikiwa hali inahitaji.",
    sos: "Niko nawe. Huna lazima kusema yote mara moja. Sema kinachoendelea, kwa maneno yako. Ninauliza swali moja moja. Timu inaitwa tu ikiwa inakuwa hatari sana.",
  },
};

function pack(locale: string): Opening {
  return OPENING[locale] ?? OPENING.fr;
}

/** Premier message de Ngemba IA dans le chat de l'application. */
export function trustOpening(input: {
  locale: string;
  source: Source;
  humanNow: boolean;
}): string {
  const text = pack(input.locale);
  if (input.humanNow) return text.now;
  if (input.source === "school") return text.school;
  if (input.source === "witness") return text.witness;
  return text.sos;
}
