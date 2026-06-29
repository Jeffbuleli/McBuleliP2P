export type AboutPageCopy = {
  brand: string;
  title: string;
  lead: string;
  eyebrow: string;
  pillarsLabel: string;
  backHome: string;
  items: string[];
  footer: {
    about: string;
    contact: string;
    terms: string;
    privacy: string;
  };
};

export function normalizeAboutPageCopy(
  copy: Partial<AboutPageCopy> & Pick<AboutPageCopy, "brand" | "title" | "lead">,
): AboutPageCopy {
  return {
    brand: copy.brand,
    title: copy.title,
    lead: copy.lead,
    eyebrow: copy.eyebrow ?? copy.brand,
    pillarsLabel: copy.pillarsLabel ?? "Mission",
    backHome: copy.backHome ?? "Home",
    items: copy.items ?? [],
    footer: copy.footer ?? {
      about: "About",
      contact: "Contact",
      terms: "Terms",
      privacy: "Privacy",
    },
  };
}
