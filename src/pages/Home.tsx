import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArrowRight,
  BookOpenCheck,
  FileText,
  MessageCircle,
  Search,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Stats, Video } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const CHIPS = [
  "Dynamic Programming",
  "Operating Systems",
  "DBMS",
  "Organic Chemistry",
  "Computer Networks",
  "Machine Learning",
];

const STEPS = [
  {
    icon: Search,
    title: "Topic search kar",
    body: "Ek query maaro — AI library me se sirf THE best video chun ke deta hai. No doom-scrolling.",
    testid: "home-how-step-1",
  },
  {
    icon: BookOpenCheck,
    title: "Video + notes saath-saath",
    body: "Video chalte hue side me AI-written revision notes aur practice questions. Ek hi screen, poora topic.",
    testid: "home-how-step-2",
  },
  {
    icon: Upload,
    title: "Daan kar do",
    body: "Apne PYQs aur notes PDF daalo, best videos recommend karo. AI har cheez verify karta hai — zero nuisance.",
    testid: "home-how-step-3",
  },
];

function Stat({ value, label, testid }: { value: number | string; label: string; testid: string }) {
  return (
    <div className="rounded-xl border border-amber-200/70 bg-[#FFFBEB] px-4 py-3" data-testid={testid}>
      <p className="font-mono text-2xl font-bold text-amber-700">{value}</p>
      <p className="text-xs font-semibold tracking-wide text-amber-800/80 uppercase">{label}</p>
    </div>
  );
}

