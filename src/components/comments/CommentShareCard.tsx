import { useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SITE_CONFIG } from '@/config/urls';
import { getCountryName, getCountryFlag } from '@/lib/countries';
import { trackFlowEvent } from '@/lib/analytics';
import { generateCommentImage } from './generateCommentImage';

interface ReadOnlySliderProps {
  label: string;
  value: number;
  color: string;
}

function ReadOnlySlider({ label, value, color }: ReadOnlySliderProps) {
  const pct = (value / 10) * 100;
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-base font-medium text-foreground">{label}</span>
        <span className="text-sm text-muted-foreground tabular-nums">{value}/10</span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-secondary">
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
        <div
          className="absolute -top-1.5 h-5 w-5 rounded-full bg-foreground shadow-md"
          style={{ left: `calc(${pct}% - 10px)` }}
        />
      </div>
    </div>
  );
}

interface CommentShareCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  dinero: number;
  desarrollo: number;
  diversion: number;
  comment: string;
  createdAt: string;
  country: string | null;
  sector: string | null;
  ageRange: string | null;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

export function CommentShareCard({
  open,
  onOpenChange,
  id,
  dinero,
  desarrollo,
  diversion,
  comment,
  createdAt,
  country,
  sector,
  ageRange,
}: CommentShareCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const shortId = id.slice(0, 8);

  const metaParts: string[] = [formatShortDate(createdAt)];
  if (country) {
    const flag = getCountryFlag(country);
    const name = getCountryName(country) || country;
    metaParts.push(`${flag ? flag + ' ' : ''}${name}`);
  }
  if (sector) metaParts.push(sector);
  if (ageRange) metaParts.push(ageRange);

  const buildBlob = () =>
    generateCommentImage({
      dinero,
      desarrollo,
      diversion,
      comment,
      createdAt,
      country,
      sector,
      ageRange,
    });

  const filename = `3d-comentario-${shortId}.png`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await buildBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating image:', e);
    } finally {
      setDownloading(false);
    }
  };

  const buildShareUrl = () => {
    const url = new URL(SITE_CONFIG.baseUrl);
    url.searchParams.set('utm_source', 'whatsapp');
    url.searchParams.set('utm_medium', 'referral');
    url.searchParams.set('utm_campaign', 'share_comment');
    url.searchParams.set('utm_content', shortId);
    return url.toString();
  };

  const buildShareText = () => {
    const snippet = comment.length > 180 ? comment.slice(0, 177) + '…' : comment;
    return `Un comentario de las 3D que me quedó dando vueltas:\n\n"${snippet}"\n\n${buildShareUrl()}`;
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const text = buildShareText();
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };

      // Try native share with image file (mobile)
      try {
        const blob = await buildBlob();
        const file = new File([blob], filename, { type: 'image/png' });
        if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
          await nav.share({ files: [file], text });
          trackFlowEvent('share_result', { surface: 'comment', id: shortId });
          return;
        }
      } catch {
        // fall through to wa.me
      }

      // Fallback: WhatsApp web link (no image)
      const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(wa, '_blank', 'noopener,noreferrer');
      trackFlowEvent('share_result', { surface: 'comment', id: shortId });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Shareable card */}
        <div className="bg-background p-8 space-y-7">
          <div className="text-sm font-semibold tracking-tight text-foreground">
            3D para Decidir
          </div>

          <div className="space-y-6">
            <ReadOnlySlider label="Dinero" value={dinero} color="#C41E3A" />
            <ReadOnlySlider label="Desarrollo" value={desarrollo} color="#1e3a5f" />
            <ReadOnlySlider label="Diversión" value={diversion} color="#9CA3AF" />
          </div>

          <div className="border-t border-border pt-5 space-y-2">
            <p className="text-base leading-relaxed text-foreground">"{comment}"</p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {metaParts.join(' · ')}
            </p>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-2">
            {SITE_CONFIG.domain}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border p-4 bg-secondary/30 flex justify-end gap-2">
          <button
            onClick={handleShare}
            disabled={sharing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border bg-background text-foreground rounded-sm hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            {sharing ? 'Abriendo…' : 'Compartir'}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-foreground text-background rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Generando…' : 'Descargar imagen'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
