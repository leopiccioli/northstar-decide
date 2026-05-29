import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPostHog } from "./lib/posthog";

createRoot(document.getElementById("root")!).render(<App />);

// Defer PostHog init until after the page is interactive to protect FCP/LCP.
if (typeof window !== "undefined") {
  const start = () => setTimeout(initPostHog, 100);
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