export default function Home() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const stats = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiGet<Stats>("/stats"),
    retry: false,
  });
  const featured = useQuery({
    queryKey: ["videos", "featured"],
    queryFn: () => apiGet<Video[]>("/videos"),
    retry: false,
    select: (videos) => videos.slice(0, 3),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="grid grid-cols-1 items-center gap-10 py-12 lg:grid-cols-12 lg:gap-12 lg:py-20">
        <div className="lg:col-span-7">
          <Badge className="mb-4 bg-[#FEF3C7] text-[#78350F]" data-testid="home-hero-badge">
            🧈 AI-moderated study adda
          </Badge>
          <h1 className="font-heading text-4xl leading-tight font-black tracking-tight sm:text-5xl lg:text-6xl">
            Padhai me dimaag ka <span className="text-amber-600">ghee khatam?</span> 💔
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
            YouTube par ghante scroll karne ka time khatam. Ek topic do — hum{" "}
            <strong>ek hi best video</strong>, side-by-side notes aur practice questions denge.
            Bas dekho, padho, khatam.
          </p>
          <form onSubmit={submit} className="mt-6 flex max-w-xl gap-2" data-testid="home-hero-search-form">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Kuch bhi pucho… “dynamic programming”, “OS deadlock”…"
              className="h-12 border-amber-200 bg-white text-base"
              data-testid="home-hero-search-input"
            />
            <Button type="submit" size="lg" className="h-12" data-testid="home-hero-search-button">
              <Search className="mr-1 h-4 w-4" /> Ek video do
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => navigate(`/search?q=${encodeURIComponent(chip)}`)}
                data-testid={`home-topic-chip-${chip.toLowerCase().replace(/\s+/g, "-")}`}
                className="rounded-full border border-amber-200 bg-[#FEF9C3]/60 px-3 py-1 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={stats.data?.videos ?? "—"} label="Curated videos" testid="home-stat-videos" />
            <Stat value={stats.data?.questions ?? "—"} label="Practice Qs" testid="home-stat-questions" />
            <Stat value={stats.data?.papers ?? "—"} label="PYQ papers" testid="home-stat-papers" />
            <Stat value={stats.data?.notes ?? "—"} label="Student notes" testid="home-stat-notes" />
          </div>
        </div>

        <div className="relative lg:col-span-5">
          <motion.div
            whileHover={{ scale: 1.02, rotate: 0 }}
            className="relative z-10 mx-auto max-w-xs rotate-2 overflow-hidden rounded-2xl border-4 border-[#18181B] shadow-xl"
            data-testid="home-meme-card"
          >
            <img
              src="/gas-khatam-meme.png"
              alt="Gas khatam meme — exam season mood"
              className="w-full"
            />
            <p className="bg-[#18181B] px-3 py-2 text-center font-heading text-sm font-bold text-white">
              Exam aane par dimaag ki sthiti 💔
            </p>
          </motion.div>
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: -6 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="absolute -bottom-8 -left-2 z-20 w-28 animate-float sm:w-32 lg:-left-6"
            data-testid="home-ghee-jar-card"
          >
            <img
              src="/ghee-jar.png"
              alt="Ghee jar — wapas bharne ke liye padho"
              className="rounded-2xl border-4 border-amber-200 object-cover shadow-lg"
            />
            <p className="mt-1 text-center font-mono text-[10px] font-semibold tracking-wider text-amber-800 uppercase">
              ghee wapas bharo — padho
            </p>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-16">
        <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl" data-testid="home-how-heading">
          Kaise kaam karta hai 🧈
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body, testid }) => (
            <motion.div key={testid} whileHover={{ scale: 1.02 }}>
              <Card className="h-full border-zinc-200 transition-colors hover:border-amber-300">
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF3C7] text-amber-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{body}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured videos */}
      <section className="py-12 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl" data-testid="home-featured-heading">
            Library ke tope lessons
          </h2>
          <Link
            to="/search"
            className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800"
            data-testid="home-featured-view-all"
          >
            Sab dekho <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {(featured.data ?? []).map((video, i) => (
            <motion.div key={video.id} whileHover={{ scale: 1.02 }}>
              <Link to={`/watch/${video.id}`} data-testid={`home-featured-card-${i}`}>
                <Card className="h-full overflow-hidden border-zinc-200 transition-colors hover:border-amber-300">
                  <img
                    src={`https://i.ytimg.com/vi/${video.youtube_id}/mqdefault.jpg`}
                    alt={video.title}
                    className="aspect-video w-full object-cover"
                  />
                  <CardContent className="p-4">
                    <Badge variant="outline" className="border-amber-200 bg-[#FEF3C7] text-[#78350F]">
                      {video.subject}
                    </Badge>
                    <h3 className="mt-2 line-clamp-2 font-heading text-base font-bold">{video.title}</h3>
                    {video.channel && <p className="mt-1 text-xs text-zinc-500">{video.channel}</p>}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Zero nuisance strip */}
      <section className="py-12 sm:py-16">
        <div
          className="flex flex-col items-start gap-4 rounded-2xl bg-[#18181B] p-8 text-white sm:flex-row sm:items-center"
          data-testid="home-zero-nuisance-strip"
        >
          <ShieldCheck className="h-10 w-10 shrink-0 text-amber-400" />
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold">Zero Nuisance Policy 🚫💔</h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-300">
              Har PDF upload, video suggestion aur comment AI moderator se guzarta hai — study
              material hi publish hota hai, gali-galoch aur spam kabhi nahi.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/contribute" data-testid="home-nuisance-contribute-cta">
              <Button className="bg-amber-500 text-black hover:bg-amber-400">Daan karo</Button>
            </Link>
            <Link to="/chat" data-testid="home-nuisance-chat-cta">
              <Button variant="outline" className="border-zinc-700 bg-transparent text-white hover:bg-zinc-800">
                <MessageCircle className="mr-1 h-4 w-4" /> Ghee Guru
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Papers teaser */}
      <section className="pb-4 text-center">
        <Link
          to="/papers"
          className="inline-flex items-center gap-2 font-semibold text-amber-700 hover:text-amber-800"
          data-testid="home-papers-teaser"
        >
          <FileText className="h-4 w-4" /> Seniors ke PYQs aur question papers browse karo
        </Link>
      </section>
    </div>
  );
}
