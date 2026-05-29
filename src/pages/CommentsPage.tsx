import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { List, LayoutGrid, ArrowRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CommentShareCard } from "@/components/comments/CommentShareCard";
import { StatsNav } from "@/components/stats/StatsNav";

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  dinero: number;
  desarrollo: number;
  diversion: number;
  country: string | null;
  sector: string | null;
  age_range: string | null;
}

type ViewMode = "feed" | "mosaic";

const CommentsPage = () => {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<ViewMode>(
    searchParams.get("vista") === "mosaico" ? "mosaic" : "feed"
  );
  const ctaPosition = useMemo(() => Math.floor(Math.random() * 13) + 3, []);
  const [selected, setSelected] = useState<Comment | null>(null);

  const { data: comments, isLoading, isError, refetch } = useQuery({
    queryKey: ["comments"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_comments");
      if (error) throw error;
      return (data ?? []) as Comment[];
    },
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: es,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with title and toggle */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex flex-col items-center py-4 px-4 gap-3">
          {/* Title + CTA */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">
              Comentarios
            </h1>
            <Link 
              to="/?utm_source=comentarios&utm_medium=header"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
            >
              Responder las 3D
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Toggle */}
          <div className="bg-secondary p-1 rounded-full inline-flex">
            <button
              onClick={() => setView("feed")}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                view === "feed"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-4 h-4" />
              Feed
            </button>
            <button
              onClick={() => setView("mosaic")}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                view === "mosaic"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Mosaico
            </button>
          </div>
        </div>
      </header>

      <StatsNav active="comments" />

      {/* Content */}
      <main className="p-4 md:p-6">
        {isLoading ? (
          view === "feed" ? <FeedSkeleton /> : <MosaicSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center py-12 gap-4">
            <p className="text-muted-foreground">No se pudieron cargar los comentarios</p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm"
            >
              Reintentar
            </button>
          </div>
        ) : view === "feed" ? (
          <FeedView comments={comments || []} formatDate={formatDate} ctaPosition={ctaPosition} onSelect={setSelected} />
        ) : (
          <MosaicView comments={comments || []} formatDate={formatDate} ctaPosition={ctaPosition} onSelect={setSelected} />
        )}
      </main>

      {selected && (
        <CommentShareCard
          open={!!selected}
          onOpenChange={(o) => !o && setSelected(null)}
          id={selected.id}
          dinero={selected.dinero}
          desarrollo={selected.desarrollo}
          diversion={selected.diversion}
          comment={selected.comment}
          createdAt={selected.created_at}
          country={selected.country}
          sector={selected.sector}
          ageRange={selected.age_range}
        />
      )}

    </div>
  );
};

interface ViewProps {
  comments: Comment[];
  formatDate: (date: string) => string;
  ctaPosition: number;
  onSelect: (c: Comment) => void;
}

const FeedSkeleton = () => (
  <div className="max-w-[600px] mx-auto bg-zinc-900 rounded-xl overflow-hidden">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex gap-3 p-4 border-b border-zinc-800 last:border-b-0">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

const MosaicSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(8)].map((_, i) => (
      <div 
        key={i} 
        className={cn("rounded-xl p-4", cardColors[i % cardColors.length])}
      >
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-4/5 mb-2" />
        <Skeleton className="h-4 w-3/5 mb-3" />
        <Skeleton className="h-3 w-20" />
      </div>
    ))}
  </div>
);

