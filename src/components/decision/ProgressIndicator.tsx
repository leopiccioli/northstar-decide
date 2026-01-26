interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="font-mono tabular-nums">
        {currentStep}/{totalSteps}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < currentStep ? 'bg-foreground' : 'bg-border'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
