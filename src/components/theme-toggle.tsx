import { MoonIcon, SunIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const nextTheme = theme === "dark" ? "light" : "dark"
  const label =
    nextTheme === "dark" ? t("theme.switchToDark") : t("theme.switchToLight")

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            type="button"
            aria-label={label}
            onClick={() => setTheme(nextTheme)}
          />
        }
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
