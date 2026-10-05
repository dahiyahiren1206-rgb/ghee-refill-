import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, FileText, Send } from "lucide-react";
import { apiErrorText, apiGet, apiPost } from "@/lib/api";
import type { AttemptResult, Comment, QuestionOut, Video } from "@/lib/api";
import Notes from "@/components/Notes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function QuestionCard({ q, videoId }: { q: QuestionOut; videoId: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const attempt = useMutation({
    mutationFn: () =>
      apiPost<AttemptResult>(`/videos/${videoId}/questions/${q.id}/attempt`, {
        answer_index: selected,
      }),
    onSuccess: (r) => {
      setResult(r);
      if (r.correct) toast.success("Sahi jawab! Ghee points 🧈");
    },
    onError: (e) => toast.error(apiErrorText(e)),
  });

  return (
    <div className="rounded-xl border border-zinc-200 p-4" data-testid={`watch-practice-question-${q.id}`}>
      <p className="text-sm font-semibold text-zinc-900">{q.question}</p>
      <div className="mt-3 grid gap-2">
        {q.options.map((opt, i) => {
          const isChosen = selected === i;
          const isCorrect = result && result.correct_index === i;
          return (
            <button
              key={i}
              onClick={() => !result && setSelected(i)}
              data-testid={`watch-practice-option-${q.id}-${i}`}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                isCorrect
                  ? "border-emerald-400 bg-emerald-50 font-medium"
                  : result && isChosen
                    ? "border-red-300 bg-red-50"
                    : isChosen
                      ? "border-amber-400 bg-amber-50"
                      : "border-zinc-200 hover:border-amber-300 hover:bg-amber-50",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {result ? (
        <p
          className={cn("mt-3 text-sm leading-relaxed", result.correct ? "text-emerald-700" : "text-red-700")}
          data-testid={`watch-practice-explanation-${q.id}`}
        >
          {result.correct ? "Sahi! 🎯 " : `Galat — correct answer: "${q.options[result.correct_index]}". `}
          {result.explanation}
        </p>
      ) : (
        <Button
          size="sm"
          className="mt-3"
          disabled={selected === null || attempt.isPending}
          onClick={() => attempt.mutate()}
          data-testid={`watch-practice-check-${q.id}`}
        >
          Check karo
        </Button>
      )}
    </div>
  );
}

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [author, setAuthor] = useState("");
  const [commentText, setCommentText] = useState("");

  const videoQ = useQuery({
    queryKey: ["video", id],
    queryFn: () => apiGet<Video>(`/videos/${id}`),
    enabled: !!id,
    retry: false,
  });
  const questionsQ = useQuery({
    queryKey: ["questions", id],
    queryFn: () => apiGet<QuestionOut[]>(`/videos/${id}/questions`),
    enabled: !!id,
    retry: false,
  });
  const commentsQ = useQuery({
    queryKey: ["comments", id],
    queryFn: () => apiGet<Comment[]>(`/videos/${id}/comments`),
    enabled: !!id,
    retry: false,
  });

  const postComment = useMutation({
    mutationFn: () =>
      apiPost<Comment>(`/videos/${id}/comments`, { author: author.trim() || "Guest", text: commentText.trim() }),
    onSuccess: () => {
      toast.success("Comment posted — AI ne approve kiya ✅");
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
    },
    onError: (e) => toast.error(apiErrorText(e, "Comment rejected")),
  });

  if (videoQ.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" data-testid="watch-loading">
        <div className="aspect-video w-full animate-pulse rounded-xl bg-amber-50" />
      </div>
    );
  }

  if (videoQ.isError || !videoQ.data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8" data-testid="watch-not-found">
        <img src="/ghee-jar.png" alt="" className="mx-auto h-16 w-16 rounded-xl border border-amber-200 object-cover" />
        <h1 className="mt-4 font-heading text-2xl font-black">Ye video library me nahi mila</h1>
        <Link to="/search" data-testid="watch-not-found-back">
          <Button className="mt-4">Wapas search karo</Button>
        </Link>
      </div>
    );
  }

  const video = videoQ.data;
  const notes = video.notes_md || "_Notes abhi taiyaar nahi hue — thodi der me wapas dekho._";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Video + comments */}
        <div className="lg:col-span-7">
          <iframe
            data-testid="watch-video-embed"
            src={`https://www.youtube.com/embed/${video.youtube_id}?rel=0`}
            title={video.title}
            allowFullScreen
            className="aspect-video w-full rounded-xl border border-zinc-200"
          />
          <div className="mt-4">
            <Badge variant="outline" className="border-amber-200 bg-[#FEF3C7] text-[#78350F]">
              {video.subject}
            </Badge>
            <h1 className="mt-2 font-heading text-2xl font-black tracking-tight" data-testid="watch-video-title">
              {video.title}
            </h1>
            {video.channel && <p className="mt-1 text-sm text-zinc-500">{video.channel}</p>}
            {video.description && <p className="mt-2 text-sm text-zinc-600">{video.description}</p>}
          </div>

          {/* AI-moderated comments */}
          <Card className="mt-8" data-testid="watch-comments-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
                💬 Discussion <Badge className="bg-[#ECFDF5] text-[#065F46]">AI-moderated · zero gali-galoch</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (commentText.trim()) postComment.mutate();
                }}
                className="grid gap-2 sm:grid-cols-3"
                data-testid="watch-comment-form"
              >
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Naam (optional)"
                  data-testid="watch-comment-author-input"
                />
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Doubt ya feedback likho…"
                  className="sm:col-span-2"
                  data-testid="watch-comment-text-input"
                />
                <Button
                  type="submit"
                  disabled={postComment.isPending || !commentText.trim()}
                  className="sm:col-span-3"
                  data-testid="watch-comment-submit-button"
                >
                  <Send className="mr-1 h-4 w-4" /> {postComment.isPending ? "AI check ho raha hai…" : "Post karo"}
                </Button>
              </form>
              <div className="mt-6 space-y-4" data-testid="watch-comments-list">
                {(commentsQ.data ?? []).map((c) => (
                  <div key={c.id} className="rounded-xl bg-[#FAFAFA] p-3" data-testid={`watch-comment-item-${c.id}`}>
                    <p className="text-sm font-semibold text-zinc-900">{c.author}</p>
                    <p className="mt-0.5 text-sm text-zinc-700">{c.text}</p>
                  </div>
                ))}
                {commentsQ.data && commentsQ.data.length === 0 && (
                  <p className="text-sm text-zinc-500">Pehla comment tumhara ho sakta hai 👀</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes + practice, side by side */}
        <div className="lg:sticky lg:top-20 lg:col-span-5">
          <Tabs defaultValue="notes">
            <TabsList className="w-full" data-testid="watch-side-tabs">
              <TabsTrigger value="notes" className="flex-1" data-testid="watch-tab-notes">
                <FileText className="mr-1 h-4 w-4" /> Notes
              </TabsTrigger>
              <TabsTrigger value="practice" className="flex-1" data-testid="watch-tab-practice">
                Practice ({questionsQ.data?.length ?? 0})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="notes" className="mt-4" data-testid="watch-notes-pane">
              <Card className="border-amber-200 bg-[#FFFBEB]">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-mono text-xs font-semibold tracking-wider text-amber-800 uppercase">
                      {video.ai_generated ? "AI-written revision notes" : "Revision notes"}
                    </p>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(notes);
                        toast.success("Notes copy ho gaye 📋");
                      }}
                      data-testid="watch-notes-copy-button"
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                    </Button>
                  </div>
                  <Notes md={notes} />
                  {video.summary.length > 0 && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-white p-4" data-testid="watch-summary-box">
                      <p className="font-heading text-sm font-bold">TL;DR — 5 line revision</p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-700">
                        {video.summary.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="practice" className="mt-4 space-y-4" data-testid="watch-practice-pane">
              {(questionsQ.data ?? []).map((q) => (
                <QuestionCard key={q.id} q={q} videoId={video.id} />
              ))}
              {questionsQ.data && questionsQ.data.length === 0 && (
                <p className="text-sm text-zinc-500">Questions abhi generate ho rahe hain…</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
