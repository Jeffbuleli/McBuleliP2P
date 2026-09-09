# NGEMBA - Contacts ONG (liste Jeff + scan) · 8 sept. 2026

Source contacts : Jeff · Emails : `src/lib/email/partnership/ngemba-ong-partnership-email.ts`  
Envoi : `scripts/send-ngemba-ong-partnership-email.ts` · From `hi@` · Sign. **Mme Patty B.** · RCCM + NIF · WhatsApp

| ID | Org | Email | Tél. | Site | Angle Ngemba |
|---|---|---|---|---|---|
| sofepadi | SOFEPADI | sofepadi@gmail.com | +243 811 982 266 | sofepadirdc.org | VBG · Safe School · Est+Kin |
| heal-africa | HEAL Africa | contact_us@healafrica.org | - | healafrica.org | Soins holistiques Goma |
| ajedi-ka | AJEDI-Ka | staffajidika@gmail.com | +243 813 136 690 | ajedikaong.org | Protection enfance Uvira/Fizi |
| centre-olame | Centre Olame | olame.centre@gmail.com | - | olamerdc.org | Femmes/enfants Bukavu |
| sadi | SADI RDC | rdcsadi@gmail.com | +243 991 617 457 | sadirdc.org | Plaidoyer / développement |
| yfp | Youth For Peace DRC | coordination@yfpdrc.org | +243 800 300 413 | yfpdrc.org | Jeunesse · paix · VBG scolaire |
| remed | REMED | remeddrc@gmail.com | +243 994 222 989 | remeddrc.org | Éducation · santé · protection SK |
| tpo | TPO DRC | info@tpordc.org | +243 999 965 943 | tpordc.org | Psychosocial / trauma |
| zaida | Club Zaïda Catalan | czaidacatalan.ps@gmail.com | +243 972 291 375 | clubzaidacatalan.org | Genre · paix Est |
| hope-peace | Hope and Peace | hopeandpeacedrc@gmail.com | +243 828 818 913 | hopeandpeacerdc.org | Paix communautaire |
| iwhe | IWHE | indigenouswomen2021@gmail.com | +243 813 033 335 | iwhe-ong.org | Femmes autochtones |
| panzi | Fondation Panzi | info@panzi.org | - | panzi.org | One Stop / VSBG Bukavu+Kin |
| uwezo | Uwezo Afrika | uwezoafrikainitiative@gmail.com | +243 962 545 075 | uwezoafrika.org | Capacitation |
| ajefem | AJEFEM ASBL | contact@ajefem.org | +243 826 704 930 | ajefem.org | Femmes · justice |
| opadec | OPADEC ASBL | opadecasbl@gmail.com | +243 971 366 367 | - | OSC Bukavu |
| wfad | WFAD DRC | infodrc@wfad.se | +46 73 532 48 54 | wfad.se | Prévention / jeunesse |
| ccj | CCJ RDC | ccjrdc.officiel@gmail.com | +243 978 802 345 | - | Jeunesse nationale |
| mwanamke | Mwanamke Kesho | mwanamkekeshodrc@gmail.com | +243 991 982 062 | mwanamkekesho.org | Femmes / filles |
| ajucv-tchad | Jeunesse Unie Contre VBG | collectiftchdien@gmail.com | +235 63 88 24 70 | - | **Tchad** - skip batch RDC |
| - | UNFPA RDC | *(pas d'email fourni)* | - | drc.unfpa.org | Vague institutionnelle |
| bca | Bloc Citoyen Amani (BCA) | blocamanirdc@gmail.com | +243 996 839 254 | Facebook | Paix · enfant · Sud-Kivu **ops** |

Déjà dans écosystème : **JGL AFRICA** · `akarhinda@gmail.com`  
Profil + accès BCA : [31-BCA-BLOC-CITOYEN-AMANI.md](./31-BCA-BLOC-CITOYEN-AMANI.md) · `scripts/send-ngemba-bca-access-email.ts`

## Commandes

```bash
npx tsx scripts/send-ngemba-ong-partnership-email.ts --list
npx tsx scripts/send-ngemba-ong-partnership-email.ts --preview
npx tsx scripts/send-ngemba-ong-partnership-email.ts --to ceo@mcbuleli.org --as sofepadi --send
npx tsx scripts/send-ngemba-ong-partnership-email.ts --to ceo@mcbuleli.org --send   # 3 premiers
npx tsx scripts/send-ngemba-ong-partnership-email.ts --all --send                 # prod (hors Tchad)
```
