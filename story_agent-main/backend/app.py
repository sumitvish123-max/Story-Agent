# app.py
# ─────────────────────────────────────────────────────────
# FASTAPI SERVER — replaces Flask completely
#
# WHY FASTAPI OVER FLASK?
# 1. Automatic API docs at http://localhost:8000/docs  (try it in browser!)
# 2. Built-in request validation — if frontend sends wrong data, FastAPI
#    automatically returns a clear error message. No manual checks needed.
# 3. Type hints — Python knows what shape every request/response should be.
#    Pydantic models define the "contract" for every endpoint.
# 4. async/await built-in — handles many requests at the same time efficiently.
# 5. Much faster than Flask for production use.
#
# KEY CONCEPTS (new compared to Flask):
#
# Pydantic model — a class that defines what a request body looks like.
#   FastAPI reads the JSON body and validates it automatically.
#   If a required field is missing, it returns a 422 error with a clear message.
#
# @app.post("/route") — decorator that registers an HTTP route.
#   Same idea as Flask's @app.route("/route", methods=["POST"])
#
# Depends() — dependency injection. Gives every route access to shared
#   objects (like story_manager) without making them global variables.
# ─────────────────────────────────────────────────────────

from fastapi import FastAPI, HTTPException, Depends  # core FastAPI tools
from fastapi.middleware.cors import CORSMiddleware   # allow React frontend to call this API
from pydantic import BaseModel, Field               # request/response validation
from typing import Optional
from contextlib import asynccontextmanager           # for startup/shutdown events

from config import GEMINI_CONFIG
from api.gemini_client import GeminiClient
from api.ollama_client import OllamaClient
from story.story_manager import StoryManager


# ─────────────────────────────────────────────────────────
# PYDANTIC MODELS — define the shape of every request body
# FastAPI reads the incoming JSON and validates it against these models.
# If a field is wrong type or missing, it auto-returns a 422 error.
# ─────────────────────────────────────────────────────────

class AddInputRequest(BaseModel):
    """Body for POST /story/add"""
    raw_text: str = Field(
        ...,                          # ... means "required" in Pydantic
        min_length=1,                 # must have at least 1 character
        description="The user's rough paragraph to polish"
    )

class EditChunkRequest(BaseModel):
    """Body for POST /story/edit"""
    chunk_id:    int = Field(..., description="ID of the chunk to rewrite")
    instruction: str = Field(..., min_length=1, description="What to change")

class SwitchModelRequest(BaseModel):
    """Body for POST /settings/model"""
    model: str = Field(..., description="'gemini' or 'ollama'")

class StoryTitleRequest(BaseModel):
    """Body for POST /story/title"""
    title: str = Field(..., min_length=1, max_length=100)


# ─────────────────────────────────────────────────────────
# APP STATE — single shared instance across all requests
# ─────────────────────────────────────────────────────────

# We use a plain dict to hold mutable app state.
# This is simpler than using globals and works well for a single-user app.
app_state: dict = {}


# ─────────────────────────────────────────────────────────
# LIFESPAN — runs on startup and shutdown
# @asynccontextmanager turns this into a FastAPI lifespan handler.
# Code before "yield" runs on startup. Code after runs on shutdown.
# This replaces Flask's app.before_first_request pattern.
# ─────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────
    print("Starting Story Writer API...")

    # Create the default AI client (Gemini) and story manager
    ai_client = GeminiClient()
    app_state["story_manager"] = StoryManager(ai_client)
    app_state["current_model"] = "gemini"

    print("AI client ready. Visit http://localhost:8000/docs for API documentation.")

    yield  # app runs here — everything between yield is the "running" phase

    # ── Shutdown ──────────────────────────────────────────
    print("Shutting down...")
    app_state.clear()


# ─────────────────────────────────────────────────────────
# CREATE THE APP
# ─────────────────────────────────────────────────────────

app = FastAPI(
    title="Story Writer API",
    description="AI-powered incremental story writing with persistent memory.",
    version="1.0.0",
    lifespan=lifespan,  # attach our startup/shutdown handler
)


# ─────────────────────────────────────────────────────────
# CORS MIDDLEWARE
# Allows the React frontend (port 5173) to call this backend (port 8000).
# Without this, browsers block cross-origin requests for security.
# ─────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],   # allow GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],   # allow all headers
)


# ─────────────────────────────────────────────────────────
# DEPENDENCY — get_story_manager()
# This is a FastAPI "dependency". Instead of accessing app_state directly
# in every route, we declare this function and FastAPI injects it.
# Routes use it like:  manager = Depends(get_story_manager)
# ─────────────────────────────────────────────────────────

