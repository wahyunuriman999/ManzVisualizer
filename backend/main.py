import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from routers import data, analysis, ai, export
from services.data_processor import TEMP_DIR

app = FastAPI(title="ManzStudio — Data Intelligence Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router)
app.include_router(analysis.router)
app.include_router(ai.router)
app.include_router(export.router)

@app.on_event("startup")
async def startup_event():
    os.makedirs(TEMP_DIR, exist_ok=True)
    frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
    os.makedirs(frontend_dir, exist_ok=True)
    # Create a dummy index.html if it doesn't exist
    index_path = os.path.join(frontend_dir, 'index.html')
    if not os.path.exists(index_path):
        with open(index_path, 'w') as f:
            f.write("<html><body><h1>ManzStudio Backend Running</h1></body></html>")

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
async def root():
    return FileResponse(os.path.join(frontend_dir, 'index.html'))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
