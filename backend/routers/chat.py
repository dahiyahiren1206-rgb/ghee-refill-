import json
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List
from backend.models import ChatMessage, ChatHistoryItem
from backend.database import db

router = APIRouter()

@router.get("/chat/{session_id}/history", response_model=List[ChatHistoryItem])
def get_chat_history(session_id: str):
    return db.get_chat_history(session_id)

GHEE_RESPONSES = [
    "Arre wah! Ekdam badhiya sawal hai! 🧈\n\nPadhai me consistent rehne ke liye **Pomodoro technique** (25 min study + 5 min break) use karo. Focus ekdam tight rahega!",
    "Bhai tension mat le! Ghee Khatam par har ek topic ka 1-shot video + PYQ solution ready hai. Bas ek video dekho aur notes revise karo! 🧈",
    "OS me deadlock ke 4 necessary conditions yaad rakho:\n1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait\n\nYe 4 conditions direct exam me aati hain!",
    "DSA seekhne ka simple rule hai:\n- 1 language master karo (C++ / Java)\n- Arrays & Strings se start karo\n- Daily 2 LeetCode easy/medium solve karo\n- Revision weekly zaroori hai! 🧈",
    "Computer Networks me OSI vs TCP/IP model sabse important topic hai. OSI has 7 layers, TCP/IP has 4 (or 5). Exam me diagram banana mat bhoolna!"
]

@router.post("/chat/stream")
async def chat_stream(req: ChatMessage):
    # Save user message
    db.add_chat_message(req.session_id, "user", req.message)

    # Determine assistant reply
    msg_lower = req.message.lower()
    if "dsa" in msg_lower or "roadmap" in msg_lower:
        reply_text = (
            "Bilkul bhai! 🧈\n\nDSA roadmap simple rakho:\n"
            "1) **Basics strong karo**: Time & Space Complexity, Arrays, Strings, Recursion\n"
            "2) **Core Data Structures**: Linked List, Stack, Queue, Hashing, Trees, Graphs\n"
            "3) **Core Algorithms**: Binary Search, Sliding Window, Two Pointers, Greedy, Backtracking, DP\n\n"
            "Daily 2-4 questions solve karo + revision!"
        )
    elif "os" in msg_lower or "deadlock" in msg_lower or "cpu" in msg_lower:
        reply_text = (
            "Deadlock & CPU Scheduling OS ke 2 sabse heavy topics hain! 🧈\n\n"
            "- **Deadlock**: Banker's Algorithm & Resource Allocation Graph bilkul mat chodna.\n"
            "- **CPU Scheduling**: Round Robin & FCFS + Gantt Chart numerical har saal aate hain!"
        )
    else:
        import random
        reply_text = random.choice(GHEE_RESPONSES)

    # Save assistant response to DB
    db.add_chat_message(req.session_id, "assistant", reply_text)

    # Stream reply as JSON event SSE (data: {"delta": "..."})
    async def generate():
        tokens = reply_text.split(" ")
        for i, token in enumerate(tokens):
            delta = token + (" " if i < len(tokens) - 1 else "")
            evt = f"data: {json.dumps({'delta': delta})}\n\n"
            yield evt
            await asyncio.sleep(0.04)
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
