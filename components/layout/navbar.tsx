"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { t, locale, setLocale, dir } = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/analyze", label: t.nav.analyze },
    { href: "/#pricing", label: t.nav.pricing },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700">
              <span className="text-sm font-bold text-white">T</span>
            </div>
            <span
              className={cn(
                "text-lg font-bold text-teal-800",
                locale === "ar" ? "font-arabic" : ""
              )}
            >
              {locale === "ar" ? "تروث‌إيه‌آي" : "TruthAI"}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 transition-colors hover:text-teal-700"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition hover:border-teal-400 hover:text-teal-700"
              aria-label="Toggle language"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{locale === "ar" ? "EN" : "عربي"}</span>
            </button>

            <Link href="/login">
              <Button variant="ghost" size="sm">
                {t.nav.login}
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">{t.nav.signup}</Button>
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5 text-gray-600" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-gray-100 py-4 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-2 py-2 text-sm text-gray-600 hover:text-teal-700"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
