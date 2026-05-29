import type { EmailLocale } from "@/lib/email/locale";

export type EmailCopyBlock = {
  subject: string;
  preheader: string;
  title: string;
  body: string;
  cta: string;
  expiry?: string;
  footerHelp: string;
  footerContact: string;
};

const COPY = {
  verify: {
    fr: {
      subject: "Confirmez votre email",
      preheader: "Un clic pour activer votre compte McBuleli.",
      title: "Vérifiez votre email",
      body: "Bienvenue — confirmez votre adresse pour accéder au portefeuille et aux retraits.",
      cta: "Confirmer mon email",
      expiry: "Ce lien expire dans 24 h.",
      footerHelp: "Besoin d'aide ?",
      footerContact: "Contactez-nous",
    },
    en: {
      subject: "Confirm your email",
      preheader: "One tap to activate your McBuleli account.",
      title: "Verify your email",
      body: "Welcome — confirm your address to access your wallet and withdrawals.",
      cta: "Confirm email",
      expiry: "This link expires in 24 hours.",
      footerHelp: "Need help?",
      footerContact: "Contact us",
    },
  },
  passwordReset: {
    fr: {
      subject: "Réinitialiser votre mot de passe",
      preheader: "Lien sécurisé pour choisir un nouveau mot de passe.",
      title: "Mot de passe oublié ?",
      body: "Utilisez le bouton ci-dessous pour définir un nouveau mot de passe.",
      cta: "Réinitialiser",
      expiry: "Lien valide 1 h. Ignorez si vous n'êtes pas à l'origine de la demande.",
      footerHelp: "Besoin d'aide ?",
      footerContact: "Contactez-nous",
    },
    en: {
      subject: "Reset your password",
      preheader: "Secure link to set a new password.",
      title: "Forgot password?",
      body: "Use the button below to choose a new password.",
      cta: "Reset password",
      expiry: "Link valid for 1 hour. Ignore if you did not request this.",
      footerHelp: "Need help?",
      footerContact: "Contact us",
    },
  },
  emailChange: {
    fr: {
      subject: "Confirmer votre nouvel email",
      preheader: "Validez le changement d'adresse sur McBuleli.",
      title: "Nouvel email",
      body: "Confirmez cette adresse pour finaliser le changement.",
      cta: "Confirmer",
      expiry: "Lien valide 1 h.",
      footerHelp: "Besoin d'aide ?",
      footerContact: "Contactez-nous",
    },
    en: {
      subject: "Confirm your new email",
      preheader: "Validate your McBuleli address change.",
      title: "New email",
      body: "Confirm this address to complete the change.",
      cta: "Confirm",
      expiry: "Link valid for 1 hour.",
      footerHelp: "Need help?",
      footerContact: "Contact us",
    },
  },
  emailChangeAlert: {
    fr: {
      subject: "Changement d'email demandé",
      preheader: "Une demande de changement d'adresse a été initiée.",
      title: "Alerte sécurité",
      body: "Quelqu'un a demandé de remplacer l'email de votre compte McBuleli. Si ce n'est pas vous, sécurisez votre compte immédiatement.",
      cta: "Ouvrir McBuleli",
      footerHelp: "Besoin d'aide ?",
      footerContact: "Contactez-nous",
    },
    en: {
      subject: "Email change requested",
      preheader: "An address change was initiated on your account.",
      title: "Security alert",
      body: "Someone requested to replace the email on your McBuleli account. If this wasn't you, secure your account immediately.",
      cta: "Open McBuleli",
      footerHelp: "Need help?",
      footerContact: "Contact us",
    },
  },
  depositUsdt: {
    fr: {
      subject: "Dépôt USDT crédité",
      preheader: "Votre portefeuille McBuleli a été crédité.",
      title: "Dépôt USDT confirmé",
      body: "Votre dépôt USDT a été vérifié et crédité sur votre portefeuille McBuleli.",
      cta: "Voir le dépôt",
      footerHelp: "Une question ?",
      footerContact: "hi@mcbuleli.org",
    },
    en: {
      subject: "USDT deposit credited",
      preheader: "Your McBuleli wallet has been credited.",
      title: "USDT deposit confirmed",
      body: "Your USDT deposit was verified and credited to your McBuleli wallet.",
      cta: "View deposit",
      footerHelp: "Questions?",
      footerContact: "hi@mcbuleli.org",
    },
  },
  depositPi: {
    fr: {
      subject: "Dépôt Pi crédité",
      preheader: "Votre portefeuille McBuleli a été crédité.",
      title: "Dépôt Pi confirmé",
      body: "Votre dépôt Pi a été vérifié et crédité sur votre portefeuille McBuleli.",
      cta: "Voir le dépôt",
      footerHelp: "Une question ?",
      footerContact: "hi@mcbuleli.org",
    },
    en: {
      subject: "Pi deposit credited",
      preheader: "Your McBuleli wallet has been credited.",
      title: "Pi deposit confirmed",
      body: "Your Pi deposit was verified and credited to your McBuleli wallet.",
      cta: "View deposit",
      footerHelp: "Questions?",
      footerContact: "hi@mcbuleli.org",
    },
  },
  withdrawUsdt: {
    fr: {
      subject: "Retrait USDT envoyé",
      preheader: "Votre retrait crypto a été traité.",
      title: "Retrait USDT envoyé",
      body: "Votre retrait USDT a été envoyé vers l'adresse indiquée. Conservez le TXID pour vos archives.",
      cta: "Voir le retrait",
      footerHelp: "Une question ?",
      footerContact: "hi@mcbuleli.org",
    },
    en: {
      subject: "USDT withdrawal sent",
      preheader: "Your crypto withdrawal was processed.",
      title: "USDT withdrawal sent",
      body: "Your USDT withdrawal was sent to the destination address. Keep the TXID for your records.",
      cta: "View withdrawal",
      footerHelp: "Questions?",
      footerContact: "hi@mcbuleli.org",
    },
  },
  withdrawPi: {
    fr: {
      subject: "Retrait Pi envoyé",
      preheader: "Votre retrait crypto a été traité.",
      title: "Retrait Pi envoyé",
      body: "Votre retrait Pi a été envoyé vers l'adresse indiquée. Conservez le TXID pour vos archives.",
      cta: "Voir le retrait",
      footerHelp: "Une question ?",
      footerContact: "hi@mcbuleli.org",
    },
    en: {
      subject: "Pi withdrawal sent",
      preheader: "Your crypto withdrawal was processed.",
      title: "Pi withdrawal sent",
      body: "Your Pi withdrawal was sent to the destination address. Keep the TXID for your records.",
      cta: "View withdrawal",
      footerHelp: "Questions?",
      footerContact: "hi@mcbuleli.org",
    },
  },
  withdrawQueuedUsdt: {
    fr: {
      subject: "Retrait USDT en cours",
      preheader: "Votre demande de retrait est en file de traitement.",
      title: "Retrait USDT demandé",
      body: "Nous avons bien reçu votre demande de retrait USDT. Vous recevrez un email dès l'envoi effectué.",
      cta: "Suivre le retrait",
      footerHelp: "Une question ?",
      footerContact: "hi@mcbuleli.org",
    },
    en: {
      subject: "USDT withdrawal queued",
      preheader: "Your withdrawal request is being processed.",
      title: "USDT withdrawal requested",
      body: "We received your USDT withdrawal request. You'll get another email once it has been sent.",
      cta: "Track withdrawal",
      footerHelp: "Questions?",
      footerContact: "hi@mcbuleli.org",
    },
  },
  withdrawQueuedPi: {
    fr: {
      subject: "Retrait Pi en cours",
      preheader: "Votre demande de retrait est en file de traitement.",
      title: "Retrait Pi demandé",
      body: "Nous avons bien reçu votre demande de retrait Pi. Vous recevrez un email dès l'envoi effectué.",
      cta: "Suivre le retrait",
      footerHelp: "Une question ?",
      footerContact: "hi@mcbuleli.org",
    },
    en: {
      subject: "Pi withdrawal queued",
      preheader: "Your withdrawal request is being processed.",
      title: "Pi withdrawal requested",
      body: "We received your Pi withdrawal request. You'll get another email once it has been sent.",
      cta: "Track withdrawal",
      footerHelp: "Questions?",
      footerContact: "hi@mcbuleli.org",
    },
  },
  passwordChanged: {
    fr: {
      subject: "Mot de passe modifié",
      preheader: "Votre mot de passe McBuleli vient d'être changé.",
      title: "Mot de passe mis à jour",
      body: "Si vous n'êtes pas à l'origine de ce changement, contactez le support tout de suite.",
      cta: "Mon compte",
      footerHelp: "Besoin d'aide ?",
      footerContact: "Contactez-nous",
    },
    en: {
      subject: "Password changed",
      preheader: "Your McBuleli password was just updated.",
      title: "Password updated",
      body: "If you didn't make this change, contact support immediately.",
      cta: "My account",
      footerHelp: "Need help?",
      footerContact: "Contact us",
    },
  },
} as const satisfies Record<string, Record<EmailLocale, EmailCopyBlock>>;

export type EmailCopyKey = keyof typeof COPY;

export function getEmailCopy(key: EmailCopyKey, locale: EmailLocale): EmailCopyBlock {
  return COPY[key][locale];
}

export function emailSubject(key: EmailCopyKey, locale: EmailLocale): string {
  return `McBuleli — ${getEmailCopy(key, locale).subject}`;
}
