"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flame,
  GraduationCap,
  LayoutGrid,
  ListTodo,
  Plus,
  Sparkles,
  Target,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Role = "student" | "teacher";

type Profile = {
  id: string;
  full_name: string;
  role: Role;
  class_code: string | null;
};

type StudyLog = {
  id: string | number;
  subject: string;
  topic: string;
  duration_minutes: number;
  question_count: number;
  created_at: string;
};

type Assignment = {
  id: string | number;
  student_id: string | null;
  class_code: string;
  subject: string;
  topic: string;
  target_question_count: number;
  due_date: string;
  is_completed: boolean;
};

type StudentProfile = Pick<Profile, "id" | "full_name">;
type TeacherSession = Pick<StudyLog, "subject" | "duration_minutes" | "question_count" | "created_at"> & {
  user_id: string;
};

const demoEnabled = process.env.NODE_ENV !== "production";
const demoTeacher: Profile = {
  id: "00000000-0000-4000-8000-000000000001",
  full_name: "Mert Kaya",
  role: "teacher",
  class_code: "12-A",
};
const demoStudents: StudentProfile[] = [
  { id: "00000000-0000-4000-8000-000000000002", full_name: "Zeynep Yılmaz" },
  { id: "00000000-0000-4000-8000-000000000003", full_name: "Ali Kemal Nayır" },
  { id: "00000000-0000-4000-8000-000000000004", full_name: "Deniz Arslan" },
  { id: "00000000-0000-4000-8000-000000000005", full_name: "Eylül Demir" },
  { id: "00000000-0000-4000-8000-000000000006", full_name: "Mert Aydın" },
  { id: "00000000-0000-4000-8000-000000000007", full_name: "Selin Çelik" },
];

const subjects = [
  { name: "Matematik", color: "bg-violet-400", soft: "bg-violet-400/10", text: "text-violet-300", progress: 74 },
  { name: "Fizik", color: "bg-sky-400", soft: "bg-sky-400/10", text: "text-sky-300", progress: 58 },
  { name: "Kimya", color: "bg-emerald-400", soft: "bg-emerald-400/10", text: "text-emerald-300", progress: 68 },
  { name: "Biyoloji", color: "bg-lime-400", soft: "bg-lime-400/10", text: "text-lime-300", progress: 49 },
  { name: "Türkçe", color: "bg-rose-400", soft: "bg-rose-400/10", text: "text-rose-300", progress: 82 },
  { name: "Tarih / Coğrafya", color: "bg-amber-400", soft: "bg-amber-400/10", text: "text-amber-300", progress: 41 },
];

const days = [
  { label: "Pzt", date: "12" },
  { label: "Sal", date: "13" },
  { label: "Çar", date: "14" },
  { label: "Per", date: "15" },
  { label: "Cum", date: "16" },
  { label: "Cmt", date: "17" },
  { label: "Paz", date: "18" },
];

const timetable: { time: string; sessions: (string | null)[] }[] = [
  { time: "09.00", sessions: ["Matematik", "Türkçe", "Matematik", "Fizik", "Türkçe", "Kimya", null] },
  { time: "10.00", sessions: ["Matematik", "Türkçe", "Fizik", "Fizik", "Biyoloji", "Kimya", "Matematik"] },
  { time: "11.00", sessions: ["Fizik", null, "Kimya", null, "Matematik", "Türkçe", "Matematik"] },
  { time: "13.00", sessions: ["Türkçe", "Matematik", "Biyoloji", "Kimya", null, "Fizik", "Türkçe"] },
  { time: "14.00", sessions: ["Tarih / Coğrafya", "Fizik", null, "Türkçe", "Kimya", "Biyoloji", null] },
];

const topicsBySubject: Record<string, string[]> = {
  Matematik: ["Limit ve süreklilik", "Türev", "İntegral", "Problemler", "Trigonometri"],
  Fizik: ["Hareket", "Kuvvet ve hareket", "Elektrik", "Dalgalar", "Optik"],
  Kimya: ["Modern atom teorisi", "Gazlar", "Çözeltiler", "Kimyasal tepkimeler"],
  Biyoloji: ["Hücre bölünmeleri", "Kalıtım", "Ekosistem", "İnsan fizyolojisi"],
  Türkçe: ["Paragraf", "Dil bilgisi", "Sözcükte anlam", "Cümlede anlam"],
  "Tarih / Coğrafya": ["Milli Mücadele", "Osmanlı tarihi", "Harita bilgisi", "Türkiye'nin bölgeleri"],
};

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("tr-TR");
}

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeDemoSessions(): TeacherSession[] {
  const now = new Date();
  return demoStudents.flatMap((student, studentIndex) =>
    Array.from({ length: 4 }, (_, itemIndex) => {
      const date = new Date(now);
      date.setDate(date.getDate() - itemIndex * 2);
      date.setHours(9 + studentIndex + itemIndex, 15, 0, 0);
      const subject = subjects[(studentIndex + itemIndex) % subjects.length].name;
      return {
        user_id: student.id,
        subject,
        duration_minutes: 35 + studentIndex * 8 + itemIndex * 5,
        question_count: 20 + studentIndex * 9 + itemIndex * 4,
        created_at: date.toISOString(),
      };
    }),
  );
}

const demoSessions = makeDemoSessions();
const demoAssignments: Assignment[] = [
  {
    id: "demo-assignment-1",
    student_id: demoStudents[1].id,
    class_code: "12-A",
    subject: "Matematik",
    topic: "Limit ve süreklilik",
    target_question_count: 40,
    due_date: dateInputValue(new Date(Date.now() + 6 * 86400000)),
    is_completed: false,
  },
  {
    id: "demo-assignment-2",
    student_id: demoStudents[1].id,
    class_code: "12-A",
    subject: "Türkçe",
    topic: "Paragraf",
    target_question_count: 20,
    due_date: dateInputValue(new Date(Date.now() + 2 * 86400000)),
    is_completed: true,
  },
  ...demoStudents.filter((student) => student.id !== demoStudents[1].id).map((student, index) => ({
    id: `demo-assignment-${index + 3}`,
    student_id: student.id,
    class_code: "12-A",
    subject: subjects[index % subjects.length].name,
    topic: topicsBySubject[subjects[index % subjects.length].name][0],
    target_question_count: 30 + index * 5,
    due_date: dateInputValue(new Date(Date.now() + (index + 3) * 86400000)),
    is_completed: index % 2 === 0,
  })),
];

