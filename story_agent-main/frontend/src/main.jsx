// src/main.jsx
// ─────────────────────────────────────────────────────────
// ENTRY POINT — this is the first JS file that runs.
// It mounts the React app into the HTML page.
// You don't usually need to change this file.
// ─────────────────────────────────────────────────────────

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Add global CSS for the spinner animation (can't do @keyframes in inline styles)
const globalStyle = document.createElement("style");
globalStyle.textContent = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #f5f5f3; }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(globalStyle);

// ReactDOM.createRoot — attaches React to the <div id="root"> in index.html
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
