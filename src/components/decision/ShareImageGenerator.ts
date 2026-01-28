import { Scores, UserContext, Option } from '@/types/decision';
import { SITE_CONFIG } from '@/config/urls';

interface GenerateImageOptions {
  currentOption: Option;
  comparisonOption?: Option | null;
  userContext: UserContext;
  isDark?: boolean;
}

function getTradeoff(a: Scores, b: Scores): string {
  const dims: { key: keyof Scores; label: string }[] = [
    { key: 'dinero', label: 'Dinero' },
    { key: 'desarrollo', label: 'Desarrollo' },
    { key: 'diversion', label: 'Diversión' },
  ];
  
  const gains = dims.filter(d => b[d.key] > a[d.key]).map(d => d.label);
  const losses = dims.filter(d => b[d.key] < a[d.key]).map(d => d.label);
  
  if (gains.length && losses.length) {
    return `+${gains.join('/')} / –${losses.join('/')}`;
  }
  if (gains.length) {
    return `+${gains.join('/')}`;
  }
  if (losses.length) {
    return `–${losses.join('/')}`;
  }
  return 'Iguales';
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  value: number,
  maxValue: number,
  label: string,
  isDark: boolean
) {
  const percentage = value / maxValue;
  const barWidth = width * percentage;
  
  // Bar background
  ctx.fillStyle = isDark ? '#2a2a2a' : '#e5e5e5';
  ctx.fillRect(x, y, width, height);
  
  // Bar fill
  ctx.fillStyle = isDark ? '#fafafa' : '#0f0f0f';
  ctx.fillRect(x, y, barWidth, height);
  
  // Label
  ctx.fillStyle = isDark ? '#fafafa' : '#0f0f0f';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.fillText(label, x, y - 20);
  
  // Value
  ctx.textAlign = 'right';
  ctx.font = '32px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#a1a1a1' : '#737373';
  ctx.fillText(`${value}/10`, x + width, y - 20);
  ctx.textAlign = 'left';
}

export async function generateShareImage({
  currentOption,
  comparisonOption,
  userContext,
  isDark = false,
}: GenerateImageOptions): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = isDark ? '#0f0f0f' : '#fafafa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padding = 80;
  const barHeight = 48;
  const barSpacing = 120;
  const barWidth = canvas.width - padding * 2;
  
  let startY = 300;

  if (comparisonOption) {
    // Comparison mode - show both options
    ctx.fillStyle = isDark ? '#fafafa' : '#0f0f0f';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentOption.name} vs ${comparisonOption.name}`, canvas.width / 2, 180);
    
    // Tradeoff
    const tradeoff = getTradeoff(currentOption.scores, comparisonOption.scores);
    ctx.font = '36px system-ui, sans-serif';
    ctx.fillStyle = isDark ? '#a1a1a1' : '#737373';
    ctx.fillText(tradeoff, canvas.width / 2, 240);
    ctx.textAlign = 'left';
    
    // Option A bars
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillStyle = isDark ? '#fafafa' : '#0f0f0f';
    ctx.fillText(currentOption.name, padding, startY - 40);
    
    drawBar(ctx, padding, startY, barWidth, barHeight, currentOption.scores.dinero, 10, 'Dinero', isDark);
    drawBar(ctx, padding, startY + barSpacing, barWidth, barHeight, currentOption.scores.desarrollo, 10, 'Desarrollo', isDark);
    drawBar(ctx, padding, startY + barSpacing * 2, barWidth, barHeight, currentOption.scores.diversion, 10, 'Diversión', isDark);
    
    // Option B bars
    startY += barSpacing * 3 + 80;
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillStyle = isDark ? '#fafafa' : '#0f0f0f';
    ctx.fillText(comparisonOption.name, padding, startY - 40);
    
    drawBar(ctx, padding, startY, barWidth, barHeight, comparisonOption.scores.dinero, 10, 'Dinero', isDark);
    drawBar(ctx, padding, startY + barSpacing, barWidth, barHeight, comparisonOption.scores.desarrollo, 10, 'Desarrollo', isDark);
    drawBar(ctx, padding, startY + barSpacing * 2, barWidth, barHeight, comparisonOption.scores.diversion, 10, 'Diversión', isDark);
  } else {
    // Single option mode
    ctx.fillStyle = isDark ? '#fafafa' : '#0f0f0f';
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Mis 3D laborales', canvas.width / 2, 180);
    ctx.textAlign = 'left';
    
    startY = 380;
    
    drawBar(ctx, padding, startY, barWidth, barHeight, currentOption.scores.dinero, 10, 'Dinero', isDark);
    drawBar(ctx, padding, startY + barSpacing, barWidth, barHeight, currentOption.scores.desarrollo, 10, 'Desarrollo', isDark);
    drawBar(ctx, padding, startY + barSpacing * 2, barWidth, barHeight, currentOption.scores.diversion, 10, 'Diversión', isDark);
    
    // Average
    const avg = (currentOption.scores.dinero + currentOption.scores.desarrollo + currentOption.scores.diversion) / 3;
    ctx.textAlign = 'center';
    ctx.font = 'bold 72px system-ui, sans-serif';
    ctx.fillStyle = isDark ? '#fafafa' : '#0f0f0f';
    ctx.fillText(avg.toFixed(1), canvas.width / 2, startY + barSpacing * 3 + 100);
    ctx.font = '32px system-ui, sans-serif';
    ctx.fillStyle = isDark ? '#a1a1a1' : '#737373';
    ctx.fillText('Promedio', canvas.width / 2, startY + barSpacing * 3 + 150);
  }

  // URL at bottom
  ctx.textAlign = 'center';
  ctx.font = '28px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#525252' : '#a1a1a1';
  ctx.fillText(SITE_CONFIG.domain, canvas.width / 2, canvas.height - 60);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate image'));
      },
      'image/png'
    );
  });
}

// Share text templates based on user context
const shareTemplates: Record<UserContext, string> = {
  improve: 'Quiero mejorar mi trabajo.\nMis 3D laborales: Dinero {d} | Desarrollo {dev} | Diversión {div}\n¿Qué mirarías primero?',
  change: 'Estoy pensando en cambiar.\nMis 3D laborales: Dinero {d} | Desarrollo {dev} | Diversión {div}\n¿Vos cambiarías?',
  burnout: 'Me siento estancado.\nMis 3D laborales: Dinero {d} | Desarrollo {dev} | Diversión {div}\n¿Qué harías en mi lugar?',
  check: 'Mis 3D laborales hoy: Dinero {d} | Desarrollo {dev} | Diversión {div}\n¿Cómo lo ves?',
  compare: 'Comparé "{a}" vs "{b}" en mis 3D laborales.\n{tradeoff}\n¿Qué harías vos?',
};

export function getShareText(
  userContext: UserContext,
  currentOption: Option,
  comparisonOption?: Option | null
): string {
  const { dinero, desarrollo, diversion } = currentOption.scores;
  
  if (userContext === 'compare' && comparisonOption) {
    const tradeoff = getTradeoff(currentOption.scores, comparisonOption.scores);
    return shareTemplates.compare
      .replace('{a}', currentOption.name)
      .replace('{b}', comparisonOption.name)
      .replace('{tradeoff}', tradeoff);
  }
  
  return shareTemplates[userContext]
    .replace('{d}', String(dinero))
    .replace('{dev}', String(desarrollo))
    .replace('{div}', String(diversion));
}
