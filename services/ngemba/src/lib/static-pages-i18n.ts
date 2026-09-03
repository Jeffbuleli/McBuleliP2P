import type { Locale } from "@/lib/i18n";
import {
  CGU_SECTIONS,
  CHARTE_ONG_SECTIONS,
  PRIVACY_SECTIONS,
  type StaticSection,
} from "@/lib/static-pages";

type PageKey = "resources" | "prevent" | "privacy" | "cgu" | "charter";

type PageCopy = { title: string; sections: StaticSection[] };

const RESOURCES: Record<Locale, PageCopy> = {
  fr: {
    title: "Aide et ressources",
    sections: [
      {
        title: "Numeros d'urgence (RDC)",
        body: [
          "Police : 112 ou commissariat le plus proche",
          "Pompiers : selon votre ville",
          "Urgence medicale : hopital ou centre de sante le plus proche",
          "En danger immediat : appelez d'abord les secours, puis NGEMBA si possible.",
        ],
      },
      {
        title: "Orientation NGEMBA",
        body: [
          "NGEMBA oriente vers un operateur humain - ce n'est pas un remplacement de la police ni des urgences medicales.",
          "Heures pilote : reponse humaine visee en quelques minutes.",
          "Hors horaires : alerte enregistree ; numeros d'urgence disponibles.",
        ],
      },
      {
        title: "Violences basees sur le genre (VBG)",
        body: [
          "Si vous etes en securite pour parler, utilisez SOS ou Parler.",
          "Mode discret : ecrivez peu de mots ; un operateur repondra par message.",
          "Ne restez pas seul si vous pouvez aller dans un lieu sur.",
        ],
      },
    ],
  },
  en: {
    title: "Help and resources",
    sections: [
      {
        title: "Emergency numbers (DRC)",
        body: [
          "Police: 112 or nearest station",
          "Fire: depends on your city",
          "Medical emergency: nearest hospital or clinic",
          "Immediate danger: call emergency services first, then NGEMBA if you can.",
        ],
      },
      {
        title: "NGEMBA orientation",
        body: [
          "NGEMBA connects you to a human operator - not a replacement for police or medical emergency.",
          "Pilot hours: human response targeted within minutes.",
          "Off hours: alert is saved; emergency numbers remain available.",
        ],
      },
      {
        title: "Gender-based violence (GBV)",
        body: [
          "If safe to speak, use SOS or Speak.",
          "Discrete mode: few words; an operator may reply by message.",
          "Do not stay alone if you can reach a safe place.",
        ],
      },
    ],
  },
  ln: {
    title: "Lisalisi mpe makambo ya lisalisi",
    sections: [
      {
        title: "Ba numeros ya likama (RDC)",
        body: [
          "Police : 112 to commissariat ya pembeni",
          "Bomoyi : na engumba na yo",
          "Likama ya mongongo : hopital to centre ya bokono",
          "Soki likama ya mbala moko : benga basungi liboso, sima NGEMBA soki okoki.",
        ],
      },
      {
        title: "Orientation NGEMBA",
        body: [
          "NGEMBA epesaka yo na moto ya lisalisi - ezali remplacement ya police to monganga te.",
          "Ngonga ya pilote : eyano ya moto na ba minutes.",
          "Na libanda ya ngonga : alerte ebombami ; ba numeros ya likama ezali.",
        ],
      },
      {
        title: "Violence sur base ya genre (VBG)",
        body: [
          "Soki ozali na kimya mpo na koloba, salela SOS to Loba.",
          "Mode ya bosembo : koma maloba moke ; moto akoyanola na message.",
          "Kofanda yo moko te soki okoki kokende na esika ya kimya.",
        ],
      },
    ],
  },
  sw: {
    title: "Msaada na rasilimali",
    sections: [
      {
        title: "Nambari za dharura (DRC)",
        body: [
          "Polisi: 112 au kituo cha karibu",
          "Zima moto: kulingana na jiji lako",
          "Dharura ya afya: hospitali au kliniki ya karibu",
          "Hatari ya papo hapo: piga huduma za dharura kwanza, kisha NGEMBA ikiwezekana.",
        ],
      },
      {
        title: "Uelekezo wa NGEMBA",
        body: [
          "NGEMBA inakuunganisha na mwendeshaji - si badala ya polisi au dharura ya afya.",
          "Saa za majaribio: majibu ya binadamu ndani ya dakika chache.",
          "Nje ya saa: tahadhari imehifadhiwa; nambari za dharura zinapatikana.",
        ],
      },
      {
        title: "Ukatili wa kijinsia (GBV)",
        body: [
          "Ikiwa salama kuongea, tumia SOS au Ongea.",
          "Hali ya siri: maneno machache; mwendeshaji anaweza kujibu kwa ujumbe.",
          "Usikae peke yako ukiweza kwenda mahali salama.",
        ],
      },
    ],
  },
  lua: {
    title: "Dishinda ne makambo",
    sections: [
      {
        title: "Ba numeros ya dikama (RDC)",
        body: [
          "Police : 112 to commissariat ya pembeni",
          "Bomoyi : mu cishi na nge",
          "Dikama ya bupole : hopital to centre ya bokono",
          "Nangu dikama ya mbala moko : bikila basadishi liboso, sima NGEMBA nguwe udi.",
        ],
      },
      {
        title: "Orientation NGEMBA",
        body: [
          "NGEMBA ukupesha muntu wa dishinda - kechi remplacement ya police to monganga.",
          "Ngonga ya pilote : eyano ya muntu mu ba minutes.",
          "Na libanda ya ngonga : alerte ibombami ; ba numeros ya dikama diudi.",
        ],
      },
      {
        title: "Violence sur base ya genre (VBG)",
        body: [
          "Nguwe udi mu mutende wa kuamba, sadisha SOS to Amba.",
          "Mode ya bosembo : soneka maloba moke ; muntu ukomonanga na message.",
          "Kukala wewe moko kechi nguwe udi kuenda mu kala ya mutende.",
        ],
      },
    ],
  },
  kg: {
    title: "Lusadisu mpe makambo",
    sections: [
      {
        title: "Ba numeros ya zingu (RDC)",
        body: [
          "Police : 112 to commissariat ya pembeni",
          "Bomoyi : na engumba na nge",
          "Zingu ya bokono : hopital to centre ya bokono",
          "Kana zingu ya mbala moko : binga basadisi liboso, sima NGEMBA soki okoki.",
        ],
      },
      {
        title: "Orientation NGEMBA",
        body: [
          "NGEMBA ke pesaka nge na muntu ya lusadisu - kele remplacement ya police to monganga ve.",
          "Ngonga ya pilote : eyano ya muntu na ba minutes.",
          "Na libanda ya ngonga : alerte me bumbama ; ba numeros ya zingu kele.",
        ],
      },
      {
        title: "Violence sur base ya genre (VBG)",
        body: [
          "Soki kele na mutende ya kuvova, sala SOS to Vova.",
          "Mode ya bosembo : sonika bangogo fioti ; muntu ta zabisa na message.",
          "Kuvanda yo moko ve soki okoki kukwenda na kisika ya mutende.",
        ],
      },
    ],
  },
};

