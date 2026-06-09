/**
 * Theme helpers for the embeddable widget.
 * Parses colors received from the host page and converts them to HSL
 * components compatible with our CSS variable system.
 */

export type HSL = { h: number; s: number; l: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case R: h = (G - B) / d + (G < B ? 6 : 0); break;
      case G: h = (B - R) / d + 2; break;
      case B: h = (R - G) / d + 4; break;
    }
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Accepts #rgb, #rrggbb, rgb(...), rgba(...). Returns null on transparent or unparseable. */
export function parseColor(input: string | null | undefined): HSL | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (!s || s === 'transparent') return null;

  // hex
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return rgbToHsl(r, g, b);
  }

  // rgb/rgba
  const rgb = s.match(/rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*(\d*(?:\.\d+)?)\s*)?\)/);
  if (rgb) {
    const a = rgb[4] !== undefined ? parseFloat(rgb[4]) : 1;
    if (a === 0) return null;
    return rgbToHsl(
      clamp(parseInt(rgb[1], 10), 0, 255),
      clamp(parseInt(rgb[2], 10), 0, 255),
      clamp(parseInt(rgb[3], 10), 0, 255),
    );
  }

  return null;
}

export function hslString(c: HSL): string {
  return `${c.h} ${c.s}% ${c.l}%`;
}

function relLum(c: HSL): number {
  // approximate luminance from L channel of HSL
  return c.l / 100;
}

/** Pick black or white foreground based on background luminance. */
export function readableOn(bg: HSL): HSL {
  return relLum(bg) > 0.55 ? { h: 0, s: 0, l: 8 } : { h: 0, s: 0, l: 98 };
}

/** Cheap contrast check using L delta. */
export function hasEnoughContrast(a: HSL, b: HSL): boolean {
  return Math.abs(a.l - b.l) >= 45;
}

export interface EmbedThemeTokens {
  bg?: HSL;
  fg?: HSL;
  accent?: HSL;
  font?: string;
}

export function readThemeFromParams(params: URLSearchParams): EmbedThemeTokens | null {
  if (params.get('theme') !== 'auto') return null;
  const bg = parseColor(params.get('bg')) ?? undefined;
  let fg = parseColor(params.get('fg')) ?? undefined;
  const accent = parseColor(params.get('accent')) ?? undefined;
  const font = params.get('font') || undefined;

  if (bg && fg && !hasEnoughContrast(bg, fg)) {
    fg = readableOn(bg);
  }

  if (!bg && !fg && !accent && !font) return null;
  return { bg, fg, accent, font };
}

/** Build a <style> string injecting CSS vars at :root for the embed page. */
export function buildThemeCSS(tokens: EmbedThemeTokens): string {
  const rules: string[] = [];
  if (tokens.bg) {
    rules.push(`--background: ${hslString(tokens.bg)};`);
    rules.push(`--card: ${hslString(tokens.bg)};`);
    rules.push(`--popover: ${hslString(tokens.bg)};`);
    rules.push(`--primary-foreground: ${hslString(tokens.bg)};`);
  }
  if (tokens.fg) {
    const fg = tokens.fg;
    rules.push(`--foreground: ${hslString(fg)};`);
    rules.push(`--card-foreground: ${hslString(fg)};`);
    rules.push(`--popover-foreground: ${hslString(fg)};`);
    rules.push(`--primary: ${hslString(fg)};`);
    rules.push(`--ring: ${hslString(fg)};`);
    // muted/border derived from fg with reduced lightness contrast
    const muted: HSL = { h: fg.h, s: Math.max(0, fg.s - 10), l: fg.l > 50 ? Math.max(20, fg.l - 30) : Math.min(80, fg.l + 30) };
    rules.push(`--muted-foreground: ${hslString(muted)};`);
    const border: HSL = { h: fg.h, s: Math.max(0, fg.s - 20), l: fg.l > 50 ? Math.min(90, fg.l - 5) : Math.max(10, fg.l + 80) };
    rules.push(`--border: ${hslString(border)};`);
    rules.push(`--input: ${hslString(border)};`);
    const secondary: HSL = { h: fg.h, s: Math.max(0, fg.s - 25), l: fg.l > 50 ? Math.min(95, fg.l - 2) : Math.max(5, fg.l + 86) };
    rules.push(`--secondary: ${hslString(secondary)};`);
    rules.push(`--secondary-foreground: ${hslString(fg)};`);
    rules.push(`--muted: ${hslString(secondary)};`);
  }
  if (tokens.accent) {
    rules.push(`--accent: ${hslString(tokens.accent)};`);
    rules.push(`--accent-foreground: ${hslString(readableOn(tokens.accent))};`);
  }
  let css = `:root{${rules.join('')}}`;
  if (tokens.font) {
    // Escape any closing braces just in case
    const safeFont = tokens.font.replace(/[<>]/g, '');
    css += `body,html{font-family:${safeFont} !important;}`;
  }
  return css;
}
