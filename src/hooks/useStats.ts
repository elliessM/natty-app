import { useMemo } from 'react';
import { useJournalStore, dayKey, entriesForDay, dayTotals, type JournalEntry } from '../store/useJournalStore';
import type { DayDatum } from '../shared/charts/BarChart7Days';

const DAYS_LABEL = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export type StatsRange = 7 | 30;

export type StatsData = {
  bars: DayDatum[];
  totalsByDay: Array<{ key: string; kcal: number; prot: number; glu: number; lip: number }>;
  averages: { kcal: number; prot: number; glu: number; lip: number };
  daysLogged: number;
  bestDay: { key: string; kcal: number } | null;
  topFoods: Array<{ food: string; emoji: string; count: number; kcal: number }>;
};

export function useStats(range: StatsRange = 7): StatsData {
  const entries = useJournalStore((s) => s.entries);

  return useMemo(() => {
    const now = Date.now();

    const totalsByDay = Array.from({ length: range }, (_, i) => {
      const d = new Date(now - (range - 1 - i) * 86400000);
      const key = dayKey(d.getTime());
      const t = dayTotals(entriesForDay(entries, key));
      return { key, ...t };
    });

    const bars: DayDatum[] = totalsByDay.map((t, i) => {
      const d = new Date(t.key);
      const isToday = i === totalsByDay.length - 1;
      // sur 30j on remplace les labels par chiffres pour pas saturer
      const label = range === 7 ? DAYS_LABEL[d.getDay()] : String(d.getDate());
      return { label, value: t.kcal, isToday };
    });

    const daysLogged = totalsByDay.filter((t) => t.kcal > 0).length;
    const totalsSum = totalsByDay.reduce(
      (acc, t) => ({
        kcal: acc.kcal + t.kcal,
        prot: acc.prot + t.prot,
        glu: acc.glu + t.glu,
        lip: acc.lip + t.lip,
      }),
      { kcal: 0, prot: 0, glu: 0, lip: 0 }
    );
    const div = Math.max(1, daysLogged);
    const averages = {
      kcal: Math.round(totalsSum.kcal / div),
      prot: Math.round(totalsSum.prot / div),
      glu: Math.round(totalsSum.glu / div),
      lip: Math.round(totalsSum.lip / div),
    };

    const bestDay =
      totalsByDay.length === 0
        ? null
        : totalsByDay.reduce((a, b) => (b.kcal > a.kcal ? b : a), totalsByDay[0]);

    // Top 3 plats sur la période (par fréquence)
    const fromTs = now - range * 86400000;
    const inRange = entries.filter((e) => e.timestamp >= fromTs);
    const grouped = new Map<string, { food: string; emoji: string; count: number; kcal: number }>();
    inRange.forEach((e) => {
      // Clé sur le nom court (avant " · ") pour grouper banane 100g + banane 150g
      const key = e.food.split(' ·')[0].split(',')[0].trim().toLowerCase();
      const existing = grouped.get(key);
      if (existing) {
        existing.count += 1;
        existing.kcal += e.kcal;
      } else {
        grouped.set(key, { food: e.food.split(' ·')[0].split(',')[0].trim(), emoji: e.emoji, count: 1, kcal: e.kcal });
      }
    });
    const topFoods = Array.from(grouped.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      bars,
      totalsByDay,
      averages,
      daysLogged,
      bestDay: bestDay && bestDay.kcal > 0 ? { key: bestDay.key, kcal: Math.round(bestDay.kcal) } : null,
      topFoods,
    };
  }, [entries, range]);
}
