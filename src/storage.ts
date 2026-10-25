import { useState } from 'react';
import { statuses, type Store } from './types';

export const STORAGE_KEY = 'offer-diary.v1';
const defaults: Store = {
  version: 1,
  applications: [],
  settings: { language: 'zh', tone: 'gentle' },
};

export function isValidStore(value: unknown): value is Store {
  if (!value || typeof value !== 'object') return false;
  const v = value as Store;
  if (
    v.version !== 1 ||
    !Array.isArray(v.applications) ||
    !v.settings ||
    !['zh', 'en'].includes(v.settings.language) ||
    !['gentle', 'humor', 'off'].includes(v.settings.tone)
  )
    return false;
  const ids = new Set<string>();
  const interviewIds = new Set<string>();
  return v.applications.every((a) => {
    if (
      !a ||
      typeof a !== 'object' ||
      typeof a.id !== 'string' ||
      !a.id ||
      ids.has(a.id)
    )
      return false;
    ids.add(a.id);
    return (
      [
        'company',
        'role',
        'location',
        'appliedAt',
        'url',
        'salary',
        'nextAction',
        'nextDate',
        'createdAt',
        'updatedAt',
      ].every((k) => typeof a[k as keyof typeof a] === 'string') &&
      statuses.includes(a.status) &&
      Number.isInteger(a.priority) &&
      a.priority >= 1 &&
      a.priority <= 5 &&
      Array.isArray(a.interviews) &&
      a.interviews.every((i) => {
        if (
          !i ||
          typeof i !== 'object' ||
          i.applicationId !== a.id ||
          typeof i.id !== 'string' ||
          !i.id ||
          interviewIds.has(i.id)
        )
          return false;
        interviewIds.add(i.id);
        return (
          [
            'round',
            'date',
            'questions',
            'performance',
            'selfNote',
            'interviewerNote',
            'reflection',
            'createdAt',
            'updatedAt',
          ].every((k) => typeof i[k as keyof typeof i] === 'string') &&
          Array.isArray(i.impressions) &&
          i.impressions.every((s) => typeof s === 'string')
        );
      })
    );
  });
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { store: defaults, blocked: false };
    const parsed: unknown = JSON.parse(raw);
    if (!isValidStore(parsed)) throw new Error('Invalid storage schema');
    return { store: parsed, blocked: false };
  } catch {
    return { store: defaults, blocked: true };
  }
}

export function useStore() {
  const [state, setState] = useState(load);
  function commit(next: Store, allowReset = false) {
    if (state.blocked && !allowReset) return false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setState({ store: next, blocked: false });
      return true;
    } catch {
      return false;
    }
  }
  return { ...state, commit };
}

export function downloadBackup(store: Store, raw = false) {
  const data = raw
    ? (localStorage.getItem(STORAGE_KEY) ?? '{}')
    : JSON.stringify(store, null, 2);
  const url = URL.createObjectURL(
    new Blob([data], { type: 'application/json' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `offer-diary-${new Date().toISOString().slice(0, 10)}${raw ? '-raw' : ''}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
