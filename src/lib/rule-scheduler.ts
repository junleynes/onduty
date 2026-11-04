/**
 * rule-scheduler.ts — deterministic schedule generator (no AI, no network).
 *
 * For each employee it learns a weekly pattern from the 4 weeks before the
 * target range (which weekdays they work, and the usual shift on each), then
 * projects that pattern over the range while enforcing the same constraints
 * the AI prompt uses. Pure functions only: safe to import from client code.
 *
 * Not handled (by design): coverage targets / minimum headcount, and
 * rotating multi-week patterns. The pattern is per weekday, so an A/B
 * rotation collapses to whichever shift appeared most.
 */
import { addDays, eachDayOfInterval, format, getDay, parseISO, startOfDay, startOfWeek, subDays } from 'date-fns';
import type { Employee, Leave, Shift } from '@/types';

export type RuleTemplate = { id: string; label: string; startTime: string; endTime: string; color?: string };

export type RuleShift = {
  employeeId: string;
  employeeName: string;
  date: string; // yyyy-MM-dd
  startTime: string;
  endTime: string;
  label: string;
  templateId?: string;
  color?: string;
  warning?: string;
};

export type RuleWarning = {
  employeeId: string;
  employeeName: string;
  message: string;
  type: 'hours' | 'duration' | 'pattern';
};

export type RuleOptions = {
  rangeStart: Date;
  rangeEnd: Date;
  employees: Employee[];     // already filtered to eligible employees
  shifts: Shift[];           // all existing shifts (history + already-planned)
  leave: Leave[];
  templates: RuleTemplate[];
  weeklyCap: (emp: Employee) => number | null; // null = no limit
  maxShiftHours: number | null;
  followPattern: boolean;    // false = everyone works Mon–Fri on their usual shift
  today?: Date;
  historyDays?: number;      // default 28
};

const WORKING_LEAVE: Leave['status'][] = ['approved', 'processed'];

const key = (d: Date | string) => format(new Date(d), 'yyyy-MM-dd');

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function shiftHours(start: string, end: string): number {
  const s = toMinutes(start);
  let e = toMinutes(end);
  if (e <= s) e += 1440;
  return (e - s) / 60;
}

const isWork = (s: Shift) => !s.isDayOff && !s.isHolidayOff && !!s.startTime && !!s.endTime;

type Slot = { startTime: string; endTime: string; label: string; color?: string };
const slotKey = (s: Slot) => `${s.startTime}|${s.endTime}|${s.label}`;

/** Most frequent slot; ties go to the most recently seen one (list is date-ascending). */
function modalSlot(slots: Slot[]): Slot | null {
  if (!slots.length) return null;
  const counts = new Map<string, { n: number; last: number; slot: Slot }>();
  slots.forEach((s, i) => {
    const k = slotKey(s);
    const c = counts.get(k);
    if (c) { c.n++; c.last = i; c.slot = s; } else counts.set(k, { n: 1, last: i, slot: s });
  });
  return [...counts.values()].sort((a, b) => b.n - a.n || b.last - a.last)[0].slot;
}

