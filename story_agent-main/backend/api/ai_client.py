# api/ai_client.py
# ─────────────────────────────────────────────────────────
# BASE CLASS — defines the "contract" every AI client must follow.
#
# Think of this like a blueprint. Both GeminiClient and OllamaClient
# MUST have these 3 methods: polish(), summarize(), edit_chunk().
# This way the rest of the app doesn't care WHICH model is being used.
#
# In Python, this is called an "Abstract Base Class" (ABC).
# ─────────────────────────────────────────────────────────

from abc import ABC, abstractmethod  # ABC = Abstract Base Class tools


class AIClient(ABC):
    """
    Abstract base class for all AI model clients.
    Any new model (Claude, GPT, etc.) just needs to extend this class
    and implement these 3 methods.
    """

    @abstractmethod
    def polish(self, raw_input: str, context: str) -> str:
        """
        Take the user's rough paragraph and return a polished version.

        raw_input : the user's messy text  e.g. "girl go market forget money"
        context   : the story so far (summary + recent chunks)
        returns   : the cleaned, improved paragraph as a string
        """
        pass  # subclasses must implement this

    @abstractmethod
    def summarize(self, full_story_text: str) -> str:
        """
        Read the full story text and return a compact summary.
        The summary captures: characters, plot events, tone, world details.

        full_story_text : all polished chunks joined together
        returns         : a short summary string (under 300 words)
        """
        pass

    @abstractmethod
    def edit_chunk(self, chunk_text: str, instruction: str, context: str) -> str:
        """
        Rewrite one specific chunk based on the user's instruction.
        Used when user selects text and says "make this more dramatic".

        chunk_text  : the specific paragraph the user wants to change
        instruction : what the user wants changed  e.g. "make it sadder"
        context     : story summary so AI stays consistent
        returns     : the rewritten chunk
        """
        pass