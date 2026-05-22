// src/hooks/useStory.js
// ─────────────────────────────────────────────────────────
// CUSTOM HOOK — useStory
// This is where ALL the story state lives.
// Components don't manage state themselves — they use this hook.
//
// WHAT IS A HOOK?
// A hook is a special React function that starts with "use".
// It lets components share logic and state without copy-pasting code.
// Think of it like a Python class that any component can "import and use".
//
// WHAT IS STATE?
// State = data that, when it changes, causes the UI to re-render.
// useState(initialValue) returns [currentValue, functionToChangeIt]
//   const [count, setCount] = useState(0)
//   setCount(5)  → React re-renders the component with count = 5
// ─────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
// useState   — stores data that causes re-renders when changed
// useEffect  — runs side effects (like loading data) after render
// useCallback — memoizes functions so they don't recreate on every render

import * as API from "../api/storyAPI";
// * as API means: import everything from storyAPI.js and call it API
// So API.addInput(), API.getStoryState(), etc.


export function useStory() {
    // ── State declarations ──────────────────────────────────
    // Each useState() is one piece of data the app tracks.

    const [chunks, setChunks] = useState([]);   // array of { id, raw, polished, timestamp }
    const [summary, setSummary] = useState("");    // compressed memory string
    const [isLoading, setLoading] = useState(false); // true while waiting for AI
    const [error, setError] = useState(null);  // error message string or null
    const [lastPolished, setLastPolished] = useState(""); // the most recent AI output

    // ── Load story on first render ──────────────────────────
    // useEffect with [] as second argument = "run this once when the component mounts"
    // This is like Python's __init__ — runs at startup.
    useEffect(() => {
        loadStory();
    }, []); // the [] means "no dependencies" = only run once

    // ── Helper: clear error after 5 seconds ──────────────────
    const clearError = useCallback(() => {
        setTimeout(() => setError(null), 5000);  // setTimeout = run after 5000ms = 5 seconds
    }, []);

    // ── Helper: apply a new state from backend ───────────────
    // Every API call returns a "state" object. This function applies it.
    const applyState = useCallback((state) => {
        setChunks(state.chunks || []);    // update chunks array
        setSummary(state.summary || "");  // update summary
    }, []);

    // ── Load story state from backend ────────────────────────
    const loadStory = useCallback(async () => {
        try {
            const state = await API.getStoryState();
            applyState(state);
        } catch (err) {
            setError("Could not load story: " + err.message);
        }
    }, [applyState]);

    // ── Add new rough input ───────────────────────────────────
    const addInput = useCallback(async (rawText) => {
        setLoading(true);   // show spinner
        setError(null);     // clear any old error

        try {
            const result = await API.addInput(rawText);
            setLastPolished(result.polished);  // show in the output box
            applyState(result.state);          // update chunks + summary
            return result.polished;            // return so WritePanel can clear the input
        } catch (err) {
            setError("AI error: " + err.message);
            clearError();
            return null;
        } finally {
            // finally = always runs, even if there was an error
            // like Python's try/except/finally
            setLoading(false);  // hide spinner
        }
    }, [applyState, clearError]);

    // ── Edit one chunk ────────────────────────────────────────
    const editChunk = useCallback(async (chunkId, instruction) => {
        setLoading(true);
        setError(null);

        try {
            const result = await API.editChunk(chunkId, instruction);
            applyState(result.state);
            return { oldText: result.old_text, newText: result.new_text };  // for diff view
        } catch (err) {
            setError("Edit error: " + err.message);
            clearError();
            return null;
        } finally {
            setLoading(false);
        }
    }, [applyState, clearError]);

    // ── Compress memory ───────────────────────────────────────
    const compressMemory = useCallback(async () => {
        setLoading(true);
        try {
            const result = await API.compressMemory();
            applyState(result.state);
        } catch (err) {
            setError("Compress error: " + err.message);
            clearError();
        } finally {
            setLoading(false);
        }
    }, [applyState, clearError]);

    // ── Reset story ───────────────────────────────────────────
    const resetStory = useCallback(async () => {
        setLoading(true);
        try {
            const result = await API.resetStory();
            applyState(result.state);
            setLastPolished("");
        } finally {
            setLoading(false);
        }
    }, [applyState]);

    // ── Switch model ──────────────────────────────────────────
    const switchModel = useCallback(async (modelName) => {
        setLoading(true);
        try {
            const result = await API.switchModel(modelName);
            applyState(result.state);
        } catch (err) {
            setError("Switch error: " + err.message);
            clearError();
        } finally {
            setLoading(false);
        }
    }, [applyState, clearError]);


    // ── Return everything components need ────────────────────
    // This is like a Python class's public interface.
    // Components destructure what they need:
    //   const { chunks, addInput, isLoading } = useStory()
    return {
        // State (read-only from component's perspective)
        chunks,
        summary,
        isLoading,
        error,
        lastPolished,

        // Actions (functions to call)
        addInput,
        editChunk,
        compressMemory,
        resetStory,
        switchModel,
    };
}