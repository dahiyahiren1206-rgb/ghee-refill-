from pydantic import BaseModel, Field
from typing import List, Optional, Any

class QuestionOut(BaseModel):
    id: str
    question: str
    options: List[str]

class AttemptRequest(BaseModel):
    option: int

class AttemptResult(BaseModel):
    correct: bool
    correct_index: int
    explanation: str

class VoteRequest(BaseModel):
    action: str  # "like" or "dislike"

class CommentCreate(BaseModel):
    author: str
    text: str

class Comment(BaseModel):
    id: str
    video_id: str
    author: str
    text: str
    created_at: str

class Video(BaseModel):
    id: str
    title: str
    subject: str
    topic: str
    description: str
    youtube_id: str
    channel: Optional[str] = "Ghee Khatam"
    duration_label: Optional[str] = "One shot"
    tags: List[str] = []
    source: Optional[str] = "admin"
    status: Optional[str] = "approved"
    ai_generated: Optional[bool] = True
    notes_md: Optional[str] = ""
    summary: Optional[List[str]] = []
    pyq_mentions: Optional[int] = 0
    likes: Optional[int] = 0
    dislikes: Optional[int] = 0
    one_liner: Optional[str] = ""
    notes_markdown: Optional[str] = ""
    created_at: str

class SearchResponse(BaseModel):
    query: str
    best: Optional[Video] = None
    alternatives: List[Video] = []

class Stats(BaseModel):
    videos: int
    questions: int
    papers: int
    notes: int
    comments: int

class Paper(BaseModel):
    id: str
    title: str
    subject: str
    exam: str
    year: str
    uploader: str
    file_name: str
    size: int
    status: str
    reason: str
    relevance: int
    created_at: str
    file_data: Optional[str] = None

class PaperOut(BaseModel):
    id: str
    title: str
    subject: str
    exam: str
    year: str
    uploader: str
    file_name: str
    size: int
    status: str
    reason: str
    relevance: int
    created_at: str

class CommunityNote(BaseModel):
    id: str
    title: str
    topic: str
    uploader: str
    file_name: str
    size: int
    status: str
    reason: str
    relevance: int
    created_at: str

class Suggestion(BaseModel):
    id: str
    youtube_id: Optional[str] = ""
    youtube_url: str
    title: str
    topic: str
    why: str
    suggested_by: str
    status: str
    reason: str
    relevance: int
    created_at: str

class ChatMessage(BaseModel):
    session_id: str
    message: str

class ChatHistoryItem(BaseModel):
    id: str
    role: str
    content: str


class SuggestionCreate(BaseModel):
    youtube_url: str
    title: str
    topic: str
    why: str = ""
    suggested_by: str = "Guest"
