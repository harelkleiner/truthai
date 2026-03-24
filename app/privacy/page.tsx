"use client";

import { useLocale } from "@/lib/locale-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function PrivacyPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-16 px-4">
        <div className="mx-auto max-w-3xl">
          {isAr ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">سياسة الخصوصية</h1>
              <p className="text-sm text-gray-400 mb-10">آخر تحديث: مارس ٢٠٢٦</p>

              <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">١. المقدمة</h2>
                  <p>
                    تروث‌إيه‌آي ("الشركة"، "نحن") تلتزم بحماية خصوصيتك. توضح هذه السياسة كيفية جمع المعلومات واستخدامها والكشف عنها وحمايتها عند استخدامك لمنصتنا على الرابط truthai.app والخدمات ذات الصلة.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">٢. المعلومات التي نجمعها</h2>
                  <p className="mb-2"><strong>معلومات الحساب:</strong> عند التسجيل، نجمع اسمك وعنوان بريدك الإلكتروني وكلمة المرور المشفّرة.</p>
                  <p className="mb-2"><strong>النصوص المُحللة:</strong> يتم معالجة النصوص التي ترسلها للتحليل وتخزينها مؤقتاً لتقديم النتائج. يمكنك حذف سجل تحليلاتك في أي وقت.</p>
                  <p className="mb-2"><strong>بيانات الاستخدام:</strong> نجمع معلومات عن كيفية استخدامك للمنصة، بما في ذلك الصفحات التي تزورها وعدد عمليات التحليل.</p>
                  <p><strong>بيانات الدفع:</strong> يتم معالجة المدفوعات عبر Polar.sh. نحن لا نخزّن بيانات بطاقات الائتمان مباشرةً.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">٣. كيف نستخدم المعلومات</h2>
                  <ul className="list-disc list-inside space-y-1">
                    <li>توفير خدمة كشف المحتوى وتحسينها</li>
                    <li>إدارة حسابك ومعالجة المدفوعات</li>
                    <li>إرسال إشعارات تتعلق بالخدمة (تحديثات، أمان)</li>
                    <li>تحليل الاستخدام لتحسين المنصة</li>
                    <li>الامتثال للالتزامات القانونية</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">٤. مشاركة البيانات</h2>
                  <p>
                    لا نبيع بياناتك الشخصية لأطراف ثالثة. نشارك البيانات فقط مع مزودي الخدمات الضروريين لتشغيل المنصة (مثل Supabase لقواعد البيانات، وAnthropic لمعالجة النصوص، وPolar.sh للمدفوعات)، وجميعهم ملتزمون بمعايير الخصوصية الصارمة.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">٥. الاحتفاظ بالبيانات</h2>
                  <p>
                    نحتفظ ببيانات حسابك طالما حسابك نشط. يمكنك طلب حذف حسابك وجميع بياناتك المرتبطة به في أي وقت عبر التواصل معنا.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">٦. الأمان</h2>
                  <p>
                    نستخدم تشفير TLS لجميع البيانات المنقولة، وتشفير كلمات المرور باستخدام bcrypt، وضوابط الوصول المستندة إلى الأدوار (RLS) في قاعدة البيانات. مع ذلك، لا توجد طريقة نقل عبر الإنترنت آمنة بنسبة ١٠٠٪.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">٧. حقوقك</h2>
                  <p>يحق لك في أي وقت:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>الاطلاع على البيانات التي نحتفظ بها عنك</li>
                    <li>تصحيح بياناتك الشخصية</li>
                    <li>طلب حذف بياناتك</li>
                    <li>الاعتراض على معالجة بياناتك</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">٨. التواصل معنا</h2>
                  <p>
                    لأي استفسارات تتعلق بالخصوصية، تواصل معنا عبر صفحة <a href="/contact" className="text-teal-600 hover:underline">التواصل</a>.
                  </p>
                </section>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
              <p className="text-sm text-gray-400 mb-10">Last updated: March 2026</p>

              <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
                  <p>
                    TruthAI ("Company", "we", "us") is committed to protecting your privacy. This policy explains how we collect, use, disclose, and safeguard your information when you use our platform at truthai.app and related services.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
                  <p className="mb-2"><strong>Account Information:</strong> When you register, we collect your name, email address, and encrypted password.</p>
                  <p className="mb-2"><strong>Analyzed Text:</strong> Text you submit for analysis is processed and temporarily stored to provide results. You can delete your analysis history at any time.</p>
                  <p className="mb-2"><strong>Usage Data:</strong> We collect information about how you use the platform, including pages visited and number of analyses run.</p>
                  <p><strong>Payment Data:</strong> Payments are processed via Polar.sh. We do not directly store credit card information.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">3. How We Use Information</h2>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Provide and improve the content detection service</li>
                    <li>Manage your account and process payments</li>
                    <li>Send service-related notifications (updates, security)</li>
                    <li>Analyze usage to improve the platform</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Data Sharing</h2>
                  <p>
                    We do not sell your personal data to third parties. We share data only with service providers necessary to operate the platform (such as Supabase for databases, Anthropic for text processing, and Polar.sh for payments), all of whom are committed to strict privacy standards.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Data Retention</h2>
                  <p>
                    We retain your account data for as long as your account is active. You may request deletion of your account and all associated data at any time by contacting us.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Security</h2>
                  <p>
                    We use TLS encryption for all data in transit, bcrypt for password hashing, and row-level security (RLS) in our database. No method of transmission over the internet is 100% secure.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Your Rights</h2>
                  <p>You have the right at any time to:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Access the data we hold about you</li>
                    <li>Correct your personal data</li>
                    <li>Request deletion of your data</li>
                    <li>Object to processing of your data</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Contact Us</h2>
                  <p>
                    For any privacy-related inquiries, reach us via our <a href="/contact" className="text-teal-600 hover:underline">Contact page</a>.
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
