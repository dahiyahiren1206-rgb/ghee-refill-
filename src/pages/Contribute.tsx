import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, FileText, ThumbsUp, UploadCloud, Youtube } from "lucide-react";
import { apiErrorText, apiFormPost, apiGet, apiPost } from "@/lib/api";
import type { CommunityNote, Suggestion } from "@/lib/api";
import AiModerationBadge from "@/components/AiModerationBadge";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function StatusBadge({ status, testid }: { status: string; testid: string }) {
  const approved = status === "approved";
  return (
    <Badge
      className={cn(approved ? "bg-[#ECFDF5] text-[#065F46]" : "bg-[#FEF2F2] text-[#991B1B]")}
      data-testid={testid}
    >
      {approved ? "✅ AI approved" : "🚫 AI rejected"}
    </Badge>
  );
}

export default function Contribute() {
  const queryClient = useQueryClient();

  // Notes upload state
  const [nTitle, setNTitle] = useState("");
  const [nTopic, setNTopic] = useState("");
  const [nUploader, setNUploader] = useState("");
  const [nFile, setNFile] = useState<File | null>(null);
  const [noteResult, setNoteResult] = useState<CommunityNote | null>(null);

  // Video suggestion state
  const [vUrl, setVUrl] = useState("");
  const [vTitle, setVTitle] = useState("");
  const [vTopic, setVTopic] = useState("");
  const [vWhy, setVWhy] = useState("");
  const [vName, setVName] = useState("");
  const [videoResult, setVideoResult] = useState<Suggestion | null>(null);

  const notesQ = useQuery({
    queryKey: ["community-notes"],
    queryFn: () => apiGet<CommunityNote[]>("/contribute/notes"),
    retry: false,
  });
  const suggestionsQ = useQuery({
    queryKey: ["suggestions"],
    queryFn: () => apiGet<Suggestion[]>("/contribute/videos"),
    retry: false,
  });

  const uploadNote = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("file", nFile!);
      fd.append("title", nTitle.trim());
      fd.append("topic", nTopic.trim());
      fd.append("uploader", nUploader.trim() || "Guest");
      return apiFormPost<CommunityNote>("/contribute/notes", fd);
    },
    onSuccess: (n) => {
      setNoteResult(n);
      if (n.status === "approved") {
        toast.success("Notes verified aur publish ho gaye ✅");
        setNTitle("");
        setNTopic("");
        setNFile(null);
        queryClient.invalidateQueries({ queryKey: ["community-notes"] });
      } else {
        toast.error(`AI ne reject kiya: ${n.reason}`);
      }
    },
    onError: (e) => toast.error(apiErrorText(e)),
  });

  const suggestVideo = useMutation({
    mutationFn: () =>
      apiPost<Suggestion>("/contribute/videos", {
        youtube_url: vUrl.trim(),
        title: vTitle.trim(),
        topic: vTopic.trim(),
        why: vWhy.trim(),
        suggested_by: vName.trim() || "Guest",
      }),
    onSuccess: (s) => {
      setVideoResult(s);
      if (s.status === "approved") {
        toast.success("Suggestion AI-approved — dhanyavaad 🧈");
        setVUrl("");
        setVTitle("");
        setVTopic("");
        setVWhy("");
        queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      } else {
        toast.error(`AI ne reject kiya: ${s.reason}`);
      }
    },
    onError: (e) => toast.error(apiErrorText(e)),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <img src="/ghee-jar.png" alt="" className="h-10 w-10 rounded-lg border border-amber-200 object-cover" />
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight">Daan Karo 🧈</h1>
          <p className="text-sm text-zinc-600">
            Apne notes aur best videos sabke liye share karo — AI har cheez verify karta hai (nuisance = rejected).
          </p>
        </div>
      </div>

      <Tabs defaultValue="notes" className="mt-8">
        <TabsList data-testid="contribute-tabs">
          <TabsTrigger value="notes" data-testid="contribute-tab-notes">
            <FileText className="mr-1 h-4 w-4" /> Notes PDF daalo
          </TabsTrigger>
          <TabsTrigger value="videos" data-testid="contribute-tab-videos">
            <Youtube className="mr-1 h-4 w-4" /> Video recommend karo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="mt-6">
          <Card className="border-amber-200" data-testid="contribute-notes-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg font-bold">Study notes PDF upload</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (nFile) uploadNote.mutate();
                }}
                className="grid gap-4 sm:grid-cols-2"
                data-testid="contribute-notes-form"
              >
                <div>
                  <Label htmlFor="note-title">Title *</Label>
                  <Input id="note-title" value={nTitle} onChange={(e) => setNTitle(e.target.value)} required placeholder="e.g. OS Deadlock — full notes" data-testid="contribute-notes-title-input" />
                </div>
                <div>
                  <Label htmlFor="note-topic">Topic *</Label>
                  <Input id="note-topic" value={nTopic} onChange={(e) => setNTopic(e.target.value)} required placeholder="e.g. Operating Systems" data-testid="contribute-notes-topic-input" />
                </div>
                <div>
                  <Label htmlFor="note-uploader">Tumhara naam</Label>
                  <Input id="note-uploader" value={nUploader} onChange={(e) => setNUploader(e.target.value)} placeholder="Guest" data-testid="contribute-notes-uploader-input" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="note-file">PDF * (max 8 MB)</Label>
                  <label
                    htmlFor="note-file"
                    className={cn(
                      "mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-sm transition-colors",
                      nFile ? "border-emerald-300 bg-[#ECFDF5] text-emerald-800" : "border-amber-300 bg-[#FFFBEB] text-amber-900 hover:bg-amber-50",
                    )}
                  >
                    <UploadCloud className="h-4 w-4" />
                    {nFile ? nFile.name : "Notes PDF yahan chuno"}
                  </label>
                  <input
                    id="note-file"
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onChange={(e) => setNFile(e.target.files?.[0] ?? null)}
                    data-testid="contribute-notes-file-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={!nFile || !nTitle.trim() || !nTopic.trim() || uploadNote.isPending} data-testid="contribute-notes-submit-button">
                    {uploadNote.isPending ? "AI check kar raha hai…" : "Upload + AI check"}
                  </Button>
                </div>
              </form>
              {noteResult && (
                <div className="mt-4" data-testid="contribute-notes-result">
                  <AiModerationBadge
                    status={noteResult.status === "approved" ? "approved" : "rejected"}
                    reason={noteResult.reason}
                    relevance={noteResult.relevance}
                    testid="contribute-notes-moderation-badge"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <h2 className="mt-10 font-heading text-xl font-bold" data-testid="contribute-notes-list-heading">
            Community notes ({notesQ.data?.length ?? 0})
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(notesQ.data ?? []).map((n) => (
              <Card key={n.id} className="border-zinc-200" data-testid={`contribute-notes-item-${n.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <FileText className="h-7 w-7 shrink-0 text-amber-600" />
                    <Badge variant="outline" className="border-amber-200 bg-[#FEF3C7] text-[#78350F]">{n.topic}</Badge>
                  </div>
                  <h3 className="mt-3 font-heading text-sm font-bold">{n.title}</h3>
                  <p className="mt-1 text-xs text-zinc-500">by {n.uploader} · {(n.size / 1024).toFixed(0)} KB</p>
                  <a
                    href={`/api/contribute/notes/${n.id}/download`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 w-full")}
                    data-testid={`contribute-notes-download-${n.id}`}
                  >
                    <Download className="mr-1 h-4 w-4" /> Download
                  </a>
                </CardContent>
              </Card>
            ))}
            {notesQ.data && notesQ.data.length === 0 && (
              <p className="text-sm text-zinc-500">Abhi koi notes nahi — pehla daan tum karo 🧈</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          <Card className="border-amber-200" data-testid="contribute-video-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg font-bold">Best YouTube video recommend karo</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  suggestVideo.mutate();
                }}
                className="grid gap-4 sm:grid-cols-2"
                data-testid="contribute-video-form"
              >
                <div className="sm:col-span-2">
                  <Label htmlFor="video-url">YouTube link *</Label>
                  <Input id="video-url" value={vUrl} onChange={(e) => setVUrl(e.target.value)} required placeholder="https://www.youtube.com/watch?v=…" data-testid="contribute-video-url-input" />
                </div>
                <div>
                  <Label htmlFor="video-title">Video title</Label>
                  <Input id="video-title" value={vTitle} onChange={(e) => setVTitle(e.target.value)} placeholder="e.g. OS full course one shot" data-testid="contribute-video-title-input" />
                </div>
                <div>
                  <Label htmlFor="video-topic">Topic</Label>
                  <Input id="video-topic" value={vTopic} onChange={(e) => setVTopic(e.target.value)} placeholder="e.g. Operating Systems" data-testid="contribute-video-topic-input" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="video-why">Kyun best hai? *</Label>
                  <textarea
                    id="video-why"
                    value={vWhy}
                    onChange={(e) => setVWhy(e.target.value)}
                    placeholder="Ek line me batao — kaunse exam ke liye, kya acha sikhata hai…"
                    className="flex min-h-20 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm"
                    data-testid="contribute-video-why-input"
                  />
                </div>
                <div>
                  <Label htmlFor="video-name">Tumhara naam</Label>
                  <Input id="video-name" value={vName} onChange={(e) => setVName(e.target.value)} placeholder="Guest" data-testid="contribute-video-name-input" />
                </div>
                <div className="flex items-end sm:col-span-2">
                  <Button type="submit" disabled={!vUrl.trim() || suggestVideo.isPending} data-testid="contribute-video-submit-button">
                    <ThumbsUp className="mr-1 h-4 w-4" />
                    {suggestVideo.isPending ? "AI check kar raha hai…" : "Recommend karo"}
                  </Button>
                </div>
              </form>
              {videoResult && (
                <div className="mt-4" data-testid="contribute-video-result">
                  <AiModerationBadge
                    status={videoResult.status === "approved" ? "approved" : "rejected"}
                    reason={videoResult.reason}
                    relevance={videoResult.relevance}
                    testid="contribute-video-moderation-badge"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <h2 className="mt-10 font-heading text-xl font-bold" data-testid="contribute-suggestions-heading">
            Recent suggestions
          </h2>
          <div className="mt-4 space-y-4" data-testid="contribute-suggestions-list">
            {(suggestionsQ.data ?? []).map((s) => (
              <Card key={s.id} className="border-zinc-200" data-testid={`contribute-suggestion-${s.id}`}>
                <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center">
                  <Youtube className="h-6 w-6 shrink-0 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-bold">{s.title}</p>
                    <p className="text-xs text-zinc-500">
                      {s.topic && `${s.topic} · `}by {s.suggested_by}
                      {s.reason && ` · ${s.reason}`}
                    </p>
                  </div>
                  <StatusBadge status={s.status} testid={`contribute-suggestion-status-${s.id}`} />
                </CardContent>
              </Card>
            ))}
            {suggestionsQ.data && suggestionsQ.data.length === 0 && (
              <p className="text-sm text-zinc-500">Abhi koi suggestion nahi aaya.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
