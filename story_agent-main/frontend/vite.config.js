// vite.config.js
// Vite is the build tool / dev server for React.
// This config tells Vite to use the React plugin.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,  // React dev server runs on port 5173
    },
});