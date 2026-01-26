export type UserContext = 
  | 'evaluate' 
  | 'compare' 
  | 'clarity';

export interface Scores {
  dinero: number;
  desarrollo: number;
  diversion: number;
}

export interface Option {
  name: string;
  scores: Scores;
  comment?: string;
}

export interface DecisionState {
  context: UserContext | null;
  currentOption: Option | null;
  comparisonOption: Option | null;
  step: 'entry' | 'context' | 'input' | 'input-comparison' | 'result' | 'close';
}

export const contextQuestions: Record<UserContext, string> = {
  evaluate: '¿Cómo te sentís laboralmente?',
  compare: '¿Qué sensación te da esta opción?',
  clarity: '¿Qué te gustaría que pase?',
};
