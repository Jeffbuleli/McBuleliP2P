# NGEMBA - Design tokens & composants

> Complément de [PLAN-MAITRE.md](./PLAN-MAITRE.md) · Police **Poppins** · Base `#06402b` · Secondaire `#882364`

---

## 1. Palette complète

### Vert (marque primaire)

| Token | Hex | Usage |
|-------|-----|-------|
| `--ng-primary` | `#06402b` | Headers, nav, boutons principaux |
| `--ng-primary-light` | `#0a5c3e` | Hover, liens actifs |
| `--ng-primary-lighter` | `#12855a` | Accents, icônes |
| `--ng-primary-dark` | `#042818` | Texte sur fond clair fort |
| `--ng-primary-muted` | `#e6f2ec` | Fond cartes secondaires |
| `--ng-primary-subtle` | `#f0f7f4` | Fond page alternatif |

### Prune (marque secondaire)

| Token | Hex | Usage |
|-------|-----|-------|
| `--ng-secondary` | `#882364` | CTA secondaires, ONG, VBG (avec parcimonie) |
| `--ng-secondary-light` | `#a8327a` | Hover |
| `--ng-secondary-dark` | `#5c1844` | Texte accent |
| `--ng-secondary-muted` | `#f5eaf0` | Fond cartes VBG / femmes |

### Sémantique urgence

| Token | Hex | Usage |
|-------|-----|-------|
| `--ng-urgent` | `#c41e3a` | Bouton SOS, badge 🔴 |
| `--ng-urgent-bg` | `#fef2f2` | Fond session urgence |
| `--ng-warning` | `#d97706` | Badge 🟠 |
| `--ng-warning-bg` | `#fffbeb` | Fond situation préoccupante |
| `--ng-calm` | `#059669` | Badge 🟢 info |
| `--ng-calm-bg` | `#ecfdf5` | Fond prévention |

### Neutres

| Token | Hex | Usage |
|-------|-----|-------|
| `--ng-bg` | `#f8faf9` | Fond page citoyen |
| `--ng-surface` | `#ffffff` | Cartes |
| `--ng-text` | `#0c1a14` | Corps |
| `--ng-muted` | `#5c6b63` | Labels, hints |
| `--ng-border` | `rgba(6,64,43,0.12)` | Bordures |
| `--ng-shadow` | `0 4px 24px rgba(6,64,43,0.08)` | Élévation cartes |

---

## 2. Typographie Poppins

```css
/* Échelle mobile-first */
--ng-text-xs:   0.75rem;   /* 12px - labels discrets */
--ng-text-sm:   0.875rem;  /* 14px - hints */
--ng-text-base: 1rem;      /* 16px - corps minimum */
--ng-text-lg:   1.125rem;  /* 18px - sous-titres */
--ng-text-xl:   1.25rem;   /* 20px - titres cartes */
--ng-text-2xl:  1.5rem;    /* 24px - titres écran */
--ng-text-3xl:  1.875rem;  /* 30px - hero rare */

--ng-leading-tight:  1.25;
--ng-leading-normal: 1.5;
--ng-leading-relaxed: 1.625;
```

| Élément | Taille | Poids | Couleur |
|---------|--------|-------|---------|
| Titre écran | 24px | 600 | `--ng-text` |
| Bouton SOS | 18px | 700 | `#ffffff` sur `--ng-urgent` |
| Corps | 16px | 400 | `--ng-text` |
| Label bouton secondaire | 14px | 500 | `--ng-primary` |
| Hint / consentement | 14px | 400 | `--ng-muted` |

---

## 3. Espacements & rayons

```css
--ng-radius-sm:  8px;   /* chips, badges */
--ng-radius-md:  12px;  /* cartes bento */
--ng-radius-lg:  16px;  /* modales */
--ng-radius-full: 9999px; /* bouton SOS */

--ng-space-xs: 4px;
--ng-space-sm: 8px;
--ng-space-md: 16px;
--ng-space-lg: 24px;
--ng-space-xl: 32px;

--ng-touch-min: 48px; /* cible tactile WCAG */
--ng-sos-size:  88px; /* bouton central */
```