function DemoControls({
  role,
  onRoleChange,
  onExit,
}: {
  role: Role;
  onRoleChange: (role: Role) => void;
  onExit: () => void;
}) {
  if (!demoEnabled) return null;

  return (
    <div className="border-b border-indigo-200 bg-indigo-50/90 px-4 py-2.5 text-indigo-950">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold sm:text-xs">Demo modu · Değişiklikler Supabase’e kaydedilmez.</p>
        <div className="flex items-center gap-1.5">
          {(["student", "teacher"] as const).map((nextRole) => (
            <button
              key={nextRole}
              type="button"
              aria-pressed={role === nextRole}
              onClick={() => onRoleChange(nextRole)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition",
                role === nextRole ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-indigo-100",
              )}
            >
              {nextRole === "student" ? "Öğrenci paneli" : "Öğretmen paneli"}
            </button>
          ))}
          <button type="button" onClick={onExit} className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-white">
            Demo’dan çık
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  iconClass,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  note: string;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111a2d] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</p>
          <p className="mt-1 text-[11px] text-slate-500">{note}</p>
        </div>
        <span className={cn("grid size-10 place-items-center rounded-xl", iconClass)}><Icon size={19} /></span>
      </div>
    </div>
  );
}

function StudentPanel({
  profile,
  demoMode = false,
  onDemoRoleChange,
  onExitDemo,
}: {
  profile: Profile;
  demoMode?: boolean;
  onDemoRoleChange?: (role: Role) => void;
  onExitDemo?: () => void;
}) {
  const supabase = useMemo(() => demoMode ? null : createClient(), [demoMode]);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0].name);
  const [selectedTopic, setSelectedTopic] = useState(topicsBySubject[subjects[0].name][0]);
  const [duration, setDuration] = useState("45");
  const [questionCount, setQuestionCount] = useState("25");
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [goals, setGoals] = useState<Assignment[]>([]);
  const [activeNav, setActiveNav] = useState("Takvim");
  const [savedMessage, setSavedMessage] = useState("");
  const [dataError, setDataError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingGoalId, setUpdatingGoalId] = useState<string | number | null>(null);
  const totalMinutes = studyLogs.reduce((total, log) => total + log.duration_minutes, 0);
  const totalQuestions = studyLogs.reduce((total, log) => total + log.question_count, 0);
  const dailyProgress = Math.min(100, Math.round(totalMinutes / 240 * 100));

  useEffect(() => {
    let active = true;

    async function loadStudentData() {
      setIsLoading(true);
      setDataError("");
      if (demoMode) {
        setStudyLogs(demoSessions.filter((session) => session.user_id === profile.id).map((session, index) => ({
          ...session,
          id: `demo-session-${index}`,
          topic: topicsBySubject[session.subject][index % topicsBySubject[session.subject].length],
        })).filter((session) => new Date(session.created_at).toDateString() === new Date().toDateString()));
        setGoals(demoAssignments.filter((assignment) => assignment.student_id === profile.id));
        setIsLoading(false);
        return;
      }
      if (!supabase) return;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [sessionsResult, assignmentsResult] = await Promise.all([
        supabase
          .from("study_sessions")
          .select("id, subject, topic, duration_minutes, question_count, created_at")
          .eq("user_id", profile.id)
          .gte("created_at", today.toISOString())
          .order("created_at", { ascending: false }),
        supabase
          .from("assignments")
          .select("id, student_id, class_code, subject, topic, target_question_count, due_date, is_completed")
          .eq("student_id", profile.id)
          .order("due_date", { ascending: true }),
      ]);

      if (!active) return;
      const errors = [sessionsResult.error, assignmentsResult.error].filter(Boolean);
      if (errors.length > 0) {
        setDataError(errors.map((error) => error?.message).join(" · "));
      } else {
        setStudyLogs(sessionsResult.data ?? []);
        setGoals(assignmentsResult.data ?? []);
      }
      setIsLoading(false);
    }

    void loadStudentData();
    return () => {
      active = false;
    };
  }, [demoMode, profile.id, supabase]);

  async function saveStudy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Number(duration);
    const questions = Number(questionCount);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440 || !Number.isInteger(questions) || questions < 0 || questions > 5000) {
      setSavedMessage("Lütfen geçerli süre ve soru sayısı gir.");
      return;
    }
    if (demoMode) {
      const created: StudyLog = {
        id: `demo-session-${Date.now()}`,
        subject: selectedSubject,
        topic: selectedTopic,
        duration_minutes: minutes,
        question_count: questions,
        created_at: new Date().toISOString(),
      };
      setStudyLogs((current) => [created, ...current]);
      setSavedMessage(`${selectedSubject} çalışman demo verisine eklendi.`);
      return;
    }
    if (!supabase) {
      setSavedMessage("Supabase bağlantısı hazır değil.");
      return;
    }
    setIsSaving(true);
    setSavedMessage("");
    const { data, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: profile.id,
        subject: selectedSubject,
        topic: selectedTopic,
        duration_minutes: minutes,
        question_count: questions,
      })
      .select("id, subject, topic, duration_minutes, question_count, created_at")
      .single();
    setIsSaving(false);
    if (error) {
      setSavedMessage(`Çalışma kaydedilemedi: ${error.message}`);
      return;
    }
    setStudyLogs((current) => [data, ...current]);
    setSavedMessage(`${selectedSubject} çalışman kaydedildi.`);
  }

  async function toggleGoal(goal: Assignment) {
    if (demoMode) {
      setGoals((current) => current.map((item) => item.id === goal.id ? { ...item, is_completed: !item.is_completed } : item));
      return;
    }
    if (!supabase) {
      setDataError("Supabase bağlantısı hazır değil.");
      return;
    }
    setUpdatingGoalId(goal.id);
    setDataError("");
    const { data, error } = await supabase
      .from("assignments")
      .update({ is_completed: !goal.is_completed })
      .eq("id", goal.id)
      .eq("student_id", profile.id)
      .select("id, student_id, class_code, subject, topic, target_question_count, due_date, is_completed")
      .single();
    setUpdatingGoalId(null);
    if (error) {
      setDataError(`Hedef durumu güncellenemedi: ${error.message}`);
      return;
    }
    setGoals((current) => current.map((item) => item.id === goal.id ? data : item));
  }
  function changeSubject(subject: string) {
    setSelectedSubject(subject);
    setSelectedTopic(topicsBySubject[subject][0]);
  }

  const navItems = [
    { label: "Takvim", icon: CalendarDays, href: "#takvim" },
    { label: "Görevlerim", icon: ListTodo, href: "#hedefler" },
    { label: "İlerlemem", icon: Activity, href: "#ilerleme" },
    { label: "Profilim", icon: UserRound, href: "#profil" },
  ];

  const initials = profile.full_name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-[#080e1b] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-36 -top-52 size-[520px] rounded-full bg-blue-500/[0.07] blur-3xl" />
        <div className="absolute -left-48 top-[42%] size-[480px] rounded-full bg-indigo-500/[0.05] blur-3xl" />
      </div>
      <header className="relative z-10 border-b border-white/[0.07] bg-[#0b1221]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[84px] max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:flex-nowrap sm:px-7 sm:py-0 lg:px-10">
          <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-blue-300"><GraduationCap size={22} /></div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold leading-tight tracking-tight text-white sm:text-base">YKS 2027 - Hayallerine Bir Adım Daha</p>
              <p className="mt-1 text-[8px] text-slate-500 sm:text-[11px]">Bugünün emeği, yarının başarısıdır</p>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <button type="button" aria-label="Bildirimler" className="relative grid size-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.08]">
              <Bell size={18} /><span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-blue-400 ring-2 ring-[#0b1221]" />
            </button>
            <div id="profil" className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] py-1.5 pl-1.5 pr-3">
              <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 text-[10px] font-bold text-white">{initials}</div>
              <div className="max-w-[120px] sm:max-w-none"><p className="text-[9px] font-semibold leading-tight text-white sm:text-[11px]">{profile.full_name}</p><p className="mt-0.5 text-[8px] leading-tight text-slate-500 sm:text-[10px]">{profile.class_code ?? "Öğrenci"}</p></div>
            </div>
          </div>
        </div>
      </header>

      {demoMode && onDemoRoleChange && onExitDemo && <DemoControls role="student" onRoleChange={onDemoRoleChange} onExit={onExitDemo} />}
      <main className="relative z-10 mx-auto max-w-[1440px] space-y-5 px-4 pb-28 pt-6 sm:px-7 sm:pt-8 lg:px-10 lg:pb-12">
        {dataError && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-xs text-rose-200">{dataError}</p>}
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-400/[0.07] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-blue-300"><Sparkles size={12} /> 2027 YKS YOLCULUĞUN</div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[30px]">Merhaba, {profile.full_name.split(/\s+/)[0]} <span aria-hidden="true">✦</span></h1>
            <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">Küçük adımlar, büyük hedeflere götürür. Bugün senin günün.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#111a2d] px-3 py-2 text-[11px] text-slate-300">
            <CalendarDays size={15} className="text-blue-300" /> 14 Ekim 2026 <span className="text-slate-600">·</span> Çarşamba
          </div>
        </section>

        <section aria-label="Günlük özet" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard icon={Clock3} label="Bugünkü çalışma" value={isLoading ? "…" : `${Math.floor(totalMinutes / 60)} sa ${totalMinutes % 60} dk`} note="Bugün kaydedilen toplam süre" iconClass="bg-blue-400/10 text-blue-300" />
          <MetricCard icon={CheckCircle2} label="Çözülen soru" value={isLoading ? "…" : `${totalQuestions}`} note="Bugün kaydedilen soru sayısı" iconClass="bg-emerald-400/10 text-emerald-300" />
          <MetricCard icon={Flame} label="Bekleyen ödev" value={isLoading ? "…" : `${goals.filter((goal) => !goal.is_completed).length}`} note="Tamamlanmamış ödev sayısı" iconClass="bg-amber-400/10 text-amber-300" />
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(310px,0.8fr)]">
          <div className="space-y-5">
            <section id="takvim" className="rounded-2xl border border-white/[0.07] bg-[#111a2d] p-4 sm:p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-sm font-bold text-white sm:text-base">Haftalık çalışma takvimi</h2><p className="mt-1 text-[11px] text-slate-500">12 – 18 Ekim · Planına sadık kal, hedefine yaklaş</p></div>
                <button type="button" className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 py-2 text-[10px] font-semibold text-slate-300 hover:bg-white/[0.05]"><ChevronLeft size={14} /> Bu hafta <ChevronRight size={14} /></button>
              </div>
              <div className="overflow-x-auto pb-1">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-[54px_repeat(7,minmax(0,1fr))] gap-1.5 sm:gap-2">
                    <div />
                    {days.map((day, index) => (
                      <div key={day.label} className={cn("rounded-lg py-2 text-center", index === 2 ? "bg-blue-500/10" : "")}>
                        <p className={cn("text-[10px] font-semibold", index === 2 ? "text-blue-300" : "text-slate-500")}>{day.label}</p>
                        <p className={cn("mt-1 text-xs font-bold", index === 2 ? "text-white" : "text-slate-300")}>{day.date}</p>
                      </div>
                    ))}
                    {timetable.map((row) => (
                      <div key={row.time} className="contents">
                        <div className="pt-2 text-[9px] font-medium text-slate-600">{row.time}</div>
                        {row.sessions.map((subject, index) => {
                          const item = subjects.find(({ name }) => name === subject);
                          return (
                            <div key={`${row.time}-${days[index].label}`} className={cn("flex min-h-[51px] items-center rounded-lg px-1.5 py-1.5 sm:px-2", item ? `${item.soft} border border-white/[0.03]` : "border border-dashed border-white/[0.06]")}>
                              {item ? <div className="min-w-0"><span className={cn("mb-1 block size-1.5 rounded-full", item.color)} /><p className={cn("truncate text-[9px] font-semibold leading-tight", item.text)}>{subject}</p><p className="mt-0.5 text-[8px] text-slate-500">45 dk · çalışma</p></div> : <span className="w-full text-center text-[9px] text-slate-700">—</span>}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 border-t border-white/[0.06] pt-3">
                {subjects.map((subject) => <span key={subject.name} className="flex items-center gap-1.5 text-[9px] text-slate-400"><span className={cn("size-1.5 rounded-full", subject.color)} />{subject.name}</span>)}
              </div>
            </section>

            <section id="kayit" className="rounded-2xl border border-blue-400/15 bg-gradient-to-br from-[#121f36] to-[#111a2d] p-4 sm:p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-400/10 text-blue-300"><Plus size={19} /></div>
                <div><h2 className="text-sm font-bold text-white sm:text-base">Bugünün çalışmasını ekle</h2><p className="mt-1 text-[11px] text-slate-400">Her emek kayda değer, ilerlemeni takip et.</p></div>
              </div>
              <form onSubmit={saveStudy} className="grid gap-3 sm:grid-cols-2">
                <label className="text-[10px] font-medium text-slate-400">Ders seç
                  <select value={selectedSubject} onChange={(event) => changeSubject(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.09] bg-[#0b1322] px-3 text-xs text-slate-100 outline-none focus:border-blue-400/50">
                    {subjects.map(({ name }) => <option key={name}>{name}</option>)}
                  </select>
                </label>
                <label className="text-[10px] font-medium text-slate-400">Konu seç
                  <select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.09] bg-[#0b1322] px-3 text-xs text-slate-100 outline-none focus:border-blue-400/50">
                    {topicsBySubject[selectedSubject].map((topic) => <option key={topic}>{topic}</option>)}
                  </select>
                </label>
                <label className="text-[10px] font-medium text-slate-400">Süre (dakika)
                  <input type="number" min="1" max="1440" required value={duration} onChange={(event) => setDuration(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.09] bg-[#0b1322] px-3 text-xs text-slate-100 outline-none focus:border-blue-400/50" />
                </label>
                <label className="text-[10px] font-medium text-slate-400">Soru sayısı
                  <input type="number" min="0" max="5000" required value={questionCount} onChange={(event) => setQuestionCount(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.09] bg-[#0b1322] px-3 text-xs text-slate-100 outline-none focus:border-blue-400/50" />
                </label>
                <div className="flex items-center justify-between gap-3 sm:col-span-2">
                  <p aria-live="polite" className={cn("text-[10px]", savedMessage.startsWith("Çalışma kaydedilemedi") || savedMessage.startsWith("Lütfen") ? "text-rose-300" : "text-emerald-300")}>{savedMessage}</p>
                  <button type="submit" disabled={isSaving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-500 px-4 text-xs font-bold text-white transition hover:bg-blue-400 disabled:cursor-wait disabled:opacity-60"><Check size={15} /> {isSaving ? "Kaydediliyor…" : "Kaydet"}</button>
                </div>
              </form>
              {(isLoading || studyLogs.length > 0) && <div className="mt-4 border-t border-white/[0.07] pt-3"><p className="mb-2 text-[10px] font-semibold text-slate-400">Bugünkü çalışmalar</p><div className="space-y-2">{isLoading ? <p className="text-[10px] text-slate-500">Kayıtlar yükleniyor…</p> : studyLogs.slice(0, 3).map((log) => <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 text-[10px]"><span className="font-semibold text-slate-200">{log.subject} <span className="font-normal text-slate-500">· {log.topic}</span></span><span className="text-slate-400">{log.duration_minutes} dk · {log.question_count} soru</span></div>)}</div></div>}
            </section>
          </div>

          <div className="space-y-5">
            <section id="ilerleme" className="rounded-2xl border border-white/[0.07] bg-[#111a2d] p-4 sm:p-5">
              <div className="mb-4"><h2 className="text-sm font-bold text-white sm:text-base">Bugünkü hedef ilerlemesi</h2><p className="mt-1 text-[11px] text-slate-500">Bugün kaydettiğin çalışmalara göre.</p></div>
              <div className="flex flex-col items-center gap-5 rounded-xl bg-[#0c1424] px-3 py-5 sm:flex-row sm:justify-around">
                <div className="relative grid size-32 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#5595ff 0% ${dailyProgress}%, #202c42 ${dailyProgress}% 100%)` }} role="img" aria-label={`Günlük hedefin yüzde ${dailyProgress} kadarı tamamlandı`}>
                  <div className="grid size-[108px] place-content-center rounded-full bg-[#0c1424] text-center"><span className="text-3xl font-bold text-white">{dailyProgress}<span className="text-lg">%</span></span><span className="mt-0.5 text-[9px] text-slate-500">HEDEFE DOĞRU</span></div>
                </div>
                <div className="text-center sm:text-left"><p className="text-[11px] font-medium text-slate-400">Bugünkü çalışma</p><p className="mt-1 text-lg font-bold text-white">{(totalMinutes / 60).toFixed(1)} <span className="text-xs font-medium text-slate-500">/ 4 saat</span></p><p className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300"><CheckCircle2 size={13} /> {totalQuestions} soru kaydedildi</p></div>
              </div>
              <div className="mt-5 space-y-3">
                {subjects.map((subject) => {
                  const minutes = studyLogs.filter((log) => log.subject === subject.name).reduce((total, log) => total + log.duration_minutes, 0);
                  const progress = totalMinutes ? Math.round(minutes / totalMinutes * 100) : 0;
                  return <div key={subject.name}>
                  <div className="mb-1.5 flex items-center justify-between text-[10px]"><span className="flex items-center gap-2 font-medium text-slate-300"><span className={cn("size-1.5 rounded-full", subject.color)} />{subject.name}</span><span className="text-slate-500">{progress}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className={cn("h-full rounded-full", subject.color)} style={{ width: `${progress}%` }} /></div>
                </div>;
                })}
              </div>
            </section>

            <section id="hedefler" className="rounded-2xl border border-white/[0.07] bg-[#111a2d] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div><h2 className="text-sm font-bold text-white sm:text-base">Ödevlerim</h2><p className="mt-1 text-[11px] text-slate-500">{goals.filter((goal) => goal.is_completed).length} / {goals.length} ödev tamamlandı</p></div>
                <span className="grid size-9 place-items-center rounded-xl bg-amber-400/10 text-amber-300"><Target size={17} /></span>
              </div>
              <div className="space-y-1">
                {isLoading ? <p className="px-2 py-4 text-[10px] text-slate-500">Ödevler yükleniyor…</p> : goals.length === 0 ? <p className="px-2 py-4 text-[10px] text-slate-500">Henüz atanmış ödevin yok.</p> : goals.map((goal) => <label key={goal.id} className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-3 transition hover:bg-white/[0.03]">
                  <input type="checkbox" checked={goal.is_completed} disabled={updatingGoalId === goal.id} onChange={() => void toggleGoal(goal)} className="mt-0.5 size-4 accent-blue-500 disabled:opacity-50" />
                  <span className="min-w-0 flex-1"><span className={cn("block text-[11px] font-semibold", goal.is_completed ? "text-slate-500 line-through" : "text-slate-200")}>{goal.subject} · {goal.topic}</span><span className="mt-1 block text-[10px] text-slate-500">{goal.target_question_count} soru · Son tarih {formatDate(goal.due_date)}</span></span>
                  {goal.is_completed && <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" />}
                </label>)}
              </div>
              {isLoading && <p className="mt-2 text-center text-[10px] text-slate-500">Supabase bağlantısı yükleniyor…</p>}
            </section>

            <div className="flex items-start gap-3 rounded-2xl border border-blue-400/10 bg-blue-400/[0.05] p-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-400/10 text-blue-300"><Award size={16} /></span><div><p className="text-[11px] font-semibold text-slate-200">İstikrar başarıyı getirir</p><p className="mt-1 text-[10px] leading-relaxed text-slate-500">Bugünün emeği, yarının başarısıdır. Harika gidiyorsun!</p></div>
            </div>
          </div>
        </section>
        <footer className="hidden items-center justify-between border-t border-white/[0.06] pt-4 text-[10px] text-slate-600 sm:flex"><span>YKS 2027 · {profile.full_name} için kişisel çalışma alanı</span><span className="flex items-center gap-1.5"><span className={cn("size-1.5 rounded-full", isLoading ? "bg-amber-400" : dataError ? "bg-rose-400" : "bg-emerald-400")} />{isLoading ? "Veriler yükleniyor" : dataError ? "Bağlantı hatası" : "Veriler güncel"}</span></footer>
      </main>

      <nav aria-label="Alt navigasyon" className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.08] bg-[#0b1221]/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4">{navItems.map(({ label, icon: Icon, href }) => <a key={label} href={href} onClick={() => setActiveNav(label)} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-semibold transition", activeNav === label ? "text-blue-300" : "text-slate-500")}><Icon size={18} /><span>{label}</span></a>)}</div>
      </nav>
    </div>
  );
}

function TeacherPanel({
  profile,
  demoMode = false,
  onDemoRoleChange,
  onExitDemo,
}: {
  profile: Profile;
  demoMode?: boolean;
  onDemoRoleChange?: (role: Role) => void;
  onExitDemo?: () => void;
}) {
  const supabase = useMemo(() => demoMode ? null : createClient(), [demoMode]);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [assignmentCreated, setAssignmentCreated] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [audience, setAudience] = useState("class");
  const [subject, setSubject] = useState("Matematik");
  const [topic, setTopic] = useState("Limit ve süreklilik");
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 6);
    return dateInputValue(date);
  });
  const [questions, setQuestions] = useState("40");
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<Assignment[]>([]);
  const [dataError, setDataError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadTeacherData() {
      setIsLoading(true);
      setDataError("");
      if (demoMode) {
        setStudents(demoStudents);
        setSessions(demoSessions);
        setTeacherAssignments(demoAssignments);
        setIsLoading(false);
        return;
      }
      if (!supabase) return;
      if (!profile.class_code) {
        setDataError("Öğretmen profilinizde class_code tanımlı değil.");
        setIsLoading(false);
        return;
      }

      const sessionStart = new Date();
      sessionStart.setDate(sessionStart.getDate() - 34);
      sessionStart.setHours(0, 0, 0, 0);

      const [studentsResult, assignmentsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name")
          .eq("role", "student")
          .eq("class_code", profile.class_code)
          .order("full_name"),
        supabase
          .from("assignments")
          .select("id, student_id, class_code, subject, topic, target_question_count, due_date, is_completed")
          .eq("teacher_id", profile.id)
          .order("due_date", { ascending: true }),
      ]);

      if (!active) return;
      const errors = [studentsResult.error, assignmentsResult.error].filter(Boolean);
      if (errors.length > 0) {
        setDataError(errors.map((error) => error?.message).join(" · "));
        setIsLoading(false);
        return;
      }

      const studentProfiles = studentsResult.data ?? [];
      const studentIds = studentProfiles.map((student) => student.id);
      const sessionsResult = studentIds.length
        ? await supabase
          .from("study_sessions")
          .select("user_id, subject, duration_minutes, question_count, created_at")
          .in("user_id", studentIds)
          .gte("created_at", sessionStart.toISOString())
        : { data: [], error: null };
      if (!active) return;
      if (sessionsResult.error) {
        setDataError(sessionsResult.error.message);
      } else {
        setStudents(studentProfiles);
        setSessions(sessionsResult.data ?? []);
        setTeacherAssignments(assignmentsResult.data ?? []);
      }
      setIsLoading(false);
    }

    void loadTeacherData();
    return () => {
      active = false;
    };
  }, [demoMode, profile.class_code, profile.id, supabase]);

  async function submitAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAssignmentError("");
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }
    const classCode = profile.class_code;
    if (!classCode) {
      setAssignmentError("Öğretmen profilinizde class_code tanımlı değil.");
      return;
    }
    if (demoMode) {
      const recipients = audience === "class" ? students : students.filter((student) => student.id === audience);
      if (recipients.length === 0) {
        setAssignmentError("Lütfen ödev atanacak öğrenci seçin.");
        return;
      }
      const questionCount = Number(questions);
      if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 5000) {
        setAssignmentError("Soru sayısı 1 ile 5000 arasında olmalıdır.");
        return;
      }
      setTeacherAssignments((current) => [
        ...current,
        ...recipients.map((student, index) => ({
          id: `demo-new-${Date.now()}-${index}`,
          student_id: student.id,
          class_code: classCode,
          subject,
          topic,
          target_question_count: questionCount,
          due_date: dueDate,
          is_completed: false,
        })),
      ]);
      setAssignmentCreated(`${recipients.length} öğrenciye ${subject} demo ödevi atandı.`);
      setAssignmentOpen(false);
      setStep(1);
      return;
    }
    if (!supabase) {
      setAssignmentError("Supabase bağlantısı hazır değil.");
      return;
    }
    const recipients = audience === "class" ? students : students.filter((student) => student.id === audience);
    if (recipients.length === 0) {
      setAssignmentError(audience === "class" ? "Bu sınıfta ödev atanacak öğrenci bulunamadı." : "Lütfen geçerli bir öğrenci seçin.");
      return;
    }
    const questionCount = Number(questions);
    if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 5000) {
      setAssignmentError("Soru sayısı 1 ile 5000 arasında olmalıdır.");
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from("assignments")
      .insert(recipients.map((student) => ({
        teacher_id: profile.id,
        student_id: student.id,
        class_code: classCode,
        subject,
        topic,
        target_question_count: questionCount,
        due_date: dueDate,
        is_completed: false,
      })))
      .select("id, student_id, class_code, subject, topic, target_question_count, due_date, is_completed");
    setIsSubmitting(false);
    if (error) {
      setAssignmentError(`Ödev atanamadı: ${error.message}`);
      return;
    }

    setTeacherAssignments((current) => [...current, ...(data ?? [])]);
    setAssignmentCreated(`${recipients.length} öğrenciye ${subject} ödevi atandı.`);
    setAssignmentOpen(false);
    setStep(1);
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weeklySessions = sessions.filter((session) => new Date(session.created_at) >= weekStart);
  const studentRows = students.map((student) => {
    const studentSessions = weeklySessions.filter((session) => session.user_id === student.id);
    const minutes = studentSessions.reduce((total, session) => total + session.duration_minutes, 0);
    const questionsCompleted = studentSessions.reduce((total, session) => total + session.question_count, 0);
    return { ...student, minutes, questions: questionsCompleted, sessions: studentSessions };
  }).sort((left, right) => right.minutes - left.minutes);
  const highestMinutes = Math.max(0, ...studentRows.map((student) => student.minutes));
  const weeklyHours = weeklySessions.reduce((total, session) => total + session.duration_minutes, 0) / 60;
  const weeklyQuestions = weeklySessions.reduce((total, session) => total + session.question_count, 0);
  const averageHours = students.length ? weeklyHours / students.length : 0;
  const averageQuestions = students.length ? weeklyQuestions / students.length : 0;
  const subjectTotals = subjects.map(({ name }) => ({
    name,
    minutes: sessions.filter((session) => session.subject === name).reduce((total, session) => total + session.duration_minutes, 0),
  }));
  const totalSubjectMinutes = subjectTotals.reduce((total, item) => total + item.minutes, 0);
  const month = new Date();
  const monthStartOffset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const monthLength = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const heatColors = ["bg-slate-100", "bg-indigo-100", "bg-indigo-200", "bg-indigo-400", "bg-indigo-600"];
  const activityByDay = new Map<string, number>();
  sessions.forEach((session) => {
    const created = new Date(session.created_at);
    const key = `${created.getFullYear()}-${created.getMonth()}-${created.getDate()}`;
    activityByDay.set(key, (activityByDay.get(key) ?? 0) + 1);
  });
  const highestDailyActivity = Math.max(0, ...activityByDay.values());
  const classAssignments = teacherAssignments.reduce((groups, assignment) => {
    const key = `${assignment.subject}-${assignment.topic}-${assignment.due_date}`;
    const group = groups.get(key) ?? { ...assignment, total: 0, completed: 0 };
    group.total += 1;
    group.completed += Number(assignment.is_completed);
    groups.set(key, group);
    return groups;
  }, new Map<string, Assignment & { total: number; completed: number }>());
  const audienceName = audience === "class"
    ? `${profile.class_code ?? "Sınıf"} sınıfı`
    : students.find((student) => student.id === audience)?.full_name ?? "Öğrenci";
  const initials = profile.full_name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-[#f1f4fa] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-7 lg:px-10">
          <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"><GraduationCap size={21} /></div><div><p className="text-sm font-bold tracking-tight text-slate-900">EduTrack <span className="font-medium text-slate-400">· Sınıf paneli</span></p><p className="mt-0.5 hidden text-[10px] text-slate-500 sm:block">Öğrencilerinizin gelişimini tek yerden takip edin</p></div></div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" aria-label="Yardım" className="hidden size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 sm:grid"><CircleHelp size={17} /></button>
            <button type="button" aria-label="Bildirimler" className="relative grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500"><Bell size={17} /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-500" /></button>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/70 p-1 pr-2 sm:gap-2.5 sm:pr-3"><div className="grid size-8 place-items-center rounded-lg bg-indigo-100 text-[10px] font-bold text-indigo-700">{initials}</div><div className="hidden sm:block"><p className="text-[10px] font-semibold text-slate-800">{profile.full_name}</p><p className="text-[9px] text-slate-500">Eğitim koçu · {profile.class_code ?? "Sınıf tanımsız"}</p></div></div>
          </div>
        </div>
      </header>

      {demoMode && onDemoRoleChange && onExitDemo && <DemoControls role="teacher" onRoleChange={onDemoRoleChange} onExit={onExitDemo} />}
      <main className="mx-auto max-w-[1440px] space-y-5 px-4 pb-24 pt-6 sm:px-7 sm:pt-8 lg:px-10">
        {dataError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{dataError}</p>}
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">2026 – 2027 DÖNEMİ <span className="px-1 text-slate-300">/</span> {profile.class_code ?? "SINIF TANIMSIZ"}</p><h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[30px]">Sınıf özeti</h1><p className="mt-1.5 text-xs text-slate-500 sm:text-sm">Öğrencilerinizin bu haftaki çalışma performansı.</p></div>
          <button type="button" onClick={() => { setAssignmentError(""); setStep(1); setAssignmentOpen(true); }} className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"><Plus size={15} /> Ödev ata</button>
        </section>

        <section aria-label="Sınıf metrikleri" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-900/[0.04] sm:p-5"><span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><UsersRound size={20} /></span><div><p className="text-[11px] font-medium text-slate-500">Toplam öğrenci</p><p className="mt-1 text-2xl font-bold text-slate-900">{isLoading ? "…" : students.length}</p></div><span className="ml-auto rounded-lg bg-indigo-50 px-2 py-1 text-[9px] font-bold text-indigo-700">{profile.class_code ?? "Sınıf"}</span></div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-900/[0.04] sm:p-5"><span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Clock3 size={20} /></span><div><p className="text-[11px] font-medium text-slate-500">Haftalık ort. çalışma süresi</p><p className="mt-1 text-2xl font-bold text-slate-900">{isLoading ? "…" : averageHours.toFixed(1)} <span className="text-xs font-medium text-slate-400">saat</span></p></div><span className="ml-auto text-[10px] font-semibold text-slate-500">Öğrenci başı</span></div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-900/[0.04] sm:p-5"><span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><BookOpen size={20} /></span><div><p className="text-[11px] font-medium text-slate-500">Haftalık ort. soru sayısı</p><p className="mt-1 text-2xl font-bold text-slate-900">{isLoading ? "…" : Math.round(averageQuestions)} <span className="text-xs font-medium text-slate-400">soru</span></p></div><span className="ml-auto rounded-lg bg-indigo-50 px-2 py-1 text-[9px] font-bold text-indigo-700">Öğrenci başı</span></div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.85fr)]">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-900/[0.04] sm:p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900 sm:text-base">Sınıfın aylık çalışma aktivitesi</h2><p className="mt-1 text-[11px] text-slate-500">Öğrencilerin günlük çalışma yoğunluğu</p></div><span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] font-semibold text-slate-600">{month.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</span></div>
            <div className="overflow-x-auto pb-1">
              <div className="min-w-[430px]">
                <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[9px] font-medium text-slate-400">{["P", "S", "Ç", "P", "C", "C", "P"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 35 }, (_, index) => {
                    const date = index - monthStartOffset + 1;
                    if (date < 1 || date > monthLength) return <span key={`empty-${index}`} />;
                    const daySessions = activityByDay.get(`${month.getFullYear()}-${month.getMonth()}-${date}`) ?? 0;
                    const intensity = highestDailyActivity ? Math.ceil(daySessions / highestDailyActivity * 4) : 0;
                    return <span key={`day-${date}`} title={`${date} ${month.toLocaleDateString("tr-TR", { month: "long" })} · ${daySessions} çalışma`} className={cn("grid aspect-square min-h-7 place-items-center rounded-md text-[9px]", heatColors[intensity], intensity > 2 ? "text-white" : "text-slate-600")}>{date}</span>;
                  })}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3"><span className="text-[10px] text-slate-500">{isLoading ? "Aktivite yükleniyor…" : "Bu ay kaydedilen sınıf çalışmaları"}</span><div className="flex items-center gap-1.5 text-[9px] text-slate-500"><span>Az</span>{heatColors.map((color) => <span key={color} className={cn("size-3 rounded-[3px]", color)} />)}<span>Çok</span></div></div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-900/[0.04] sm:p-5">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-900 sm:text-base">Derslere göre çalışma süresi</h2><p className="mt-1 text-[11px] text-slate-500">Son 35 günde kaydedilen süre dağılımı</p></div><LayoutGrid size={17} className="text-indigo-400" /></div>
            <div className="space-y-3.5">{subjectTotals.map(({ name, minutes }, index) => {
              const progress = totalSubjectMinutes ? Math.round(minutes / totalSubjectMinutes * 100) : 0;
              return <div key={name}><div className="mb-1.5 flex items-center justify-between text-[10px]"><span className="font-medium text-slate-700">{name}</span><span className="font-semibold text-slate-500">{progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", ["bg-indigo-500", "bg-indigo-400", "bg-sky-500", "bg-violet-500", "bg-slate-500", "bg-indigo-300"][index])} style={{ width: `${progress}%` }} /></div></div>;
            })}</div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/[0.04]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:px-5">
            <div><h2 className="text-sm font-bold text-slate-900 sm:text-base">Öğrenci listesi</h2><p className="mt-1 text-[11px] text-slate-500">Haftalık çalışma performansı · {isLoading ? "yükleniyor…" : `${students.length} öğrenci`}</p></div>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600">Son 7 gün</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead><tr className="bg-slate-50/80 text-[9px] font-semibold uppercase tracking-wide text-slate-400"><th className="px-5 py-3">Sıra / Öğrenci</th><th className="px-4 py-3">Çalışma saati</th><th className="px-4 py-3">Soru sayısı</th><th className="px-4 py-3">En yüksek öğrenciye göre</th><th className="px-4 py-3">Durum</th></tr></thead>
              <tbody>{studentRows.map((student, index) => {
                const progress = highestMinutes ? Math.round(student.minutes / highestMinutes * 100) : 0;
                const studentInitials = student.full_name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
                return <tr key={student.id} className="border-t border-slate-100">
                <td className="px-5 py-3"><div className="flex items-center gap-3"><span className="w-4 text-[10px] font-semibold text-slate-400">{index + 1}</span><span className="grid size-8 place-items-center rounded-full bg-indigo-50 text-[9px] font-bold text-indigo-700">{studentInitials}</span><span className="whitespace-nowrap text-[11px] font-semibold text-slate-800">{student.full_name}</span></div></td>
                <td className="px-4 py-3 text-[11px] font-semibold text-slate-700">{(student.minutes / 60).toFixed(1)} <span className="font-normal text-slate-400">sa</span></td>
                <td className="px-4 py-3 text-[11px] font-semibold text-slate-700">{student.questions}</td>
                <td className="w-[190px] px-4 py-3"><div className="flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${progress}%` }} /></div><span className="w-8 text-right text-[10px] font-semibold text-slate-500">{progress}%</span></div></td>
                <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-1 text-[9px] font-semibold", student.sessions.length ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500")}>{student.sessions.length ? "Aktif" : "Çalışma yok"}</span></td>
              </tr>;
              })}{!isLoading && students.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-500">Bu sınıfta kayıtlı öğrenci bulunamadı.</td></tr>}</tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3"><span className="text-[10px] text-slate-500">{isLoading ? "Öğrenciler yükleniyor…" : `${students.length} öğrenci listeleniyor`}</span><span className="text-[10px] font-semibold text-indigo-600">{profile.class_code}</span></div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/[0.04]">
          <div className="border-b border-slate-100 p-4 sm:px-5"><h2 className="text-sm font-bold text-slate-900 sm:text-base">Atanan ödevler</h2><p className="mt-1 text-[11px] text-slate-500">Öğrenci bazında tamamlanma durumu</p></div>
          <div className="divide-y divide-slate-100">
            {[...classAssignments.values()].map((assignment) => <div key={`${assignment.subject}-${assignment.topic}-${assignment.due_date}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <div><p className="text-[11px] font-semibold text-slate-800">{assignment.subject} · {assignment.topic}</p><p className="mt-1 text-[10px] text-slate-500">{assignment.target_question_count} soru · Son tarih {formatDate(assignment.due_date)}</p></div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">{assignment.completed}/{assignment.total} tamamlandı</span>
            </div>)}
            {!isLoading && classAssignments.size === 0 && <p className="px-5 py-6 text-center text-xs text-slate-500">Henüz ödev atanmamış.</p>}
          </div>
        </section>
      </main>

      <button type="button" onClick={() => { setAssignmentError(""); setStep(1); setAssignmentOpen(true); }} className="fixed bottom-5 right-4 z-30 flex h-12 items-center gap-2 rounded-full bg-indigo-600 px-5 text-xs font-bold text-white shadow-xl shadow-indigo-900/25 transition hover:-translate-y-0.5 hover:bg-indigo-700 sm:bottom-7 sm:right-7"><Plus size={17} /> Ödev ata</button>

      {assignmentOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setAssignmentOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="assignment-title" className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div><div className="mb-2 flex items-center gap-1.5">{[1, 2, 3].map((number) => <span key={number} className={cn("h-1 w-8 rounded-full", number <= step ? "bg-indigo-600" : "bg-slate-200")} />)}<span className="ml-1 text-[9px] font-medium text-slate-400">{step} / 3</span></div><h2 id="assignment-title" className="text-lg font-bold text-slate-900">Yeni ödev atama</h2><p className="mt-1 text-[11px] text-slate-500">{["Hedef kitle", "Ders ve konu", "Tarih ve soru sayısı"][step - 1]}</p></div>
            <button type="button" aria-label="Kapat" onClick={() => setAssignmentOpen(false)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X size={17} /></button>
          </div>
          <form onSubmit={submitAssignment}>
            {step === 1 && <label className="block text-[11px] font-semibold text-slate-700">Hedef kitle<select value={audience} onChange={(event) => setAudience(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400"><option value="class">{profile.class_code ?? "Sınıf"} sınıfının tamamı ({students.length} öğrenci)</option>{students.map((student) => <option key={student.id} value={student.id}>{student.full_name}</option>)}</select><p className="mt-2 text-[10px] font-normal text-slate-400">Sınıf seçildiğinde her öğrenci için ayrı ödev kaydı oluşturulur.</p></label>}
            {step === 2 && <div className="grid gap-3"><label className="text-[11px] font-semibold text-slate-700">Ders<select value={subject} onChange={(event) => { setSubject(event.target.value); setTopic(topicsBySubject[event.target.value][0]); }} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400">{subjects.map(({ name }) => <option key={name}>{name}</option>)}</select></label><label className="text-[11px] font-semibold text-slate-700">Konu<select value={topic} onChange={(event) => setTopic(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400">{topicsBySubject[subject].map((item) => <option key={item}>{item}</option>)}</select></label></div>}
            {step === 3 && <div className="grid gap-3 sm:grid-cols-2"><label className="text-[11px] font-semibold text-slate-700">Son teslim tarihi<input type="date" required value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400" /></label><label className="text-[11px] font-semibold text-slate-700">Soru sayısı<input type="number" min="1" max="5000" required value={questions} onChange={(event) => setQuestions(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400" /></label><div className="rounded-xl bg-slate-50 p-3 text-[10px] leading-relaxed text-slate-500 sm:col-span-2"><span className="font-semibold text-slate-700">Ödev özeti:</span> {audienceName} · {subject} · {topic} · {questions} soru</div></div>}
            {assignmentError && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] text-rose-700">{assignmentError}</p>}
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4"><button type="button" onClick={() => step > 1 ? setStep((current) => current - 1) : setAssignmentOpen(false)} className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-slate-500 hover:bg-slate-50">{step > 1 && <ChevronLeft size={14} />}{step > 1 ? "Geri" : "Vazgeç"}</button><button type="submit" disabled={isSubmitting} className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">{isSubmitting ? "Atanıyor…" : step === 3 ? "Ödevi ata" : "Devam et"}{step < 3 && <ChevronRight size={14} />}</button></div>
          </form>
        </section>
      </div>}
      {assignmentCreated && <div role="status" className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-4 py-3 text-[11px] font-semibold text-white shadow-xl sm:bottom-6"><CheckCircle2 size={16} className="text-emerald-400" />{assignmentCreated}<button type="button" aria-label="Bildirimi kapat" onClick={() => setAssignmentCreated("")}><X size={14} className="text-slate-400" /></button></div>}
      <footer className="mx-auto flex max-w-[1440px] items-center justify-between px-4 pb-5 text-[9px] text-slate-400 sm:px-7 lg:px-10"><span>EduTrack · {profile.class_code ?? "Sınıf tanımsız"} · {profile.full_name}</span><span className="hidden items-center gap-1 sm:flex"><span className={cn("size-1.5 rounded-full", isLoading ? "bg-amber-400" : dataError ? "bg-rose-500" : "bg-indigo-500")} />{isLoading ? "Veriler yükleniyor" : dataError ? "Bağlantı hatası" : "Veriler güncel"}</span></footer>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [authState, setAuthState] = useState<
    | { status: "loading" }
    | { status: "ready"; profile: Profile; demoMode: boolean }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (demoEnabled && window.sessionStorage.getItem("rota-demo-mode") === "enabled") {
        const role = window.sessionStorage.getItem("rota-demo-role") === "teacher" ? "teacher" : "student";
        const profile = role === "teacher"
          ? demoTeacher
          : {
            ...demoStudents[1],
            role: "student" as const,
            class_code: "12-A",
          };
        if (active) setAuthState({ status: "ready", profile, demoMode: true });
        return;
      }

      try {
        const supabase = createClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) {
          if (active) router.replace("/login");
          return;
        }
        if (!session?.user) {
          if (active) router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, role, class_code")
          .eq("id", session.user.id)
          .single();
        if (error) {
          if (active) setAuthState({ status: "error", message: `Profil yüklenemedi: ${error.message}` });
          return;
        }
        if (data.role !== "student" && data.role !== "teacher") {
          if (active) setAuthState({ status: "error", message: "Profil rolü 'student' veya 'teacher' olmalıdır." });
          return;
        }
        if (active) setAuthState({ status: "ready", profile: data, demoMode: false });
      } catch {
        if (active) {
          router.replace("/login");
        }
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [router]);

  if (authState.status === "loading") {
    return <main className="grid min-h-screen place-items-center bg-slate-100 px-4 text-sm text-slate-500">Supabase profiliniz yükleniyor…</main>;
  }
  if (authState.status === "error") {
    return <main className="grid min-h-screen place-items-center bg-slate-100 px-4"><section role="alert" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h1 className="text-lg font-bold text-slate-900">Panele erişilemiyor</h1><p className="mt-2 text-sm leading-relaxed text-slate-600">{authState.message}</p></section></main>;
  }

  const changeDemoRole = (role: Role) => {
    if (!authState.demoMode) return;
    window.sessionStorage.setItem("rota-demo-role", role);
    setAuthState({
      status: "ready",
      demoMode: true,
      profile: role === "teacher"
        ? demoTeacher
        : { ...demoStudents[1], role: "student", class_code: "12-A" },
    });
  };
  const exitDemo = () => {
    window.sessionStorage.removeItem("rota-demo-mode");
    window.sessionStorage.removeItem("rota-demo-role");
    router.replace("/login");
  };

  return authState.profile.role === "student"
    ? <StudentPanel profile={authState.profile} demoMode={authState.demoMode} onDemoRoleChange={changeDemoRole} onExitDemo={exitDemo} />
    : <TeacherPanel profile={authState.profile} demoMode={authState.demoMode} onDemoRoleChange={changeDemoRole} onExitDemo={exitDemo} />;
}
