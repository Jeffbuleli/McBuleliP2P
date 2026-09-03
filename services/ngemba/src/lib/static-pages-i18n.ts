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
        title: "Numéros d'urgence (RDC)",
        body: [
          "Police : 112 ou commissariat le plus proche",
          "Pompiers : selon votre ville",
          "Urgence médicale : hôpital ou centre de santé le plus proche",
          "En danger immédiat : appelez d'abord les secours, puis NGEMBA si possible.",
        ],
      },
      {
        title: "Orientation NGEMBA",
        body: [
          "NGEMBA oriente vers un opérateur humain - ce n'est pas un remplacement de la police ni des urgences médicales.",
          "Heures pilote : réponse humaine visée en quelques minutes.",
          "Hors horaires : alerte enregistrée ; numéros d'urgence disponibles.",
        ],
      },
      {
        title: "Violences basées sur le genre (VBG)",
        body: [
          "Si vous êtes en sécurité pour parler, utilisez SOS ou Parler.",
          "Mode discret : écrivez peu de mots ; un opérateur répondra par message.",
          "Ne restez pas seul si vous pouvez aller dans un lieu sûr.",
        ],
      },
    ],
  },
  en: {
    title: "Help and Resources",
    sections: [
      {
        title: "Emergency Numbers (DRC)",
        body: [
          "Police: 112 or nearest police station",
          "Firefighters: depending on your city",
          "Medical emergency: nearest hospital or health center",
          "In immediate danger: call for help first, then NGEMBA if possible.",
        ],
      },
      {
        title: "NGEMBA Guidance",
        body: [
          "NGEMBA directs you to a human operator - it is not a replacement for police or medical emergencies.",
          "Pilot hours: human response aimed within minutes.",
          "Outside hours: recorded alert; emergency numbers available.",
        ],
      },
      {
        title: "Gender-Based Violence (GBV)",
        body: [
          "If you are safe to talk, use SOS or Talk.",
          "Discreet mode: write few words; an operator will respond via message.",
          "Do not stay alone if you can go to a safe place.",
        ],
      },
    ],
  },
  ln: {
    title: "Bokoli na Bantu",
    sections: [
      {
        title: "Mokolo ya Nganga (RDC)",
        body: [
          "Polisi: 112 to komisi ya polisi ya liboso",
          "Bokoli: ndenge na esika na yo",
          "Mokolo ya nzoto: hopital to centre ya nzoto ya liboso",
          "Na esika ya mpasi: yebisa liboso, nsima NGEMBA soki okoki.",
        ],
      },
      {
        title: "Mokano ya NGEMBA",
        body: [
          "NGEMBA ebandaka na mokonzi ya moto - ezali te lokola polisi to mokolo ya nzoto.",
          "Sikoyo ya malamu: koyebisa moto na miniti.",
          "Na nsima ya malamu: alerte ya kokoma; mokolo ya nganga ezali na esika.",
        ],
      },
      {
        title: "Mokolo ya Bantu (VBG)",
        body: [
          "Soki ozali na esika ya koloba, yebisa SOS to Koloba.",
          "Mokano ya kokanga: koloba makambo moke; mokonzi akokutana na yo na message.",
          "Soki okoki, soki ozali na esika ya kokanga, soki okoki.",
        ],
      },
    ],
  },
  sw: {
    title: "Msaada na Rasilimali",
    sections: [
      {
        title: "Nambari za Dharura (DRC)",
        body: [
          "Polisi: 112 au kituo cha polisi kilicho karibu",
          "Wakaguzi wa moto: kulingana na jiji lako",
          "Dharura ya matibabu: hospitali au kituo cha afya kilicho karibu",
          "Katika hatari ya papo hapo: piga simu kwa msaada kwanza, kisha NGEMBA ikiwa inawezekana.",
        ],
      },
      {
        title: "Mwongozo wa NGEMBA",
        body: [
          "NGEMBA inakuongoza kwa opereta wa kibinadamu - si mbadala wa polisi au dharura za matibabu.",
          "Saa za majaribio: jibu la kibinadamu linatarajiwa ndani ya dakika chache.",
          "Nje ya saa: tahadhari iliyorekodiwa; nambari za dharura zinapatikana.",
        ],
      },
      {
        title: "Vikosi vya Kijinsia (VBG)",
        body: [
          "Ikiwa uko salama kuzungumza, tumia SOS au Zungumza.",
          "Njia ya siri: andika maneno machache; opereta atajibu kwa ujumbe.",
          "Usikose kuwa peke yako ikiwa unaweza kwenda mahali salama.",
        ],
      },
    ],
  },
  lua: {
    title: "Bantu na Misa",
    sections: [
      {
        title: "Nambari za Dharura (RDC)",
        body: [
          "Polisi: 112 au kituo cha polisi kilicho karibu",
          "Wakaguzi wa moto: kulingana na jiji lako",
          "Dharura ya matibabu: hospitali au kituo cha afya kilicho karibu",
          "Katika hatari ya papo hapo: piga simu kwa msaada kwanza, kisha NGEMBA ikiwa inawezekana.",
        ],
      },
      {
        title: "Mwongozo wa NGEMBA",
        body: [
          "NGEMBA inakuongoza kwa opereta wa kibinadamu - si mbadala wa polisi au dharura za matibabu.",
          "Saa za majaribio: jibu la kibinadamu linatarajiwa ndani ya dakika chache.",
          "Nje ya saa: tahadhari iliyorekodiwa; nambari za dharura zinapatikana.",
        ],
      },
      {
        title: "Vikosi vya Kijinsia (VBG)",
        body: [
          "Ikiwa uko salama kuzungumza, tumia SOS au Zungumza.",
          "Njia ya siri: andika maneno machache; opereta atajibu kwa ujumbe.",
          "Usikose kuwa peke yako ikiwa unaweza kwenda mahali salama.",
        ],
      },
    ],
  },
  kg: {
    title: "Mokolo na Bantu",
    sections: [
      {
        title: "Nambari za Dharura (RDC)",
        body: [
          "Polisi: 112 au kituo cha polisi kilicho karibu",
          "Wakaguzi wa moto: kulingana na jiji lako",
          "Dharura ya matibabu: hospitali au kituo cha afya kilicho karibu",
          "Katika hatari ya papo hapo: piga simu kwa msaada kwanza, kisha NGEMBA ikiwa inawezekana.",
        ],
      },
      {
        title: "Mwongozo wa NGEMBA",
        body: [
          "NGEMBA inakuongoza kwa opereta wa kibinadamu - si mbadala wa polisi au dharura za matibabu.",
          "Saa za majaribio: jibu la kibinadamu linatarajiwa ndani ya dakika chache.",
          "Nje ya saa: tahadhari iliyorekodiwa; nambari za dharura zinapatikana.",
        ],
      },
      {
        title: "Vikosi vya Kijinsia (VBG)",
        body: [
          "Ikiwa uko salama kuzungumza, tumia SOS au Zungumza.",
          "Njia ya siri: andika maneno machache; opereta atajibu kwa ujumbe.",
          "Usikose kuwa peke yako ikiwa unaweza kwenda mahali salama.",
        ],
      },
    ],
  },
};

