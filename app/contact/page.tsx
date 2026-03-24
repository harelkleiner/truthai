"use client";

import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function ContactPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  const labels = isAr
    ? {
        title: "تواصل معنا",
        subtitle: "لديك سؤال أو اقتراح؟ نحن هنا للمساعدة.",
        name: "الاسم الكامل",
        email: "البريد الإلكتروني",
        subject: "الموضوع",
        message: "الرسالة",
        submit: "إرسال الرسالة",
        sending: "جارٍ الإرسال...",
        success_title: "تم الإرسال بنجاح!",
        success_msg: "شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.",
        error_msg: "حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.",
        name_ph: "اكتب اسمك هنا",
        email_ph: "example@email.com",
        subject_ph: "موضوع رسالتك",
        message_ph: "اكتب رسالتك هنا...",
        send_another: "إرسال رسالة أخرى",
      }
    : {
        title: "Contact Us",
        subtitle: "Have a question or suggestion? We're here to help.",
        name: "Full Name",
        email: "Email Address",
        subject: "Subject",
        message: "Message",
        submit: "Send Message",
        sending: "Sending...",
        success_title: "Message Sent!",
        success_msg: "Thank you for reaching out. We'll get back to you as soon as possible.",
        error_msg: "An error occurred while sending. Please try again.",
        name_ph: "Your full name",
        email_ph: "example@email.com",
        subject_ph: "What is this about?",
        message_ph: "Write your message here...",
        send_another: "Send Another Message",
      };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-16 px-4">
        <div className="mx-auto max-w-xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{labels.title}</h1>
            <p className="text-gray-500">{labels.subtitle}</p>
          </div>

          {status === "success" ? (
            <div className="rounded-2xl border border-teal-100 bg-teal-50 p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
                <svg className="h-7 w-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-teal-800 mb-2">{labels.success_title}</h2>
              <p className="text-teal-700 mb-6">{labels.success_msg}</p>
              <button
                onClick={() => setStatus("idle")}
                className="rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
              >
                {labels.send_another}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-8 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{labels.name}</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={labels.name_ph}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{labels.email}</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={labels.email_ph}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{labels.subject}</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder={labels.subject_ph}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{labels.message}</label>
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={labels.message_ph}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all resize-none"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-600">{labels.error_msg}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-xl bg-teal-700 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
              >
                {status === "loading" ? labels.sending : labels.submit}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
