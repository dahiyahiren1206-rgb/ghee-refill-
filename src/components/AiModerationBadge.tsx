import { BadgeCheck, LoaderCircle, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "approved" | "rejected" | "processing";

const STYLES: Record<Status, { box: string; label: string }> = {
  approved: {
    box: "border-emerald-200 bg-[#ECFDF5] text-[#065F46]",
    label: "AI check passed",
  },
  rejected: {
    box: "border-red-200 bg-[#FEF2F2] text-[#991B1B]",
    label: "AI check failed",
  },
  processing: {
    box: "border-amber-200 bg-[#FEF3C7] text-[#78350F]",
    label: "AI check chal raha hai…",
  },
};

export default function AiModerationBadge({
  status,
  reason,
  relevance,
  testid,
}: {
  status: Status;
  reason?: string;
  relevance?: number;
  testid?: string;
}) {
  const style = STYLES[status];
  const Icon = status === "approved" ? BadgeCheck : status === "rejected" ? ShieldX : LoaderCircle;
  return (
    <div
      data-testid={testid}
      className={cn("flex items-start gap-2 rounded-xl border px-3 py-2 text-sm", style.box)}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", status === "processing" && "animate-spin")} />
      <div>
        <p className="font-semibold">
          {style.label}
          {status !== "processing" && typeof relevance === "number" && ` · ${relevance}% relevant`}
        </p>
        {reason && <p className="mt-0.5 text-xs opacity-80">{reason}</p>}
      </div>
    </div>
  );
}
