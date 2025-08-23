import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TfiLayoutGrid2 } from 'react-icons/tfi';
import { FaChevronDown, FaSearch } from 'react-icons/fa';

export default function CategoryDropdown({ categories = [], onSelect, label = 'Danh mục' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focusIndex, setFocusIndex] = useState(0);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => String(c.name || '').toLowerCase().includes(q));
  }, [categories, query]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIndex((i) => Math.min(i + 1, filtered.length)); // include "Tất cả" index 0
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        // focusIndex 0 -> Tất cả, otherwise filtered[focusIndex-1]
        if (focusIndex === 0) {
          handleSelectAll();
        } else {
          const item = filtered[focusIndex - 1];
          if (item) handleSelect(item);
        }
      }
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, filtered, focusIndex]);

  const toggleOpen = () => setOpen((v) => !v);
  const handleSelect = (cat) => {
    setOpen(false);
    setQuery('');
    setFocusIndex(0);
    if (onSelect) onSelect(cat);
  };
  const handleSelectAll = () => {
    setOpen(false);
    setQuery('');
    setFocusIndex(0);
    if (onSelect) onSelect(null);
  };

  const isDisabled = !categories || categories.length === 0;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        className={`text-ink bg-primary/30 hover:bg-primary/50 flex cursor-pointer items-center gap-2 rounded-[10px] px-4 py-2 duration-200 ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !isDisabled && toggleOpen()}
      >
        <TfiLayoutGrid2 size={18} />
        <span className="text-[16px]">{label}</span>
        <FaChevronDown />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="border-primary absolute left-0 top-[calc(100%+8px)] z-30 w-[280px] rounded-xl border bg-white p-2 shadow-md"
          role="listbox"
          tabIndex={-1}
        >
          <div className="flex items-center gap-2 rounded-lg border px-2 py-1.5">
            <FaSearch className="text-muted h-4 w-4" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setFocusIndex(0); }}
              placeholder="Tìm danh mục..."
              className="w-full bg-transparent text-sm outline-none"
              autoFocus
            />
          </div>

          <ul className="mt-2 max-h-64 space-y-1 overflow-auto pr-1">
            <li>
              <button
                className={`hover:bg-primary/20 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${focusIndex === 0 ? 'bg-primary/20' : ''}`}
                onClick={handleSelectAll}
                role="option"
                aria-selected={focusIndex === 0}
              >
                <span className="text-primary font-semibold">Tất cả</span>
              </button>
            </li>
            {filtered.map((cat, idx) => (
              <li key={cat._id || idx}>
                <button
                  className={`hover:bg-primary/20 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${focusIndex === idx + 1 ? 'bg-primary/20' : ''}`}
                  onClick={() => handleSelect(cat)}
                  role="option"
                  aria-selected={focusIndex === idx + 1}
                >
                  <span className="h-2 w-2 rounded-full bg-ink/50" />
                  <span className="text-ink">{cat.name}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="text-muted px-3 py-2 text-sm">Không tìm thấy</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
