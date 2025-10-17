import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { UIProvider } from "./design/UIProvider";
import { initSentry } from "./lib/monitoring/sentry";

// Initialize error tracking
initSentry();

createRoot(document.getElementById("root")!).render(
  <UIProvider>
    <App />
  </UIProvider>
);
