import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import { en } from "@/lib/i18n/locales/en"
import { fr } from "@/lib/i18n/locales/fr"
import type { AppLanguage } from "@/types/language.type"

export const languageStorageKey = "scan-release-list-language"
export const supportedLanguages: AppLanguage[] = ["fr", "en"]

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: "fr",
  fallbackLng: "fr",
  supportedLngs: supportedLanguages,
  load: "languageOnly",
  interpolation: {
    escapeValue: false,
  },
})

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === "fr" || value === "en"
}

export default i18n
