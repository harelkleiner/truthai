export function getAdminEmails(): string[] {
  const emails = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "";
  return emails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
