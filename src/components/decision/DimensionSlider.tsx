import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TooltipInfo {
  title: string;
  bullets: string[];
}

interface DimensionSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  colorClass: string;
  tooltip?: TooltipInfo;
}

export function DimensionSlider({ label, value, onChange, colorClass, tooltip }: DimensionSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base font-medium">{label}</span>
          {tooltip && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    type="button" 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`Información sobre ${label}`}
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent 
                  side="top"
                  sideOffset={8}
                  className="max-w-[220px] p-3 border border-border shadow-lg z-50"
                  style={{ backgroundColor: 'hsl(var(--card))' }}
                >
                  <p className="text-sm font-medium mb-2 text-foreground">{tooltip.title}</p>
                  <ul className="space-y-1">
                    {tooltip.bullets.map((bullet, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-foreground/60">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">{value}/10</span>
      </div>
      
      <SliderPrimitive.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[value]}
        onValueChange={([v]) => {
          // Haptic feedback on mobile
          if ('vibrate' in navigator) {
            navigator.vibrate(10);
          }
          onChange(v);
        }}
        max={10}
        min={1}
        step={1}
      >
        <SliderPrimitive.Track className="slider-track relative grow h-1.5">
          <SliderPrimitive.Range 
            className={cn("absolute h-full rounded-full", colorClass.replace('text-', 'bg-'))} 
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb 
          className="block w-5 h-5 bg-foreground rounded-full shadow-md
                     hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring
                     transition-transform cursor-grab active:cursor-grabbing"
        />
      </SliderPrimitive.Root>
    </div>
  );
}
