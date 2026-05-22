# config.py
# ─────────────────────────────────────────────────────────
# ALL model settings live here in one place.
# If you want to change temperature or switch models,
# you only change THIS file — nothing else needs to change.
# ─────────────────────────────────────────────────────────

import os
from dotenv import load_dotenv   # reads your .env file

load_dotenv()  # loads GEMINI_API_KEY from .env into os.environ


# ── Gemini settings ───────────────────────────────────────
GEMINI_CONFIG = {
    "api_key":          os.getenv("GEMINI_API_KEY", ""),  # reads key from .env file
    "model":            "gemini-2.5-flash",               # flash = fast + cheap; "gemini-1.5-pro" = smarter
    "temperature":      0.7,    # 0.0 = safe/boring, 1.0 = very creative. 0.7 is good for stories
    "max_output_tokens": 1024,  # max words AI can reply with. 1024 ≈ ~750 words
    "top_p":            0.9,    # keeps output focused. don't change unless you know what you're doing
    "top_k":            40,     # limits vocabulary choices. 40 is a safe default
}

# ── Ollama settings (local model, no API key needed) ──────
OLLAMA_CONFIG = {
    "base_url": "http://localhost:11434",  # where Ollama runs on your computer
    "model":    "qwen2.5:7b",                  # must run: ollama pull llama3   first
    "temperature": 0.7,
    "stream":   False,   # False = wait for full reply. True = stream word by word (harder to code)
    "options": {
        "num_ctx": 4096,  # how many tokens of context the model can read at once
    }
}

# ── Memory settings ───────────────────────────────────────
MEMORY_CONFIG = {
    "max_chunks_before_compress": 4,  # after 4 new chunks, auto-compress into summary
    "recent_chunks_to_keep":      2,  # after compressing, keep last 2 chunks in full
    "max_summary_tokens":         300, # summary should not exceed ~300 words
}

# ── System prompt (AI's personality / role) ───────────────
# This is sent with EVERY request so the AI always knows its job.
SYSTEM_PROMPT = """You are a professional story editor and creative writing assistant.

Your job is to help the user build a story incrementally. You will:
- Fix grammar and spelling errors
- Improve sentence flow and word choice
- Keep ALL the user's original ideas and plot points — never invent new ones
- Match the tone and style already established in the story
- Keep the story consistent with characters and events already described

Always return ONLY the requested content. No preamble, no explanation, no meta-commentary."""