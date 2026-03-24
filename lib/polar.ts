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
  pro: {
    productId: process.env.POLAR_PRO_PRODUCT_ID ?? "",
    name: "Pro",
    price_usd: 24,
  },
  business: {
    productId: process.env.POLAR_BUSINESS_PRODUCT_ID ?? "",
    name: "Business",
    price_usd: 99,
  },
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