const PREVENT: Record<Locale, PageCopy> = {
  fr: {
    title: "Prevenir",
    sections: [
      {
        title: "Avant une situation",
        body: [
          "Identifiez un contact de confiance.",
          "Reperez les lieux surs pres de chez vous.",
          "En zone a risque, deplacements accompagnes si possible.",
        ],
      },
      {
        title: "Si vous etes temoin",
        body: [
          "Ne vous mettez jamais en danger pour filmer ou intervenir.",
          "Signalez via Temoin : lieu, type de situation, heure.",
          "Appelez les urgences si une vie est en danger immediat.",
        ],
      },
      {
        title: "Fausses alertes",
        body: [
          "NGEMBA est un service de confiance.",
          "Les fausses alertes repetees peuvent limiter l'acces.",
        ],
      },
    ],
  },
  en: {
    title: "Prevent",
    sections: [
      {
        title: "Before a situation",
        body: [
          "Identify a trusted contact.",
          "Note safe places near you.",
          "In risky areas, travel with others when possible.",
        ],
      },
      {
        title: "If you are a witness",
        body: [
          "Never put yourself in danger to film or intervene.",
          "Report via Witness: place, situation type, time.",
          "Call emergency services if a life is in immediate danger.",
        ],
      },
      {
        title: "False alerts",
        body: [
          "NGEMBA is a trust service.",
          "Repeated false alerts may limit access.",
        ],
      },
    ],
  },
  ln: {
    title: "Kobatela",
    sections: [
      {
        title: "Liboso ya likambo",
        body: [
          "Yeba moto oyo ozali kondima.",
          "Yeba bisika ya kimya pembeni na yo.",
          "Na esika ya likama, tambola na bato soki okoki.",
        ],
      },
      {
        title: "Soki ozali momonisi",
        body: [
          "Kotia yo te na likama mpo na kofilmer to kosala.",
          "Yebisa na Temoin : esika, likambo, ngonga.",
          "Benga basungi soki bomoi ezali na likama.",
        ],
      },
      {
        title: "Ba fausses alertes",
        body: [
          "NGEMBA ezali service ya confiance.",
          "Ba fausses alertes epekisi access.",
        ],
      },
    ],
  },
  sw: {
    title: "Zuia",
    sections: [
      {
        title: "Kabla ya hali",
        body: [
          "Tambua mtu unayemwamini.",
          "Jua maeneo salama karibu nawe.",
          "Katika maeneo hatari, safiri na wengine ikiwezekana.",
        ],
      },
      {
        title: "Ukiwa shahidi",
        body: [
          "Usijihatarishe kupiga video au kuingilia.",
          "Ripoti kupitia Shahidi: eneo, aina ya hali, muda.",
          "Piga dharura ikiwa maisha yako hatarini.",
        ],
      },
      {
        title: "Tahadhari za uongo",
        body: [
          "NGEMBA ni huduma ya kuaminiana.",
          "Tahadhari za uongo zinaweza kupunguza ufikiaji.",
        ],
      },
    ],
  },
  lua: {
    title: "Lukengela",
    sections: [
      {
        title: "Liboso ya dikama",
        body: [
          "Mona muntu udi ukengela.",
          "Mona bisika ya mutende pembeni na nge.",
          "Mu kala ya dikama, tamba ne bantu nguwe udi.",
        ],
      },
      {
        title: "Nguwe udi mumonishi",
        body: [
          "Ke ika wewe mu dikama mpo na kufilmer to kusala.",
          "Ambila na Mumonishi : kala, dikama, ngonga.",
          "Bikila basadishi nguwe bomoi budi mu dikama.",
        ],
      },
      {
        title: "Ba fausses alertes",
        body: [
          "NGEMBA kele service ya confiance.",
          "Ba fausses alertes dipeki access.",
        ],
      },
    ],
  },
  kg: {
    title: "Lunda",
    sections: [
      {
        title: "Liboso ya zingu",
        body: [
          "Mona muntu oyo kele na kondima.",
          "Yeba bisika ya mutende pembeni na nge.",
          "Na kisika ya zingu, tamba ti bantu soki okoki.",
        ],
      },
      {
        title: "Soki kele nsungidi",
        body: [
          "Kutula nge ve na zingu mpo na kofilmer to kusala.",
          "Zabisa na Nsungidi : kisika, zingu, ngonga.",
          "Binga basadisi kana bomoi kele na zingu.",
        ],
      },
      {
        title: "Ba fausses alertes",
        body: [
          "NGEMBA kele service ya confiance.",
          "Ba fausses alertes ke pesa limite na access.",
        ],
      },
    ],
  },
};

