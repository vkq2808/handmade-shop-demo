import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/customAxios.js';
import ImageInput from '../../components/ImageInput.jsx';
import PromotionSlider from '../../components/PromotionSlider.jsx';
import Policies from '../../components/Policies.jsx';
import { FaArrowDown, FaArrowUp, FaTrash } from 'react-icons/fa';

export default function SettingsPage() {
  const [promotions, setPromotions] = useState([{ image: '', link: '', title: '', subtitle: '' }]);
  const [policies, setPolicies] = useState([{ title: '', description: '', icon: '' }]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/settings');
        setPromotions(res?.data?.promotions?.length ? res.data.promotions : [{ image: '', link: '', title: '', subtitle: '' }]);
        setPolicies(res?.data?.policies?.length ? res.data.policies : [{ title: '', description: '', icon: '' }]);
      } catch (e) {
        setError('Không thể tải cài đặt');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addPromotion = () => setPromotions((arr) => [...arr, { image: '', link: '', title: '', subtitle: '' }]);
  const removePromotion = (i) => setPromotions((arr) => arr.filter((_, idx) => idx !== i));
  const updatePromotion = (i, key, value) => setPromotions((arr) => arr.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));

  const addPolicy = () => setPolicies((arr) => [...arr, { title: '', description: '', icon: '' }]);
  const removePolicy = (i) => setPolicies((arr) => arr.filter((_, idx) => idx !== i));
  const updatePolicy = (i, key, value) => setPolicies((arr) => arr.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.put('/settings', { promotions, policies });
      setMessage('Đã lưu thay đổi');
    } catch (e) {
      setError('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const isUrl = (s) => typeof s === 'string' && (/^https?:\/\//.test(s) || s.startsWith('/uploads/'));

  const canMoveUp = (i) => i > 0;
  const canMoveDown = (i, len) => i < len - 1;
  const movePromotion = (i, dir) => {
    setPromotions((arr) => {
      const next = [...arr];
      const j = dir === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= next.length) return arr;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const previewPromotions = useMemo(() => promotions.filter((p) => p?.image), [promotions]);
  const previewPolicies = useMemo(() => policies.filter((p) => p?.title || p?.description || p?.icon), [policies]);

  if (loading) return <div className="p-4">Đang tải cài đặt...</div>;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-ink text-2xl font-bold">Cài đặt công khai</h1>
        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </div>
      </div>
      {error && <div className="mb-3 rounded bg-red-100 p-2 text-red-700">{error}</div>}
      {message && <div className="mb-3 rounded bg-green-100 p-2 text-green-700">{message}</div>}

      {/* Live preview */}
      <section className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-ink text-lg font-semibold">Xem trước</h2>
        </div>
        <div className="card-handmade p-3">
          <PromotionSlider promotions={previewPromotions} handleNavigate={() => { }} />
          <div className="mt-4">
            <Policies policies={previewPolicies} />
          </div>
        </div>
      </section>

      {/* Promotions */}
      <section className="mb-10">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-ink text-lg font-semibold">Promotions</h2>
          <button className="btn-primary" onClick={addPromotion}>Thêm banner</button>
        </div>
        <div className="space-y-4">
          {promotions.map((p, i) => (
            <div key={i} className="card-handmade p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-4">
                  <ImageInput
                    label={`Ảnh banner #${i + 1}`}
                    multiple={false}
                    value={p.image}
                    onChange={(v) => updatePromotion(i, 'image', v)}
                    helper="Nhập URL hoặc tải ảnh lên"
                  />
                </div>
                <div className="md:col-span-8 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="flex flex-col">
                    <label className="mb-1 block text-sm">Link khi bấm</label>
                    <input className="input" placeholder="https://... hoặc /products" value={p.link} onChange={(e) => updatePromotion(i, 'link', e.target.value)} />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-1 block text-sm">Tiêu đề (tùy chọn)</label>
                    <input className="input" placeholder="Ví dụ: Ưu đãi mùa này" value={p.title} onChange={(e) => updatePromotion(i, 'title', e.target.value)} />
                  </div>
                  <div className="md:col-span-2 flex flex-col">
                    <label className="mb-1 block text-sm">Phụ đề (tùy chọn)</label>
                    <input className="input" placeholder="Mô tả ngắn đi kèm" value={p.subtitle} onChange={(e) => updatePromotion(i, 'subtitle', e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 md:col-span-2 justify-end">
                    <button className="btn-outline" onClick={() => removePromotion(i)} title="Xoá"><FaTrash /></button>
                    <button className="btn-outline" onClick={() => movePromotion(i, 'up')} disabled={!canMoveUp(i)} title="Lên"><FaArrowUp /></button>
                    <button className="btn-outline" onClick={() => movePromotion(i, 'down')} disabled={!canMoveDown(i, promotions.length)} title="Xuống"><FaArrowDown /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Policies */}
      <section className="mb-12">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-ink text-lg font-semibold">Policies</h2>
          <button className="btn-primary" onClick={addPolicy}>Thêm chính sách</button>
        </div>
        <div className="space-y-3">
          {policies.map((p, i) => (
            <div key={i} className="card-handmade p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="md:col-span-1 flex items-center justify-center">
                  {isUrl(p.icon) ? (
                    <img src={p.icon} alt="icon" className="h-10 w-10 rounded object-cover border bg-white" />
                  ) : (
                    <span className="text-2xl" aria-hidden>{p.icon || '✅'}</span>
                  )}
                </div>
                <div className="md:col-span-11 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input className="input" placeholder="Tiêu đề" value={p.title} onChange={(e) => updatePolicy(i, 'title', e.target.value)} />
                  <input className="input" placeholder="Mô tả" value={p.description} onChange={(e) => updatePolicy(i, 'description', e.target.value)} />
                  <input className="input" placeholder="Icon (emoji hoặc URL)" value={p.icon} onChange={(e) => updatePolicy(i, 'icon', e.target.value)} />
                </div>
                <div className="md:col-span-12 mt-2 text-right">
                  <button className="btn-outline" onClick={() => removePolicy(i)}>Xoá</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="sticky bottom-4 flex justify-end">
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
      </div>
    </div>
  );
}
