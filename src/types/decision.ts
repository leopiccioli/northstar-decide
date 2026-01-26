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
}

export interface DecisionState {
  context: UserContext | null;
  currentOption: Option | null;
  comparisonOption: Option | null;
  step: 'entry' | 'context' | 'input' | 'input-comparison' | 'result' | 'close';
}
