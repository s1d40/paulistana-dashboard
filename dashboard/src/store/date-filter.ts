import { create } from 'zustand';

export type DateRange = '7d' | '30d' | '90d' | 'all';

interface DateFilterState {
  range: DateRange;
  setRange: (range: DateRange) => void;
}

export const useDateFilter = create<DateFilterState>((set) => ({
  range: '7d', // Filtro padrão: Últimos 7 dias
  setRange: (range) => set({ range }),
}));
