// src/utils/constants.js
// ─────────────────────────────────────────────────────────
// APP-WIDE CONSTANTS
// Single source of truth for values used in multiple places.
// If you want to change the backend URL, change it here only.
// ─────────────────────────────────────────────────────────


// Backend URL — change this when deploying
export const API_BASE_URL = "http://localhost:8000/api";

// Available AI models shown in SettingsPanel
export const MODELS = [
    {
        id: "gemini",
        label: "Gemini Flash",
        description: "Cloud-based. Fast, smart. Needs API key.",
    },
    {
        id: "ollama",
        label: "Ollama (llama3)",
        description: "Runs locally. Private, no API key needed. Install Ollama first.",
    },
];

// Tab definitions — used in App.jsx
export const TABS = [
    { id: "write", label: "Write" },
    { id: "story", label: "Story" },
    { id: "memory", label: "Memory" },
    { id: "settings", label: "Settings" },
];