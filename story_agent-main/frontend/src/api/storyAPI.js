// src/api/storyAPI.js
// ─────────────────────────────────────────────────────────
// API SERVICE LAYER
// All calls to the Python backend live here.
// Components never call fetch() directly — they use these functions.
//
// FOR PYTHON DEVELOPERS — JS concepts used here:
//
// async/await — same as Python's async/await.
//   async function foo() { ... }   means the function returns a Promise
//   await someFunction()           means "wait here until this finishes"
//
// const — like Python's variable assignment, but can't be reassigned.
//   const x = 5   is like   x = 5   but x = 10 later would throw an error.
//
// Arrow functions — short way to write functions:
//   const add = (a, b) => a + b    is like   def add(a, b): return a + b
//
// Template literals — like Python f-strings:
//   `Hello ${name}`   is like   f"Hello {name}"
//
// Object destructuring — like Python tuple unpacking:
//   const { data, error } = result   means pull data and error out of result dict
// ─────────────────────────────────────────────────────────

// Base URL of the Python backend
// In development: http://localhost:5000
// Change this when you deploy to a server
const BASE_URL = "http://localhost:8000/api";

// Mock mode - return fake data instead of calling API
const MOCK_MODE = false;

// Mock data storage
let mockChunks = [
    { id: 1, raw: "The hero entered the dark forest.", polished: "The brave hero ventured into the shadowy depths of the ancient forest, where twisted trees whispered secrets of old.", timestamp: Date.now() - 300000 },
    { id: 2, raw: "He found a sword.", polished: "Amidst the underbrush, his fingers closed around the hilt of a gleaming sword, its blade etched with runes of forgotten power.", timestamp: Date.now() - 200000 },
];
let mockSummary = "The hero begins his journey in a mysterious forest, discovering ancient artifacts.";
let mockModel = "gemini";

// Mock API call function
async function mockApiCall(path, body = null) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (path === "/health") {
        return { status: "ok" };
    }

    if (path === "/story/state") {
        return {
            chunks: mockChunks,
            summary: mockSummary,
            total_chunks_ever: mockChunks.length,
            title: "Mock Story"
        };
    }

    if (path === "/story/add") {
        const newId = mockChunks.length + 1;
        const polished = `Polished version of: ${body.raw_text}`;
        const newChunk = {
            id: newId,
            raw: body.raw_text,
            polished: polished,
            timestamp: Date.now()
        };
        mockChunks.push(newChunk);
        return {
            polished: polished,
            compressed: false,
            state: {
                chunks: mockChunks,
                summary: mockSummary,
                total_chunks_ever: mockChunks.length,
                title: "Mock Story"
            }
        };
    }

    if (path === "/story/edit") {
        const chunk = mockChunks.find(c => c.id === body.chunk_id);
        if (chunk) {
            chunk.polished = `Edited: ${chunk.polished} (${body.instruction})`;
        }
        return {
            chunk_id: body.chunk_id,
            old_text: chunk.raw,
            new_text: chunk.polished,
            state: {
                chunks: mockChunks,
                summary: mockSummary,
                total_chunks_ever: mockChunks.length,
                title: "Mock Story"
            }
        };
    }

    if (path === "/story/compress") {
        mockSummary = "Compressed memory summary.";
        return {
            message: "Memory compressed successfully",
            state: {
                chunks: mockChunks,
                summary: mockSummary,
                total_chunks_ever: mockChunks.length,
                title: "Mock Story"
            }
        };
    }

    if (path === "/story/reset") {
        mockChunks = [];
        mockSummary = "";
        return {
            message: "Story reset",
            state: {
                chunks: mockChunks,
                summary: mockSummary,
                total_chunks_ever: 0,
                title: "New Story"
            }
        };
    }

    if (path === "/settings/model") {
        mockModel = body.model;
        return {
            message: `Switched to ${body.model}`,
            state: {
                chunks: mockChunks,
                summary: mockSummary,
                total_chunks_ever: mockChunks.length,
                title: "Mock Story"
            }
        };
    }

    throw new Error("Unknown API path");
}

// ── Helper function ───────────────────────────────────────
/**
 * Private helper that handles ALL fetch calls.
 * Adds error handling so we don't repeat try/catch everywhere.
 *
 * method  : "GET" or "POST"
 * path    : URL path e.g. "/story/add"
 * body    : JavaScript object to send as JSON  (optional, for POST requests)
 */
async function apiCall(method, path, body = null) {
    if (MOCK_MODE) {
        // Return mock responses
        return mockApiCall(path, body);
    }

    // Build the options object that fetch() needs
    const options = {
        method: method,                              // "GET" or "POST"
        headers: { "Content-Type": "application/json" },  // tell server we're sending JSON
    };

    // If there's a body (POST request), convert the JS object to a JSON string
    // JSON.stringify() is like Python's json.dumps()
    if (body) {
        options.body = JSON.stringify(body);
    }

    // fetch() sends the HTTP request — like Python's requests.get() / requests.post()
    const response = await fetch(`${BASE_URL}${path}`, options);

    // response.json() parses the JSON response — like Python's response.json()
    const data = await response.json();

    // If the server returned an error (4xx or 5xx), throw it so the caller can handle it
    if (!response.ok) {
        throw new Error(data.error || "Server error");
    }

    return data;  // return the parsed response object
}


// ── API functions (exported — usable by any component) ────

/**
 * Check if the backend is running.
 * Called when the app first loads.
 */
export async function checkHealth() {
    return await apiCall("GET", "/health");
}

/**
 * Get the current story state from the backend.
 * Called on app load to restore the story.
 * Returns: { chunks, summary, total_chunks_ever, title }
 */
export async function getStoryState() {
    return await apiCall("GET", "/story/state");
}

/**
 * Submit rough text → AI polishes it → added to story.
 * rawText : the user's rough paragraph
 * Returns: { polished, compressed, state }
 */
export async function addInput(rawText) {
    return await apiCall("POST", "/story/add", { raw_text: rawText });
}

/**
 * Rewrite one chunk based on user instruction.
 * chunkId     : the id of the chunk to change
 * instruction : what to change  e.g. "make this sadder"
 * Returns: { chunk_id, old_text, new_text, state }
 */
export async function editChunk(chunkId, instruction) {
    return await apiCall("POST", "/story/edit", {
        chunk_id: chunkId,
        instruction: instruction,
    });
}

/**
 * Manually compress memory (user clicked 'Compress now').
 * Returns: { message, state }
 */
export async function compressMemory() {
    return await apiCall("POST", "/story/compress");
}

/**
 * Reset the story — start fresh.
 * Returns: { message, state }
 */
export async function resetStory() {
    return await apiCall("POST", "/story/reset");
}

/**
 * Switch the AI model (gemini or ollama).
 * modelName : "gemini" or "ollama"
 * Returns: { message, state }
 */
export async function switchModel(modelName) {
    return await apiCall("POST", "/settings/model", { model: modelName });
}