---

## 4. Composants clés - specs visuelles

### Bouton SOS (`NgembaSosButton`)

```
Forme     : cercle 88×88px
Fond      : #c41e3a (--ng-urgent)
Texte     : « SOS » + « En danger » (2 lignes, blanc)
Ombre     : 0 8px 32px rgba(196,30,58,0.35)
Animation : pulse ring 2s infinite (opacity 0.4 → 0)
Haptic    : impactMedium au tap
États     : default | pressed | sending | sent (vert check)
```

### Carte Bento

```
Fond      : --ng-surface
Bordure   : 1px --ng-border
Rayon     : 12px
Padding   : 16px
Min-height: 80px
Icône     : 32px, couleur --ng-primary ou --ng-secondary
Label     : 14px Medium, --ng-text
```

### Badge urgence

| Niveau | Fond | Texte | Icône |
|--------|------|-------|-------|
| critical | `#fef2f2` | `#c41e3a` | 🔴 |
| high | `#fffbeb` | `#d97706` | 🟠 |
| medium | `#f0f7f4` | `#06402b` | 🟡 |
| info | `#ecfdf5` | `#059669` | 🟢 |

### Barre session active

```
Fond      : --ng-primary-dark
Texte     : blanc
Contenu   : « Alerte active » · timer · badge urgence
Hauteur   : 48px fixed top
```

---

## 5. Tailwind v4 - snippet `@theme`

```css
@theme inline {
  --color-ng-primary: #06402b;
  --color-ng-primary-light: #0a5c3e;
  --color-ng-primary-muted: #e6f2ec;
  --color-ng-secondary: #882364;
  --color-ng-secondary-muted: #f5eaf0;
  --color-ng-urgent: #c41e3a;
  --color-ng-warning: #d97706;
  --color-ng-calm: #059669;
  --color-ng-bg: #f8faf9;
  --color-ng-surface: #ffffff;
  --color-ng-text: #0c1a14;
  --color-ng-muted: #5c6b63;
  --font-sans: var(--font-poppins), ui-sans-serif, system-ui, sans-serif;
}
```

Classes utilitaires suggérées :

```
bg-ng-bg · bg-ng-primary · text-ng-muted
rounded-ng-md · shadow-ng-card
min-h-ng-touch · size-ng-sos
```

---

## 6. Mode discret (UI)

Quand le mode discret est **ON** :

- Pas de rouge à l'écran - utiliser `--ng-secondary-muted` et vibrations
- Pas de son notification
- Écran verrouillé sur une fausse page neutre (calculatrice / météo) - Phase 3
- Confirmation : double vibration courte

---

## 7. Accessibilité

| Critère | Implémentation |
|---------|----------------|
| Contraste | Texte ≥ 4.5:1 sur fond clair |
| Touch | Min 48×48px tous boutons |
| VoiceOver | `aria-label` explicites sur SOS |
| Motion | `prefers-reduced-motion` désactive pulse SOS |
| Langue | `lang` attribute par écran |

---

## 8. Inspiration Dribbble - checklist design review

Lors de la création Figma, vérifier :

- [ ] SOS visible en **≤ 1 tap** depuis l'accueil
- [ ] Fond **clair et apaisant** (pas anxiogène sauf bouton SOS)
- [ ] Grille Bento **≤ 4 modules** autour du SOS
- [ ] Écran GPS : **2 boutons égaux** (pas de dark pattern)
- [ ] Session active : **barre persistante** en haut
- [ ] Dashboard ONG : **liste priorisée par urgence**, pas par date seule
- [ ] Icônes reconnaissables **sans texte** (SOSPhone pattern)

*Réf. : [Dribbble SOS emergency](https://dribbble.com/search/sos-emergency)*
