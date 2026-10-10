from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from backend.models import Video, QuestionOut, AttemptRequest, AttemptResult, VoteRequest, CommentCreate, Comment, Stats, SearchResponse
from backend.database import db
from backend import moderation

router = APIRouter()

@router.get("/stats", response_model=Stats)
def get_stats():
    return db.get_stats()

@router.get("/videos", response_model=List[Video])
def get_videos(subject: Optional[str] = None, search: Optional[str] = None):
    return db.get_videos(subject=subject, search=search)

@router.get("/videos/{video_id}", response_model=Video)
def get_video(video_id: str):
    v = db.get_video(video_id)
    if not v:
        raise HTTPException(status_code=404, detail="Video not found")
    return v

@router.post("/videos/{video_id}/vote")
def vote_video(video_id: str, req: VoteRequest):
    res = db.vote_video(video_id, req.action)
    if not res:
        raise HTTPException(status_code=404, detail="Video not found")
    return res

@router.get("/videos/{video_id}/questions", response_model=List[QuestionOut])
def get_questions(video_id: str):
    return db.get_questions(video_id)

@router.post("/videos/{video_id}/questions/{question_id}/attempt", response_model=AttemptResult)
def attempt_question(video_id: str, question_id: str, req: AttemptRequest):
    res = db.attempt_question(video_id, question_id, req.option)
    if not res:
        raise HTTPException(status_code=404, detail="Question not found")
    return res

@router.get("/videos/{video_id}/comments", response_model=List[Comment])
def get_comments(video_id: str):
    return db.get_comments(video_id)

@router.post("/videos/{video_id}/comments", response_model=Comment)
async def add_comment(video_id: str, req: CommentCreate):
    video = db.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    text = req.text.strip()
    author = (req.author or "").strip()[:40] or "Guest"
    if not text:
        raise HTTPException(status_code=422, detail="Comment khaali hai")
    if len(text) > 1000:
        raise HTTPException(status_code=422, detail="Comment 1000 characters se chhota rakho")
    ok, reason = await moderation.review_comment(text, video["title"], author)
    if not ok:
        raise HTTPException(status_code=422, detail={"message": "Comment rejected", "reason": reason})
    return db.add_comment(video_id, author, text)

@router.get("/search", response_model=SearchResponse)
def search_videos(q: Optional[str] = Query(default="")):
    return db.search(q)
