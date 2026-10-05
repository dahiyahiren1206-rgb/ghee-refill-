import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, FileText, UploadCloud } from "lucide-react";
import { apiErrorText, apiFormPost, apiGet } from "@/lib/api";
import type { Paper } from "@/lib/api";
import AiModerationBadge from "@/components/AiModerationBadge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function Papers() {
  const queryClient = useQueryClient();
  const papersQ = useQuery({
    queryKey: ["papers"],
    queryFn: () => apiGet<Paper[]>("/papers"),
    retry: false,
  });

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [exam, setExam] = useState("");
  const [year, setYear] = useState("");
  const [uploader, setUploader] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filter, setFilter] = useState("");
  const [lastResult, setLastResult] = useState<Paper | null>(null);

  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("file", file!);
      fd.append("title", title.trim());
      fd.append("subject", subject.trim());
      fd.append("exam", exam.trim());
      fd.append("year", year.trim());
      fd.append("uploader", uploader.trim() || "Guest");
      return apiFormPost<Paper>("/papers", fd);
    },
    onSuccess: (p) => {
      setLastResult(p);
      if (p.status === "approved") {
        toast.success("Paper verified aur publish ho gaya ✅");
        setTitle("");
        setSubject("");
        setExam("");
        setYear("");
        setFile(null);
        queryClient.invalidateQueries({ queryKey: ["papers"] });
      } else {
        toast.error(`AI ne reject kiya: ${p.reason}`);
      }
    },
    onError: (e) => toast.error(apiErrorText(e)),
  });

  const subjects = Array.from(new Set((papersQ.data ?? []).map((p) => p.subject)));
  const shown = (papersQ.data ?? []).filter((p) => !filter || p.subject === filter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <img src="/ghee-jar.png" alt="" className="h-10 w-10 rounded-lg border border-amber-200 object-cover" />
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight">PYQs &amp; Question Papers 📄</h1>
          <p className="text-sm text-zinc-600">
            Seniors ke papers dekho, apne bhi daalo — AI check karega ki sach me exam material hai.
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <Card className="mt-8 border-amber-200" data-testid="papers-upload-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
            <UploadCloud className="h-5 w-5 text-amber-600" /> Apna question paper daan karo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (file) upload.mutate();
            }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            data-testid="papers-upload-form"
          >
            <div className="sm:col-span-2 lg:col-span-1">
              <Label htmlFor="paper-title">Paper title *</Label>
              <Input
                id="paper-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Data Structures Sem-3 Endsem"
                required
                data-testid="papers-title-input"
              />
            </div>
            <div>
              <Label htmlFor="paper-subject">Subject *</Label>
              <Input
                id="paper-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. DSA"
                required
                data-testid="papers-subject-input"
              />
            </div>
            <div>
              <Label htmlFor="paper-exam">Exam / University</Label>
              <Input
                id="paper-exam"
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                placeholder="e.g. VTU / GATE / University exam"
                data-testid="papers-exam-input"
              />
            </div>
            <div>
              <Label htmlFor="paper-year">Year</Label>
              <Input
                id="paper-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2024"
                data-testid="papers-year-input"
              />
            </div>
            <div>
              <Label htmlFor="paper-uploader">Tumhara naam</Label>
              <Input
                id="paper-uploader"
                value={uploader}
                onChange={(e) => setUploader(e.target.value)}
                placeholder="Guest"
                data-testid="papers-uploader-input"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Label htmlFor="paper-file">PDF file * (max 8 MB)</Label>
              <label
                htmlFor="paper-file"
                className={cn(
                  "mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-sm transition-colors",
                  file ? "border-emerald-300 bg-[#ECFDF5] text-emerald-800" : "border-amber-300 bg-[#FFFBEB] text-amber-900 hover:bg-amber-50",
                )}
              >
                <FileText className="h-4 w-4" />
                {file ? file.name : "PDF yahan drop karo ya click karke chuno"}
              </label>
              <input
                id="paper-file"
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                data-testid="papers-file-input"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" disabled={!file || !title.trim() || !subject.trim() || upload.isPending} data-testid="papers-submit-button">
                {upload.isPending ? "AI check kar raha hai…" : "Upload + AI check"}
              </Button>
            </div>
          </form>
          {lastResult && (
            <div className="mt-4" data-testid="papers-upload-result">
              <AiModerationBadge
                status={lastResult.status === "approved" ? "approved" : "rejected"}
                reason={lastResult.reason}
                relevance={lastResult.relevance}
                testid="papers-moderation-badge"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Library */}
      <div className="mt-10 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("")}
          data-testid="papers-filter-all"
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            !filter ? "border-amber-400 bg-amber-100 text-amber-900" : "border-zinc-200 text-zinc-600 hover:bg-amber-50",
          )}
        >
          Sab
        </button>
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s === filter ? "" : s)}
            data-testid={`papers-filter-${s.toLowerCase().replace(/\s+/g, "-")}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              filter === s ? "border-amber-400 bg-amber-100 text-amber-900" : "border-zinc-200 text-zinc-600 hover:bg-amber-50",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="papers-grid">
        {papersQ.isLoading && <p className="text-sm text-zinc-500">Papers load ho rahe hain…</p>}
        {papersQ.data && shown.length === 0 && (
          <p className="text-sm text-zinc-500">Abhi koi paper nahi — pehla daan tum karo 🧈</p>
        )}
        {shown.map((p) => (
          <Card key={p.id} className="border-zinc-200" data-testid={`papers-item-${p.id}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <FileText className="h-8 w-8 shrink-0 text-amber-600" />
                <Badge variant="outline" className="border-amber-200 bg-[#FEF3C7] text-[#78350F]">
                  {p.subject}
                </Badge>
              </div>
              <h3 className="mt-3 font-heading text-sm font-bold">{p.title}</h3>
              <p className="mt-1 text-xs text-zinc-500">
                {[p.exam, p.year, `by ${p.uploader}`].filter(Boolean).join(" · ")}
              </p>
              <a
                href={`/api/papers/${p.id}/download`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 w-full")}
                data-testid={`papers-download-${p.id}`}
              >
                <Download className="mr-1 h-4 w-4" /> Download PDF
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
