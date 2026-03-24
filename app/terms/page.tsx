"use client";

import { useLocale } from "@/lib/locale-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function TermsPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-16 px-4">
        <div className="mx-auto max-w-3xl">
          {isAr ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">شروط الاستخدام</h1>
              <p className="text-sm text-gray-400 mb-10">آخر تحديث: مارس ٢٠٢٦</p>

              <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">١. القبول بالشروط</h2>
                  <p>
                    باستخدامك لمنصة تروث‌إيه‌آي، فإنك توافق على الالتزام بهذه الشروط. إذا كنت لا توافق على أي جزء منها، يرجى عدم استخدام الخدمة.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">٢. وصف الخدمة</h2>
                  <p>
                    تروث‌إيه‌آي منصة لكشف المحتوى المُولَّد بالذكاء الاصطناعي في النصوص العربية، مع تخصص في اللهجة الإماراتية والخليجية. تُقدَّم الخدمة "كما هي" وقد تتضمن نتائج الكشف نسبة من الخطأ؛ لا ينبغي الاعتماد عليها وحدها في اتخاذ قرارات حرجة.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">٣. حساب المستخدم</h2>
                  <p className="mb-2">أنت مسؤول عن:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>الحفاظ على سرية بيانات تسجيل الدخول</li>
                    <li>جميع الأنشطة التي تحدث عبر حسابك</li>
                    <li>إخطارنا فوراً عند اشتباهك بأي استخدام غير مصرح</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">٤. الاستخدام المقبول</h2>
                  <p className="mb-2">يُحظر استخدام المنصة من أجل:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>أي نشاط غير قانوني أو احتيالي</li>
                    <li>انتهاك حقوق الملكية الفكرية لأطراف ثالثة</li>
                    <li>إرسال محتوى ضار أو مسيء أو ينتهك حقوق الآخرين</li>
                    <li>محاولة اختراق المنصة أو التحايل على قيودها</li>
                    <li>إعادة بيع الخدمة دون إذن مسبق</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">٥. الاشتراكات والمدفوعات</h2>
                  <p className="mb-2">
                    تُجدَّد الاشتراكات تلقائياً كل شهر. يمكنك إلغاء الاشتراك في أي وقت من لوحة التحكم. لا يحق استرداد المبالغ عن الفترات المنقضية جزئياً إلا في حالات استثنائية يُقدَّرها فريق الدعم.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">٦. الملكية الفكرية</h2>
                  <p>
                    جميع حقوق الملكية الفكرية للمنصة — بما فيها التصميم والكود والنماذج — محفوظة لتروث‌إيه‌آي. النصوص التي تُرسلها للتحليل تظل ملكاً لك.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">٧. إخلاء المسؤولية</h2>
                  <p>
                    تُقدَّم الخدمة "كما هي" دون أي ضمانات صريحة أو ضمنية. لا تتحمل تروث‌إيه‌آي مسؤولية أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام الخدمة أو عدم القدرة على استخدامها.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">٨. التعديلات</h2>
                  <p>
                    نحتفظ بحق تعديل هذه الشروط في أي وقت. سيُعلَم المستخدمون المسجَّلون بأي تغييرات جوهرية عبر البريد الإلكتروني.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">٩. القانون المنطبق</h2>
                  <p>
                    تخضع هذه الشروط لقوانين دولة الإمارات العربية المتحدة وتُفسَّر وفقاً لها.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">١٠. التواصل</h2>
                  <p>
                    لأي استفسارات تتعلق بهذه الشروط، تواصل معنا عبر صفحة <a href="/contact" className="text-teal-600 hover:underline">التواصل</a>.
                  </p>
                </section>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
              <p className="text-sm text-gray-400 mb-10">Last updated: March 2026</p>

              <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
                  <p>
                    By using TruthAI, you agree to be bound by these Terms. If you do not agree to any part of them, please do not use the service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Service Description</h2>
                  <p>
                    TruthAI is a platform for detecting AI-generated content in Arabic text, specializing in Emirati and Gulf dialects. The service is provided "as is" and detection results may include a margin of error; they should not be relied upon alone for critical decisions.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">3. User Account</h2>
                  <p className="mb-2">You are responsible for:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Maintaining the confidentiality of your login credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of any suspected unauthorized use</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Acceptable Use</h2>
                  <p className="mb-2">You may not use the platform for:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Any illegal or fraudulent activity</li>
                    <li>Infringing third-party intellectual property rights</li>
                    <li>Submitting harmful, abusive, or rights-violating content</li>
                    <li>Attempting to breach or circumvent platform security</li>
                    <li>Reselling the service without prior written permission</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Subscriptions & Payments</h2>
                  <p>
                    Subscriptions renew automatically each month. You may cancel at any time from your dashboard. Refunds for partially elapsed periods are not provided except in exceptional circumstances at the discretion of our support team.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Intellectual Property</h2>
                  <p>
                    All intellectual property rights in the platform — including design, code, and models — are owned by TruthAI. The text you submit for analysis remains your property.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Disclaimer of Warranties</h2>
                  <p>
                    The service is provided "as is" without any express or implied warranties. TruthAI is not liable for any direct or indirect damages arising from your use of or inability to use the service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Modifications</h2>
                  <p>
                    We reserve the right to modify these Terms at any time. Registered users will be notified of any material changes via email.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Governing Law</h2>
                  <p>
                    These Terms are governed by and construed in accordance with the laws of the United Arab Emirates.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Contact</h2>
                  <p>
                    For any questions about these Terms, reach us via our <a href="/contact" className="text-teal-600 hover:underline">Contact page</a>.
                  </p>
                </section>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
