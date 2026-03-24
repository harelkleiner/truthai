"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Locale } from "./i18n";
import ar from "@/locales/ar.json";
import en from "@/locales/en.json";

const translations = { ar, en };

type Translations = typeof ar;

type LocaleContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
  dir: "rtl" | "ltr";
};

const LocaleContext = createContext<LocaleContextType>({
  locale: "ar",
  setLocale: () => {},
  t: ar,
  dir: "rtl",
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored === "ar" || stored === "en") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  };

  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [locale, dir]);

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t: translations[locale],
        dir,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
