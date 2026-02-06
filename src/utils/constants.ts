export const STATUS_VALUES = [
  'ABERTA',
  'PROGRESSO',
  'RESOLVIDA',
  'FECHADA',
  'CANCELADA'
] as const;

export const PRIORITY_VALUES = ['BAIXA', 'MEDIA', 'ALTA'] as const;

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  ABERTA: ['PROGRESSO', 'RESOLVIDA', 'CANCELADA'],
  PROGRESSO: ['RESOLVIDA', 'CANCELADA'],
  RESOLVIDA: ['FECHADA'],
  FECHADA: [],
  CANCELADA: []
};

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;
