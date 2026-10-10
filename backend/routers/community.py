import base64
import re
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response, Query
from typing import Optional, List
from backend.models import PaperOut, CommunityNote, Suggestion, SuggestionCreate
from backend.database import db
from backend import moderation

router = APIRouter()

@router.get("/community/papers", response_model=List[PaperOut])
@router.get("/papers", response_model=List[PaperOut])
def get_papers(subject: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None):
    return db.get_papers(subject=subject, status=status, search=search)

@router.post("/community/papers", response_model=PaperOut)
@router.post("/papers/upload", response_model=PaperOut)
@router.post("/papers", response_model=PaperOut)
async def upload_paper(
    title: str = Form(...),
    subject: str = Form(...),
    exam: str = Form(...),
    year: str = Form(...),
    uploader: str = Form(default="Guest"),
    file: UploadFile = File(...)
):
    content = await file.read()
    v = await moderation.review_pdf("an exam question paper (PYQ)", title, subject,
                                    f"exam={exam}, year={year}", file.filename or "", content)
    ok = v["approved"]
    return db.add_paper(
        title=title.strip(), subject=subject.strip(), exam=exam.strip(), year=year.strip(),
        uploader=(uploader or "Guest").strip()[:40], file_name=file.filename or "paper.pdf", size=len(content),
        file_data=base64.b64encode(content).decode("utf-8") if ok else None,
        status="approved" if ok else "rejected", reason=v["reason"], relevance=v["relevance"],
    )

@router.get("/community/papers/{paper_id}/download")
@router.get("/papers/{paper_id}/download")
def download_paper(paper_id: str):
    p = db.get_paper(paper_id)
    if not p:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    file_bytes = b""
    if p.get("file_data"):
        try:
            file_bytes = base64.b64decode(p["file_data"])
        except Exception:
            file_bytes = b"%PDF-1.4 Mock Question Paper PDF"
    else:
        file_bytes = f"%PDF-1.4 Question Paper: {p['title']}".encode('utf-8')
        
    return Response(
        content=file_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{p["file_name"]}"'}
    )

@router.get("/community/notes", response_model=List[CommunityNote])
@router.get("/notes", response_model=List[CommunityNote])
def get_notes(subject: Optional[str] = None, status: Optional[str] = None):
    return db.notes

@router.get("/community/suggestions", response_model=List[Suggestion])
@router.get("/suggestions", response_model=List[Suggestion])
def get_suggestions():
    return db.suggestions


# ---------- Daan Karo (contribute) endpoints used by the frontend ----------

YT_RE = re.compile(
    r"(?:youtube\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/)|youtu\.be/)([A-Za-z0-9_-]{11})"
)

@router.get("/contribute/notes", response_model=List[CommunityNote])
def contribute_get_notes():
    return db.notes

@router.post("/contribute/notes", response_model=CommunityNote)
async def contribute_upload_note(
    title: str = Form(...),
    topic: str = Form(...),
    uploader: str = Form(default="Guest"),
    file: UploadFile = File(...),
):
    content = await file.read()
    v = await moderation.review_pdf("student study notes", title, topic, "", file.filename or "", content)
    ok = v["approved"]
    return db.add_note(
        title.strip(), topic.strip(), (uploader or "Guest").strip()[:40], file.filename or "notes.pdf", len(content),
        file_data=base64.b64encode(content).decode("utf-8") if ok else None,
        status="approved" if ok else "rejected", reason=v["reason"], relevance=v["relevance"],
    )

@router.get("/contribute/notes/{note_id}/download")
def contribute_download_note(note_id: str):
    n = db.get_note(note_id)
    if not n:
        raise HTTPException(status_code=404, detail="Note not found")
    if n.get("file_data"):
        data = base64.b64decode(n["file_data"])
    else:
        data = f"%PDF-1.4 Notes: {n['title']}".encode("utf-8")
    return Response(content=data, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{n["file_name"]}"'})

@router.get("/contribute/videos", response_model=List[Suggestion])
def contribute_get_videos():
    return db.suggestions

@router.post("/contribute/videos", response_model=Suggestion)
async def contribute_suggest_video(req: SuggestionCreate):
    m = YT_RE.search(req.youtube_url)
    if not m:
        return db.add_suggestion(req.youtube_url, "", req.title, req.topic, req.why, req.suggested_by,
                                 status="rejected", reason="Valid YouTube link daalo (youtube.com ya youtu.be).",
                                 relevance=0)
    v = await moderation.review_suggestion(req.youtube_url, req.title, req.topic, req.why)
    return db.add_suggestion(req.youtube_url, m.group(1), req.title.strip(), req.topic.strip(), req.why.strip(),
                             (req.suggested_by or "Guest").strip()[:40],
                             status="approved" if v["approved"] else "rejected",
                             reason=v["reason"], relevance=v["relevance"])
