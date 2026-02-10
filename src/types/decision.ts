export type UserContext = 
  | 'improve'    // Mejorar trabajo actual
  | 'change'     // Cambiar de trabajo
  | 'compare'    // Comparar opciones
  | 'burnout'    // Estancado/agotado
  | 'check';     // Solo chequear

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

// Prompts for optional comments (null = no comment field)
export const contextQuestions: Record<UserContext, string | null> = {
  improve: '¿Qué querés mejorar primero?',
  change: '¿Qué cambio buscás?',
  compare: '¿Qué te hace dudar?',
  burnout: '¿Qué te pesa hoy?',
  check: '¿Algo que te haga ruido?',
};