export function generateRuleSchedule(opts: RuleOptions): { shifts: RuleShift[]; warnings: RuleWarning[] } {
  const today = startOfDay(opts.today ?? new Date());
  const rangeStart = startOfDay(opts.rangeStart);
  const rangeEnd = startOfDay(opts.rangeEnd);
  const histDays = opts.historyDays ?? 28;
  const histEnd = rangeStart < today ? rangeStart : today;
  const histStart = subDays(histEnd, histDays);

  const targetDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const histWindow = eachDayOfInterval({ start: histStart, end: subDays(histEnd, 1) });

  const byEmp = new Map<string, Shift[]>();
  for (const s of opts.shifts) {
    if (!s.employeeId) continue;
    if (!byEmp.has(s.employeeId)) byEmp.set(s.employeeId, []);
    byEmp.get(s.employeeId)!.push(s);
  }

  const leaveByEmp = new Map<string, Leave[]>();
  for (const l of opts.leave) {
    if (!WORKING_LEAVE.includes(l.status)) continue;
    if (!leaveByEmp.has(l.employeeId)) leaveByEmp.set(l.employeeId, []);
    leaveByEmp.get(l.employeeId)!.push(l);
  }
  const onLeave = (empId: string, d: Date) => {
    const k = key(d);
    return (leaveByEmp.get(empId) ?? []).some(l => key(l.startDate) <= k && k <= key(l.endDate));
  };

  // Fallback slot for people with no history: the most common shift across everyone.
  const histStartKey = key(histStart);
  const histEndKey = key(subDays(histEnd, 1));
  const inHistory = (s: Shift) => {
    const k = key(s.date);
    return k >= histStartKey && k <= histEndKey;
  };
  const everyone = opts.shifts
    .filter(s => isWork(s) && inHistory(s))
    .sort((a, b) => key(a.date).localeCompare(key(b.date)))
    .map(s => ({ startTime: s.startTime, endTime: s.endTime, label: s.label, color: s.color }));
  const tpl = opts.templates[0];
  const defaultSlot: Slot | null = modalSlot(everyone)
    ?? (tpl ? { startTime: tpl.startTime, endTime: tpl.endTime, label: tpl.label, color: tpl.color } : null);

  const out: RuleShift[] = [];
  const warnings: RuleWarning[] = [];

  for (const emp of opts.employees) {
    const name = `${emp.firstName} ${emp.lastName}`.trim();
    const mine = byEmp.get(emp.id) ?? [];
    const warn = (message: string, type: RuleWarning['type']) =>
      warnings.push({ employeeId: emp.id, employeeName: name, message, type });

    // ── Learn the weekly pattern ─────────────────────────────────────────────
    const histWork = mine.filter(s => isWork(s) && inHistory(s))
      .sort((a, b) => key(a.date).localeCompare(key(b.date)));
    const holidayOff = new Set(mine.filter(s => s.isHolidayOff).map(s => key(s.date)));

    const slotFor: (Slot | null)[] = Array(7).fill(null); // null = rest day
    let usedDefault = false;

    if (histWork.length && opts.followPattern) {
      for (let wd = 0; wd < 7; wd++) {
        const days = histWindow.filter(d => getDay(d) === wd
          && !onLeave(emp.id, d) && !holidayOff.has(key(d)));
        if (!days.length) continue;
        const worked = histWork.filter(s => getDay(new Date(s.date)) === wd);
        if (worked.length / days.length >= 0.5) {
          slotFor[wd] = modalSlot(worked.map(s => ({
            startTime: s.startTime, endTime: s.endTime, label: s.label, color: s.color,
          })));
        }
      }
    } else {
      const slot = modalSlot(histWork.map(s => ({
        startTime: s.startTime, endTime: s.endTime, label: s.label, color: s.color,
      }))) ?? defaultSlot;
      if (!histWork.length) usedDefault = true;
      if (slot) for (const wd of [1, 2, 3, 4, 5]) slotFor[wd] = slot;
    }

    if (usedDefault) {
      if (!defaultSlot) {
        warn('No shift history and no shift templates to fall back on — skipped.', 'pattern');
        continue;
      }
      warn(`No shifts in the previous ${histDays} days — used the default Mon–Fri shift (${defaultSlot.label}).`, 'pattern');
    }
    if (!slotFor.some(Boolean)) {
      warn('No working weekdays found in recent history — skipped.', 'pattern');
      continue;
    }

    // ── Project it over the range, enforcing constraints ─────────────────────
    const taken = new Set(mine.map(s => key(s.date))); // never overwrite an existing entry
    const cap = opts.weeklyCap(emp);
    const weekHours = new Map<string, number>();
    const hoursFor = (d: Date) => {
      const wk = key(startOfWeek(d, { weekStartsOn: 1 }));
      if (!weekHours.has(wk)) {
        const wkEnd = addDays(startOfWeek(d, { weekStartsOn: 1 }), 6);
        const existing = mine
          .filter(s => isWork(s) && key(s.date) >= wk && key(s.date) <= key(wkEnd))
          .reduce((sum, s) => sum + shiftHours(s.startTime, s.endTime), 0);
        weekHours.set(wk, existing);
      }
      return { wk, hours: weekHours.get(wk)! };
    };
    const skippedForHours = new Map<string, number>();

    for (const d of targetDays) {
      const slot = slotFor[getDay(d)];
      if (!slot) continue;
      if (taken.has(key(d)) || onLeave(emp.id, d)) continue;

      const dur = shiftHours(slot.startTime, slot.endTime);
      if (opts.maxShiftHours !== null && dur > opts.maxShiftHours) {
        warn(`${format(d, 'EEE MMM d')}: ${dur.toFixed(1)}h shift exceeds ${opts.maxShiftHours}h — skipped.`, 'duration');
        continue;
      }

      const { wk, hours } = hoursFor(d);
      if (cap !== null && hours + dur > cap) {
        skippedForHours.set(wk, (skippedForHours.get(wk) ?? 0) + 1);
        continue;
      }
      weekHours.set(wk, hours + dur);

      const match = opts.templates.find(t =>
        t.label === slot.label && t.startTime === slot.startTime && t.endTime === slot.endTime);
      out.push({
        employeeId: emp.id,
        employeeName: name,
        date: key(d),
        startTime: slot.startTime,
        endTime: slot.endTime,
        label: slot.label,
        templateId: match?.id,
        color: match?.color ?? slot.color,
      });
    }

    for (const [wk, n] of skippedForHours) {
      warn(`Week of ${format(parseISO(wk), 'MMM d')}: ${n} shift${n > 1 ? 's' : ''} left out to stay within ${cap}h.`, 'hours');
    }
  }

  out.sort((a, b) => a.date.localeCompare(b.date) || a.employeeName.localeCompare(b.employeeName));
  return { shifts: out, warnings };
}
