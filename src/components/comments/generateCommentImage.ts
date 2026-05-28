import { SITE_CONFIG } from '@/config/urls';

interface Args {
  dinero: number;
  desarrollo: number;
  diversion: number;
  comment: string;
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
  ctx.font = '600 36px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y - 20);

  ctx.textAlign = 'right';
  ctx.font = '500 32px "Space Grotesk", system-ui, sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(`${value}/10`, x + width, y - 20);

  // Track
  ctx.fillStyle = COLORS.track;
  ctx.beginPath();
  ctx.roundRect(x, y, width, 14, 7);
  ctx.fill();

  // Fill
  const fillWidth = Math.max(28, (value / 10) * width);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, fillWidth, 14, 7);
  ctx.fill();

  // Thumb
  const thumbX = x + fillWidth;
  ctx.fillStyle = COLORS.fg;
  ctx.beginPath();
  ctx.arc(thumbX, y + 7, 14, 0, Math.PI * 2);
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
}: Args): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padding = 90;
  const innerWidth = canvas.width - padding * 2;

  // Title
  ctx.fillStyle = COLORS.fg;
  ctx.font = '700 44px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('3D para Decidir', padding, 140);

  // Sliders
  let y = 280;
  const barGap = 140;
  drawBar(ctx, padding, y, innerWidth, 'Dinero', dinero, COLORS.dinero);
  y += barGap;
  drawBar(ctx, padding, y, innerWidth, 'Desarrollo', desarrollo, COLORS.desarrollo);
  y += barGap;
  drawBar(ctx, padding, y, innerWidth, 'Diversión', diversion, COLORS.diversion);

  // Divider
  y += 100;
  ctx.fillStyle = COLORS.track;
  ctx.fillRect(padding, y, innerWidth, 1);

  // Comment
  y += 70;
  ctx.fillStyle = COLORS.fg;
  ctx.font = '400 40px "Space Grotesk", Georgia, serif';
  ctx.textAlign = 'left';
  const lines = wrapText(ctx, `"${comment}"`, innerWidth);
  const lineHeight = 56;
  const maxLines = 10;
  const shown = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    shown[shown.length - 1] = shown[shown.length - 1].replace(/\s*\S*$/, '…');
  }
  for (const line of shown) {
    ctx.fillText(line, padding, y);
    y += lineHeight;
  }

  // Footer
  ctx.textAlign = 'center';
  ctx.font = '500 28px "Space Grotesk", system-ui, sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(SITE_CONFIG.domain, canvas.width / 2, canvas.height - 70);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to generate image'))),
      'image/png'
    );
  });
}
