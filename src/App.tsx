import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import { SiteHeader } from "./components/SiteHeader";

function ConditionalHeader() {
  const { pathname } = useLocation();
  if (pathname === "/embed") return null;
  return <SiteHeader />;
}


// Lazy load pages that aren't immediately needed
const ResultPage = lazy(() => import("./pages/ResultPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const SectorStatsPage = lazy(() => import("./pages/SectorStatsPage"));
const AgeStatsPage = lazy(() => import("./pages/AgeStatsPage"));
const CommentsPage = lazy(() => import("./pages/CommentsPage"));
const CompletarPage = lazy(() => import("./pages/CompletarPage"));
const TestBurnoutPage = lazy(() => import("./pages/TestBurnoutPage"));
const CambiarDeTrabajoPage = lazy(() => import("./pages/CambiarDeTrabajoPage"));
const CambiarDeTrabajo40Page = lazy(() => import("./pages/CambiarDeTrabajo40Page"));
const CambiarDeTrabajo50Page = lazy(() => import("./pages/CambiarDeTrabajo50Page"));
const EmbedPage = lazy(() => import("./pages/EmbedPage"));
const EmbedDocsPage = lazy(() => import("./pages/EmbedDocsPage"));
const DatosLlmPage = lazy(() => import("./pages/DatosLlmPage"));
const OrigenPage = lazy(() => import("./pages/OrigenPage"));
// Catch-all: resolves the data-driven content pages by path and falls back to
// NotFound. Kept lazy so the whole content corpus stays out of the entry chunk.
const ContentPage = lazy(() => import("./pages/ContentPage"));

// Lazy load toasters - not needed for initial render
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));

// Minimal loading fallback - just a centered spinner
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <>
    {/* Lazy load toasters - they're not needed until user interaction */}
    <Suspense fallback={null}>
      <Toaster />
      <Sonner />
    </Suspense>
    <BrowserRouter>
      <ConditionalHeader />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/r/:id" element={<ResultPage />} />
          <Route path="/por-pais" element={<StatsPage />} />
          <Route path="/por-sector" element={<SectorStatsPage />} />
          <Route path="/por-edad" element={<AgeStatsPage />} />
          <Route path="/comentarios" element={<CommentsPage />} />
          <Route path="/completar" element={<CompletarPage />} />
          <Route path="/test-burnout" element={<TestBurnoutPage />} />
          <Route path="/cambiar-de-trabajo" element={<CambiarDeTrabajoPage />} />
          <Route path="/cambiar-de-trabajo-a-los-40" element={<CambiarDeTrabajo40Page />} />
          <Route path="/cambiar-de-trabajo-a-los-50" element={<CambiarDeTrabajo50Page />} />
          <Route path="/embed" element={<EmbedPage />} />
          <Route path="/embed-docs" element={<EmbedDocsPage />} />
          <Route path="/datos-llm" element={<DatosLlmPage />} />
          <Route path="/origen" element={<OrigenPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<ContentPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </>
);

export default App;
