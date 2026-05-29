import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initPostHog } from "./lib/posthog";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Defer PostHog init until after the page is interactive to protect FCP/LCP.
if (typeof window !== "undefined") {
  const start = () => setTimeout(initPostHog, 100);
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
