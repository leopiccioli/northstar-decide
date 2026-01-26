import { useState } from 'react';
import { DecisionState, UserContext, Scores } from '@/types/decision';
import { EntryScreen } from './EntryScreen';
import { ContextScreen } from './ContextScreen';
import { InputScreen } from './InputScreen';
import { ResultScreen } from './ResultScreen';
import { CloseScreen } from './CloseScreen';

const initialState: DecisionState = {
  context: null,
  currentOption: null,
  comparisonOption: null,
  step: 'entry',
};

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

  return (
    <main className="min-h-screen bg-background">
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
      
      {state.step === 'result' && state.currentOption && state.context && (
        <ResultScreen
          context={state.context}
          currentOption={state.currentOption}
          comparisonOption={state.comparisonOption}
          onContinue={handleContinueToClose}
          onRestart={handleRestart}
        />
      )}
      
      {state.step === 'close' && (
        <CloseScreen onRestart={handleRestart} />
      )}
    </main>
  );
}
