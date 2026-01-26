import { useState } from 'react';
import { DecisionState, UserContext, Scores } from '@/types/decision';
import { EntryScreen } from './EntryScreen';
import { ContextScreen } from './ContextScreen';
import { InputScreen } from './InputScreen';
import { ResultScreen } from './ResultScreen';
import { CloseScreen } from './CloseScreen';
import { ProgressIndicator } from './ProgressIndicator';

const initialState: DecisionState = {
  context: null,
  currentOption: null,
  comparisonOption: null,
  step: 'entry',
};

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
  const [state, setState] = useState<DecisionState>(initialState);

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
    setState(initialState);
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
        <ContextScreen onSelect={handleContextSelect} />
      )}
      
      {state.step === 'input' && state.context && (
        <InputScreen
          context={state.context}
          isComparison={false}
          isFirstComparison={state.context === 'compare'}
          onComplete={handleInputComplete}
          onBack={handleBack}
        />
      )}
      
      {state.step === 'input-comparison' && state.context && (
        <InputScreen
          context={state.context}
          isComparison={true}
          onComplete={handleInputComplete}
          onBack={handleBack}
        />
      )}
      
      {state.step === 'result' && state.currentOption && (
        <ResultScreen
          currentOption={state.currentOption}
          comparisonOption={state.comparisonOption}
        />
      )}
      
      {state.step === 'close' && (
        <CloseScreen onRestart={handleRestart} />
      )}
    </main>
  );
}
