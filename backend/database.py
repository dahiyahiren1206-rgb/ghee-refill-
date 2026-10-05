import json
import os
import uuid
from datetime import datetime, timezone

SEED_FILE = os.path.join(os.path.dirname(__file__), "..", "seed_data.json")

class Database:
    def __init__(self):
        self.videos = {}
        self.questions = {} # video_id -> list of raw question dicts
        self.comments = {}  # video_id -> list of comment dicts
        self.papers = []
        self.notes = []
        self.suggestions = []
        self.chat_history = {} # session_id -> list of ChatHistoryItem dicts
        self.load_seed()

    def load_seed(self):
        if os.path.exists(SEED_FILE):
            with open(SEED_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                
                for v in data.get("videos", []):
                    vid = v["id"]
                    # Extract questions and comments
                    qs = v.pop("questions", [])
                    cs = v.pop("comments_list", [])
                    
                    self.videos[vid] = v
                    self.questions[vid] = qs
                    self.comments[vid] = cs
                
                self.papers = data.get("papers", [])
                self.notes = data.get("notes", [])
                self.suggestions = data.get("suggestions", [])

    def get_stats(self):
        total_questions = sum(len(q) for q in self.questions.values())
        total_comments = sum(len(c) for c in self.comments.values())
        return {
            "videos": len(self.videos),
            "questions": total_questions,
            "papers": len(self.papers),
            "notes": len(self.notes),
            "comments": total_comments
        }

    def get_videos(self, subject=None, search=None):
        res = list(self.videos.values())
        if subject:
            res = [v for v in res if v.get("subject", "").lower() == subject.lower()]
        if search:
            s = search.lower()
            res = [
                v for v in res
                if s in v.get("title", "").lower()
                or s in v.get("topic", "").lower()
                or s in v.get("subject", "").lower()
                or any(s in tag.lower() for tag in v.get("tags", []))
            ]
        return res

    def get_video(self, video_id):
        return self.videos.get(video_id)

    def vote_video(self, video_id, action):
        v = self.videos.get(video_id)
        if not v:
            return None
        if action == "like":
            v["likes"] = v.get("likes", 0) + 1
        elif action == "dislike":
            v["dislikes"] = v.get("dislikes", 0) + 1
        return {"likes": v.get("likes", 0), "dislikes": v.get("dislikes", 0)}

    def get_questions(self, video_id):
        qs = self.questions.get(video_id, [])
        out = []
        for q in qs:
            out.append({
                "id": q["id"],
                "question": q["question"],
                "options": q["options"]
            })
        return out

    def attempt_question(self, video_id, question_id, option_idx):
        qs = self.questions.get(video_id, [])
        q = next((x for x in qs if x["id"] == question_id), None)
        if not q:
            return None
        correct_idx = q.get("correct_option", 0)
        is_correct = (option_idx == correct_idx)
        return {
            "correct": is_correct,
            "correct_index": correct_idx,
            "explanation": q.get("explanation", "")
        }

    def get_comments(self, video_id):
        return self.comments.get(video_id, [])

    def add_comment(self, video_id, author, text):
        c = {
            "id": str(uuid.uuid4()),
            "video_id": video_id,
            "author": author or "Anonymous",
            "text": text,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        if video_id not in self.comments:
            self.comments[video_id] = []
        self.comments[video_id].append(c)
        return c

    def search(self, query):
        if not query:
            return {"query": "", "best": None, "alternatives": []}
        matches = self.get_videos(search=query)
        if not matches:
            # Fallback to all videos
            matches = list(self.videos.values())
        best = matches[0] if matches else None
        alts = matches[1:] if len(matches) > 1 else []
        return {"query": query, "best": best, "alternatives": alts}

    def get_papers(self, subject=None, status=None, search=None):
        res = list(self.papers)
        if subject:
            res = [p for p in res if p.get("subject", "").lower() == subject.lower()]
        if status:
            res = [p for p in res if p.get("status", "").lower() == status.lower()]
        if search:
            s = search.lower()
            res = [p for p in res if s in p.get("title", "").lower() or s in p.get("subject", "").lower()]
        return res

    def add_paper(self, title, subject, exam, year, uploader, file_name, size, file_data=None):
        p = {
            "id": str(uuid.uuid4()),
            "title": title,
            "subject": subject,
            "exam": exam,
            "year": year,
            "uploader": uploader or "Guest",
            "file_name": file_name,
            "size": size,
            "status": "approved",
            "reason": f"Genuine {subject} exam question paper matching title.",
            "relevance": 98,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "file_data": file_data
        }
        self.papers.insert(0, p)
        return p

    def get_paper(self, paper_id):
        return next((p for p in self.papers if p["id"] == paper_id), None)

    def get_chat_history(self, session_id):
        return self.chat_history.get(session_id, [])

    def add_chat_message(self, session_id, role, content):
        if session_id not in self.chat_history:
            self.chat_history[session_id] = []
        item = {
            "id": str(uuid.uuid4()),
            "role": role,
            "content": content
        }
        self.chat_history[session_id].append(item)
        return item

db = Database()