const CTACard = ({ variant }: { variant: "feed" | "mosaic" }) => {
  if (variant === "feed") {
    return (
      <Link
        to="/?utm_source=comentarios&utm_medium=cta_feed"
        className="flex gap-3 p-4 bg-primary/10 hover:bg-primary/20 transition-colors border-y border-primary/20"
      >
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <ArrowRight className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-100">¿Y vos, cómo estás?</p>
          <p className="text-sm text-zinc-400 mt-0.5">
            Respondé las 3D y compartí tu situación →
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/?utm_source=comentarios&utm_medium=cta_mosaic"
      className="rounded-xl shadow-sm p-5 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-colors block opacity-0 animate-fade-up"
      style={{ animationDelay: "150ms" }}
    >
      <p className="text-lg font-semibold text-foreground">¿Y vos, cómo estás?</p>
      <p className="text-sm text-muted-foreground mt-1">
        Respondé las 3D y compartí tu situación
      </p>
      <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-primary">
        Empezar <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  );
};

const FeedView = ({ comments, formatDate, ctaPosition, onSelect }: ViewProps) => (
  <div className="max-w-[600px] mx-auto bg-zinc-900 rounded-xl overflow-hidden">
    <div className="divide-y divide-zinc-800">
      {comments.map((comment, index) => (
        <>
          {index === ctaPosition && <CTACard key="cta" variant="feed" />}
          <article
            key={comment.id}
            onClick={() => onSelect(comment)}
            className="flex gap-3 p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer"
          >
            {/* Avatar placeholder */}
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0" />
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-sm">
                {(() => {
                  const parts: string[] = [];
                  if (comment.country) {
                    const flag = getCountryFlag(comment.country);
                    const name = getCountryName(comment.country) || comment.country;
                    parts.push(`${flag ? flag + ' ' : ''}${name}`);
                  }
                  if (comment.sector) parts.push(comment.sector);
                  if (comment.age_range) parts.push(comment.age_range);
                  return parts.length > 0 ? (
                    <span className="font-semibold text-zinc-100">{parts.join(' · ')}</span>
                  ) : null;
                })()}
                {(comment.country || comment.sector || comment.age_range) && (
                  <span className="text-zinc-500">·</span>
                )}
                <time className="text-zinc-500">{formatDate(comment.created_at)}</time>
              </div>
              <p className="mt-1 text-zinc-100">{comment.comment}</p>
            </div>
          </article>
        </>
      ))}
    </div>
  </div>
);

const Mini3DChart = ({ dinero, desarrollo, diversion }: { 
  dinero: number; 
  desarrollo: number; 
  diversion: number 
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center justify-center gap-1 w-full cursor-help">
          <div 
            className="h-2 rounded-sm" 
            style={{ width: `${dinero * 10}%`, backgroundColor: '#C41E3A', minWidth: '20%' }} 
          />
          <div 
            className="h-2 rounded-sm" 
            style={{ width: `${desarrollo * 10}%`, backgroundColor: '#1e3a5f', minWidth: '20%' }} 
          />
          <div 
            className="h-2 rounded-sm" 
            style={{ width: `${diversion * 10}%`, backgroundColor: '#9CA3AF', minWidth: '20%' }} 
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs space-y-1">
          <p><span style={{ color: '#C41E3A' }}>●</span> Dinero: {dinero}/10</p>
          <p><span style={{ color: '#1e3a5f' }}>●</span> Desarrollo: {desarrollo}/10</p>
          <p><span style={{ color: '#9CA3AF' }}>●</span> Diversión: {diversion}/10</p>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const cardColors = [
  "bg-rose-50 dark:bg-rose-950/30",
  "bg-blue-50 dark:bg-blue-950/30",
  "bg-amber-50 dark:bg-amber-950/30",
  "bg-emerald-50 dark:bg-emerald-950/30",
  "bg-violet-50 dark:bg-violet-950/30",
  "bg-slate-100 dark:bg-slate-800/30",
];

const MosaicView = ({ comments, formatDate, ctaPosition, onSelect }: ViewProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {comments.map((comment, index) => {
      const isShort = comment.comment.length < 80;
      const isLong = comment.comment.length > 120;
      const colorClass = cardColors[index % cardColors.length];
      const animationDelay = Math.min((index + (index >= ctaPosition ? 1 : 0)) * 50, 500);

      return (
        <>
          {index === ctaPosition && <CTACard key="cta-mosaic" variant="mosaic" />}
          <article
            key={comment.id}
            onClick={() => onSelect(comment)}
            className={cn(
              "rounded-xl shadow-sm opacity-0 animate-fade-up cursor-pointer hover:scale-[1.02] transition-transform",
              colorClass,
              isShort ? "p-5" : isLong ? "p-3" : "p-4",
              isLong ? "flex flex-col gap-3" : "flex gap-3"
            )}
            style={{ animationDelay: `${animationDelay}ms` }}
          >
          {/* Columna texto */}
          <div className={cn("min-w-0", isLong ? "w-full" : "flex-1")}>
            <p
              className={cn(
                "text-foreground leading-relaxed",
                isShort ? "text-lg font-medium" : isLong ? "text-sm" : "text-base"
              )}
            >
              {comment.comment}
            </p>
            <time className="block mt-2 text-xs text-muted-foreground">
              {formatDate(comment.created_at)}
            </time>
          </div>
          
          {/* Gráfico: abajo si es largo, al lado si es corto */}
          <div className={cn(
            "flex items-center",
            isLong ? "w-full justify-center" : "w-[35%] flex-shrink-0"
          )}>
            <Mini3DChart 
              dinero={comment.dinero} 
              desarrollo={comment.desarrollo} 
              diversion={comment.diversion} 
            />
          </div>
        </article>
        </>
      );
    })}
  </div>
);

export default CommentsPage;
