"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CheckoutRedirectPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CheckoutRedirect />
    </Suspense>
  );
}

function CheckoutRedirect() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const billing = searchParams.get("billing") ?? "monthly";

  useEffect(() => {
    if (!plan) { window.location.href = "/dashboard"; return; }
    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billing }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) window.location.href = data.url;
        else window.location.href = "/dashboard";
      })
      .catch(() => { window.location.href = "/dashboard"; });
  }, [plan, billing]);

  return <Spinner />;
}

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
    </div>
  );
}
