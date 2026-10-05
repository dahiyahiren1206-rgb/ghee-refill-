import type { ReactNode } from "react";

// Inline markdown-lite: **bold**, `code`. No dangerouslySetInnerHTML anywhere.
function inline(text: string, keyBase: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter((p) => p !== "");
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4)
      return (
        <strong key={`${keyBase}-${i}`} className="font-semibold text-zinc-900">
          {p.slice(2, -2)}
        </strong>
      );
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2)
      return (
        <code
          key={`${keyBase}-${i}`}
          className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[0.85em] text-amber-900"
        >
          {p.slice(1, -1)}
        </code>
      );
    return <span key={`${keyBase}-${i}`}>{p}</span>;
  });
}

// Renders the AI notes_md (## sections, - bullets, **bold**, `code`) as React elements.
export default function Notes({ md }: { md: string }) {
  const out: ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: string) => {
    if (list.length) {
      out.push(
        <ul key={key} className="my-2 list-disc space-y-1 pl-5">
          {list.map((li, i) => (
            <li key={i}>{inline(li, `${key}-${i}`)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  md.split("\n").forEach((raw, idx) => {
    const line = raw.trim();
    if (line.startsWith("- ") || line.startsWith("* ")) {
      list.push(line.slice(2));
      return;
    }
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (numbered) {
      list.push(numbered[1]);
      return;
    }
    flush(`list-${idx}`);
    if (!line) return;
    if (line.startsWith("### "))
      out.push(
        <h4 key={idx} className="mt-4 font-heading text-xs font-bold tracking-wider text-amber-800 uppercase">
          {inline(line.slice(4), `h4-${idx}`)}
        </h4>,
      );
    else if (line.startsWith("## "))
      out.push(
        <h3 key={idx} className="mt-5 font-heading text-base font-bold text-zinc-900">
          {inline(line.slice(3), `h3-${idx}`)}
        </h3>,
      );
    else if (line.startsWith("# "))
      out.push(
        <h2 key={idx} className="mt-2 font-heading text-lg font-black text-zinc-900">
          {inline(line.slice(2), `h2-${idx}`)}
        </h2>,
      );
    else
      out.push(
        <p key={idx} className="my-2">
          {inline(line, `p-${idx}`)}
        </p>,
      );
  });
  flush("list-tail");
  return (
    <div className="text-sm leading-relaxed text-zinc-700" data-testid="notes-rendered">
      {out}
    </div>
  );
}
