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

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-comments");
      if (error) throw error;
      return data.comments as Comment[];
    },
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
  <div className="max-w-[600px] mx-auto space-y-4">
    {comments.map((comment) => (
      <article
        key={comment.id}
        className="p-5 border border-border rounded-sm bg-card"
      >
        <p className="text-foreground leading-relaxed">{comment.comment}</p>
        <time className="block mt-3 text-sm text-muted-foreground">
          {formatDate(comment.created_at)}
        </time>
      </article>
    ))}
  </div>
);

const MosaicView = ({ comments, formatDate }: ViewProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
    {comments.map((comment, index) => {
      const isLong = comment.comment.length > 150;
      return (
        <article
          key={comment.id}
          className={cn(
            "p-5 border border-border rounded-sm bg-card break-inside-avoid",
            index % 5 === 0 && "sm:col-span-1"
          )}
        >
          <p
            className={cn(
              "text-foreground leading-relaxed",
              isLong ? "text-sm" : "text-base"
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
