'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import clsx from 'clsx';

interface DateTimePickerProps {
  value: string; // ISO string: "2026-07-04T09:00"
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  dark?: boolean;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function DateTimePicker({ value, onChange, label, className, dark = false }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Parse the value
  const date = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [viewMonth, setViewMonth] = useState(date.getMonth());
  const selectedDay = date.getDate();
  const selectedMonth = date.getMonth();
  const selectedYear = date.getFullYear();
  const [hours, setHours] = useState(date.getHours());
  const [minutes, setMinutes] = useState(date.getMinutes());

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const emitChange = (year: number, month: number, day: number, h: number, m: number) => {
    const d = new Date(year, month, day, h, m);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onChange(iso);
  };

  const handleDayClick = (day: number) => {
    emitChange(viewYear, viewMonth, day, hours, minutes);
  };

  const handleTimeChange = (h: number, m: number) => {
    setHours(h);
    setMinutes(m);
    emitChange(selectedYear, selectedMonth, selectedDay, h, m);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const today = new Date();

  // Formatted display: dd/mm/aaaa às HH:MM
  const displayDate = value
    ? `${String(selectedDay).padStart(2, '0')}/${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear} às ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    : 'Selecionar data e hora';

  const bgBase = dark ? 'bg-zinc-950' : 'bg-white dark:bg-zinc-950';
  const borderBase = dark ? 'border-zinc-800' : 'border-zinc-200 dark:border-zinc-800';
  const textBase = dark ? 'text-zinc-300' : 'text-zinc-900 dark:text-zinc-100';

  return (
    <div className={clsx("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left shadow-sm",
          bgBase, borderBase, textBase,
          "hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        )}
      >
        <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
        <span className="text-xs font-bold flex-1">{displayDate}</span>
        <ChevronRight className={clsx("w-3.5 h-3.5 text-zinc-400 transition-transform", isOpen && "rotate-90")} />
      </button>

      {isOpen && (
        <div className={clsx(
          "absolute z-50 mt-2 left-0 w-72 rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200",
          dark ? "bg-zinc-900 border-zinc-800" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <ChevronLeft className="w-4 h-4 text-zinc-500" />
            </button>
            <span className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-200">
              {MESES[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </button>
          </div>

          {/* Days grid */}
          <div className="p-3">
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DIAS_SEMANA.map(d => (
                <div key={d} className="text-center text-[8px] font-black uppercase text-zinc-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear;
                const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                const isPast = new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    disabled={isPast}
                    className={clsx(
                      "h-8 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center",
                      isSelected
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110"
                        : isToday
                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/30"
                        : isPast
                        ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time picker */}
          <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-[9px] font-black uppercase text-zinc-500">Horário:</span>
            <div className="flex items-center gap-1 flex-1">
              <select
                value={hours}
                onChange={(e) => handleTimeChange(Number(e.target.value), minutes)}
                className="bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg px-2 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none text-center w-14"
              >
                {Array.from({ length: 24 }).map((_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                ))}
              </select>
              <span className="text-zinc-400 font-black">:</span>
              <select
                value={minutes}
                onChange={(e) => handleTimeChange(hours, Number(e.target.value))}
                className="bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg px-2 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none text-center w-14"
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                  <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Confirm */}
          <div className="px-4 pb-3">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
