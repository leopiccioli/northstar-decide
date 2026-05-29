import { useEffect, useState, lazy, Suspense } from 'react';
import { DecisionState, UserContext, Scores } from '@/types/decision';
import { EntryScreen } from './EntryScreen';
import { ProgressIndicator } from './ProgressIndicator';
import { trackFlowEvent } from '@/lib/analytics';


// Lazy load screens that are not shown initially
const ContextScreen = lazy(() => import('./ContextScreen'));
const InputScreen = lazy(() => import('./InputScreen'));
const ResultScreen = lazy(() => import('./ResultScreen'));
const CloseScreen = lazy(() => import('./CloseScreen'));

// Minimal spinner for lazy loading fallback
const ScreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
  </div>
);

// Mobile users skip the entry screen entirely — analytics showed it was a hard
// drop-off. Desktop keeps it (with QR for mobile handoff). Computed synchronously
// from viewport width to avoid flicker.
const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth < 768;

const getInitialState = (): DecisionState => ({
  context: null,
  currentOption: null,
  comparisonOption: null,
  step: isMobileViewport() ? 'context' : 'entry',
});

function getStepNumber(step: DecisionState['step'], isCompare: boolean): number {
  if (step === 'entry') return 0;
  if (step === 'context') return 1;
  if (step === 'input') return 2;
  if (step === 'input-comparison') return 3;
  if (step === 'result') return isCompare ? 4 : 3;
  return 0;
}

function getTotalSteps(isCompare: boolean): number {
  return isCompare ? 4 : 3;
}

export function DecisionFlow() {
  const [state, setState] = useState<DecisionState>(getInitialState);

  // Mobile entry: still fire start_flow once on mount since the entry button is skipped
  useEffect(() => {
    if (isMobileViewport()) {
      trackFlowEvent('start_flow');
    }
  }, []);

  const handleStart = () => {
    setState(prev => ({ ...prev, step: 'context' }));
  };

  const handleContextSelect = (context: UserContext) => {
    setState(prev => ({ ...prev, context, step: 'input' }));
  };

  const handleInputComplete = (name: string, scores: Scores, comment?: string) => {
    if (state.context === 'compare' && !state.currentOption) {
      // First option in comparison flow
      setState(prev => ({
        ...prev,
        currentOption: { name, scores, comment },
        step: 'input-comparison',
      }));
    } else if (state.step === 'input-comparison') {
      // Second option in comparison flow
      setState(prev => ({
        ...prev,
        comparisonOption: { name, scores, comment },
        step: 'result',
      }));
    } else {
      // Single evaluation
      setState(prev => ({
        ...prev,
        currentOption: { name, scores, comment },
        step: 'result',
      }));
    }
  };

  const handleContinueToClose = () => {
    setState(prev => ({ ...prev, step: 'close' }));
  };

  const handleRestart = () => {
    setState(getInitialState());
  };

  const handleBack = () => {
    if (state.step === 'input') {
      setState(prev => ({ ...prev, step: 'context', context: null }));
    } else if (state.step === 'input-comparison') {
      setState(prev => ({ ...prev, step: 'input', currentOption: null }));
    }
  };

  const isCompare = state.context === 'compare';
  const stepNumber = getStepNumber(state.step, isCompare);
  const totalSteps = getTotalSteps(isCompare);
  const showProgress = state.step !== 'entry' && state.step !== 'close' && state.step !== 'result';

  return (
    <main className="min-h-screen bg-background relative">
      {/* Progress indicator */}
      {showProgress && (
        <div className="absolute top-6 right-6 z-10">
          <ProgressIndicator currentStep={stepNumber} totalSteps={totalSteps} />
        </div>
      )}

      {state.step === 'entry' && (
        <EntryScreen onStart={handleStart} />
      )}
      
      {state.step === 'context' && (
        <Suspense fallback={<ScreenLoader />}>
          <ContextScreen onSelect={handleContextSelect} />
        </Suspense>
      )}
      
      {state.step === 'input' && state.context && (
        <Suspense fallback={<ScreenLoader />}>
          <InputScreen
            context={state.context}
            isComparison={false}
            isFirstComparison={state.context === 'compare'}
            onComplete={handleInputComplete}
            onBack={handleBack}
          />
        </Suspense>
      )}
      
      {state.step === 'input-comparison' && state.context && (
        <Suspense fallback={<ScreenLoader />}>
          <InputScreen
            context={state.context}
            isComparison={true}
            onComplete={handleInputComplete}
            onBack={handleBack}
          />
        </Suspense>
      )}
      
      {state.step === 'result' && state.currentOption && state.context && (
        <Suspense fallback={<ScreenLoader />}>
          <ResultScreen
            currentOption={state.currentOption}
            comparisonOption={state.comparisonOption}
            userContext={state.context}
          />
        </Suspense>
      )}
      
      {state.step === 'close' && (
        <Suspense fallback={<ScreenLoader />}>
          <CloseScreen onRestart={handleRestart} />
        </Suspense>
      )}
    </main>
  );
}