const PREVENT: Record<Locale, PageCopy> = {
  fr: {
    title: "Prévenir",
    sections: [
      {
        title: "Avant qu'il soit trop tard",
        body: [
          "Identifiez un contact de confiance à prévenir en cas de danger.",
          "Mémorisez les numéros d'urgence locaux.",
          "Parlez des situations inquiétantes tôt - ne restez pas isolé.",
        ],
      },
      {
        title: "En ligne et hors ligne",
        body: [
          "Ne partagez pas de photos intimes sous la pression.",
          "Bloquez et signalez le harcèlement en ligne.",
          "À l'école ou au travail : parlez à un référent de confiance.",
        ],
      },
    ],
  },
  en: {
    title: "Prevent",
    sections: [
      {
        title: "Before It's Too Late",
        body: [
          "Identify a trusted contact to alert in case of danger.",
          "Memorize local emergency numbers.",
          "Talk about concerning situations early - do not stay isolated.",
        ],
      },
      {
        title: "Online and Offline",
        body: [
          "Do not share intimate photos under pressure.",
          "Block and report online harassment.",
          "At school or work: talk to a trusted reference.",
        ],
      },
    ],
  },
  ln: {
    title: "Kokisa",
    sections: [
      {
        title: "Liboso ya kokisa",
        body: [
          "Yebisa mokonzi ya motema ya kokisa soki ozali na mpasi.",
          "Mémorisez les numéros d'urgence locaux.",
          "Tanga na makambo ya mpasi na ntango ya liboso - soki okoki, soki okoki.",
        ],
      },
      {
        title: "Na Internet mpe na esika",
        body: [
          "Soki ozali na mpasi, soki okoki, soki okoki.",
          "Kanga mpe yebisa makambo ya mpasi na Internet.",
          "Na esika ya mosala to na esika ya masolo: yebisa mokonzi ya motema.",
        ],
      },
    ],
  },
  sw: {
    title: "Kuzuia",
    sections: [
      {
        title: "Kabla ya Kuchelewa",
        body: [
          "Tambua mtu wa kuaminika wa kumtaarifu endapo kuna hatari.",
          "Kumbuka nambari za dharura za eneo lako.",
          "Zungumza kuhusu hali zinazotia wasiwasi mapema - usijifungie.",
        ],
      },
      {
        title: "Mtandaoni na Nje ya Mtandao",
        body: [
          "Usishiriki picha za faragha chini ya shinikizo.",
          "Zuia na ripoti unyanyasaji mtandaoni.",
          "Shuleni au kazini: zungumza na mtu wa kuaminika.",
        ],
      },
    ],
  },
  lua: {
    title: "Kuzuia",
    sections: [
      {
        title: "Kabla ya Kuchelewa",
        body: [
          "Tambua mtu wa kuaminika wa kumtaarifu endapo kuna hatari.",
          "Kumbuka nambari za dharura za eneo lako.",
          "Zungumza kuhusu hali zinazotia wasiwasi mapema - usijifungie.",
        ],
      },
      {
        title: "Mtandaoni na Nje ya Mtandao",
        body: [
          "Usishiriki picha za faragha chini ya shinikizo.",
          "Zuia na ripoti unyanyasaji mtandaoni.",
          "Shuleni au kazini: zungumza na mtu wa kuaminika.",
        ],
      },
    ],
  },
  kg: {
    title: "Kuzuia",
    sections: [
      {
        title: "Kabla ya Kuchelewa",
        body: [
          "Tambua mtu wa kuaminika wa kumtaarifu endapo kuna hatari.",
          "Kumbuka nambari za dharura za eneo lako.",
          "Zungumza kuhusu hali zinazotia wasiwasi mapema - usijifungie.",
        ],
      },
      {
        title: "Mtandaoni na Nje ya Mtandao",
        body: [
          "Usishiriki picha za faragha chini ya shinikizo.",
          "Zuia na ripoti unyanyasaji mtandaoni.",
          "Shuleni au kazini: zungumza na mtu wa kuaminika.",
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
      legalPage(l, "Confidentialité (brouillon pilote)", PRIVACY_SECTIONS),
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
      legalPage(l, "Charte opérateur ONG (brouillon)", CHARTE_ONG_SECTIONS),
    ]),
  ) as Record<Locale, PageCopy>,
};

export function getStaticPage(page: PageKey, locale: Locale): PageCopy {
  const bucket = PAGES[page];
  return bucket[locale] ?? bucket.fr;
}

export type { PageKey };
