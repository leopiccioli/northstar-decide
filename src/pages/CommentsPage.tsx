import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Comment {
  id: string;
  comment: string;
  created_at: string;
}

type ViewMode = "feed" | "mosaic";

const CommentsPage = () => {
  const [view, setView] = useState<ViewMode>("feed");

  const { data: comments, isLoading, isError, refetch } = useQuery({
    queryKey: ["comments"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-comments");
      if (error) throw error;
      return data.comments as Comment[];
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
      {/* Header with toggle */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex justify-center py-4">
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

      {/* Content */}
      <main className="p-4 md:p-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
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
          <FeedView comments={comments || []} formatDate={formatDate} />
        ) : (
          <MosaicView comments={comments || []} formatDate={formatDate} />
        )}
      </main>
    </div>
  );
};

interface ViewProps {
  comments: Comment[];
  formatDate: (date: string) => string;
}

const FeedView = ({ comments, formatDate }: ViewProps) => (
  <div className="max-w-[600px] mx-auto bg-zinc-900 rounded-xl overflow-hidden">
    <div className="divide-y divide-zinc-800">
      {comments.map((comment) => (
        <article
          key={comment.id}
          className="flex gap-3 p-4 hover:bg-zinc-800/50 transition-colors"
        >
          {/* Avatar placeholder */}
          <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0" />
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-sm">
              <span className="font-semibold text-zinc-100">Anónimo</span>
              <span className="text-zinc-500">·</span>
              <time className="text-zinc-500">{formatDate(comment.created_at)}</time>
            </div>
            <p className="mt-1 text-zinc-100">{comment.comment}</p>
          </div>
        </article>
      ))}
    </div>
  </div>
);

const cardColors = [
  "bg-rose-50 dark:bg-rose-950/30",
  "bg-blue-50 dark:bg-blue-950/30",
  "bg-amber-50 dark:bg-amber-950/30",
  "bg-emerald-50 dark:bg-emerald-950/30",
  "bg-violet-50 dark:bg-violet-950/30",
  "bg-slate-100 dark:bg-slate-800/30",
];

const MosaicView = ({ comments, formatDate }: ViewProps) => (
  <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
    {comments.map((comment, index) => {
      const isShort = comment.comment.length < 80;
      const isLong = comment.comment.length > 200;
      const colorClass = cardColors[index % cardColors.length];

      return (
        <article
          key={comment.id}
          className={cn(
            "break-inside-avoid rounded-xl shadow-sm mb-4",
            colorClass,
            isShort ? "p-6" : isLong ? "p-4" : "p-5"
          )}
        >
          <p
            className={cn(
              "text-foreground leading-relaxed",
              isShort ? "text-xl font-medium" : isLong ? "text-sm" : "text-base"
            )}
          >
            {comment.comment}
          </p>
          <time className="block mt-3 text-xs text-muted-foreground">
            {formatDate(comment.created_at)}
          </time>
        </article>
      );
    })}
  </div>
);

export default CommentsPage;
