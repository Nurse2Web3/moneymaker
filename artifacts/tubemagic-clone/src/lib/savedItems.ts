import { useState, useEffect, useCallback } from 'react';

export type SavedItemType =
  | 'script'
  | 'improved-script'
  | 'hook'
  | 'title'
  | 'idea'
  | 'niche'
  | 'description'
  | 'tags'
  | 'thumbnail'
  | 'channel-dna'
  | 'clone-idea';

export interface SavedItem {
  id: string;
  type: SavedItemType;
  label: string;
  content: string;
  meta?: string;
  savedAt: number;
  color: string;
}

export const TYPE_META: Record<SavedItemType, { label: string; icon: string; color: string }> = {
  'script':          { label: 'Script',          icon: '✦',  color: '#a78bfa' },
  'improved-script': { label: 'Improved Script', icon: '✨', color: '#c084fc' },
  'hook':            { label: 'Hook',             icon: '🎣', color: '#f59e0b' },
  'title':           { label: 'Title',            icon: '✏️', color: '#60a5fa' },
  'idea':            { label: 'Idea',             icon: '💡', color: '#34d399' },
  'niche':           { label: 'Niche',            icon: '🔬', color: '#4ade80' },
  'description':     { label: 'Description',      icon: '📄', color: '#38bdf8' },
  'tags':            { label: 'Tags',             icon: '🏷️', color: '#fb923c' },
  'thumbnail':       { label: 'Thumbnail',        icon: '🖼️', color: '#f472b6' },
  'channel-dna':     { label: 'Channel DNA',      icon: '🧬', color: '#a3e635' },
  'clone-idea':      { label: 'Clone Idea',       icon: '💡', color: '#fbbf24' },
};

const STORAGE_KEY = 'moneymaker_saved_items';

function load(): SavedItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as SavedItem[];
  } catch {
    return [];
  }
}

function persist(items: SavedItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Global event so all hook instances stay in sync
const SAVED_EVENT = 'moneymaker_saved_change';

export function useSavedItems() {
  const [items, setItems] = useState<SavedItem[]>(load);

  useEffect(() => {
    function sync() { setItems(load()); }
    window.addEventListener(SAVED_EVENT, sync);
    return () => window.removeEventListener(SAVED_EVENT, sync);
  }, []);

  const saveItem = useCallback((item: Omit<SavedItem, 'id' | 'savedAt' | 'color'>) => {
    const meta = TYPE_META[item.type];
    const newItem: SavedItem = { ...item, id: uid(), savedAt: Date.now(), color: meta.color };
    const next = [newItem, ...load()];
    persist(next);
    setItems(next);
    window.dispatchEvent(new Event(SAVED_EVENT));
  }, []);

  const removeItem = useCallback((id: string) => {
    const next = load().filter(i => i.id !== id);
    persist(next);
    setItems(next);
    window.dispatchEvent(new Event(SAVED_EVENT));
  }, []);

  const isSaved = useCallback((content: string, type: SavedItemType) => {
    return load().some(i => i.content === content && i.type === type);
  }, []);

  const toggleSave = useCallback((item: Omit<SavedItem, 'id' | 'savedAt' | 'color'>) => {
    const existing = load().find(i => i.content === item.content && i.type === item.type);
    if (existing) {
      const next = load().filter(i => i.id !== existing.id);
      persist(next);
      setItems(next);
    } else {
      const meta = TYPE_META[item.type];
      const newItem: SavedItem = { ...item, id: uid(), savedAt: Date.now(), color: meta.color };
      const next = [newItem, ...load()];
      persist(next);
      setItems(next);
    }
    window.dispatchEvent(new Event(SAVED_EVENT));
  }, []);

  return { items, saveItem, removeItem, isSaved, toggleSave };
}
