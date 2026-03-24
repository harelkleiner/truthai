import ar from "@/locales/ar.json";
import en from "@/locales/en.json";

export type Locale = "ar" | "en";

type DeepValue<T> = T extends object
  ? { [K in keyof T]: DeepValue<T[K]> }
  : string | string[];

const translations: Record<Locale, typeof ar> = { ar, en };

export function getTranslations(locale: Locale) {
  return translations[locale];
}

export const defaultLocale: Locale = "ar";
