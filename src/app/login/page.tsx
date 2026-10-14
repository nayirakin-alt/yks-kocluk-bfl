"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const demoAvailable = process.env.NODE_ENV !== "production";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
          return;
        }
        router.replace("/");
        router.refresh();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, class_code: classCode } },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (!data.user) {
        setError("Hesap oluşturuldu ancak kullanıcı kaydı alınamadı. Lütfen tekrar deneyin.");
        return;
      }
      if (!data.session) {
        setMessage("Hesabınız oluşturuldu. E-posta adresinizi doğrulayın; profil satırınızın `profiles` tablosunda oluşturulması gerekir.");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        role: "student",
        class_code: classCode,
      });
      if (profileError) {
        setError(`Hesap oluşturuldu fakat profil kaydedilemedi: ${profileError.message}`);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Giriş sırasında beklenmeyen bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function enterDemo() {
    window.sessionStorage.setItem("rota-demo-mode", "enabled");
    window.sessionStorage.setItem("rota-demo-role", "student");
    router.replace("/");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/[0.06] sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-indigo-600 text-white"><GraduationCap size={23} /></span>
          <div>
            <p className="text-sm font-bold text-slate-900">Rota · YKS 2027</p>
            <p className="mt-0.5 text-xs text-slate-500">Öğrenci ve öğretmen koçluk paneli</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{mode === "login" ? "Tekrar hoş geldin" : "Hesap oluştur"}</h1>
        <p className="mt-1.5 text-sm text-slate-500">{mode === "login" ? "Devam etmek için hesabına giriş yap." : "Panelini oluşturmak için bilgilerini doldur."}</p>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          {(["login", "signup"] as const).map((nextMode) => (
            <button key={nextMode} type="button" onClick={() => { setMode(nextMode); setError(""); setMessage(""); }} className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition ${mode === nextMode ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              {nextMode === "login" ? "Giriş yap" : "Kayıt ol"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === "signup" && <>
            <label className="block text-xs font-semibold text-slate-700">Ad soyad
              <input required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </label>
            <label className="block text-xs font-semibold text-slate-700">Sınıf kodu
              <input required value={classCode} onChange={(event) => setClassCode(event.target.value)} placeholder="12-A" className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </label>
          </>}
          <label className="block text-xs font-semibold text-slate-700">E-posta
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
          </label>
          <label className="block text-xs font-semibold text-slate-700">Şifre
            <input required type="password" minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
          </label>

          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-700">{error}</p>}
          {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs leading-relaxed text-emerald-800">{message}</p>}

          <button type="submit" disabled={isSubmitting} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">
            {isSubmitting ? "İşleniyor…" : mode === "login" ? "Giriş yap" : "Hesap oluştur"}{!isSubmitting && <ArrowRight size={16} />}
          </button>
        </form>

        {demoAvailable && <div className="mt-5 border-t border-slate-100 pt-5">
          <button type="button" onClick={enterDemo} className="h-11 w-full rounded-xl border border-indigo-200 bg-indigo-50 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100">Demo modunda panelleri incele</button>
          <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-500">Yalnızca geliştirme ortamında kullanılabilir. Demo değişiklikleri kaydedilmez.</p>
        </div>}
      </section>
    </main>
  );
}
