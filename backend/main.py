from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import videos, community, chat

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

@app.get("/")
@app.get("/api")
def root():
    return {"message": "Ghee Khatam API Server is running 🧈"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8001, reload=True)
