# api/ollama_client.py
# ─────────────────────────────────────────────────────────
# OLLAMA IMPLEMENTATION (local model — no API key needed)
# Ollama runs on your own computer. No data leaves your machine.
# Before using: install ollama + run "ollama pull llama3"
# ─────────────────────────────────────────────────────────

import requests   # pip install requests — for making HTTP calls
import json
from api.ai_client import AIClient
from config import OLLAMA_CONFIG, SYSTEM_PROMPT


class OllamaClient(AIClient):
    """
    Talks to Ollama running locally on your machine.
    Uses HTTP requests to Ollama's REST API.
    """

    def __init__(self):
        self.base_url = OLLAMA_CONFIG["base_url"]   # http://localhost:11434
        self.model    = OLLAMA_CONFIG["model"]       # "llama3"
        self.options  = {
            "temperature": OLLAMA_CONFIG["temperature"],
            "num_ctx":     OLLAMA_CONFIG["options"]["num_ctx"],
        }

    def _call(self, prompt: str) -> str:
        """
        Private helper — sends prompt to local Ollama and returns reply text.
        Ollama's API endpoint: POST /api/generate
        """
        url = f"{self.base_url}/api/generate"

        # The request body Ollama expects
        payload = {
            "model":  self.model,
            "prompt": f"{SYSTEM_PROMPT}\n\n{prompt}",  # Ollama doesn't have system_instruction, so we prepend it
            "stream": OLLAMA_CONFIG["stream"],          # False = wait for full reply
            "options": self.options,
        }

        try:
            response = requests.post(url, json=payload, timeout=120)  # timeout after 2 min
            response.raise_for_status()  # raises error if HTTP status is 4xx or 5xx

            data = response.json()
            return data["response"].strip()

        except requests.exceptions.ConnectionError:
            # This happens if Ollama is not running
            raise ConnectionError(
                "Cannot connect to Ollama. Make sure Ollama is running: run 'ollama serve' in terminal."
            )
        except requests.exceptions.Timeout:
            raise TimeoutError("Ollama took too long to respond. Try a smaller model or shorter input.")

    def polish(self, raw_input: str, context: str) -> str:
        """Same logic as GeminiClient.polish() but calls Ollama."""
        if context:
            prompt = f"""STORY CONTEXT:
{context}

---
NEW ROUGH INPUT (polish this):
{raw_input}

Return ONLY the polished paragraph."""
        else:
            prompt = f"""ROUGH INPUT (start of a new story — polish it):
{raw_input}

Return ONLY the polished paragraph."""

        return self._call(prompt)

    def summarize(self, full_story_text: str) -> str:
        """Compress full story into a structured summary."""
        prompt = f"""Create a compact story summary capturing:
- Characters (names, traits, relationships)
- Key plot events in order
- Setting, tone, genre
- Unresolved threads
- Where the story currently stands

STORY:
{full_story_text}

Return ONLY the summary."""

        return self._call(prompt)

    def edit_chunk(self, chunk_text: str, instruction: str, context: str) -> str:
        """Rewrite one chunk per user instruction."""
        prompt = f"""STORY CONTEXT:
{context}

---
CHUNK TO REWRITE:
{chunk_text}

---
INSTRUCTION:
{instruction}

Return ONLY the rewritten chunk."""

        return self._call(prompt)