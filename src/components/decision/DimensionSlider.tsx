import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

interface DimensionSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  colorClass: string;
}

export function DimensionSlider({ label, value, onChange, colorClass }: DimensionSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-base font-medium">{label}</span>
        <span className="text-2xl font-medium tabular-nums">{value}</span>
      </div>
      
      <SliderPrimitive.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[value]}
        onValueChange={([v]) => onChange(v)}
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
