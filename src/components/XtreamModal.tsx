import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Tv, Key, User, Globe, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Channel } from '../types';

interface XtreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportChannels: (channels: Channel[], categories: string[]) => void;
  t: any;
  language: any;
  isRtl: boolean;
}

export const XtreamModal: React.FC<XtreamModalProps> = ({
  isOpen,
  onClose,
  onImportChannels,
  t,
  language,
  isRtl
}) => {
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleServerUrlChange = (val: string) => {
    setServerUrl(val);
    
    // Auto-parse full Xtream link if user pasted one
    try {
      let trimmed = val.trim();
      if (!trimmed) return;

      // Check query params username & password
      if (trimmed.includes('username=') || trimmed.includes('password=')) {
        const urlObj = new URL(trimmed.startsWith('http') ? trimmed : 'http://' + trimmed);
        const u = urlObj.searchParams.get('username');
        const p = urlObj.searchParams.get('password');
        const base = `${urlObj.protocol}//${urlObj.host}`;
        if (u && p) {
          setServerUrl(base);
          setUsername(u);
          setPassword(p);
        }
        return;
      }

      // Check path format like /c/username/password/
      const match = trimmed.match(/^(https?:\/\/[^\/]+)\/c\/([^\/]+)\/([^\/]+)/i);
      if (match) {
        const base = match[1];
        const u = match[2];
        const p = match[3];
        setServerUrl(base);
        setUsername(u);
        setPassword(p);
        return;
      }
    } catch (e) {
      // Ignore parse errors while typing partial URL
    }
  };

  const executeLogin = async (sUrl: string, usr: string, pwd: string) => {
    if (!sUrl.trim() || !usr.trim() || !pwd.trim()) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/xtream-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl: sUrl.trim(),
          username: usr.trim(),
          password: pwd.trim()
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to authenticate with Xtream Codes server');
      }

      setSuccessMsg(language === 'English' 
        ? `Successfully connected! Loaded ${data.channels?.length || 0} channels.` 
        : `سەرکەوتوو بوو! ${data.channels?.length || 0} کەناڵ بارکران.`);

      try {
        localStorage.setItem('amedi_xtream_config', JSON.stringify({
          serverUrl: sUrl.trim(),
          username: usr.trim(),
          password: pwd.trim()
        }));
      } catch (err) {}

      if (data.channels && data.channels.length > 0) {
        onImportChannels(data.channels, data.categories || []);
      }

      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 1500);

    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Connection error');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(serverUrl, username, password);
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
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner">
                <Tv className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">{language === 'English' ? 'Xtream Codes API' : 'إضافة اشتراك Xtream'}</h2>
                <p className="text-xs text-white/50">{language === 'English' ? 'Connect your IPTV playlist with Server URL, Username & Password' : 'ربط قائمة IPTV الخاصة بك'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {successMsg ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 flex flex-col items-center justify-center text-center gap-4 relative z-10"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-white">{successMsg}</h3>
            </motion.div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4 relative z-10">
              {error && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-orange-400" />
                  {language === 'English' ? 'Server URL (e.g. http://provider.com:8080)' : 'رابط الخادم (Server URL)'} *
                </label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => handleServerUrlChange(e.target.value)}
                  placeholder="http://line.provider.com:8080"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-white/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-accent" />
                  {language === 'English' ? 'Username' : 'اسم المستخدم (Username)'} *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder:text-white/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  {language === 'English' ? 'Password' : 'كلمة المرور (Password)'} *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-white/20"
                />
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
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === 'English' ? 'Connecting...' : 'جاري الاتصال...'}</span>
                    </>
                  ) : (
                    <>
                      <Tv className="w-4 h-4" />
                      <span>{language === 'English' ? 'Connect Xtream' : 'اتصال'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
