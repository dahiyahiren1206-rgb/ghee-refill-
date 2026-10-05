import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Search, Sparkles } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { SearchResponse, Video } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const TRENDING = [
  "Dynamic Programming",
  "Operating Systems",
  "DBMS",
  "Recursion",
  "Organic Chemistry",
  "Computer Networks",
];

function VideoCard({ video }: { video: Video }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }}>
      <Link to={`/watch/${video.id}`} data-testid={`search-alternative-card-${video.id}`}>
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
            <h3 className="mt-2 line-clamp-2 font-heading text-sm font-bold">{video.title}</h3>
            {video.channel && <p className="mt-1 text-xs text-zinc-500">{video.channel}</p>}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [input, setInput] = useState(q);

  const search = useQuery({
    queryKey: ["search", q],
    queryFn: () => apiGet<SearchResponse>(`/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length > 0,
    retry: false,
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) setParams({ q: input.trim() });
  };

  const best = search.data?.best ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <img src="/ghee-jar.png" alt="" className="h-10 w-10 rounded-lg border border-amber-200 object-cover" />
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight">Ek video. Bas. 🎯</h1>
          <p className="text-sm text-zinc-600">Topic likho — AI library se THE best video chun ke dega.</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 flex max-w-2xl gap-2" data-testid="search-form">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="“operating system”, “organic chemistry”, “gradient descent”…"
          className="h-12 border-amber-200 text-base"
          data-testid="search-input"
        />
        <Button type="submit" size="lg" className="h-12" data-testid="search-submit-button">
          <Search className="mr-1 h-4 w-4" /> Dhoondo
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {TRENDING.map((chip) => (
          <button
            key={chip}
            onClick={() => setParams({ q: chip })}
            data-testid={`search-trending-chip-${chip.toLowerCase().replace(/\s+/g, "-")}`}
            className="rounded-full border border-amber-200 bg-[#FEF9C3]/60 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            🔥 {chip}
          </button>
        ))}
      </div>

      {/* Best pick spotlight */}
      {q && search.isLoading && (
        <div className="mt-10 space-y-4" data-testid="search-loading">
          <div className="aspect-video w-full max-w-3xl animate-pulse rounded-xl bg-amber-50" />
          <div className="h-6 w-2/3 animate-pulse rounded bg-amber-50" />
        </div>
      )}

      {q && best && (
        <section className="mt-10" data-testid="search-best-section">
          <p className="flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-amber-700 uppercase">
            <Sparkles className="h-4 w-4" /> AI ka pick — isse dekho, kaam khatam
          </p>
          <div className="mt-4 grid items-start gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <iframe
                data-testid="search-best-video-embed"
                src={`https://www.youtube.com/embed/${best.youtube_id}?rel=0`}
                title={best.title}
                allowFullScreen
                className="aspect-video w-full rounded-xl border border-zinc-200"
              />
            </div>
            <div className="lg:col-span-5">
              <Card className="border-amber-200 bg-[#FFFBEB]">
                <CardContent className="p-6">
                  <Badge className="bg-[#FEF3C7] text-[#78350F]">{best.subject}</Badge>
                  <h2 className="mt-3 font-heading text-xl font-black">{best.title}</h2>
                  {best.channel && <p className="mt-1 text-sm text-zinc-600">{best.channel}</p>}
                  {best.description && (
                    <p className="mt-3 line-clamp-3 text-sm text-zinc-600">{best.description}</p>
                  )}
                  <Link to={`/watch/${best.id}`} data-testid="search-best-watch-button">
                    <Button className="mt-4 w-full">
                      Full notes + practice questions <Search className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Runner-ups */}
      {q && !search.isLoading && (search.data?.alternatives?.length ?? 0) > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-xl font-bold" data-testid="search-alternatives-heading">
            Inse bhi kaam chal sakta hai
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {search.data!.alternatives.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {q && !search.isLoading && !best && (search.data?.alternatives?.length ?? 0) === 0 && (
        <div className="mt-12 rounded-2xl border border-amber-200 bg-[#FFFBEB] p-10 text-center" data-testid="search-empty-state">
          <img src="/ghee-jar.png" alt="" className="mx-auto h-16 w-16 rounded-xl border border-amber-200 object-cover" />
          <p className="mt-4 font-heading text-lg font-bold">Is topic ka video abhi library me nahi hai</p>
          <p className="mt-1 text-sm text-zinc-600">
            Ghee Guru se pucho kya padhna chahiye, ya thodi der baad wapas aana.
          </p>
          <Link to="/chat" data-testid="search-empty-chat-link">
            <Button className="mt-4">Ghee Guru se pucho 🧈</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
