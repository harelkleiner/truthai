"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";

export function Footer() {
  const { t, locale } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700">
              <span className="text-xs font-bold text-white">T</span>
            </div>
            <span className="text-sm font-semibold text-teal-800">
              {locale === "ar" ? "تروث‌إيه‌آي" : "TruthAI"}
            </span>
          </div>

          <p className="text-xs text-gray-400">
            © {year} TruthAI. {t.footer.rights}.
          </p>

          <div className="flex gap-4">
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-teal-600">
              {t.footer.privacy}
            </Link>
            <Link href="/terms" className="text-xs text-gray-400 hover:text-teal-600">
              {t.footer.terms}
            </Link>
            <Link href="/contact" className="text-xs text-gray-400 hover:text-teal-600">
              {t.footer.contact}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