def get_story_manager() -> StoryManager:
    """Dependency that provides the shared StoryManager instance."""
    manager = app_state.get("story_manager")
    if not manager:
        raise HTTPException(status_code=503, detail="Story manager not initialized")
    return manager


# ─────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────

@app.get("/api/health", tags=["System"])
async def health():
    """
    Health check — confirms the backend is running.
    Frontend calls this on load. Also shows current model.
    """
    return {
        "status": "ok",
        "model":  app_state.get("current_model", "unknown"),
    }


@app.get("/api/story/state", tags=["Story"])
async def get_state(manager: StoryManager = Depends(get_story_manager)):
    """
    Returns the full current story state.
    Called when the frontend loads to restore a previous session.

    Returns: { chunks, summary, total_chunks_ever, title }
    """
    return manager.get_state()


@app.post("/api/story/add", tags=["Story"])
async def add_input(
    body:    AddInputRequest,                       # FastAPI auto-parses + validates the JSON body
    manager: StoryManager = Depends(get_story_manager),
):
    """
    Main action: submit rough text → AI polishes it → added to story.

    Body:    { "raw_text": "girl go market forget money" }
    Returns: { "polished": "...", "compressed": false, "state": {...} }
    """
    try:
        result = manager.add_input(body.raw_text)
        return result

    except Exception as e:
        # HTTPException is FastAPI's way to return error responses with status codes
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/story/edit", tags=["Story"])
async def edit_chunk(
    body:    EditChunkRequest,
    manager: StoryManager = Depends(get_story_manager),
):
    """
    Rewrite one specific chunk based on a user instruction.
    Used by the select-to-edit feature.

    Body:    { "chunk_id": 3, "instruction": "make this more dramatic" }
    Returns: { "chunk_id": 3, "old_text": "...", "new_text": "...", "state": {...} }
    """
    try:
        result = manager.edit_chunk(body.chunk_id, body.instruction)
        return result

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))  # chunk not found
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/story/compress", tags=["Story"])
async def compress(manager: StoryManager = Depends(get_story_manager)):
    """
    Manually trigger memory compression.
    Called when user clicks 'Compress memory now'.

    Returns: { "message": "Compressed successfully", "state": {...} }
    """
    try:
        result = manager.compress_now()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/story/reset", tags=["Story"])
async def reset(manager: StoryManager = Depends(get_story_manager)):
    """
    Clear everything and start a new story.

    Returns: { "message": "Story reset", "state": {...} }
    """
    manager.reset()
    return {"message": "Story reset", "state": manager.get_state()}


@app.post("/api/story/title", tags=["Story"])
async def set_title(
    body:    StoryTitleRequest,
    manager: StoryManager = Depends(get_story_manager),
):
    """
    Update the story title.

    Body:    { "title": "The Old Man's Apple" }
    Returns: { "title": "The Old Man's Apple", "state": {...} }
    """
    manager.memory_manager.memory.title = body.title
    return {"title": body.title, "state": manager.get_state()}


@app.post("/api/settings/model", tags=["Settings"])
async def switch_model(body: SwitchModelRequest):
    """
    Switch the AI model between Gemini and Ollama.
    Story state is preserved — only the AI client changes.

    Body:    { "model": "ollama" }
    Returns: { "message": "Switched to ollama", "state": {...} }
    """
    model_name = body.model.lower().strip()

    if model_name not in ("gemini", "ollama"):
        raise HTTPException(
            status_code=400,
            detail=f"Unknown model '{model_name}'. Use 'gemini' or 'ollama'."
        )

    # Save current story state before switching
    current_manager = app_state.get("story_manager")
    current_state   = current_manager.get_state() if current_manager else {}

    # Create the new AI client
    if model_name == "gemini":
        new_client = GeminiClient()
    else:
        new_client = OllamaClient()

    # Create new StoryManager with the new client, restore the old story
    new_manager = StoryManager(new_client)
    if current_state:
        new_manager.load_story(current_state)

    # Update app state
    app_state["story_manager"]  = new_manager
    app_state["current_model"]  = model_name

    return {
        "message": f"Switched to {model_name}",
        "state":   new_manager.get_state(),
    }


# ─────────────────────────────────────────────────────────
# RUN THE SERVER
# ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn  # pip install uvicorn — the ASGI server that runs FastAPI

    uvicorn.run(
        "app:app",       # "filename:FastAPI_instance"
        host="0.0.0.0",  # accessible from all network interfaces
        port=8000,       # FastAPI default port (Flask used 5000)
        reload=True,     # auto-restart when code changes (like Flask's debug=True)
    )