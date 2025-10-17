import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { UIProvider } from "./design/UIProvider";

// Task 13: Initialize Sentry
initSentry();

createRoot(document.getElementById("root")!).render(
  <UIProvider>
    <App />
  </UIProvider>
);
