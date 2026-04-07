import { Polar } from "@polar-sh/sdk";

let _polar: Polar | null = null;

export function getPolar(): Polar {
  if (!_polar) {
    _polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
    });
  }
  return _polar;
}

export const PLANS = {
  starter: { productId: process.env.POLAR_STARTER_PRODUCT_ID ?? "" },
  starter_annual: { productId: process.env.POLAR_STARTER_ANNUAL_PRODUCT_ID ?? "" },
  pro: { productId: process.env.POLAR_PRO_PRODUCT_ID ?? "" },
  pro_annual: { productId: process.env.POLAR_PRO_ANNUAL_PRODUCT_ID ?? "" },
} as const;

export async function createCheckoutSession({
  productId,
  customerEmail,
  successUrl,
  metadata,
}: {
  productId: string;
  customerEmail: string;
  successUrl: string;
  metadata?: Record<string, string>;
}) {
  const polar = getPolar();
  const checkout = await polar.checkouts.create({
    products: [productId],
    customerEmail,
    successUrl,
    metadata,
  } as any);
  return checkout;
}
