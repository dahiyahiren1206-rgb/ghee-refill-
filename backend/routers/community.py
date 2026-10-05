import base64
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response, Query
from typing import Optional, List
from backend.models import Paper, CommunityNote, Suggestion
from backend.database import db

router = APIRouter()

@router.get("/community/papers", response_model=List[Paper])
@router.get("/papers", response_model=List[Paper])
def get_papers(subject: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None):
    return db.get_papers(subject=subject, status=status, search=search)

@router.post("/community/papers", response_model=Paper)
@router.post("/papers/upload", response_model=Paper)
async def upload_paper(
    title: str = Form(...),
    subject: str = Form(...),
    exam: str = Form(...),
    year: str = Form(...),
    uploader: str = Form(default="Guest"),
    file: UploadFile = File(...)
):
    content = await file.read()
    b64_data = base64.b64encode(content).decode('utf-8')
    p = db.add_paper(
        title=title,
        subject=subject,
        exam=exam,
        year=year,
        uploader=uploader,
        file_name=file.filename,
        size=len(content),
        file_data=b64_data
    )
    return p

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
