import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import type { AppTheme } from "@/types/theme.type"

export const themeStorageKey = "scan-release-list-theme"

type ThemeContextValue = {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>("dark")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const storedValue = window.localStorage.getItem(themeStorageKey)

    if (isAppTheme(storedValue)) {
      setTheme(storedValue)
    }

    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    document.documentElement.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem(themeStorageKey, theme)
  }, [hydrated, theme])

  const value = useMemo(() => ({ theme, setTheme }), [theme])

  return <ThemeContext value={value}>{children}</ThemeContext>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.")
  }

  return context
}

export function isAppTheme(value: unknown): value is AppTheme {
  return value === "light" || value === "dark"
}
