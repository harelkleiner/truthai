"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, Loader2, Save, Sparkles, Upload, Wand2, Pencil, Trash2, X, Eye, EyeOff } from "lucide-react";

type Stats = {
  users: number;
  analyses: number;
  paid_users: number;
  articles: number;
};

type AdminArticle = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  created_at: string;
};

type EditingArticle = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  tags: string;
  published: boolean;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestion?: {
    title: string;
    body: string;
    excerpt: string;
  };
};

export default function AdminPage() {
  const { locale, dir } = useLocale();
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(true);
  const [finalReview, setFinalReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<EditingArticle | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);

  const parsedTags = useMemo(
    () => tags.split(",").map((t) => t.trim()).filter(Boolean),
    [tags]
  );

  async function loadAdminData() {
    const [statsRes, articlesRes] = await Promise.all([
      fetch("/api/admin/stats"),
      fetch("/api/admin/articles"),
    ]);

    if (statsRes.status === 403 || articlesRes.status === 403) {
      setForbidden(true);
      setLoading(false);
      return;
    }

    const statsData = await statsRes.json();
    const articlesData = await articlesRes.json();
    setStats(statsData);
    setArticles(articlesData.articles ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAdminData().catch(() => {
      setForbidden(true);
      setLoading(false);
    });
  }, []);

  async function handleCreateArticle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          content,
          coverImageUrl,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          published,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed");

      setTitle("");
      setExcerpt("");
      setContent("");
      setCoverImageUrl("");
      setCoverPreviewUrl("");
      setTags("");
      setPublished(true);
      setMessage(locale === "ar" ? "تم إنشاء المقال بنجاح" : "Article created successfully");
      await loadAdminData().catch(() => {});
    } catch (err: any) {
      setMessage(err?.message ?? (locale === "ar" ? "حدث خطأ" : "Something went wrong"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSourceUpload(file: File) {
    setSourceLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/extract-text", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not process file");
      const extracted = String(data?.text ?? "").trim();
      if (!extracted) throw new Error(locale === "ar" ? "لا يوجد نص قابل للاستخراج" : "No extractable text found");
      setContent(extracted);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
      setMessage(locale === "ar" ? "تم إدراج النص في المحرر" : "Source text loaded into editor");
    } catch (err: any) {
      setMessage(err?.message ?? (locale === "ar" ? "فشل رفع الملف" : "Failed to ingest source file"));
    } finally {
      setSourceLoading(false);
    }
  }

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatPrompt.trim() || chatLoading) return;

    const prompt = chatPrompt.trim();
    setChatPrompt("");
    setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: prompt }]);
    setChatLoading(true);

    try {
      const historyForApi = [...chatMessages, { id: "temp", role: "user", content: prompt }]
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/admin/article-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          title,
          body: content,
          history: historyForApi,
        }),
      });
      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error(locale === "ar" ? "لم يتم استلام رد صحيح من الخادم" : "Invalid response from server");
      }
      if (!res.ok) throw new Error(data?.error ?? "Assistant failed");

      setChatMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply ?? "",
          suggestion: {
            title: data.improved_title ?? title,
            body: data.improved_body ?? content,
            excerpt: data.improved_excerpt ?? excerpt,
          },
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: err?.message ?? (locale === "ar" ? "حدث خطأ في المساعد" : "Assistant error"),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  function applySuggestion(mode: "overwrite" | "append", suggestion?: ChatMessage["suggestion"]) {
    if (!suggestion) return;
    const newTitle = suggestion.title?.trim() || title;
    const newBody = suggestion.body?.trim() || content;
    const newExcerpt = suggestion.excerpt?.trim() || excerpt;
    if (mode === "overwrite") {
      if (newTitle) setTitle(newTitle);
      if (newBody) setContent(newBody);
      if (newExcerpt) setExcerpt(newExcerpt);
      return;
    }
    if (newBody) setContent((prev) => `${prev.trim()}\n\n${newBody}`.trim());
  }

  async function handleDelete(id: string) {
    if (!confirm(locale === "ar" ? "هل أنت متأكد من حذف هذا المقال؟" : "Delete this article? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Delete failed");
      await loadAdminData().catch(() => {});
    } catch (err: any) {
      alert(err?.message ?? (locale === "ar" ? "فشل الحذف" : "Failed to delete"));
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(a: AdminArticle) {
    setEditingArticle({
      id: a.id,
      title: a.title,
      excerpt: "",
      content: "",
      coverImageUrl: "",
      tags: "",
      published: a.published,
    });
    // Fetch full article data
    fetch(`/api/admin/articles/${a.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.article) {
          setEditingArticle({
            id: a.id,
            title: data.article.title ?? a.title,
            excerpt: data.article.excerpt ?? "",
            content: data.article.content ?? "",
            coverImageUrl: data.article.cover_image_url ?? "",
            tags: (data.article.tags ?? []).join(", "),
            published: data.article.published ?? a.published,
          });
        }
      })
      .catch(() => {});
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingArticle) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/articles/${editingArticle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingArticle.title,
          excerpt: editingArticle.excerpt,
          content: editingArticle.content,
          coverImageUrl: editingArticle.coverImageUrl,
          tags: editingArticle.tags.split(",").map((t) => t.trim()).filter(Boolean),
          published: editingArticle.published,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Update failed");
      setEditingArticle(null);
      await loadAdminData().catch(() => {});
    } catch (err: any) {
      alert(err?.message ?? (locale === "ar" ? "فشل التحديث" : "Failed to update"));
    } finally {
      setEditSaving(false);
    }
  }

  function handleImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      setCoverImageUrl(dataUrl);
      setCoverPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className={cn("mb-8", dir === "rtl" ? "text-right" : "text-left")}>
            <h1 className="text-3xl font-bold text-gray-900">{locale === "ar" ? "لوحة الأدمن" : "Admin Panel"}</h1>
            <p className="mt-2 text-gray-500">
              {locale === "ar" ? "إدارة المقالات وإحصائيات المنصة" : "Manage articles and platform analytics"}
            </p>
          </div>

          {loading && <p className="text-sm text-gray-500">{locale === "ar" ? "جار التحميل..." : "Loading..."}</p>}
          {!loading && forbidden && (
            <Card>
              <CardContent className="py-8 text-sm text-red-700">
                {locale === "ar" ? "غير مصرح لك بدخول هذه الصفحة" : "You are not authorized to access this page."}
              </CardContent>
            </Card>
          )}

          {!loading && !forbidden && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title={locale === "ar" ? "المستخدمون" : "Users"} value={stats?.users ?? 0} />
                <StatCard title={locale === "ar" ? "إجمالي التحليلات" : "Total analyses"} value={stats?.analyses ?? 0} />
                <StatCard title={locale === "ar" ? "المستخدمون المدفوعون" : "Paid users"} value={stats?.paid_users ?? 0} />
                <StatCard title={locale === "ar" ? "المقالات" : "Articles"} value={stats?.articles ?? 0} />
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <div className="space-y-4 xl:col-span-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-teal-600" />
                        {locale === "ar" ? "رفع المصدر (PDF/TXT/DOCX)" : "Source Upload (PDF/TXT/DOCX)"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        onClick={() => sourceInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleSourceUpload(file);
                        }}
                        className={cn(
                          "cursor-pointer rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center transition hover:border-teal-400 hover:bg-teal-50",
                          sourceLoading ? "pointer-events-none opacity-70" : ""
                        )}
                      >
                        {sourceLoading ? (
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{locale === "ar" ? "جار استخراج النص..." : "Extracting text..."}</span>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">
                            {locale === "ar"
                              ? "اسحب ملف PDF/TXT/DOCX هنا أو اضغط للرفع"
                              : "Drag a PDF/TXT/DOCX file here or click to upload"}
                          </p>
                        )}
                      </div>
                      <input
                        ref={sourceInputRef}
                        type="file"
                        accept=".pdf,.txt,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSourceUpload(file);
                          e.target.value = "";
                        }}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{locale === "ar" ? "Article Studio" : "Article Studio"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateArticle} className="space-y-3">
                        <input
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                          placeholder={locale === "ar" ? "العنوان" : "Title"}
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        />
                        <input
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                          placeholder={locale === "ar" ? "ملخص قصير" : "Short excerpt"}
                          value={excerpt}
                          onChange={(e) => setExcerpt(e.target.value)}
                        />

                        <div className="rounded-lg border border-gray-200 p-3">
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                            <ImageIcon className="h-4 w-4 text-teal-600" />
                            <span>{locale === "ar" ? "صورة الغلاف" : "Cover image"}</span>
                          </div>
                          <div
                            onClick={() => imageInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file) handleImageFile(file);
                            }}
                            className="cursor-pointer rounded-md border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-500 hover:border-teal-400 hover:bg-teal-50"
                          >
                            {locale === "ar" ? "اسحب صورة هنا أو اضغط للرفع" : "Drag an image here or click to upload"}
                          </div>
                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageFile(file);
                              e.target.value = "";
                            }}
                          />
                          <input
                            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                            placeholder={locale === "ar" ? "أو ألصق رابط الصورة" : "Or paste image URL"}
                            value={coverImageUrl}
                            onChange={(e) => {
                              setCoverImageUrl(e.target.value);
                              setCoverPreviewUrl(e.target.value);
                            }}
                          />
                          {coverPreviewUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={coverPreviewUrl} alt="cover preview" className="mt-3 h-44 w-full rounded-md object-cover" />
                          )}
                        </div>

                        <input
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                          placeholder={locale === "ar" ? "الوسوم (tag1, tag2)" : "Tags (tag1, tag2)"}
                          value={tags}
                          onChange={(e) => setTags(e.target.value)}
                        />
                        <textarea
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                          placeholder={locale === "ar" ? "محتوى المقال" : "Article content"}
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          rows={12}
                          required
                        />

                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                            {locale === "ar" ? "نشر مباشرة" : "Publish immediately"}
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input type="checkbox" checked={finalReview} onChange={(e) => setFinalReview(e.target.checked)} />
                            {locale === "ar" ? "مراجعة نهائية" : "Final review"}
                          </label>
                        </div>

                        <Button type="submit" disabled={saving} className="gap-2">
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {locale === "ar" ? "جار الحفظ..." : "Saving..."}
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              {locale === "ar" ? "نشر المقال" : "Publish article"}
                            </>
                          )}
                        </Button>
                      </form>

                      {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
                    </CardContent>
                  </Card>

                  {finalReview && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{locale === "ar" ? "معاينة قبل النشر" : "Final Review"}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {coverPreviewUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={coverPreviewUrl} alt="preview" className="mb-4 h-56 w-full rounded-lg object-cover" />
                        )}
                        <h2 className="mb-2 text-2xl font-bold text-gray-900">{title || (locale === "ar" ? "بدون عنوان" : "Untitled")}</h2>
                        {excerpt && <p className="mb-3 text-gray-600">{excerpt}</p>}
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {parsedTags.map((tag) => (
                            <span key={tag} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">{tag}</span>
                          ))}
                        </div>
                        <article className="whitespace-pre-wrap text-sm leading-7 text-gray-700">{content}</article>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Card className="h-fit xl:sticky xl:top-20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-teal-600" />
                      {locale === "ar" ? "AI Refinement" : "AI Refinement"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 max-h-[420px] space-y-2 overflow-auto pr-1">
                      {chatMessages.length === 0 && (
                        <p className="text-xs text-gray-500">
                          {locale === "ar"
                            ? "اطلب من المساعد تحسين المقال (مثال: اختصر الفقرة الثانية)."
                            : "Ask the assistant to refine this draft (e.g. shorten paragraph 2)."}
                        </p>
                      )}
                      {chatMessages.map((m) => (
                        <div key={m.id} className={cn("rounded-md border px-3 py-2", m.role === "assistant" ? "bg-teal-50 border-teal-100" : "bg-white border-gray-100")}>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            {m.role === "assistant" ? "AI" : (locale === "ar" ? "أنت" : "You")}
                          </p>
                          <p className="whitespace-pre-wrap text-sm text-gray-700">{m.content}</p>
                          {m.role === "assistant" && m.suggestion && (
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                onClick={() => applySuggestion("overwrite", m.suggestion)}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-teal-700 ring-1 ring-teal-200 hover:bg-teal-50"
                              >
                                <Wand2 className="h-3.5 w-3.5" />
                                {locale === "ar" ? "تطبيق على المحرر" : "Apply to Editor"}
                              </button>
                              <button
                                type="button"
                                onClick={() => applySuggestion("append", m.suggestion)}
                                className="rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                              >
                                {locale === "ar" ? "إلحاق" : "Append"}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleChatSubmit} className="space-y-2">
                      <textarea
                        rows={3}
                        value={chatPrompt}
                        onChange={(e) => setChatPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (chatPrompt.trim() && !chatLoading) {
                              handleChatSubmit(e as any);
                            }
                          }
                        }}
                        placeholder={locale === "ar" ? "مثال: حسّن العنوان واجعل النبرة أكثر رسمية (Enter للإرسال)" : "Example: make title stronger and shorten section 2 (Enter to send)"}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                      />
                      <Button type="submit" disabled={chatLoading || !chatPrompt.trim()} className="w-full gap-2">
                        {chatLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {locale === "ar" ? "جار المعالجة..." : "Thinking..."}
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            {locale === "ar" ? "تحسين بالذكاء الاصطناعي" : "Refine with AI"}
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{locale === "ar" ? "المقالات الحالية" : "Current articles"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {articles.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-3 rounded-md border border-gray-100 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{a.title}</p>
                          <p className="text-xs text-gray-400">/{a.slug}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn("text-xs font-semibold", a.published ? "text-green-600" : "text-amber-500")}>
                            {a.published ? (locale === "ar" ? "منشور" : "Published") : (locale === "ar" ? "مسودة" : "Draft")}
                          </span>
                          <button
                            onClick={() => startEdit(a)}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition"
                            title={locale === "ar" ? "تعديل" : "Edit"}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            disabled={deletingId === a.id}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                            title={locale === "ar" ? "حذف" : "Delete"}
                          >
                            {deletingId === a.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    {articles.length === 0 && (
                      <p className="text-sm text-gray-500">{locale === "ar" ? "لا توجد مقالات بعد" : "No articles yet."}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ── Edit article modal ── */}
              {editingArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                      <h2 className="font-semibold text-gray-900">
                        {locale === "ar" ? "تعديل المقال" : "Edit Article"}
                      </h2>
                      <button onClick={() => setEditingArticle(null)} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleEditSave} className="space-y-3 p-5">
                      <input
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                        placeholder={locale === "ar" ? "العنوان" : "Title"}
                        value={editingArticle.title}
                        onChange={(e) => setEditingArticle((prev) => prev && ({ ...prev, title: e.target.value }))}
                        required
                      />
                      <input
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                        placeholder={locale === "ar" ? "ملخص قصير" : "Short excerpt"}
                        value={editingArticle.excerpt}
                        onChange={(e) => setEditingArticle((prev) => prev && ({ ...prev, excerpt: e.target.value }))}
                      />
                      <input
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                        placeholder={locale === "ar" ? "رابط صورة الغلاف" : "Cover image URL"}
                        value={editingArticle.coverImageUrl}
                        onChange={(e) => setEditingArticle((prev) => prev && ({ ...prev, coverImageUrl: e.target.value }))}
                      />
                      <input
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                        placeholder={locale === "ar" ? "الوسوم (tag1, tag2)" : "Tags (tag1, tag2)"}
                        value={editingArticle.tags}
                        onChange={(e) => setEditingArticle((prev) => prev && ({ ...prev, tags: e.target.value }))}
                      />
                      <textarea
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                        placeholder={locale === "ar" ? "محتوى المقال" : "Article content"}
                        value={editingArticle.content}
                        onChange={(e) => setEditingArticle((prev) => prev && ({ ...prev, content: e.target.value }))}
                        rows={14}
                        required
                      />

                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setEditingArticle((prev) => prev && ({ ...prev, published: !prev.published }))}
                          className={cn(
                            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
                            editingArticle.published
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          )}
                        >
                          {editingArticle.published
                            ? <><Eye className="h-3.5 w-3.5" />{locale === "ar" ? "منشور" : "Published"}</>
                            : <><EyeOff className="h-3.5 w-3.5" />{locale === "ar" ? "مسودة" : "Draft"}</>}
                        </button>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={editSaving} className="gap-2">
                          {editSaving
                            ? <><Loader2 className="h-4 w-4 animate-spin" />{locale === "ar" ? "جار الحفظ..." : "Saving..."}</>
                            : <><Save className="h-4 w-4" />{locale === "ar" ? "حفظ التغييرات" : "Save changes"}</>}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setEditingArticle(null)}>
                          {locale === "ar" ? "إلغاء" : "Cancel"}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-gray-400">{title}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}
