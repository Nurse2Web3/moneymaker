import { useState, useEffect } from 'react';
import { useSavedItems, type SavedItemType } from '../lib/savedItems';

interface SaveButtonProps {
  type: SavedItemType;
  label: string;
  content: string;
  meta?: string;
  size?: 'sm' | 'md';
}

export default function SaveButton({ type, label, content, meta, size = 'sm' }: SaveButtonProps) {
  const { toggleSave, isSaved } = useSavedItems();
  const [saved, setSaved] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setSaved(isSaved(content, type));
  }, [content, type, isSaved]);

  function handle() {
    toggleSave({ type, label, content, meta });
    const nowSaved = !saved;
    setSaved(nowSaved);
    if (nowSaved) {
      setFlash(true);
      setTimeout(() => setFlash(false), 1200);
    }
  }

  const isSmall = size === 'sm';

  return (
    <button
      onClick={handle}
      title={saved ? 'Remove from saved' : 'Save to dashboard'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: isSmall ? 4 : 6,
        padding: isSmall ? '4px 10px' : '6px 14px',
        borderRadius: isSmall ? 6 : 8,
        fontSize: isSmall ? 12 : 13,
        fontWeight: 600,
        background: saved ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${saved ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)'}`,
        color: saved ? '#a78bfa' : 'rgba(255,255,255,0.5)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        transform: flash ? 'scale(1.08)' : 'scale(1)',
        flexShrink: 0,
      }}
    >
      <svg width={isSmall ? 11 : 13} height={isSmall ? 13 : 15} viewBox="0 0 12 15" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 1h10v13l-5-3.5L1 14V1z" />
      </svg>
      {flash ? 'Saved!' : saved ? 'Saved' : 'Save'}
    </button>
  );
}
