"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { translations, type Locale, type TranslationKey } from "./translations"

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load locale from localStorage
    try {
      const savedLocale = localStorage.getItem("locale") as Locale | null
      if (savedLocale && savedLocale in translations) {
        setLocaleState(savedLocale)
      }
    } catch (error) {
      console.error("[v0] Error loading locale from localStorage:", error)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem("locale", newLocale)
    } catch (error) {
      console.error("[v0] Error saving locale to localStorage:", error)
    }
  }

  const t = (key: TranslationKey): string => {
    const translation = translations[locale]?.[key]
    if (!translation) {
      console.warn(`[v0] Missing translation for key: ${key} in locale: ${locale}`)
      return key
    }
    return translation
  }

  if (!mounted) {
    return null
  }

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
