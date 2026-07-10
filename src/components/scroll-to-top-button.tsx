import { ChevronUpIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

const visibilityThreshold = 480

export function ScrollToTopButton() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const updateVisibility = () =>
      setVisible(window.scrollY >= visibilityThreshold)

    updateVisibility()
    window.addEventListener("scroll", updateVisibility, { passive: true })
    return () => window.removeEventListener("scroll", updateVisibility)
  }, [])

  if (!visible) {
    return null
  }

  return (
    <Button
      className="fixed right-5 bottom-5 opacity-70 shadow-lg backdrop-blur-sm hover:opacity-100"
      variant="secondary"
      size="icon"
      type="button"
      aria-label={t("navigation.backToTop")}
      onClick={() => window.scrollTo({ top: 0 })}
    >
      <ChevronUpIcon />
    </Button>
  )
}
