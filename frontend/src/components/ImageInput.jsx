import React, { useMemo, useRef, useState } from 'react';
import { FaUpload } from 'react-icons/fa';
import api, { API_BASE_URL } from '../utils/customAxios.js';

function toPreviewUrl(u) {
  if (!u) return u;
  if (u.startsWith('/uploads/')) {
    const base = API_BASE_URL.replace(/\/api$/, '');
    return base + u;
  }
  return u;
}

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string')
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

function toValue(list) {
  return Array.from(new Set((list || []).filter(Boolean))).join(', ');
}

function extractUrlsFromUpload(data) {
  const urls = new Set();
  const push = (x) => {
    if (x) urls.add(x);
  };
  if (!data) return [];
  if (Array.isArray(data?.paths) && data.paths.length) {
    data.paths.forEach((x) => push(x));
    return Array.from(urls);
  }
  if (Array.isArray(data?.files) && data.files.length) {
    data.files.forEach((f) => push(f?.path || f?.url));
  } else if (Array.isArray(data)) {
    for (const it of data) {
      if (typeof it === 'string') push(it);
      else if (it?.path) push(it.path);
      else if (it?.url) push(it.url);
    }
  } else {
    if (data.path) push(data.path);
    if (data.url) push(data.url);
  }
  return Array.from(urls);
}

export default function ImageInput({
  label = 'Ảnh',
  placeholder,
  multiple = true,
  value,
  onChange,
  helper,
}) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const list = useMemo(() => parseList(value), [value]);
  const count = list.length;

  const pick = () => {
    if (!uploading) fileRef.current?.click();
  };

  const handleUpload = async (files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    try {
      setUploading(true);
      const collected = [];
      // If single, only take first file
      const targets = multiple ? arr : [arr[0]];
      for (const f of targets) {
        const fd = new FormData();
        fd.append('image', f);
        const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const urls = extractUrlsFromUpload(res.data);
        if (urls.length) collected.push(...urls);
      }
      if (!collected.length) return;
      if (multiple) {
        const next = toValue([...list, ...collected]);
        onChange?.(next);
      } else {
        onChange?.(collected[0]);
      }
    } catch (e) {
      console.error('Upload error:', e);
    } finally {
      setUploading(false);
    }
  };

  const handleTextChange = (e) => {
    const v = e.target.value;
    onChange?.(v);
  };

  const clear = () => onChange?.('');

  return (
    <div>
      {label && <label className="mb-1 block text-sm">{label}{count > 0 ? ` (${count})` : ''}</label>}
      {multiple ? (
        <textarea
          className="w-full rounded border px-3 py-2"
          placeholder={placeholder || 'https://... , https://...'}
          rows={2}
          value={value || ''}
          onChange={handleTextChange}
        />
      ) : (
        <input
          className="w-full rounded border px-3 py-2"
          placeholder={placeholder || 'https://...'}
          value={Array.isArray(value) ? (parseList(value)[0] || '') : value || ''}
          onChange={handleTextChange}
        />
      )}

      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted">{helper || (multiple ? 'Nhập 1 hoặc nhiều URL, cách nhau bằng dấu phẩy.' : 'Nhập 1 URL hoặc tải ảnh.')}</p>
        {value && (
          <button type="button" className="btn-outline px-2 py-1 text-xs" onClick={clear}>Xoá ảnh</button>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div
          role="button"
          tabIndex={0}
          className={`flex items-center justify-center chip ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={pick}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !uploading) pick(); }}
          aria-disabled={uploading}
          title={multiple ? 'Thêm ảnh từ máy tính' : 'Chọn ảnh'}
        >
          <FaUpload className="text-black" />
          <span className="ml-1">Chọn ảnh</span>
        </div>
        {uploading && <span className="text-xs text-muted">Đang tải lên…</span>}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple={!!multiple}
          onChange={(e) => { handleUpload(e.target.files); e.target.value = ''; }}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {/* Previews */}
      {multiple ? (
        list.length > 0 && (
          <div className="mt-2 flex items-center gap-2 overflow-x-auto">
            {list.slice(0, 3).map((u, i) => (
              <img key={i} src={toPreviewUrl(u)} alt="preview" className="h-14 w-14 rounded border object-cover" />
            ))}
            {list.length > 3 && (
              <span className="text-xs text-muted">+{list.length - 3} nữa</span>
            )}
          </div>
        )
      ) : (
        (parseList(value)[0]) && (
          <div className="mt-2">
            <img src={toPreviewUrl(parseList(value)[0])} alt="preview" className="h-20 w-20 rounded border object-cover" />
          </div>
        )
      )}
    </div>
  );
}
