import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Link, Tv, CheckCircle, AlertCircle } from 'lucide-react';
import { Channel, Category, Language } from '../types';

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChannel: (channel: Channel) => void;
  t: any;
  language: Language;
  isRtl: boolean;
}

const AVAILABLE_CATEGORIES: Category[] = [
  'General', 'News', 'Sports', 'Kurdish', 'Arabic', 'Music', 'Radio', 'Islamic', 'Kids', 'Drama', 'Badini'
];

export const AddChannelModal: React.FC<AddChannelModalProps> = ({
  isOpen,
  onClose,
  onAddChannel,
  t,
  language,
  isRtl
}) => {
  const [name, setName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('General');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !streamUrl.trim()) {
      setError(t.validationError || 'Please fill in required fields');
      return;
    }

    const newChannel: Channel = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      streamUrl: streamUrl.trim(),
      logo: logoUrl.trim() || 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&q=80&w=200',
      categories: [selectedCategory],
      description: `Custom user-added stream link: ${name}`
    };

    onAddChannel(newChannel);
    setSuccess(true);
    setError('');
    setTimeout(() => {
      setSuccess(false);
      setName('');
      setStreamUrl('');
      setLogoUrl('');
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-[#140f24] border border-white/10 rounded-[32px] p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-brand-accent shadow-inner">
                <Link className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">{t.addChannel || 'Add Custom Link'}</h2>
                <p className="text-xs text-white/50">{t.addChannelDesc || 'Add any HLS, m3u8, video, or stream link'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 flex flex-col items-center justify-center text-center gap-4 relative z-10"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-white">{t.addedSuccess || 'Channel added successfully!'}</h3>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              {error && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
                  {t.channelName || 'Channel / Link Name'} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My Custom TV / Live Stream"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder:text-white/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
                  {t.streamUrl || 'Stream URL (.m3u8, HLS, MP4)'} *
                </label>
                <input
                  type="url"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="https://example.com/stream/index.m3u8"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder:text-white/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
                  {t.logoUrl || 'Logo Image URL (Optional)'}
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder:text-white/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
                  {t.selectCategories || 'Category'}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as Category)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                >
                  {AVAILABLE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#140f24] text-white">
                      {t[`category${cat}`] || cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs uppercase tracking-widest transition-all"
                >
                  {t.close || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-2xl bg-brand-accent hover:bg-brand-accent/90 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-brand-accent/25 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t.addChannel || 'Add Link'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
