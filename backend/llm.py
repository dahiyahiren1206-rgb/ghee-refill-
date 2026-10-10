"""Tiny LLM layer so the site works with Gemini (free tier available) or Anthropic.

Provider is picked from the environment:
  GEMINI_API_KEY (or GOOGLE_API_KEY)  -> Gemini   (default model: gemini-3.8-flash, override: GEMINI_MODEL)
  ANTHROPIC_API_KEY                   -> Anthropic (default model: claude-haiku-5-5, override: GHEE_MODEL)
If both are set Gemini wins, unless LLM_PROVIDER=anthropic.
"""
import base64
import json
import os
from typing import AsyncIterator, Optional

import httpx

GEMINI_BASE = os.environ.get("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta")


def _gemini_key() -> Optional[str]:
    return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")


def provider() -> Optional[str]:
    forced = os.environ.get("LLM_PROVIDER", "").lower()
    has_g, has_a = bool(_gemini_key()), bool(os.environ.get("ANTHROPIC_API_KEY"))
    if forced == "anthropic" and has_a:
        return "anthropic"
    if forced == "gemini" and has_g:
        return "gemini"
    if has_g:
        return "gemini"
    if has_a:
        return "anthropic"
    return None


def gemini_model() -> str:
    return os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")


def anthropic_model() -> str:
    return os.environ.get("GHEE_MODEL", "claude-haiku-5-5")


# ---------------------------------------------------------------- Gemini helpers
def _gemini_headers() -> dict:
    return {"x-goog-api-key": _gemini_key() or "", "Content-Type": "application/json"}


def _gemini_config(max_tokens: int, json_mode: bool = False) -> dict:
    cfg: dict = {"maxOutputTokens": max_tokens, "temperature": 0.8 if not json_mode else 0.0}
    if json_mode:
        cfg["responseMimeType"] = "application/json"
    if gemini_model().startswith("gemini-3.8-flash"):
        cfg["thinkingConfig"] = {"thinkingBudget": 0}  # faster/cheaper chat; avoids thinking eating the token budget
    return cfg


def _gemini_contents(messages: list[dict]) -> list[dict]:
    """Map our {role, content} list to Gemini contents, merging consecutive same-role turns."""
    out: list[dict] = []
    for m in messages:
        role = "model" if m["role"] == "assistant" else "user"
        if out and out[-1]["role"] == role:
            out[-1]["parts"][0]["text"] += "\n" + m["content"]
        else:
            out.append({"role": role, "parts": [{"text": m["content"]}]})
    return out


def _gemini_text(chunk: dict) -> str:
    parts = ((chunk.get("candidates") or [{}])[0].get("content") or {}).get("parts") or []
    return "".join(p.get("text", "") for p in parts if not p.get("thought"))


class LLMError(Exception):
    pass


async def _raise_for_gemini(r: httpx.Response) -> None:
    if r.status_code == 200:
        return
    body = (await r.aread()).decode("utf-8", "ignore")[:300]
    raise LLMError(f"Gemini HTTP {r.status_code}: {body}")


# ---------------------------------------------------------------- public API
async def stream_chat(system: str, messages: list[dict], max_tokens: int = 1500) -> AsyncIterator[str]:
    """Yield reply text chunks. Raises LLMError / other exceptions on failure."""
    p = provider()
    if p == "gemini":
        url = f"{GEMINI_BASE}/models/{gemini_model()}:streamGenerateContent?alt=sse"
        body = {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": _gemini_contents(messages),
            "generationConfig": _gemini_config(max_tokens),
        }
        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0)) as client:
            async with client.stream("POST", url, headers=_gemini_headers(), json=body) as r:
                await _raise_for_gemini(r)
                async for line in r.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    try:
                        chunk = json.loads(line[5:].strip())
                    except json.JSONDecodeError:
                        continue
                    text = _gemini_text(chunk)
                    if text:
                        yield text
        return
    if p == "anthropic":
        from anthropic import AsyncAnthropic
        client = AsyncAnthropic()
        async with client.messages.stream(
            model=anthropic_model(), max_tokens=max_tokens, system=system, messages=messages
        ) as stream:
            async for text in stream.text_stream:
                yield text
        return
    raise LLMError("No LLM API key configured")


async def judge(system: str, text: str, pdf: Optional[bytes] = None) -> Optional[str]:
    """One-shot call that should return JSON text. Returns None on any failure."""
    p = provider()
    try:
        if p == "gemini":
            parts = []
            if pdf:
                parts.append({"inline_data": {"mime_type": "application/pdf", "data": base64.b64encode(pdf).decode()}})
            parts.append({"text": text})
            body = {
                "system_instruction": {"parts": [{"text": system}]},
                "contents": [{"role": "user", "parts": parts}],
                "generationConfig": _gemini_config(1024, json_mode=True),
            }
            url = f"{GEMINI_BASE}/models/{gemini_model()}:generateContent"
            async with httpx.AsyncClient(timeout=httpx.Timeout(40.0, connect=10.0)) as client:
                r = await client.post(url, headers=_gemini_headers(), json=body)
            if r.status_code != 200:
                raise LLMError(f"Gemini HTTP {r.status_code}: {r.text[:200]}")
            return _gemini_text(r.json())
        if p == "anthropic":
            from anthropic import AsyncAnthropic
            client = AsyncAnthropic(timeout=30.0, max_retries=1)
            content: object = text
            if pdf:
                content = [
                    {"type": "document", "source": {"type": "base64", "media_type": "application/pdf",
                                                    "data": base64.b64encode(pdf).decode()}},
                    {"type": "text", "text": text},
                ]
            resp = await client.messages.create(
                model=anthropic_model(), max_tokens=300, system=system,
                messages=[{"role": "user", "content": content}],
            )
            return "".join(b.text for b in resp.content if getattr(b, "type", "") == "text")
    except Exception as e:
        print(f"[llm] judge error: {type(e).__name__}: {e}")
    return None
