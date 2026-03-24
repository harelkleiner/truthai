import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          plan: "free" | "pro" | "business";
          stripe_customer_id: string | null;
          created_at: string;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          word_count: number;
          created_at: string;
        };
      };
      results: {
        Row: {
          id: string;
          document_id: string;
          human_pct: number;
          ai_pct: number;
          dialect: "emirati" | "gulf" | "msa" | "mixed" | "other";
          confidence: "high" | "medium" | "low";
          sentence_data: SentenceResult[];
          created_at: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          plan: "pro" | "business";
          status: string;
          current_period_end: string;
        };
      };
    };
  };
};

export type SentenceResult = {
  sentence: string;
  label: "human" | "ai" | "mixed";
  reason: string;
};
