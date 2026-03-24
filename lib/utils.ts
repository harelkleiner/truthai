import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert Western Arabic numerals to Eastern Arabic
export function toEasternArabic(num: number | string): string {
  return String(num).replace(/[0-9]/g, (d) =>
    String.fromCharCode(d.charCodeAt(0) + 0x0630)
  );
}

// Format currency based on locale
export function formatCurrency(
  amount: number,
  locale: "ar" | "en",
  currency = "AED"
): string {
  if (locale === "ar") {
    const sym = currency === "AED" ? "د.إ" : currency;
    return `${toEasternArabic(amount)} ${sym}`;
  }
  return `${currency} ${amount}`;
}

// Word count utility (handles Arabic and English)
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export type Locale = "ar" | "en";
