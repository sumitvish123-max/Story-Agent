# api/gemini_client.py
# ─────────────────────────────────────────────────────────
# GEMINI IMPLEMENTATION
# This class talks to Google's Gemini API.
# It extends AIClient and implements all 3 required methods.
# ─────────────────────────────────────────────────────────

import google.generativeai as genai   # pip install google-generativeai
from api.ai_client import AIClient
from config import GEMINI_CONFIG, SYSTEM_PROMPT


class GeminiClient(AIClient):
    """
    Talks to Google Gemini API.
    Extends AIClient, so it must implement: polish(), summarize(), edit_chunk()
    """

    def __init__(self):
        # Configure the Gemini library with our API key
        genai.configure(api_key=GEMINI_CONFIG["api_key"])

        # Create the generation config object — this is how Gemini accepts parameters
        generation_config = genai.types.GenerationConfig(
            temperature=GEMINI_CONFIG["temperature"],
            max_output_tokens=GEMINI_CONFIG["max_output_tokens"],
            top_p=GEMINI_CONFIG["top_p"],
            top_k=GEMINI_CONFIG["top_k"],
        )

        # Create the model instance with system instructions
        self.model = genai.GenerativeModel(
            model_name=GEMINI_CONFIG["model"],
            generation_config=generation_config,
            system_instruction=SYSTEM_PROMPT,  # AI's role/personality
        )

    def _call(self, prompt: str) -> str:
        """
        Private helper method — sends a prompt to Gemini and returns the text reply.
        The underscore prefix (_call) is Python convention for "internal use only".
        """
        response = self.model.generate_content(prompt)
        return response.text.strip()  # .strip() removes extra whitespace at start/end

    def polish(self, raw_input: str, context: str) -> str:
        """
        Build a polish prompt and call Gemini.
        """
        # If there's existing story context, include it so AI stays consistent
        if context:
            prompt = f"""STORY CONTEXT (what has happened so far):
{context}

---
NEW ROUGH INPUT (polish this and continue the story naturally):
{raw_input}

Return ONLY the polished paragraph. proper story each things mentioned No explanation."""
        else:
            # No context = this is the very first paragraph
            prompt = f"""ROUGH INPUT (this is the beginning of a new story — polish it):
{raw_input}

Return ONLY the polished paragraph. But proper story donot make more concise each things proper way  No explanation only story."""

        return self._call(prompt)

    def summarize(self, full_story_text: str) -> str:
        """
        Ask Gemini to compress the full story into a structured summary.
        """
        prompt = f"""Read this story and create a compact summary that captures:
- All characters (names, personality, relationships)
- Key plot events in order
- Setting and world details
- Tone and genre
- Any unresolved mysteries or threads
- Where the story currently stands

Be specific and factual. This summary will be used to continue the story consistently.

STORY:
{full_story_text}

Return ONLY the summary. No preamble."""

        return self._call(prompt)

    def edit_chunk(self, chunk_text: str, instruction: str, context: str) -> str:
        """
        Rewrite one specific chunk based on the user's instruction.
        """
        prompt = f"""STORY CONTEXT (for consistency):
{context}

---
CHUNK TO REWRITE:
{chunk_text}

---
USER'S INSTRUCTION:
{instruction}

Rewrite the chunk following the instruction. Keep it consistent with the story context.
Return ONLY the rewritten chunk. No explanation."""

        return self._call(prompt)