import { CircleQuestionMarkIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

export function AppHelpPopover() {
  const { t } = useTranslation()

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button aria-label={t("help.open")} variant="outline" size="icon" />
        }
      >
        <CircleQuestionMarkIcon />
      </PopoverTrigger>
      <PopoverContent align="end">
        <PopoverHeader>
          <PopoverTitle>{t("help.title")}</PopoverTitle>
          <PopoverDescription>{t("help.description")}</PopoverDescription>
        </PopoverHeader>
        <p className="text-muted-foreground">{t("help.localStorage")}</p>
      </PopoverContent>
    </Popover>
  )
}
