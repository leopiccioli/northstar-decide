import { SITE_CONFIG } from '@/config/urls';
import { getCountryName } from '@/lib/countries';

interface Args {
  dinero: number;
  desarrollo: number;
  diversion: number;
  comment: string;
  createdAt?: string;
  country?: string | null;
  sector?: string | null;
  ageRange?: string | null;
}

const COLORS = {
  bg: '#fafafa',
  fg: '#0f0f0f',
  muted: '#737373',
  track: '#e5e5e5',
  dinero: '#C41E3A',
  desarrollo: '#1e3a5f',
  diversion: '#9CA3AF',
};

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
  value: number,
  color: string
) {
  ctx.fillStyle = COLORS.fg;
  ctx.font = '600 34px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y - 18);

  ctx.textAlign = 'right';
  ctx.font = '500 30px "Space Grotesk", system-ui, sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(`${value}/10`, x + width, y - 18);

  ctx.fillStyle = COLORS.track;
  ctx.beginPath();
  ctx.roundRect(x, y, width, 12, 6);
  ctx.fill();

  const fillWidth = Math.max(24, (value / 10) * width);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, fillWidth, 12, 6);
  ctx.fill();

  const thumbX = x + fillWidth;
  ctx.fillStyle = COLORS.fg;
  ctx.beginPath();
  ctx.arc(thumbX, y + 6, 12, 0, Math.PI * 2);
  ctx.fill();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateCommentImage({
  dinero,
  desarrollo,
  diversion,
  comment,
  createdAt,
  country,
  sector,
  ageRange,
}: Args): Promise<Blob> {
  const width = 1080;
  const padding = 80;
  const innerWidth = width - padding * 2;

  // First pass: measure comment lines with a temp canvas
  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = '400 38px "Space Grotesk", Georgia, serif';
  const commentLines = wrapText(measure, `“${comment}”`, innerWidth);
  const lineHeight = 54;

  // Build metadata line (no flag emoji — avoids cross-browser canvas issues)
  const metaParts: string[] = [];
  if (createdAt) metaParts.push(formatShortDate(createdAt));
  if (country) metaParts.push(getCountryName(country) || country);
  if (sector) metaParts.push(sector);
  if (ageRange) metaParts.push(ageRange);
  const metaLine = metaParts.join(' · ');

  // Layout y-cursor calculation
  const titleY = 110;
  const slidersStartY = 230;
  const barGap = 130;
  const slidersEndY = slidersStartY + barGap * 2 + 12; // 3 bars
  const dividerY = slidersEndY + 70;
  const commentStartY = dividerY + 60;
  const commentEndY = commentStartY + commentLines.length * lineHeight;
  const metaY = commentEndY + (metaLine ? 50 : 0);
  const footerSpacing = 80;
  const footerY = metaY + footerSpacing;
  const bottomPadding = 60;

  const computedHeight = footerY + bottomPadding;
  const height = Math.max(1080, Math.min(1920, computedHeight));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = COLORS.fg;
  ctx.font = '700 42px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Las 3D del Trabajo', padding, titleY);

  // Sliders
  let y = slidersStartY;
  drawBar(ctx, padding, y, innerWidth, 'Dinero', dinero, COLORS.dinero);
  y += barGap;
  drawBar(ctx, padding, y, innerWidth, 'Desarrollo', desarrollo, COLORS.desarrollo);
  y += barGap;
  drawBar(ctx, padding, y, innerWidth, 'Diversión', diversion, COLORS.diversion);

  // Divider
  ctx.fillStyle = COLORS.track;
  ctx.fillRect(padding, dividerY, innerWidth, 1);

  // Comment
  ctx.fillStyle = COLORS.fg;
  ctx.font = '400 38px "Space Grotesk", Georgia, serif';
  ctx.textAlign = 'left';
  let cy = commentStartY;
  for (const line of commentLines) {
    ctx.fillText(line, padding, cy);
    cy += lineHeight;
  }

  // Metadata
  if (metaLine) {
    ctx.font = '400 24px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(metaLine, padding, metaY);
  }

  // Footer
  ctx.textAlign = 'center';
  ctx.font = '500 26px "Space Grotesk", system-ui, sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(SITE_CONFIG.domain, width / 2, height - 50);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to generate image'))),
      'image/png'
    );
  });
}
