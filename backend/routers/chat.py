import json
from typing import List

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from backend import llm
from backend.database import db
from backend.models import ChatHistoryItem, ChatMessage

router = APIRouter()

MAX_HISTORY = 24      # last N messages sent to the model as context
MAX_TOKENS = 1500

SYSTEM_PROMPT = """You are Ghee Guru 🧈, the friendly AI study buddy inside the "Ghee Khatam" website \
(a site that gives students one best YouTube video per topic, AI notes, practice questions and PYQs).

Personality:
- Talk like a smart, warm senior/friend. Reply in Hinglish (Hindi written in English letters mixed with English) \
by default. If the user writes in pure English, reply in English; if in Hindi script, reply in Hindi. \
Always mirror the user's language and tone.
- You are a real, general-purpose assistant. Help with studies first (DSA, OS, DBMS, CN, ML, maths, physics, \
chemistry, exam strategy, motivation), but you can also chat about anything else: career, coding, life advice, \
general knowledge, jokes, casual talk. Never refuse a normal question just because it is not about studies.

How to answer:
- Actually answer the exact question that was asked, using the conversation so far for context. \
Never repeat earlier answers or reuse stock lines. If a question is vague, ask one short clarifying question.
- Be accurate. If you are not sure about something, say so instead of guessing. Do not invent facts, links or sources.
- Keep it concise and conversational (usually 2-8 lines). Go longer only when the user wants a detailed \
explanation, and then use clear steps, small examples or code.
- Output PLAIN TEXT only, because the chat window does not render Markdown: no ** bold, no # headers, no tables. \
Use simple numbered lines or hyphen lines for lists, and plain indented lines for code.
- Use an emoji occasionally (🧈 is your signature), not in every line.
- Be supportive about exam stress and low motivation, and give practical next steps. If someone seems to be in \
serious distress, respond with care and encourage them to talk to someone they trust or a professional."""


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


@router.get("/chat/{session_id}/history", response_model=List[ChatHistoryItem])
def get_chat_history(session_id: str):
    return db.get_chat_history(session_id)


@router.post("/chat/stream")
async def chat_stream(req: ChatMessage):
    message = req.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="Message khaali hai")

    if llm.provider() is None:
        raise HTTPException(
            status_code=503,
            detail="Ghee Guru ka AI abhi connected nahi hai. Server par GEMINI_API_KEY set karo (free key: aistudio.google.com).",
        )

    # Conversation context = previous turns + this new user message.
    prior = db.get_chat_history(req.session_id)[-MAX_HISTORY:]
    messages = [{"role": m["role"], "content": m["content"]} for m in prior if m["content"].strip()]
    messages.append({"role": "user", "content": message})
    db.add_chat_message(req.session_id, "user", message)

    async def generate():
        reply = ""
        try:
            async for text in llm.stream_chat(SYSTEM_PROMPT, messages, MAX_TOKENS):
                reply += text
                yield _sse({"delta": text})
        except Exception as e:  # network / auth / rate-limit / safety-block errors
            print(f"[ghee-guru] LLM error: {type(e).__name__}: {e}")
            if reply:
                db.add_chat_message(req.session_id, "assistant", reply)  # keep the partial answer
            else:
                hist = db.chat_history.get(req.session_id, [])
                if hist and hist[-1]["role"] == "user":
                    hist.pop()  # no reply was produced, so drop the dangling question
                yield _sse({"delta": "Oops, abhi mera dimaag connect nahi ho pa raha 😅 Thodi der baad phir try karo."})
            yield _sse({"done": True, "error": True})
            return

        if reply.strip():
            db.add_chat_message(req.session_id, "assistant", reply)
        yield _sse({"done": True})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
