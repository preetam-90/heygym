'use client';

import { useSyncExternalStore } from 'react';

const KEY = 'heygym-compare';
const MAX = 4;

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): string[] {
  if (typeof window === 'undefined') return ['iron-fortress', 'kuro-athletics'];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return ['iron-fortress', 'kuro-athletics'];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : ['iron-fortress', 'kuro-athletics'];
  } catch {
    return ['iron-fortress', 'kuro-athletics'];
  }
}

let cache: string[] | null = null;

function getSnapshot(): string[] {
  if (!cache) cache = read();
  return cache;
}

function emit() {
  cache = read();
  listeners.forEach((l) => l());
}

export function subscribeCompare(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCompareSnapshot() {
  return getSnapshot();
}

export function useCompareSlugs(): string[] {
  return useSyncExternalStore(subscribeCompare, getCompareSnapshot, () => ['iron-fortress', 'kuro-athletics']);
}

export function useCompareCount(): number {
  return useCompareSlugs().length;
}

export function isCompared(slug: string): boolean {
  return getSnapshot().includes(slug);
}

export function toggleCompare(slug: string): string[] {
  const current = read();
  const next = current.includes(slug)
    ? current.filter((s) => s !== slug)
    : [...current, slug].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  emit();
  return next;
}

export function clearCompare() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([]));
  } catch {
    /* storage unavailable */
  }
  emit();
}

export const COMPARE_MAX = MAX;