function legalPage(
  locale: Locale,
  titleFr: string,
  sectionsFr: StaticSection[],
): PageCopy {
  const notice: Record<Locale, string> = {
    fr: "",
    en: "Legal draft in French - full translation coming.",
    ln: "Mokanda ya mibeko ezali na lifalans - ndimbola mobimba ezali koya.",
    sw: "Hati ya kisheria kwa Kifaransa - tafsiri kamili inakuja.",
    lua: "Mokanda ya mibeko ezali na lifalans - ndimbola mobimba ezali koya.",
    kg: "Mokanda ya mibeko ezali na lifalans - ndimbola mobimba ke kwisa.",
  };
  const n = notice[locale];
  return {
    title: titleFr,
    sections: n ? [{ title: n, body: [] }, ...sectionsFr] : sectionsFr,
  };
}

const PAGES: Record<PageKey, Record<Locale, PageCopy>> = {
  resources: RESOURCES,
  prevent: PREVENT,
  privacy: Object.fromEntries(
    (["fr", "en", "ln", "sw", "lua", "kg"] as Locale[]).map((l) => [
      l,
      legalPage(l, "Confidentialite (brouillon pilote)", PRIVACY_SECTIONS),
    ]),
  ) as Record<Locale, PageCopy>,
  cgu: Object.fromEntries(
    (["fr", "en", "ln", "sw", "lua", "kg"] as Locale[]).map((l) => [
      l,
      legalPage(l, "Conditions d'utilisation (brouillon)", CGU_SECTIONS),
    ]),
  ) as Record<Locale, PageCopy>,
  charter: Object.fromEntries(
    (["fr", "en", "ln", "sw", "lua", "kg"] as Locale[]).map((l) => [
      l,
      legalPage(l, "Charte operateur ONG (brouillon)", CHARTE_ONG_SECTIONS),
    ]),
  ) as Record<Locale, PageCopy>,
};

export function getStaticPage(page: PageKey, locale: Locale): PageCopy {
  const bucket = PAGES[page];
  return bucket[locale] ?? bucket.fr;
}

export type { PageKey };
