import { LanguagesIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  isAppLanguage,
  languageStorageKey,
} from "@/lib/i18n/i18n"
import type { AppLanguage } from "@/types/language.type"

export function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const language: AppLanguage = isAppLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : "fr"
  const nextLanguage: AppLanguage = language === "fr" ? "en" : "fr"

  function changeLanguage() {
    window.localStorage.setItem(languageStorageKey, nextLanguage)
    void i18n.changeLanguage(nextLanguage)
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={changeLanguage}
          />
        }
      >
        <LanguagesIcon data-icon="inline-start" />
        {language.toUpperCase()}
      </TooltipTrigger>
      <TooltipContent>{t("language.change")}</TooltipContent>
    </Tooltip>
  )
}
