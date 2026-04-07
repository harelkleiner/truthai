export type AppPlan = "free" | "starter" | "pro" | "business";

export const PLAN_WORD_LIMIT: Record<AppPlan, number | null> = {
  free: 500,
  starter: 2000,
  pro: null,
  business: null,
};

export const PLAN_MONTHLY_CHECK_LIMIT: Record<AppPlan, number | null> = {
  free: 5,
  starter: 50,
  pro: null,
  business: null,
};

export const PLAN_MONTHLY_UPLOAD_LIMIT: Record<AppPlan, number | null> = {
  free: 0,
  starter: 0,
  pro: 50,
  business: null,
};

export const PLAN_MONTHLY_HUMANIZE_LIMIT: Record<AppPlan, number | null> = {
  free: 0,
  starter: 20,
  pro: 100,
  business: null,
};

export function normalizePlan(plan: string | null | undefined): AppPlan {
  if (plan === "starter" || plan === "pro" || plan === "business") return plan;
  return "free";
}

export function getMonthlyLimit(plan: AppPlan): number | null {
  return PLAN_MONTHLY_CHECK_LIMIT[plan];
}

export function getWordLimit(plan: AppPlan): number | null {
  return PLAN_WORD_LIMIT[plan];
}

export function getUploadLimit(plan: AppPlan): number | null {
  return PLAN_MONTHLY_UPLOAD_LIMIT[plan];
}

export function getHumanizeLimit(plan: AppPlan): number | null {
  return PLAN_MONTHLY_HUMANIZE_LIMIT[plan];
}
