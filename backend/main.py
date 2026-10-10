import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
load_dotenv()  # must run before routers are imported so env vars are visible

from backend.routers import videos, community, chat  # noqa: E402

app = FastAPI(title="Ghee Khatam API", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers under /api and root
app.include_router(videos.router, prefix="/api", tags=["Videos"])
app.include_router(community.router, prefix="/api", tags=["Community"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])

@app.get("/api")
def api_root():
    return {"message": "Ghee Khatam API Server is running 🧈"}

# Serve the built frontend (npm run build -> dist/) from the same origin, so a single
# deployment works with the relative "/api" base the frontend uses.
DIST = os.path.join(os.path.dirname(__file__), "..", "dist")
if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        candidate = os.path.normpath(os.path.join(DIST, full_path))
        if full_path and candidate.startswith(os.path.normpath(DIST)) and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(DIST, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "Ghee Khatam API Server is running 🧈"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8001, reload=True)
