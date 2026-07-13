import { motion, AnimatePresence } from 'motion/react';
import { Clock, Settings, Search, Globe, Home, Info, X, ChevronLeft, LayoutGrid, MonitorPlay, Cast, Play, Download, Smartphone, RefreshCw, Sparkles, Bell, BellOff, Share, Compass, Plus, Tv, Megaphone, Phone, MessageCircle, Ghost, Youtube, Instagram, Music2, Key, ExternalLink, Check, Lock, CheckCircle, Shield, ShieldAlert, Server, Wifi, Trash, Trash2, Send, AlertTriangle, Mic, Trophy, Film, Star, Calendar, Minimize2, Maximize2, PictureInPicture2 } from 'lucide-react';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { Category, Language, Channel } from './types';
import { CHANNELS, CATEGORIES, MOVIES } from './data';
import { InfoModal } from './components/InfoModal';
import { SettingsModal } from './components/SettingsModal';
import { VoiceAssistant } from './components/VoiceAssistant';
import { MoviesModal } from './components/MoviesModal';
import { AddChannelModal } from './components/AddChannelModal';
import { XtreamModal } from './components/XtreamModal';

// --- Subcomponents ---

const AdBanner = ({ 
  adsConfig, 
  placement, 
  isRtl 
}: { 
  adsConfig: any, 
  placement: 'belowCategories' | 'insidePlayer', 
  isRtl: boolean 
}) => {
  if (!adsConfig || !adsConfig.adsEnabled) return null;

  const [activeIndex, setActiveIndex] = useState(0);
  const [adStyleMode, setAdStyleMode] = useState<'adsense' | 'custom'>('adsense');

  // Dynamic Google AdSense script injection
  useEffect(() => {
    if (adsConfig.adSenseEnabled && adsConfig.adSenseClientId) {
      const scriptId = 'google-adsense-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsConfig.adSenseClientId}`;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
      }
    }
  }, [adsConfig.adSenseEnabled, adsConfig.adSenseClientId]);

  // Initializing Google AdSense unit
  useEffect(() => {
    if (adsConfig.adSenseEnabled && adsConfig.adSenseClientId) {
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      } catch (err) {
        console.error('AdSense push error:', err);
      }
    }
  }, [adsConfig.adSenseEnabled, adsConfig.adSenseClientId]);

  // Handle auto ad alternating / changing modes (AdSense vs Custom Sponsors)
  useEffect(() => {
    const hasAdSense = adsConfig.adSenseEnabled && adsConfig.adSenseClientId && !adsConfig.adSenseAutoAdsEnabled && adsConfig.adSenseSlotId;
    const hasCustom = adsConfig.customBannerActive && adsConfig.customBanners && adsConfig.customBanners.length > 0;

    if (!adsConfig.autoChangeAdsEnabled || !hasAdSense || !hasCustom) {
      if (hasAdSense) {
        setAdStyleMode('adsense');
      } else {
        setAdStyleMode('custom');
      }
      return;
    }

    const intervalSec = adsConfig.autoChangeInterval || 10;
    const interval = setInterval(() => {
      setAdStyleMode(prev => prev === 'adsense' ? 'custom' : 'adsense');
    }, intervalSec * 1000);

    return () => clearInterval(interval);
  }, [
    adsConfig.adSenseEnabled,
    adsConfig.adSenseClientId,
    adsConfig.adSenseAutoAdsEnabled,
    adsConfig.adSenseSlotId,
    adsConfig.customBannerActive,
    adsConfig.customBanners?.length,
    adsConfig.autoChangeAdsEnabled,
    adsConfig.autoChangeInterval
  ]);

  // Handle custom banner carousel interval if multiple custom banners exist
  useEffect(() => {
    if (!adsConfig.customBanners || adsConfig.customBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % adsConfig.customBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [adsConfig.customBanners?.length]);

  const hasAdSense = adStyleMode === 'adsense' && adsConfig.adSenseEnabled && adsConfig.adSenseClientId && (!adsConfig.adSenseAutoAdsEnabled && adsConfig.adSenseSlotId);
  const customBanners = adsConfig.customBanners || [];
  const hasCustom = customBanners.length > 0;

  if (!hasAdSense && !hasCustom) {
    return null;
  }

  return (
    <div className={`w-full max-w-6xl mx-auto px-4 ${placement === 'insidePlayer' ? 'my-2' : 'my-4'}`}>
      <AnimatePresence mode="wait">
        {hasAdSense ? (
          <motion.div 
            key={`adsense-${placement}-${adsConfig.adSenseSlotId}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full overflow-hidden flex flex-col items-center justify-center bg-black/20 border border-white/5 rounded-2xl p-4"
          >
            <span className="text-[9px] text-brand-text-muted hover:text-white uppercase tracking-widest block mb-2 font-mono">
              Advertisement
            </span>
            <div className="w-full h-auto min-h-[90px] flex items-center justify-center">
              <ins 
                className="adsbygoogle"
                style={{ display: 'block', width: '100%', minHeight: '90px' }}
                data-ad-client={adsConfig.adSenseClientId}
                data-ad-slot={adsConfig.adSenseSlotId || ''}
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            </div>
          </motion.div>
        ) : (
          (() => {
            const currentBanner = customBanners[activeIndex] || customBanners[0];
            return (
              <motion.div 
                key={`custom-${placement}-${currentBanner.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="relative bg-gradient-to-r from-[#17102e] to-[#0f0a20] border border-white/5 rounded-[24px] overflow-hidden p-4 md:p-5 shadow-2xl flex flex-col sm:flex-row items-center gap-4 transition-all hover:border-brand-accent/30 group"
              >
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-black text-brand-text-muted hover:text-white uppercase tracking-widest border border-white/5 z-10 select-none">
                  SPONSOR
                </div>
                
                {currentBanner.image && (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-white/10 relative">
                    <img 
                      src={currentBanner.image} 
                      alt={currentBanner.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}
                
                <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <h4 className="font-black text-white text-sm md:text-base leading-snug group-hover:text-brand-accent transition-colors flex items-center gap-2">
                    {currentBanner.title}
                    <Sparkles className="w-4 h-4 text-brand-accent shrink-0 animate-bounce" />
                  </h4>
                  <p className="text-xs text-brand-text-muted mt-1 leading-relaxed font-semibold line-clamp-2 md:line-clamp-3">
                    {currentBanner.desc}
                  </p>
                </div>

                {currentBanner.url && (
                  <a
                    href={currentBanner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3 bg-brand-accent hover:bg-purple-700 active:scale-95 text-white font-extrabold text-xs tracking-widest uppercase transition-all shadow-lg rounded-2xl flex items-center justify-center gap-2 border border-brand-accent/20 shrink-0"
                  >
                    <span>{isRtl ? 'سەردانکردن' : 'Visit Sponsor'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>
    </div>
  );
};

interface StartupAdModalProps {
  key?: string;
  adsConfig: any;
  isRtl: boolean;
  language: Language;
  onDismiss: () => void;
}

const StartupAdModal = ({ adsConfig, isRtl, language, onDismiss }: StartupAdModalProps) => {
  if (!adsConfig || !adsConfig.adsEnabled) {
    return null;
  }

  const [counter, setCounter] = useState(6);
  const [canSkip, setCanSkip] = useState(false);
  const [currentAdIndex] = useState(0);

  const adTexts: Record<Language, {
    title: string;
    supportLabel: string;
    description: string;
    skipBtn: string;
    loadingAd: string;
    sponsorTag: string;
    visitSponsor: string;
  }> = {
    English: {
      title: "AMEDI TV Sponsors",
      supportLabel: "Supporting Our App",
      description: "Enjoy dynamic regional and local entertainment. Premium ad space allows AMEDI TV to remain 100% free with top-tier stability for global Kurdish families.",
      skipBtn: "Skip Showcase",
      loadingAd: "Ad Loading...",
      sponsorTag: "EXCLUSIVELY SPONSORED",
      visitSponsor: "Explore Sponsor"
    },
    Kurdish: {
      title: "پشتگیریکەرانی ئامێدی تیڤی",
      supportLabel: "پشتگیریکردنی ئەپڵیکەیشنەکەمان",
      description: "بینەری خێرا و سروشتی پڕۆگرامە دڵخوازەکانت بە کواڵیتی بەرز بن. سپۆنسەر و ڕیکلامەکان یارمەتیدەرن کە خزمەتگوزارییەکە بە خۆڕایی و بەردەوام بمێنێتەوە.",
      skipBtn: "بازدان",
      loadingAd: "ڕیکلامەکە باردەکرێت...",
      sponsorTag: "ڕیکلامی تایبەت",
      visitSponsor: "سەردانکردنی سپۆنسەر"
    },
    Badini: {
      title: "پشتجرێن ئامێدی تیڤی",
      supportLabel: "پشتگریکرنا بەرنامێ مە",
      description: "بینەرێ خێرا و سروشتی یێ پرۆگرامێن خۆ یێن دلخواز بە ب کواڵیتییا بلند. سپۆنسەر و ڕیکلام هاریکارن کو خزمەتگوزاری ب خۆڕایی و بەردەوام بمینیت.",
      skipBtn: "بازدان",
      loadingAd: "ڕیکلام دهێتە بارکرن...",
      sponsorTag: "ڕیکلاما تایبەت",
      visitSponsor: "سەردانکرنا سپۆنسەری"
    },
    Arabic: {
      title: "رعاة أميدي تي في",
      supportLabel: "دعم تطبيقنا المجاني",
      description: "استمتع بمشاهدة جميع القنوات والأفلام مجاناً بجودة فائقة. الإعلانات والجهات الراعية تساعدنا على إبقاء الخدمة مستقرة ومتاحة للجميع.",
      skipBtn: "تخطي الإعلان",
      loadingAd: "جاري تحميل الإعلان...",
      sponsorTag: "رعاية حصرية",
      visitSponsor: "زيارة الراعي"
    }
  };

  const tAd = adTexts[language] || adTexts.English;

  useEffect(() => {
    let timer: any;
    if (counter > 0) {
      timer = setTimeout(() => setCounter(prev => prev - 1), 1000);
    } else {
      setCanSkip(true);
    }
    return () => clearTimeout(timer);
  }, [counter]);

  const customBanners = adsConfig?.customBanners || [
    {
      id: "ad-default-1",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop",
      url: "https://www.snapchat.com/add/savan10.ten?share_id=P_WZNoKBOyw&locale=en-US",
      title: "Savan Amedi Digital Hub",
      desc: "Reach thousands of direct users. Place custom advertisements, graphic sliders, and sponsored interactive notifications. Tap to get in touch!"
    }
  ];

  const activeAd = customBanners[currentAdIndex] || customBanners[0];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 120 }}
      className="w-full max-w-2xl bg-gradient-to-br from-[#161031] to-[#0a0614] border border-white/10 rounded-[32px] p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-accent/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="flex flex-row items-center justify-between border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent font-black">
            <Megaphone className="w-5 h-5 text-brand-accent animate-pulse" />
          </div>
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <p className="text-[10px] font-black uppercase text-brand-accent tracking-widest">{tAd.supportLabel}</p>
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight">{tAd.title}</h2>
          </div>
        </div>

        <button
          onClick={onDismiss}
          disabled={!canSkip}
          className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2 cursor-pointer relative ${
            canSkip
              ? 'bg-brand-accent hover:opacity-95 text-white shadow-xl shadow-brand-accent/20 active:scale-95'
              : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
          }`}
        >
          {canSkip ? (
            <>
              <span>{tAd.skipBtn}</span>
              <ChevronLeft className={`w-4 h-4 transition-transform ${isRtl ? '' : 'rotate-180'}`} />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
              <span>{counter} s</span>
            </div>
          )}
        </button>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
        {activeAd.image && (
          <div className="w-full md:w-56 h-40 md:h-56 rounded-2xl overflow-hidden shrink-0 border border-white/10 relative shadow-lg">
            <img
              src={activeAd.image}
              alt={activeAd.title}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/70 text-[9px] font-black text-white/90 uppercase tracking-widest pointer-events-none">
              {tAd.sponsorTag}
            </div>
          </div>
        )}

        <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-snug hover:text-brand-accent transition-colors flex items-center gap-2 gap-y-1 flex-wrap">
            {activeAd.title}
            <CheckCircle className="w-5 h-5 text-brand-accent shrink-0 animate-bounce" />
          </h3>
          <p className="text-sm text-brand-text-muted mt-3 leading-relaxed font-semibold">
            {activeAd.desc}
          </p>
          <p className="text-xs text-brand-text-muted/65 mt-4 italic font-medium">
            {tAd.description}
          </p>
        </div>
      </div>

      {activeAd.url && (
        <div className="relative z-10 flex flex-row gap-3 pt-4 border-t border-white/5 justify-end">
          <a
            href={activeAd.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 bg-brand-accent hover:bg-purple-700 hover:scale-[1.02] active:scale-95 text-white font-extrabold text-xs tracking-widest uppercase transition-all shadow-xl shadow-brand-accent/15 rounded-2xl flex items-center gap-2.5 border border-brand-accent/25 cursor-pointer"
          >
            <span>{tAd.visitSponsor}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </motion.div>
  );
};

const SearchBar = ({ value, onChange, placeholder, inputRef, isRtl, isTvFocused }: { value: string; onChange: (v: string) => void; placeholder: string; inputRef?: React.RefObject<HTMLInputElement>; isRtl: boolean; isTvFocused?: boolean }) => (
  <div className="w-full px-4 py-4 bg-[#0f0a1e] z-10">
    <div className="relative w-full">
      <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-brand-text-muted w-5 h-5`} />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className={`w-full bg-brand-card/50 border rounded-2xl py-3 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all text-sm ${isTvFocused ? 'ring-4 ring-purple-600 border-purple-500 bg-brand-card/85' : 'border-white/5'}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);

interface ChannelCardProps {
  id?: string;
  name: string;
  logo: string;
  onClick: () => void;
  isTvFocused?: boolean;
  chNumber?: number;
}

const ChannelCard: React.FC<ChannelCardProps> = ({ id, name, logo, onClick, isTvFocused, chNumber }) => (
  <motion.button
    id={id}
    layout
    type="button"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`w-full bg-brand-card/40 rounded-[28px] p-5 flex flex-col items-center justify-center gap-4 text-center cursor-pointer border hover:bg-brand-card/60 transition-all shadow-xl hover:scale-[1.03] outline-none duration-150 relative ${isTvFocused ? 'ring-4 ring-purple-600 bg-brand-card/80 border-purple-500/50 scale-105' : 'border-white/5 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-accent focus:bg-brand-card/85'}`}
  >
    {chNumber && (
      <span className="absolute top-4 right-4 text-[9px] font-mono font-black px-1.5 py-0.5 rounded-lg bg-black/50 border border-white/5 text-brand-text-muted select-none">
        CH {chNumber}
      </span>
    )}
    <div className={`w-20 h-20 rounded-[22px] overflow-hidden flex items-center justify-center p-1 ${isTvFocused ? 'bg-purple-900/40 border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-black/20'}`}>
      <img src={logo} alt={name} className="w-full h-full object-cover rounded-[18px]" referrerPolicy="no-referrer" />
    </div>
    <span className={`font-bold text-sm line-clamp-1 ${isTvFocused ? 'text-purple-300 font-extrabold scale-105' : 'text-white/90'}`}>{name}</span>
  </motion.button>
);



const isHlsUrl = (url: string) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  
  // Explicit HLS indicators
  if (lowerUrl.includes('.m3u8')) return true;
  if (lowerUrl.includes('.smil')) return true;
  if (lowerUrl.includes('/hls/') || lowerUrl.includes('/live/') || lowerUrl.includes('xtream')) return true;
  if (lowerUrl.includes('playlist')) return true;
  if (lowerUrl.includes('master')) return true;
  if (lowerUrl.includes('chunks.m3u8')) return true;
  if (lowerUrl.includes('karwan.tv')) return true;
  if (lowerUrl.includes('workers.dev') || lowerUrl.includes('pages.dev') || lowerUrl.includes('cloudflare') || lowerUrl.includes('vercel.app') || lowerUrl.includes('vercel')) return true;

  try {
    const urlObj = new URL(url);
    // Proxied URLs or tokens in query params
    const uParam = urlObj.searchParams.get('u') || urlObj.searchParams.get('url') || urlObj.searchParams.get('link');
    if (uParam && (uParam.toLowerCase().includes('.m3u8') || uParam.toLowerCase().includes('karwan.tv'))) return true;
    
    // Some Kurdish streams use 'hls' as a path
    if (urlObj.pathname.includes('/hls')) return true;
  } catch {
    // Fallback for non-standard URLs
  }
  
  return false;
};

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return '';
  let id = '';
  if (url.includes('youtu.be/')) {
    id = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('watch?v=')) {
    id = url.split('watch?v=')[1]?.split('&')[0];
  } else if (url.includes('embed/')) {
    id = url.split('embed/')[1]?.split('?')[0];
  }
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&rel=0` : url;
};

const MiniPlayer = ({ channel, onExpand, onClose, t, proxyConfig }: { channel: Channel, onExpand: () => void, onClose: () => void, t: any, proxyConfig: any }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isYouTube = channel.streamUrl?.includes('youtube.com') || channel.streamUrl?.includes('youtu.be');

  const resolvedUrl = useMemo(() => {
    if (!channel.streamUrl) return '';
    if (channel.streamUrl.startsWith('https://ameditv.kurdiish.workers.dev')) {
      return channel.streamUrl;
    }
    if (channel.streamUrl.startsWith('/') || channel.streamUrl.startsWith('http://localhost') || channel.streamUrl.startsWith('https://localhost')) {
      return channel.streamUrl;
    }
    if (proxyConfig && proxyConfig.proxyType === 'cloudflare') {
      let workerUrl = proxyConfig.cloudflareWorkerUrl || 'https://ameditv.kurdiish.workers.dev';
      if (workerUrl && !workerUrl.startsWith('http://') && !workerUrl.startsWith('https://')) {
        workerUrl = 'https://' + workerUrl;
      }
      try {
        const parsed = new URL(workerUrl);
        if (parsed.pathname === '/' || parsed.pathname === '') {
          workerUrl = parsed.origin + '/proxy';
        }
      } catch (e) {
        if (!workerUrl.includes('/proxy') && !workerUrl.includes('?')) {
          if (workerUrl.endsWith('/')) {
            workerUrl = workerUrl.slice(0, -1);
          }
          workerUrl = workerUrl + '/proxy';
        }
      }
      const delimiter = workerUrl.includes('?') ? '&' : '?';
      return `${workerUrl}${delimiter}url=${encodeURIComponent(channel.streamUrl)}`;
    }
    return `/api/proxy?url=${encodeURIComponent(channel.streamUrl)}`;
  }, [channel.streamUrl, proxyConfig]);

  useEffect(() => {
    if (isYouTube) return;
    let hls: Hls | null = null;
    const video = videoRef.current;
    if (video && resolvedUrl) {
      if (Hls.isSupported() && isHlsUrl(resolvedUrl)) {
        hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(resolvedUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
      } else {
        video.src = resolvedUrl;
        video.play().catch(() => {});
      }
    }
    return () => {
      if (hls) hls.destroy();
    };
  }, [resolvedUrl, isYouTube]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-24 right-6 z-50 w-80 h-48 bg-black/95 rounded-2xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-md flex flex-col group"
    >
      <div className="absolute top-0 left-0 right-0 p-2 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent opacity-90 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-white line-clamp-1">{channel.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={onExpand}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Expand Player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 w-full h-full bg-black relative flex items-center justify-center">
        {isYouTube ? (
          <iframe
            className="w-full h-full border-0 pointer-events-none"
            src={getYouTubeEmbedUrl(channel.streamUrl || '')}
            title={channel.name}
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-contain cursor-pointer"
            onClick={onExpand}
            playsInline
            autoPlay
            muted
          />
        )}
      </div>
    </motion.div>
  );
};

const PlayerView = ({ channel, onBack, onSelectChannel, onMinimizeToPip, t, allChannels, adsConfig, isRtl, proxyConfig }: { channel: Channel, onBack: () => void, onSelectChannel: (c: Channel) => void, onMinimizeToPip: (c: Channel) => void, t: any, allChannels: Channel[], adsConfig: any, isRtl: boolean, proxyConfig: { proxyType: 'local' | 'cloudflare'; cloudflareWorkerUrl: string } }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [canCast, setCanCast] = useState(false);
  const [tvFocusedChId, setTvFocusedChId] = useState<string | null>(channel.id);
  const [isPaused, setIsPaused] = useState(false);
  const [channelInputNumber, setChannelInputNumber] = useState<string>('');
  const isYouTube = channel.streamUrl?.includes('youtube.com') || channel.streamUrl?.includes('youtu.be');

  const resolvedStreamUrl = useMemo(() => {
    if (!channel.streamUrl) return '';
    if (channel.streamUrl.startsWith('https://ameditv.kurdiish.workers.dev')) {
      return channel.streamUrl;
    }
    if (channel.streamUrl.startsWith('/') || channel.streamUrl.startsWith('http://localhost') || channel.streamUrl.startsWith('https://localhost')) {
      return channel.streamUrl;
    }
    if (proxyConfig && proxyConfig.proxyType === 'cloudflare') {
      let workerUrl = proxyConfig.cloudflareWorkerUrl || 'https://ameditv.kurdiish.workers.dev';
      if (workerUrl && !workerUrl.startsWith('http://') && !workerUrl.startsWith('https://')) {
        workerUrl = 'https://' + workerUrl;
      }
      try {
        const parsed = new URL(workerUrl);
        if (parsed.pathname === '/' || parsed.pathname === '') {
          workerUrl = parsed.origin + '/proxy';
        }
      } catch (e) {
        if (!workerUrl.includes('/proxy') && !workerUrl.includes('?')) {
          if (workerUrl.endsWith('/')) {
            workerUrl = workerUrl.slice(0, -1);
          }
          workerUrl = workerUrl + '/proxy';
        }
      }
      const delimiter = workerUrl.includes('?') ? '&' : '?';
      return `${workerUrl}${delimiter}url=${encodeURIComponent(channel.streamUrl)}`;
    }
    return `/api/proxy?url=${encodeURIComponent(channel.streamUrl)}`;
  }, [channel.streamUrl, proxyConfig]);

  useEffect(() => {
    setTvFocusedChId(channel.id);
  }, [channel.id]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  };

  useEffect(() => {
    if (!channelInputNumber) return;
    const delay = 1500;
    const timer = setTimeout(() => {
      const idx = parseInt(channelInputNumber, 10);
      if (!isNaN(idx) && idx >= 1 && idx <= allChannels.length) {
        onSelectChannel(allChannels[idx - 1]);
      }
      setChannelInputNumber('');
    }, delay);
    return () => clearTimeout(timer);
  }, [channelInputNumber, allChannels, onSelectChannel]);

  useEffect(() => {
    const handlePlayerKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if typing in any text fields
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const isBackKey = ['Backspace', 'Escape', 'Esc', 'BrowserBack', 'XF86Back', 'GoBack'].includes(e.key);
      const isEnterKey = ['Enter', 'OK', 'Select'].includes(e.key);
      const isArrowLeft = ['ArrowLeft', 'Left'].includes(e.key);
      const isArrowRight = ['ArrowRight', 'Right'].includes(e.key);
      const isArrowUp = ['ArrowUp', 'Up'].includes(e.key);
      const isArrowDown = ['ArrowDown', 'Down'].includes(e.key);
      const isPlayPauseKey = [' ', 'Spacebar', 'Play', 'Pause', 'MediaPlay', 'MediaPause', 'MediaPlayPause'].includes(e.key);
      const isChannelUp = ['ChannelUp', 'ChannelUpKey'].includes(e.key);
      const isChannelDown = ['ChannelDown', 'ChannelDownKey'].includes(e.key);
      const isDigit = /^[0-9]$/.test(e.key);

      if (
        !isBackKey && !isEnterKey && !isArrowLeft && !isArrowRight && 
        !isArrowUp && !isArrowDown && !isPlayPauseKey && !isChannelUp && 
        !isChannelDown && !isDigit
      ) {
        return; // normal keys
      }

      e.preventDefault();

      if (isBackKey) {
        onBack();
        return;
      }

      if (isPlayPauseKey) {
        togglePlay();
        return;
      }

      if (isDigit) {
        setChannelInputNumber(prev => (prev.length < 4 ? prev + e.key : prev));
        return;
      }

      const currentIndex = allChannels.findIndex(c => c.id === (tvFocusedChId || channel.id));
      if (currentIndex === -1) return;

      if (isArrowLeft || isChannelDown) {
        const prevIdx = currentIndex === 0 ? allChannels.length - 1 : currentIndex - 1;
        onSelectChannel(allChannels[prevIdx]);
        return;
      }

      if (isArrowRight || isChannelUp) {
        const nextIdx = currentIndex === allChannels.length - 1 ? 0 : currentIndex + 1;
        onSelectChannel(allChannels[nextIdx]);
        return;
      }

      if (isArrowUp) {
        const prevIdx = currentIndex === 0 ? allChannels.length - 1 : currentIndex - 1;
        setTvFocusedChId(allChannels[prevIdx].id);
        const el = document.getElementById(`ch-btn-${allChannels[prevIdx].id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      if (isArrowDown) {
        const nextIdx = currentIndex === allChannels.length - 1 ? 0 : currentIndex + 1;
        const activeId = nextIdx === -1 ? allChannels[0].id : allChannels[nextIdx].id;
        setTvFocusedChId(activeId);
        const el = document.getElementById(`ch-btn-${activeId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      if (isEnterKey) {
        const focusedCh = allChannels.find(c => c.id === tvFocusedChId);
        if (focusedCh) {
          onSelectChannel(focusedCh);
        }
        return;
      }
    };

    window.addEventListener('keydown', handlePlayerKeyDown);
    return () => window.removeEventListener('keydown', handlePlayerKeyDown);
  }, [channel, allChannels, tvFocusedChId, onSelectChannel, onBack]);



  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const isRemoteSupported = !!((video as any).remote || (video as any).webkitShowPlaybackTargetPicker);
      setCanCast(isRemoteSupported);

      if ((video as any).remote && typeof (video as any).remote.watchAvailability === 'function') {
        (video as any).remote.watchAvailability((available: boolean) => {
          if (available) setCanCast(true);
        }).catch(() => {});
      }
    }
  }, [channel.id]);

  const handleCast = async () => {
    const video = videoRef.current;
    if (!video) return;

    if ((video as any).remote) {
      try {
        await (video as any).remote.prompt();
      } catch (err: any) {
        // Silently handle invalid state or dismissed prompts
      }
    } else if ((video as any).webkitShowPlaybackTargetPicker) {
      try {
        (video as any).webkitShowPlaybackTargetPicker();
      } catch (err: any) {}
    }
  };



  useEffect(() => {
    if (isYouTube) return;
    let hls: Hls | null = null;
    const video = videoRef.current;
    setError(null);
    
    if (video && resolvedStreamUrl) {
      const isHls = isHlsUrl(channel.streamUrl);

      if (isHls) {
        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
            autoStartLoad: true,
            debug: false
          });
          
          hls.loadSource(resolvedStreamUrl);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });
          
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                   hls?.startLoad();
                   break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                   hls?.recoverMediaError();
                   break;
                default:
                   hls?.destroy();
                   setError("playbackError");
                   break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = resolvedStreamUrl;
          video.addEventListener('loadedmetadata', () => {
            video.play().catch(() => {});
          });
          video.onerror = () => setError("playbackError");
        }
      } else {
        video.src = resolvedStreamUrl;
        video.onplay = () => setError(null);
        video.onerror = () => setError("playbackError");
      }

      return () => {
        if (hls) hls.destroy();
        video.src = '';
        video.load();
      };
    }
  }, [resolvedStreamUrl, refreshKey]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="fixed inset-0 z-[60] bg-brand-bg flex flex-col md:flex-row"
    >
      <div 
        className="flex-1 flex flex-col h-full bg-black relative select-none"
      >
        {/* Top Header Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ms-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-4 focus:ring-brand-accent focus:bg-white/15 outline-none">
              <ChevronLeft className="w-6 h-6 text-white rtl:rotate-180" />
            </button>
            <div className="flex flex-col">
              <h1 className="font-bold text-sm leading-tight line-clamp-1 text-white">{channel.name}</h1>
              <div className="flex items-center gap-1.5 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[10px] uppercase font-black tracking-widest text-white/45">{t.liveNow}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const video = videoRef.current;
                if (!video) return;
                if (typeof (video as any).webkitShowPlaybackTargetPicker === 'function') {
                  (video as any).webkitShowPlaybackTargetPicker();
                } else {
                  handleCast();
                }
              }}
              className="p-2 rounded-full hover:bg-white/5 transition-all focus:outline-none focus:ring-4 focus:ring-brand-accent focus:bg-white/10 outline-none flex items-center gap-1.5 px-3 bg-white/10 border border-white/15 text-white"
              title={t.airPlayDevice}
            >
              <Tv className="w-4 h-4 text-brand-accent" />
              <span className="text-xs font-bold hidden sm:inline">AirPlay</span>
            </button>
            <button 
              onClick={() => {
                if (onMinimizeToPip) onMinimizeToPip(channel);
              }}
              className="p-2 rounded-full hover:bg-white/5 transition-all focus:outline-none focus:ring-4 focus:ring-brand-accent focus:bg-white/10 outline-none flex items-center gap-1.5 px-3 bg-white/10 border border-white/15 text-white"
              title={t.pip || 'Picture-in-Picture'}
            >
              <PictureInPicture2 className="w-4 h-4 text-brand-accent" />
              <span className="text-xs font-bold hidden sm:inline">PiP</span>
            </button>
            <button 
              onClick={handleCast}
              className={`p-2 rounded-full hover:bg-white/5 transition-all focus:outline-none focus:ring-4 focus:ring-brand-accent focus:bg-white/10 outline-none ${canCast ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}
              title={t.castDevice}
            >
              <Cast className="w-5 h-5 text-white animate-pulse" style={{ animationDuration: '3s' }} />
            </button>
            <button onClick={onBack} className="p-2 rounded-full hover:bg-white/5 ms-2 focus:outline-none focus:ring-4 focus:ring-brand-accent focus:bg-white/10 outline-none text-white"><X className="w-6 h-6" /></button>
          </div>
        </div>



        {/* Video Player Display */}
        <div className="flex-1 flex items-center justify-center relative group/player w-full h-full bg-black">

          {isYouTube ? (
            <div className="absolute inset-0 w-full h-full bg-black z-20">
              <iframe
                className="w-full h-full border-0"
                src={getYouTubeEmbedUrl(channel.streamUrl || '')}
                title={channel.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <video 
              ref={videoRef}
              className="w-full h-full object-contain" 
              controls 
              playsInline
              autoPlay
              onPlay={() => setIsPaused(false)}
              onPause={() => setIsPaused(true)}
              {...{ 
                "x-webkit-airplay": "allow",
                "disableRemotePlayback": false 
              }}
            />
          )}

          {channelInputNumber && (
            <div className="absolute top-24 right-8 bg-brand-accent/95 text-white font-black text-4xl px-7 py-4 rounded-[24px] border border-white/20 shadow-2xl animate-bounce backdrop-blur-md z-50 flex items-center gap-4">
              <Tv className="w-9 h-9 text-white animate-pulse" />
              <span>{channelInputNumber}</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center gap-4 p-6 text-center z-10">
              <MonitorPlay className="w-12 h-12 text-brand-accent animate-pulse" />
              <p className="text-sm font-medium text-white/80">{t[error] || error}</p>
              <div className="flex flex-row gap-2">
                <button 
                  onClick={() => setRefreshKey(prev => prev + 1)}
                  className="mt-2 px-6 py-2 bg-brand-accent text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-brand-accent/20"
                >
                  {t.reconnect}
                </button>
                <a 
                  href={channel.streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 px-6 py-2 bg-yellow-500 text-black rounded-full text-xs font-bold uppercase tracking-widest shadow-xl flex items-center gap-2"
                >
                  {t.openLink}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full md:w-80 h-1/2 md:h-full bg-brand-bg border-s border-white/5 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-xs font-black uppercase tracking-widest text-brand-text-muted">{t.allChannels}</h2>
        </div>

        <AdBanner adsConfig={adsConfig} placement="insidePlayer" isRtl={isRtl} />

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
          {allChannels.map((ch) => {
            const chGlobalIdx = allChannels.findIndex(c => c.id === ch.id) + 1;
            return (
              <button
                key={ch.id}
                id={`ch-btn-${ch.id}`}
                onClick={() => onSelectChannel(ch)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border outline-none ${
                  ch.id === channel.id 
                    ? 'bg-brand-accent/20 border-brand-accent/40 scale-[1.02]' 
                    : 'bg-brand-card/30 border-transparent hover:bg-brand-card/50'
                } ${ch.id === tvFocusedChId ? 'ring-4 ring-purple-600 border-purple-500 bg-brand-accent/15 scale-[1.02]' : 'focus:outline-none focus:ring-4 focus:ring-brand-accent focus:bg-brand-card/70 focus:scale-[1.02] focus:border-brand-accent/50'}`}
              >
                <img src={ch.logo} alt={ch.name} className="w-10 h-10 rounded-xl object-cover bg-black/20" referrerPolicy="no-referrer" />
                <div className="flex-1 text-start flex items-center justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <div className={`font-bold text-xs truncate ${ch.id === channel.id ? 'text-brand-accent' : 'text-white'}`}>{ch.name}</div>
                    <div className="text-[10px] text-brand-text-muted truncate">
                       {ch.categories.map(cat => t[`category${cat}`] || cat).join(', ')}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono select-none font-black text-white/30 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded-lg shrink-0">
                    CH {chGlobalIdx}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// --- Modals ---









// --- PWA Installation Guide Modal ---
const PwaInstallModal = ({ isOpen, onClose, t, isIos, language }: { isOpen: boolean; onClose: () => void; t: any; isIos: boolean; language: Language }) => {
  const isRtl = language === 'Kurdish' || language === 'Badini' || language === 'Arabic';
  const [selectedPlatform, setSelectedPlatform] = useState<'ios' | 'android_pc' | 'tv'>(isIos ? 'ios' : 'android_pc');

  const getIosSteps = () => {
    switch (language) {
      case 'Kurdish':
        return [
          { icon: <Compass className="w-4 h-4 text-sky-400" />, text: 'گەڕۆکی سەکۆیی نیشتمانی Safari بکەرەوە بۆ ئەم ماڵپەڕە (تەنها Safari پشتگیری دەکات).' },
          { icon: <Share className="w-4 h-4 text-brand-accent animate-pulse" />, text: 'دوگمەی Share (هاوبەشکردن) لە ژێرەوە یان لە ڕیزبەندی سەرەوە دابگرە.' },
          { icon: <Plus className="w-4 h-4 text-green-400" />, text: 'بڕۆ خوارەوە و بژاردەی "Add to Home Screen" (زیادکردن بۆ ڕوونمای سەرەکی) هەڵبژێرە.' },
          { icon: <Smartphone className="w-4 h-4 text-purple-400" />, text: 'دوگمەی "Add" (زیادکردن) لە لای سەرەوەی ڕاست دابگرە بۆ تەواوکردنی دابەزاندن.' }
        ];
      case 'Badini':
        return [
          { icon: <Compass className="w-4 h-4 text-sky-400" />, text: 'گەڕۆکێ سەکۆیی Safari ڤەکە بۆ ڤی مالپەری (تەنیا Safari پشتگیری دکەت).' },
          { icon: <Share className="w-4 h-4 text-brand-accent animate-pulse" />, text: 'ل سەر دوگمەیا Share (بەلاڤکرن) ل خوارێ یان ل سەرێ کلیک بکە.' },
          { icon: <Plus className="w-4 h-4 text-green-400" />, text: 'بچە خوارێ و بژاردەیا "Add to Home Screen" هەلبژێرە.' },
          { icon: <Smartphone className="w-4 h-4 text-purple-400" />, text: 'دوگمەیا "Add" ل لایێ سەرێ لایێ ڕاستێ دابگرە بۆ تەمامکرنێ.' }
        ];
      case 'Arabic':
        return [
          { icon: <Compass className="w-4 h-4 text-sky-400" />, text: 'افتح هذا الموقع في متصفّح Safari (سفاري) حصرياً.' },
          { icon: <Share className="w-4 h-4 text-brand-accent animate-pulse" />, text: 'اضغط على زر المشاركة (Share) في شريط المتصفح السفلي أو العلوي.' },
          { icon: <Plus className="w-4 h-4 text-green-400" />, text: 'مرر لأسفل وانقر على خيار "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).' },
          { icon: <Smartphone className="w-4 h-4 text-purple-400" />, text: 'اضغط على زر "إضافة" (Add) في الزاوية العلوية اليمنى لإتمام التثبيت.' }
        ];
      default:
        return [
          { icon: <Compass className="w-4 h-4 text-sky-400" />, text: 'Open this app in the Safari browser (only Safari supports iOS PWA install).' },
          { icon: <Share className="w-4 h-4 text-brand-accent animate-pulse" />, text: 'Tap the Share button in the browser control bar.' },
          { icon: <Plus className="w-4 h-4 text-green-400" />, text: 'Scroll down and select the option "Add to Home Screen".' },
          { icon: <Smartphone className="w-4 h-4 text-purple-400" />, text: 'Tap the "Add" button in the top-right corner to complete installation.' }
        ];
    }
  };

  const getTvSteps = () => {
    switch (language) {
      case 'Kurdish':
        return [
          { icon: <Tv className="w-4 h-4 text-orange-400" />, text: 'گەڕۆکێک لەسەر تەلەفزیۆنەکەت بکەرەوە (Downloader، TV Bro یان BrowseHere).' },
          { icon: <Globe className="w-4 h-4 text-sky-400 animate-pulse" />, text: 'ناونیشانی ماڵپەڕەکە بنووسە: ameditv.com' },
          { icon: <Plus className="w-4 h-4 text-green-400" />, text: 'لاپەڕەکە زیادبکە بۆ پەڕەی دڵخواز (Bookmarks) یان ڕوونمای سەرەکی بۆ چوونەژوورەوەی خێرا.' }
        ];
      case 'Badini':
        return [
          { icon: <Tv className="w-4 h-4 text-orange-400" />, text: 'گەڕۆکەک ل سەر تەلەفزیۆنا خۆ ڤەکە (Downloader، TV Bro یان BrowseHere).' },
          { icon: <Globe className="w-4 h-4 text-sky-400 animate-pulse" />, text: 'ناڤونیشانێ مالپەری بنڤیسە: ameditv.com' },
          { icon: <Plus className="w-4 h-4 text-green-400" />, text: 'لاپەرێ زێدە بکە بۆ پەرتووکدۆست (Bookmarks) یان شاشەیا سەرەکی بۆ هاتنا بلەز.' }
        ];
      case 'Arabic':
        return [
          { icon: <Tv className="w-4 h-4 text-orange-400" />, text: 'افتح متصفح الويب على جهاز التلفاز الذكي الخاص بك (مثل Downloader أو TV Bro).' },
          { icon: <Globe className="w-4 h-4 text-sky-400 animate-pulse" />, text: 'أدخل رابط كود الموقع الإلكتروني: ameditv.com' },
          { icon: <Plus className="w-4 h-4 text-green-400" />, text: 'أضف الصفحة إلى المفضلة (Bookmarks) أو الشاشة الرئيسية للتلفاز للوصول السريع مستقبلاً.' }
        ];
      default:
        return [
          { icon: <Tv className="w-4 h-4 text-orange-400" />, text: 'Open any web browser on your Smart TV (e.g. Downloader, TV Bro, BrowseHere).' },
          { icon: <Globe className="w-4 h-4 text-sky-400 animate-pulse" />, text: 'Navigate to this website: ameditv.com' },
          { icon: <Plus className="w-4 h-4 text-green-400" />, text: 'Add the page to your Bookmarks or speed dial for instant remote control lookup.' }
        ];
    }
  };

  const getAndroidPcSteps = () => {
    switch (language) {
      case 'Kurdish':
        return [
          { icon: <Download className="w-4 h-4 text-emerald-400" />, text: "فایلی APK فەرمی دابەزێنە لە ڕێگەی دوگمەی دابەزاندنی ژێرەوە (زۆر پێشنیارکراوە)." },
          { icon: <Plus className="w-4 h-4 text-purple-400" />, text: "یان لە ڕێگەی گەڕۆکی Chrome بژاردەی 'Install app' یان 'Add to Home screen' هەڵبژێرە." }
        ];
      case 'Badini':
        return [
          { icon: <Download className="w-4 h-4 text-emerald-400" />, text: "فایلی APK فەرمی دابەزینە ب ڕێکا دوگمەیا داگرتنێ ل خوارێ (گەلەک پێشنیارکریە)." },
          { icon: <Plus className="w-4 h-4 text-purple-400" />, text: "یان ب ڕێکا گەڕۆکێ Chrome بژاردەیا 'Install app' یان 'Add to Home screen' هەلبژێرە." }
        ];
      case 'Arabic':
        return [
          { icon: <Download className="w-4 h-4 text-emerald-400" />, text: "قم بتحميل ملف APK الرسمي مباشرة من زر التحميل بالأسفل (موصى به بشدة)." },
          { icon: <Plus className="w-4 h-4 text-purple-400" />, text: "أو من قائمة متصفح Chrome، اختر 'تثبيت التطبيق' (Install app) أو 'إضافة للشاشة الرئيسية'." }
        ];
      default:
        return [
          { icon: <Download className="w-4 h-4 text-emerald-400" />, text: "Download the official APK file directly using the download button below (Highly Recommended)." },
          { icon: <Plus className="w-4 h-4 text-purple-400" />, text: "Or open Google Chrome's menu (⋮) and click 'Install app' or 'Add to Home screen'." }
        ];
    }
  };

  const iosSteps = getIosSteps();
  const tvSteps = getTvSteps();
  const androidPcSteps = getAndroidPcSteps();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-4 m-auto h-fit glass-card rounded-[40px] z-[201] p-8 max-w-sm flex flex-col gap-6 shadow-2xl border border-white/10 text-white animate-none animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Download className="w-5 h-5 text-brand-accent animate-bounce" />
                {t.installApp}
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex flex-col gap-4 text-center items-center py-2">
              <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl border border-white/15 p-1 bg-[#1a1433] flex items-center justify-center">
                <img 
                  src="https://i.postimg.cc/QxGcmFd3/file-0000000004b47246b78b315ac6479e1d.png" 
                  alt="AMEDI TV Logo" 
                  className="w-full h-full object-cover rounded-2xl" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-sm font-semibold text-white/85 max-w-xs">{t.installAppDesc}</div>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex gap-1 p-1 bg-white/5 border border-white/5 rounded-2xl w-full">
              <button
                onClick={() => setSelectedPlatform('ios')}
                className={`flex-1 py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                  selectedPlatform === 'ios'
                    ? 'bg-brand-accent text-white font-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-bold">iOS</span>
              </button>
              <button
                onClick={() => setSelectedPlatform('android_pc')}
                className={`flex-1 py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                  selectedPlatform === 'android_pc'
                    ? 'bg-brand-accent text-white font-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-bold">Android</span>
              </button>
              <button
                onClick={() => setSelectedPlatform('tv')}
                className={`flex-1 py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                  selectedPlatform === 'tv'
                    ? 'bg-brand-accent text-white font-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-bold">TV</span>
              </button>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/5 p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-brand-accent/20 text-brand-accent flex-shrink-0">
                    {selectedPlatform === 'ios' && <Smartphone className="w-5 h-5" />}
                    {selectedPlatform === 'android_pc' && <Globe className="w-5 h-5" />}
                    {selectedPlatform === 'tv' && <Tv className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none">Device Platform</p>
                    <p className="text-[11px] font-bold text-brand-accent mt-1">
                      {selectedPlatform === 'ios' ? 'Apple iOS (iPhone/iPad)' : selectedPlatform === 'tv' ? 'Smart TV / Android TV' : 'Android'}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent flex-shrink-0">PWA</span>
              </div>

              <div className="h-px bg-white/10 w-full my-1" />

              <div className="text-xs leading-relaxed text-slate-300">
                {selectedPlatform === 'ios' ? (
                  <div className={`flex flex-col gap-3 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
                    <p className="font-black text-brand-accent text-[11px] uppercase tracking-wider mb-1">
                      {language === 'English' ? 'iOS Installation Steps:' : 'ڕێنمایی دابەزاندن بۆ ئایفۆن (iOS):'}
                    </p>
                    <div className="flex flex-col gap-2.5 font-medium">
                      {iosSteps.map((step, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start">
                          <div className="flex-shrink-0 w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/80">
                            {idx + 1}
                          </div>
                          <div className="flex gap-2 items-center flex-1">
                            <span className="flex-shrink-0 p-1 rounded bg-white/5 border border-white/5">{step.icon}</span>
                            <span className="text-[11px] leading-snug text-white/80">{step.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedPlatform === 'tv' ? (
                  <div className={`flex flex-col gap-3 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
                    <p className="font-black text-brand-accent text-[11px] uppercase tracking-wider mb-1">
                      {language === 'English' ? 'Smart TV Steps:' : 'ڕێنمایی بۆ تەلەفزیۆنی زیرەک (Smart TV):'}
                    </p>
                    <div className="flex flex-col gap-2.5 font-medium">
                      {tvSteps.map((step, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start">
                          <div className="flex-shrink-0 w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/80">
                            {idx + 1}
                          </div>
                          <div className="flex gap-2 items-center flex-1">
                            <span className="flex-shrink-0 p-1 rounded bg-white/5 border border-white/5">{step.icon}</span>
                            <span className="text-[11px] leading-snug text-white/80">{step.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={`flex flex-col gap-3 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
                    <p className="font-black text-brand-accent text-[11px] uppercase tracking-wider mb-1">
                      {language === 'English' ? 'Android Installation:' : 'ڕێنمایی دابەزاندن بۆ ئەندرۆید:'}
                    </p>
                    <div className="flex flex-col gap-2.5 font-medium">
                      {androidPcSteps.map((step, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start">
                          <div className="flex-shrink-0 w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/80">
                            {idx + 1}
                          </div>
                          <div className="flex gap-2 items-center flex-1">
                            <span className="flex-shrink-0 p-1 rounded bg-white/5 border border-white/5">{step.icon}</span>
                            <span className="text-[11px] leading-snug text-white/80">{step.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>




            {/* iOS installation via PWA is shown in the platform steps above */}

            {selectedPlatform === 'ios' && (
              <a
                href="/amedi-tv.ipa"
                download="amedi-tv.ipa"
                className="py-3.5 w-full rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs tracking-widest uppercase transition-all shadow-lg text-center flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Download className="w-4 h-4 animate-bounce" />
                {language === 'English' 
                  ? 'Download iOS IPA' 
                  : language === 'Arabic' 
                    ? 'تحميل ملف IPA للأيفون' 
                    : language === 'Badini'
                      ? 'داگرتنا فایلی IPA'
                      : 'دابەزاندنی فایلی IPA'}
              </a>
            )}

            {(selectedPlatform === 'android_pc' || selectedPlatform === 'tv') && (
              <a
                href="/amedi-tv.apk"
                download="amedi-tv.apk"
                className="py-3.5 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-widest uppercase transition-all shadow-lg text-center flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Download className="w-4 h-4 animate-bounce" />
                {language === 'English' 
                  ? 'Download APK' 
                  : language === 'Arabic' 
                    ? 'تحميل ملف APK' 
                    : language === 'Badini'
                      ? 'داگرتنا فایلی APK'
                      : 'دابەزاندنی فایلی APK'}
              </a>
            )}

            <button
              onClick={onClose}
              className="py-3.5 w-full rounded-2xl bg-brand-accent hover:bg-purple-700 text-white font-bold text-xs tracking-widest uppercase transition-all shadow-lg active:scale-[0.98]"
            >
              {t.close}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};



const LanguageModal = ({ isOpen, onClose, onSelect, t }: { isOpen: boolean; onClose: () => void; onSelect: (l: Language) => void, t: any }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] px-4 flex items-end pb-10"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 glass-card rounded-t-[40px] z-[71] p-8 max-w-lg mx-auto"
        >
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
          <h2 className="text-xl font-bold mb-6 text-center">{t.selectLanguage}</h2>
          <div className="space-y-3">
            {[
              { id: 'Kurdish', label: 'کوردی (S)', flag: '🇹🇯' },
              { id: 'Badini', label: 'بادینی', flag: '🇹🇯' },
              { id: 'Arabic', label: 'العربية', flag: '🇦🇪' },
              { id: 'English', label: 'English', flag: '🇬🇧' }
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => { onSelect(lang.id as Language); onClose(); }}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="text-start">
                    <div className="font-bold text-lg">{lang.label}</div>
                    <div className="text-xs text-brand-text-muted">{lang.id}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// --- Main App ---

const TRANSLATIONS = {
  English: {
    home: 'Home',
    language: 'Language',
    search: 'Search',
    settings: 'Settings',
    info: 'Info',
    allChannels: 'All Channels',
    noChannels: 'No channels found in this category',
    noStream: 'No stream available for this channel',
    searchPlaceholder: 'Search for channels...',
    supportMsg: 'You can support us by donating to this FIB account:',
    selectLang: 'Select Language',
    playbackError: 'Playback Error',
    reconnect: 'Reconnect',
    selectLanguage: 'Select Language',
    appTitle: 'Amedi TV',
    socialFollow: 'Snapchat',
    socialTikTok: 'TikTok',
    socialYoutube: 'YouTube',
    socialInstagram: 'Instagram',
    donorName: 'Savan Amedi',
    donorAccount: 'P7AZPUOWHQFL',
    categoryAll: 'All',
    categoryKurdish: 'Kurdish',
    categoryArabic: 'Arabic',
    categoryGeneral: 'General',
    categoryNews: 'News',
    categorySports: 'Sports',
    categoryMovies: 'Movies',
    categoryMusic: 'Music',
    categoryRadio: 'Radio',
    categoryIslamic: 'Islamic',
    categoryKids: 'Kids',
    categoryBadini: 'Badini',
    liveNow: 'Live Now',
    liveMatchesNav: 'Matches',
    openLink: 'Open Link',
    welcomeDesc: 'Welcome to Amedi TV to watch live Kurdish, International, Arabic, and Sports channels',
    initializing: 'Initializing',
    networkOnline: 'Network Online',
    initializingServer: 'Initializing Server...',
    castDevice: 'Cast to device',
    airPlay: 'AirPlay',
    airPlayDevice: 'AirPlay to Apple TV',
    installApp: 'Install App',
    installAppDesc: 'Install Amedi TV app on your device for a fast and smooth experience.',
    installInstructions: 'To install this app on an iOS device (iPhone), tap the Share button in Safari, then select "Add to Home Screen".',
    close: 'Close',
    addChannel: 'Add Channel',
    addChannelDesc: 'Add a new Kurdish or international TV channel.',
    channelName: 'Channel Name',
    streamUrl: 'Stream URL (HLS .m3u8)',
    logoUrl: 'Logo URL (Image Link)',
    selectCategories: 'Select Categories',
    adding: 'Adding...',
    addedSuccess: 'Channel added successfully!',
    validationError: 'Please fill in all fields with valid values',
    updateBannerTitle: 'New Channels Ready',
    updateBannerDesc: 'New channels have been added. Update now to watch them!',
    updateNow: 'Update Network',
    updatingChannels: 'Updating Channels and Frequencies...',
    websiteUpdateTitle: 'Website Update Available',
    websiteUpdateDesc: 'A new version of Amedi TV is available. Please update to experience the new features.',
    websiteUpdateBtn: 'Update and Reload',
    notificationSetup: 'Enable Notifications',
    notificationSetupDesc: 'Subscribe to receive alerts when new channels or website updates are available.',
    notificationEnabled: 'Notifications Enabled',
    notificationDisabled: 'Notifications Disabled',
    notificationAllowBtn: 'Allow Notifications',
    notificationSuccessTitle: 'Amedi TV Notifications',
    notificationSuccessDesc: 'We will now notify you when new channels are added or updated!',
    systemStatus: 'System Status and Updates',
    appVersion: 'App Version',
    checkUpdates: 'Check for Updates',
    checking: 'Checking...',
    upToDate: 'The app is up to date',
    updateReady: 'New Update Ready!',
    deviceModeTV: 'TV Mode',
    deviceModePhone: 'Phone Mode',
    deviceModeAuto: 'Auto Mode',
    deviceSelectorLabel: 'Display Mode Settings',
    tvRemoteGuide: 'TV remote control enabled: use arrow keys to navigate, [Enter] to select, [Backspace/Esc] to go back.',
    phoneGestureGuide: 'Phone gestures: swipe on video to change channel quickly!',
    supportPhone: 'Phone Support and Help',
    supportPhoneDesc: 'For help via phone or our WhatsApp groups contact us directly.',
    clickToCall: 'Call Us',
    clickToChat: 'WhatsApp Support',
    advertiseHeader: '📢 Advertise on Amedi TV!',
    advertiseText: 'Advertise your Snapchat, store, YouTube, or business here to reach thousands of active viewers. Click to start!',
    contactToAdvertise: 'Advertise Here',
    supportUsWithFib: 'Support Us with FIB',
    settingsTitle: 'Settings & Options',
    smartTvMode: 'Smart TV Mode',
    smartTvModeDesc: 'Enable arrow-key navigation for Smart TV remotes',
    proxyTypeLabel: 'Streaming Proxy Server',
    proxyLocal: 'Local Server Proxy',
    proxyCloudflare: 'Cloudflare Worker Proxy',
    clearCache: 'Clear Cache & Reset',
    clearCacheDesc: 'Force rebuild app cache & reset configurations',
    adminSection: 'Admin Control Center'
  },
  Kurdish: {
    home: 'سەرەکی',
    language: 'زمان',
    search: 'گەڕان',
    settings: 'ڕێکخستن',
    info: 'زانیاری',
    allChannels: 'هەموو کەناڵەکان',
    noChannels: 'هیچ کەناڵێک نەدۆزرایەوە لەم بەشەدا',
    noStream: 'هیچ پەخشێک بەردەست نییە بۆ ئەم کەناڵە',
    searchPlaceholder: 'بگەڕێ بۆ کەناڵەکان...',
    supportMsg: 'دەتوانیت هاوکاریمان بکەیت بە بەخشین بۆ ئەم ئەژمارەی FIB:',
    selectLang: 'زمان هەڵبژێرە',
    playbackError: 'هەڵەی پەخش',
    reconnect: 'دووبارە بەستنەوە',
    selectLanguage: 'زمان هەڵبژێرە',
    appTitle: 'ئامێدی تیڤی',
    socialFollow: 'سناپ چات',
    socialTikTok: 'تیکتۆک',
    socialYoutube: 'یوتیوب',
    socialInstagram: 'ئینستاگرام',
    donorName: 'ساڤان ئامێدی',
    donorAccount: 'P7AZPUOWHQFL',
    categoryAll: 'هەموو',
    categoryKurdish: 'کوردی',
    categoryArabic: 'عەرەبی',
    categoryGeneral: 'گشتی',
    categoryNews: 'هەواڵ',
    categorySports: 'وەرزش',
    categoryMovies: 'فیلم',
    categoryMusic: 'مۆزیک',
    categoryRadio: 'ڕادیۆ',
    categoryIslamic: 'ئیسلامی',
    categoryKids: 'منداڵان',
    categoryBadini: 'بادینی',
    liveNow: 'پەخشی ڕاستەوخۆ',
    liveMatchesNav: 'یارییەکان',
    openLink: 'کردنەوەی بەستەر',
    welcomeDesc: 'بەخێربێن بۆ ئامێدی تیڤی بۆ بینینی کەناڵە کوردی، بیانی، عەرەبی و وەرزشییەکان بە شێوازی ڕاستەوخۆ',
    initializing: 'دەستپێکردن',
    networkOnline: 'تۆڕ چالاکە',
    initializingServer: 'خەریکی ئامادەکردنی سێرڤەر...',
    castDevice: 'ئاراستەکردن بۆ ئامێر',
    airPlay: 'ئێرپڵەی',
    airPlayDevice: 'بۆ ئامێری Apple TV',
    installApp: 'داگرتنی ئەپەکە',
    installAppDesc: 'ئەپی ئامێدی تیڤی دابەزێنە سەر ئامێرەکەت بۆ بینینێکی خێرا و گونجاو.',
    installInstructions: 'بۆ دابەزاندنی ئەم ئەپە لەسەر ئامێری iOS (ئایفۆن)، دوگمەی Share لە Safari دابگرە، پاشان "Add to Home Screen" هەڵبژێرە.',
    close: 'داخستن',
    addChannel: 'زیادکردنی کەناڵ',
    addChannelDesc: 'کەناڵێکی تەلەفزیۆنی کوردی یان جیهانی نوێ زیاد بکە.',
    channelName: 'ناوی کەناڵ',
    streamUrl: 'بەستەری پەخش (HLS .m3u8)',
    logoUrl: 'بەستەری لۆگۆ (بەستەری وێنە)',
    selectCategories: 'هاوپۆلەکان دیاری بکە',
    adding: 'خەریکی زیادکردنە...',
    addedSuccess: 'کەناڵەکە بەسەرکەوتوویی زیادکرا!',
    validationError: 'تکایە هەموو خانەکان بە دروستی پڕبکەرەوە',
    updateBannerTitle: 'کەناڵی نوێ بەردەستە',
    updateBannerDesc: 'کەناڵی نوێ بۆ تۆڕەکە زیادکراوە. ئێستا نوێی بکەرەوە بۆ بینینیان!',
    updateNow: 'تۆڕ نوێ بکەرەوە',
    updatingChannels: 'خەریکی وەرگرتنی شەپۆلی کەناڵەکانە...',
    websiteUpdateTitle: 'نوێکردنەوەی ماڵپەڕ بەردەستە',
    websiteUpdateDesc: 'وەشانێکی نوێی ئامێدی تیڤی ئامادەیە. دایبەزێنە بۆ بەدەستهێنانی نوێترین تایبەتمەندییەکان.',
    websiteUpdateBtn: 'داگرتن و نوێکردنەوە',
    notificationSetup: 'ئاگادارکردنەوەکان چالاک بکە',
    notificationSetupDesc: 'ئاگادارکردنەوەت پێدەگات کاتێک کەناڵی نوێ یان نوێکردنەوەی ماڵپەڕ ڕوودەدات.',
    notificationEnabled: 'ئاگادارکردنەوەکان چالاککراون',
    notificationDisabled: 'ئاگادارکردنەوەکان ناچالاککراون',
    notificationAllowBtn: 'ڕێگەپێدان بە ئاگادارکردنەوە',
    notificationSuccessTitle: 'ئاگادارکردنەوەکانی ئامێدی تیڤی',
    notificationSuccessDesc: 'ئێستا ئاگادارت دەکەینەوە کاتێک کەناڵەکان زیاد دەکرێن یان نوێ دەکرێنەوە!',
    systemStatus: 'سیستەم و ئاگادارکردنەوەکان',
    appVersion: 'وەشانی ئەپ',
    checkUpdates: 'بگەڕێ بۆ نوێکردنەوە',
    checking: 'خەریکی گەڕانە...',
    upToDate: 'ئەپەکە نوێترین وەشاندایە',
    updateReady: 'نوێکردنەوەی نوێ بەردەستە!',
    deviceModeTV: 'دۆخی تەلەفزیۆنی زیرەک',
    deviceModePhone: 'دۆخی مۆبایل',
    deviceModeAuto: 'خۆکار بەستنەوە',
    deviceSelectorLabel: 'گونجاندنی شاشە',
    tvRemoteGuide: 'کۆنتڕۆڵی تەلەفزیۆن چالاکە: تیرەکان بەکاربهێنە بۆ بینینی کەناڵەکان، [Enter] بۆ لێدان، [Backspace/Esc] بۆ گەڕانەوە.',
    phoneGestureGuide: 'دۆخی مۆبایل: پەنجە بخشێنە بە لای ڕاست/چەپ لەسەر ڤیدیۆکە بۆ گۆڕینی کەناڵ!',
    supportPhone: 'پاڵپشتی تەلەفۆنی',
    supportPhoneDesc: 'بۆ پاڵپشتی لە ڕێگەی پەیوەندی تەلەفۆنی یان چاتی واتسئەپ، ڕاستەوخۆ پەیوەندیمان پێوە بکە.',
    clickToCall: 'پەیوەندی بکە',
    clickToChat: 'واتسئەپی پاڵپشتی',
    advertiseHeader: '📢 ڕیکلام لە ئامێدی تیڤی بڵاوبکەرەوە و کارەکەت گەشەپێبدە!',
    advertiseText: 'سناپچات، دوکان، کەناڵی یوتیوب یان بزنسەکەت لێرە بڵاوبکەرەوە بۆ گەیشتن بە دەیان هەزار بینەری چالاکی ڕۆژانە. کرتە بکە بۆ ڕیکلام کردن',
    contactToAdvertise: 'ڕیکلام لەگەڵ ئێمە',
    supportUsWithFib: 'پاڵپشتی ئەپ (FIB)',
    settingsTitle: 'ڕێکخستن و هەڵبژاردنەکان',
    smartTvMode: 'دۆخی تەلەفزیۆنی زیرەک',
    smartTvModeDesc: 'چالاککردنی دوگمەکانی ئاڕاستە بۆ تەلەفزیۆن',
    proxyTypeLabel: 'سێرڤەری پرۆکسی پەخش',
    proxyLocal: 'سێرڤەری پرۆکسی ناوخۆیی',
    proxyCloudflare: 'پرۆکسی کلودفڵێر (Cloudflare)',
    clearCache: 'پاککردنەوەی کاش و نوێکردنەوە',
    clearCacheDesc: 'نوێکردنەوەی تەواوی ئەپ و کەناڵەکان',
    adminSection: 'بەشی بەڕێوەبەر (کۆنترۆڵ)'
  },
  Badini: {
    home: 'سەرەکی',
    language: 'زمان',
    search: 'گەڕان',
    settings: 'ڕێکخستن',
    info: 'زانیاری',
    allChannels: 'هەموو کەناڵەکان',
    noChannels: 'چ کەناڵ نەهاتنە دیتن د ڤی بەشی دا',
    noStream: 'چ پەخش نینە بۆ ڤی کەناڵی',
    searchPlaceholder: 'بگەڕە بۆ کەناڵان...',
    supportMsg: 'تو دکۆدی هاوکاریا مە بکەی ب بەخشینێ بۆ ڤی ئەژمارا FIB:',
    selectLang: 'زمان هەلبژێره',
    playbackError: 'خەلەتی د پەخشی دا',
    reconnect: 'دووبارە گرێدان',
    selectLanguage: 'زمان هەلبژێره',
    appTitle: 'ئامێدی تیڤی',
    socialFollow: 'سناپ چات',
    socialTikTok: 'تیکتۆک',
    socialYoutube: 'یوتیوب',
    socialInstagram: 'ئینستاگرام',
    donorName: 'ساڤان ئامێدی',
    donorAccount: 'P7AZPUOWHQFL',
    categoryAll: 'هەموو',
    categoryKurdish: 'کوردی',
    categoryArabic: 'عەرەبی',
    categoryGeneral: 'گشتی',
    categoryNews: 'هەواڵ',
    categorySports: 'وەرزش',
    categoryMovies: 'فیلم',
    categoryMusic: 'مۆزیک',
    categoryRadio: 'ڕادیۆ',
    categoryIslamic: 'ئیسلامی',
    categoryKids: 'منداڵان',
    categoryBadini: 'بادینی',
    liveNow: 'پەخشێ ڕاستەوخۆ',
    liveMatchesNav: 'یاریێن تە',
    openLink: 'ڤەکرنا لینکی',
    welcomeDesc: 'بخیر بین بوو ئامێدی تیڤی بو دیتنا که نالێن کوردی، بیانی عه ره بی و وه رزشی یێن راسته وخو و دیتنا سترانا و فیلم و دراما هاتیە دروست کرن ژ لایێ ساڤان ئامێدی',
    initializing: 'دەستپێکرن',
    networkOnline: 'تۆڕ یا چالاکە',
    initializingServer: 'ل هەمبەر ئامادەکرنا سێرڤەری...',
    castDevice: 'شاندن بۆ ئامێرێ دی',
    airPlay: 'ئێرپڵەی',
    airPlayDevice: 'بۆ Apple TV',
    installApp: 'داگرتنا ئەپی',
    installAppDesc: 'ئەپا ئامێدی تیڤی دابەزینە سەر ئامیرێ خۆ بۆ دیتنەکا بێ ئاریشە.',
    installInstructions: 'بۆ دابەزاندنا ڤی ئەپی ل سەر ئامیرێن iOS (ئایفۆن)، دوگمەیا Share ل سەر Safari دابگرە، پاشان "Add to Home Screen" هەلبژێره.',
    close: 'داخستن',
    addChannel: 'زێدەکرنا کەناڵی',
    addChannelDesc: 'کەناڵەکێ نوو یێ کوردی یان جیهانی زێدە بکە.',
    channelName: 'ناڤێ کەناڵی',
    streamUrl: 'لینکا پەخشی (HLS .m3u8)',
    logoUrl: 'لینکا لۆگۆی (لینکا وێنەی)',
    selectCategories: 'هاوپۆلان دیاری بکە',
    adding: 'ل هەمبەر زێدەکرنێ...',
    addedSuccess: 'کەناڵ ب سەرکەفتی هاتە زێدەکرن!',
    validationError: 'تکایە هەموو خانان ب دروستی پر بکە',
    updateBannerTitle: 'کەناڵێن نوی یێن بەردەستن',
    updateBannerDesc: 'کەناڵێن نوی بۆ تۆڕێ هاتنە زێدەکرن. نوکە نوی بکە بۆ بینینا وان!',
    updateNow: 'تۆڕێ نوی بکە',
    updatingChannels: 'ل هەمبەر وەرگرتنا شەپۆلێن کەناڵان...',
    websiteUpdateTitle: 'نویکرنا مالپەری به ردەستە',
    websiteUpdateDesc: 'وەشانەکا نوی یا ئامێدی تیڤی یا بەردەستە. داگرە بۆ لێکتێگەهشتنا تایبەتمەندیێن نوی.',
    websiteUpdateBtn: 'داگرتن و نویکرن',
    notificationSetup: 'ئاگادارکرنان چالاک بکە',
    notificationSetupDesc: 'ئاگادارکرن دێ بۆ کەن کاتێ کەناڵەکێ نوی یان نویکرنا مالپەری چێ ببیت.',
    notificationEnabled: 'ئاگادارکرن هاتنە چالاککرن',
    notificationDisabled: 'ئاگادارکرن ناچالاکن',
    notificationAllowBtn: 'رێپێدان ب ئاگدارکرنێ',
    notificationSuccessTitle: 'ئاگادارکرنێن ئامێدی تیڤی',
    notificationSuccessDesc: 'دێ ئاگداریا تە کەین کاتێ کەناڵ زێدە دبن یان نوی دبن!',
    systemStatus: 'سیستەم و ئاگادارکرن',
    appVersion: 'وەشانێ ئەپی',
    checkUpdates: 'بگەڕە بۆ نویکرنێ',
    checking: 'ل هەمبەر گەڕانێ...',
    upToDate: 'ئەپ د نویتری وەشان دایە',
    updateReady: 'نویکرنا نوی یا بەردەستە!',
    deviceModeTV: 'دۆخی تەلەفزیۆنی زیرەک',
    deviceModePhone: 'دۆخی مۆبایلی',
    deviceModeAuto: 'خۆکارانە',
    deviceSelectorLabel: 'گونجاندنا شاشێ',
    tvRemoteGuide: 'کۆنتڕۆڵا تەلەفزیۆنێ یا چالاکە: تیران بەکاربینە بۆ دیتنا کەناڵان، [Enter] بۆ لێدانێ، [Backspace/Esc] بۆ زڤڕینێ.',
    phoneGestureGuide: 'دۆخی مۆبایلی: پەنجا خۆ بکێشە لایێ ڕاست/چەپ ل سەر ڤیدیۆیێ بۆ گوهۆڕینا کەناڵان!',
    supportPhone: 'پاڵپشتیا تەلەفۆنی',
    supportPhoneDesc: 'بۆ پاڵپشتیێ ب ڕێكا تەلەفۆنێ یان چاتا واتسئەپێ، ڕاستەوخۆ پەیوەندیێ ب مە بکە.',
    clickToCall: 'پەیوەندیێ بکە',
    clickToChat: 'واتسئەپا پاڵپشتیێ',
    advertiseHeader: '📢 ڕیکلامێ ل ئامێدی تیڤی بڵاڤ بکە و کارێ خۆ مەزن بکە!',
    advertiseText: 'سناپچات، دوکان، یوتیوب یان بزنسا خۆ لێرە بڵاڤ بکە بۆ گەهشتنا ب هزاران بینەرێن چالاک یێن ڕۆژانە. لێرە دابگرە بۆ دەستپێکرنێ!',
    contactToAdvertise: 'ڕیکلام دگەل مە دابنە',
    supportUsWithFib: 'پاڵپشتيا ئەپي ب ڕێكا (FIB)',
    settingsTitle: 'ڕێکخستن و هەڵبژاردن',
    smartTvMode: 'دۆخێ تەلەفزیۆنا زیرەک',
    smartTvModeDesc: 'چالاککرنا دوگمێن ئاڕاستەیێ بۆ تەلەفزیۆنێ',
    proxyTypeLabel: 'پڕۆکسیێ سێرڤەرێ پەخشێ',
    proxyLocal: 'پڕۆکسیێ سێرڤەرێ ناوخۆیی',
    proxyCloudflare: 'پڕۆکسیێ کلودفڵێر (Worker)',
    clearCache: 'پاککرنا کاشێ و نوژەنکرن',
    clearCacheDesc: 'نوژەنکرنا تەمام یا ئەپی و کەناڵان',
    adminSection: 'پەنەلا کۆنترۆڵا رێڤەبەری'
  },
  Arabic: {
    home: 'الرئيسية',
    language: 'اللغة',
    search: 'بحث',
    settings: 'الإعدادات',
    info: 'معلومات',
    allChannels: 'جميع القنوات',
    noChannels: 'لم يتم العثور على قنوات في هذه الفئة',
    noStream: 'البث غير متوفر حالياً لهذه القناة',
    searchPlaceholder: 'ابحث عن القنوات...',
    supportMsg: 'يمكنك دعم التطبيق عن طريق التبرع لحساب FIB التالي:',
    selectLang: 'اختر اللغة',
    playbackError: 'خطأ في التشغيل',
    reconnect: 'إعادة الاتصال',
    selectLanguage: 'اختر اللغة',
    appTitle: 'أميدي تي في',
    socialFollow: 'سناب شات',
    socialTikTok: 'تيك توك',
    socialYoutube: 'يوتيوب',
    socialInstagram: 'إنستغرام',
    donorName: 'سافان أميدي',
    donorAccount: 'P7AZPUOWHQFL',
    categoryAll: 'الكل',
    categoryKurdish: 'كردي',
    categoryArabic: 'عربي',
    categoryGeneral: 'عام',
    categoryNews: 'أخبار',
    categorySports: 'رياضة',
    categoryMovies: 'أفلام',
    categoryMusic: 'موسيقى',
    categoryRadio: 'راديو',
    categoryIslamic: 'إسلامي',
    categoryKids: 'أطفال',
    categoryBadini: 'باديني',
    liveNow: 'بث مباشر',
    liveMatchesNav: 'المباريات',
    openLink: 'فتح الرابط',
    welcomeDesc: 'أهلاً بكم في أميدي تي في لمشاهدة القنوات الكردية، العالمية، العربية، والرياضية بث مباشر',
    initializing: 'جاري البدء',
    networkOnline: 'الشبكة متصلة',
    initializingServer: 'جاري تهيئة الخادم...',
    castDevice: 'بث إلى جهاز',
    airPlay: 'إيربلاي',
    airPlayDevice: 'البث عبر AirPlay',
    installApp: 'تثبيت التطبيق',
    installAppDesc: 'قم بتثبيت تطبيق أميدي تي في على جهازك للاستمتاع ببث سريع ومستقر.',
    installInstructions: 'لتثبيت التطبيق على جهاز iOS (آيفون)، اضغط على زر المشاركة في Safari ثم اختر "إضافة إلى الشاشة الرئيسية".',
    close: 'إغلاق',
    addChannel: 'إضافة قناة',
    addChannelDesc: 'إضافة قناة تلفزيونية كردية أو عالمية جديدة.',
    channelName: 'اسم القناة',
    streamUrl: 'رابط البث (HLS .m3u8)',
    logoUrl: 'رابط الشعار (رابط الصورة)',
    selectCategories: 'اختر الفئات',
    adding: 'جاري الإضافة...',
    addedSuccess: 'تم إضافة القناة بنجاح!',
    validationError: 'يرجى ملء جميع الحقول بقيم صالحة',
    updateBannerTitle: 'تحديثات القنوات جاهزة',
    updateBannerDesc: 'تم إضافة قنوات جديدة للشبكة. حدث الآن لمشاهدتها!',
    updateNow: 'تحديث القنوات',
    updatingChannels: 'جاري مزامنة القنوات والترددات...',
    websiteUpdateTitle: 'تحديث الموقع متوفر',
    websiteUpdateDesc: 'نسخة جديدة من أميدي تي في متوفرة الآن. يرجى التحديث لتجربة الميزات الجديدة.',
    websiteUpdateBtn: 'تحديث مع إعادة التحميل',
    notificationSetup: 'تفعيل الإشعارات',
    notificationSetupDesc: 'اشترك لتلقي تنبيهات عندما تتوفر قنوات جديدة أو تحديثات للموقع.',
    notificationEnabled: 'تم تفعيل الإشعارات',
    notificationDisabled: 'تم تعطيل الإشعارات',
    notificationAllowBtn: 'السماح بالإشعارات',
    notificationSuccessTitle: 'إشعارات أميدي تي في',
    notificationSuccessDesc: 'سنقوم الآن بإخبارك عند إضافة قنوات جديدة أو تحديثات!',
    systemStatus: 'حالة النظام والتحديثات',
    appVersion: 'إصدار التطبيق',
    checkUpdates: 'التحقق من التحديثات',
    checking: 'جاري التحقق...',
    upToDate: 'التطبيق محدث إلى آخر إصدار',
    updateReady: 'تحديث جديد جاهز!',
    deviceModeTV: 'وضع التلفزيون',
    deviceModePhone: 'وضع الهاتف',
    deviceModeAuto: 'تلقائي حسب النظام',
    deviceSelectorLabel: 'إعدادات الشاشة والوضع',
    tvRemoteGuide: 'التحكم بريموت التلفزيون مفعل: استخدم الأزرار لتغيير القنوات، [Enter] للتشغيل، [Backspace/Esc] للرجوع.',
    phoneGestureGuide: 'إيماءات الهاتف: اسحب على الفيديو لتغيير القناة بسرعة!',
    supportPhone: 'الدعم الهاتفي والمساعدة',
    supportPhoneDesc: 'للحصول على المساعدة عبر الهاتف أو مجموعات الواتساب الخاصة بنا تواصل معنا مباشرة.',
    clickToCall: 'اتصل بنا',
    clickToChat: 'واتساب الدعم',
    advertiseHeader: '📢 أعلن على أميدي تي في وانشر عملك!',
    advertiseText: 'انشر حسابك على سناب شات، قناتك، أو عملك هنا للوصول إلى آلاف المشاهدين النشطين يومياً. اضغط للبدء!',
    contactToAdvertise: 'أعلن هنا',
    supportUsWithFib: 'الدعم المالي (FIB)',
    settingsTitle: 'الإعدادات والخيارات',
    smartTvMode: 'وضع التلفاز الذكي',
    smartTvModeDesc: 'تفعيل التنقل بأزرار الأسهم لأجهزة التلفاز',
    proxyTypeLabel: 'خادم بروكسي البث',
    proxyLocal: 'بروكسي الخادم المحلي',
    proxyCloudflare: 'بروكسي كلاود فلير (Cloudflare)',
    clearCache: 'مسح التخزين المؤقت والبيانات',
    clearCacheDesc: 'إعادة تحميل التطبيق وتحديث كافة القنوات',
    adminSection: 'لوحة تحكم المسؤول'
  }
};

const SplashScreen = ({ t }: { t: any; key?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-brand-bg z-[9999] flex flex-col items-center justify-between py-16 px-4 select-none"
    >
      {/* Spacer to push content down for vertical balance */}
      <div className="w-1/12" />

      {/* Brand Hero Context */}
      <div className="flex flex-col items-center max-w-lg w-full text-center">
        {/* Centered Glassmorphic Purple Icon box */}
        <motion.div 
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-32 h-32 md:w-36 md:h-36 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/10 border border-white/5 bg-[#171230] flex items-center justify-center mb-8 shrink-0 relative"
        >
          <img 
            src="https://i.postimg.cc/QxGcmFd3/file-0000000004b47246b78b315ac6479e1d.png" 
            alt="AMEDI TV Logo" 
            className="w-full h-full object-cover block shrink-0" 
            referrerPolicy="no-referrer" 
          />
        </motion.div>

        {/* Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
          className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-none mb-4"
        >
          AMEDI <span className="text-brand-accent">TV</span>
        </motion.h1>

        {/* Dynamic Welcome Message */}
        <motion.p 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: "easeOut" }}
          className="text-xs md:text-sm text-white/70 max-w-xs md:max-w-sm leading-relaxed px-4 font-sans font-medium"
        >
          {t.welcomeDesc}
        </motion.p>
      </div>

      {/* Initializing Progress Indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex flex-col items-center w-full max-w-[180px] shrink-0"
      >
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative shadow-inner">
          <motion.div 
            initial={{ left: "-40%", width: "40%" }}
            animate={{ left: "100%" }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.8, 
              ease: "easeInOut" 
            }}
            className="absolute h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
          />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-3 animate-pulse">
          {t.initializing}
        </span>
      </motion.div>
    </motion.div>
  );
};

const ActivationScreen = ({ 
  onActivateSuccess, 
  language, 
  setLanguage, 
  t, 
  isRtl,
  adsConfig
}: { 
  onActivateSuccess: (plan: '1month' | '6months' | '1year' | 'ad_24h') => void; 
  language: Language; 
  setLanguage: (lang: Language) => void; 
  t: any; 
  isRtl: boolean; 
  adsConfig?: any;
}) => {
  const [activationCode, setActivationCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [showPayDetails, setShowPayDetails] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedQi, setCopiedQi] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'fib' | 'qi'>('fib');
  const [selectedPeriod, setSelectedPeriod] = useState<'1month' | '6months' | '1year'>('6months');
  const [isSubscriptionCreated, setIsSubscriptionCreated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('amedi_tv_sub_created') === 'true';
    } catch (_) {
      return false;
    }
  });

  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adCountdown, setAdCountdown] = useState(15);
  const [isAdReadyToClaim, setIsAdReadyToClaim] = useState(false);
  const [adMuted, setAdMuted] = useState(true);
  const [showDirectActivationCodeForm, setShowDirectActivationCodeForm] = useState(false);

  const handleStartAd = () => {
    setIsAdPlaying(true);
    setAdCountdown(15);
    setIsAdReadyToClaim(false);
  };

  const handleClaimAdPass = () => {
    try {
      localStorage.setItem('amedi_tv_activated', 'true');
      localStorage.setItem('amedi_tv_activated_plan', 'ad_24h');
      localStorage.setItem('amedi_tv_activated_at', Date.now().toString());
    } catch (_) {}
    setIsAdPlaying(false);
    onActivateSuccess('ad_24h');
  };

  useEffect(() => {
    let timer: any;
    if (isAdPlaying && adCountdown > 0) {
      timer = setInterval(() => {
        setAdCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsAdReadyToClaim(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAdPlaying, adCountdown]);



  const actText: { 
    [key in Language]: { 
      title: string; 
      description: string; 
      placeholder: string; 
      button: string; 
      contactLabel: string; 
      successMsg: string; 
      errorMsg: string;
      payToGet: string;
      payInstructions: string;
      copyAccount: string;
      copied: string;
      orContact: string;
      pricingTitle: string;
      oneMonthLabel: string;
      sixMonthsLabel: string;
      oneYearLabel: string;
      iqd: string;
      selectPeriodPrompt: string;
      selectedPlanLabel: string;
      requiredAmountLabel: string;
      activationStepCode: string;
      haveCodeNotice: string;
      activationSuccessNotice: string;
      qiInstructions: string;
      copyQiAccount: string;
      qiAccountNumber: string;
      createSubscriptionBtn: string;
      subscriptionSuccessNoticeText: string;
      lockNotice: string;
      watchAdTitle: string;
      watchAdDesc: string;
      watchAdBtn: string;
      adTitle: string;
      adTicking: string;
      seconds: string;
      adFinished: string;
      processing: string;
    } 
  } = {
    English: {
      title: "Activation Required",
      description: "Please enter your activation code to unlock and access the premium channels. Activation ensures uninterrupted high-speed streaming.",
      placeholder: "ENTER ACTIVE CODE...",
      button: "Activate Now",
      contactLabel: "Don't have an active code? Contact Savan Amedi",
      successMsg: "Activated successfully! Enjoy watching Amedi TV.",
      errorMsg: "Invalid activation code. Please try again or contact developer.",
      payToGet: "💳 Pay via FIB or Super Qi to Get Code",
      payInstructions: "Select a payment method and transfer the subscription fee according to your chosen plan. Once payment is completed, send the screenshot to Savan Amedi on Snapchat to receive your activation code instantly.",
      copyAccount: "Copy FIB Account ID",
      copied: "Copied successfully! 🎉",
      orContact: "Send screenshot / Contact developer:",
      pricingTitle: "Subscription Pricing",
      oneMonthLabel: "1 Month",
      sixMonthsLabel: "6 Months",
      oneYearLabel: "1 Year",
      iqd: "IQD",
      selectPeriodPrompt: "1. Specify subscription duration & payment method:",
      selectedPlanLabel: "Selected Subscription Duration",
      requiredAmountLabel: "Required Payment Amount",
      activationStepCode: "2. Enter your activation code:",
      haveCodeNotice: "Make sure you have your code before activating the subscription.",
      activationSuccessNotice: "Once you have the code and complete the activation process, the subscription will be activated successfully.",
      qiInstructions: "Transfer the subscription fee via Super Qi Wallet. Copy our Wallet ID below, complete the transfer, and send the screenshot to Savan Amedi on Snapchat.",
      copyQiAccount: "Copy Super Qi Wallet ID",
      qiAccountNumber: "Super Qi Wallet Number",
      createSubscriptionBtn: "Create Subscription Plan ⚡",
      subscriptionSuccessNoticeText: "Subscription Created Successfully! Please complete payment below to get your code.",
      lockNotice: "🔐 Please complete Step 1 (Create Subscription) first to unlock this section.",
      watchAdTitle: "Watch Ads for Free Access",
      watchAdDesc: "Watch a quick 15-second sponsor advertisement to instantly gain 24 hours of premium Amedi TV access, no payment required.",
      watchAdBtn: "Watch Sponsor Ad to Unlock 🔓",
      adTitle: "Sponsor Advertisement",
      adTicking: "Premium access unlocks in",
      seconds: "seconds",
      adFinished: "Sponsor ad completed! Your 24-hour pass is now active. Enjoy AMEDI TV! ⚡",
      processing: "Activating premium access...",
    },
    Kurdish: {
      title: "چالاککردن پێویستە",
      description: "تکایە کۆدی چالاککردنەکەت بنووسە بۆ کردنەوە و دەستگەیشتن بە کەناڵە نایابەکان. چالاککردن خێراییەکی بێپچڕان دابین دەکات.",
      placeholder: "کۆدی چالاککردن لێرە بنووسە...",
      button: "ئێستا چالاکی بکە",
      contactLabel: "کۆدی چالاککردنت نییە؟ پەیوەندی بە ساڤان ئامێدی بکە",
      successMsg: "بەسەرکەوتوویی چالاککرا! هیوای بینینێکی خۆش بۆ ئامێدی تیڤی.",
      errorMsg: "کۆدی چالاککردنەکە هەڵەیە. تکایە دووبارە هەوڵبدەرەوە یان پەیوەندی بە گەشەپێدەر بکە.",
      payToGet: "💳 پارەدان لە ڕێگەی FIB یان سوپەر کی بۆ بەدەستهێنانی کۆد",
      payInstructions: "ڕێگەیەکی پارەدان هەڵبژێره و بڕی پارەی بەشداریکردنەکە بەپێی پلانەکەت بنێرە. پاش گواستنەوە پێویستە وێنەی شاشەی سەرکەوتنی ناردنەکە بۆ ساڤان ئامێدی بنێریت لە سناپچات بۆ وەرگرتنی کۆدەکە بە خێرایی.",
      copyAccount: "کۆپیکردنی ژمارەی ئەژماری FIB",
      copied: "بە سەرکەوتوویی کۆپی کرا! 🎉",
      orContact: "وێنەی شاشەکە بنێرە یان پەیوەندی بە ساڤان بکە:",
      pricingTitle: "نرخی کۆدی چالاککردن",
      oneMonthLabel: "١ مانگ",
      sixMonthsLabel: "٦ مانگ",
      oneYearLabel: "١ ساڵ",
      iqd: "دینار",
      selectPeriodPrompt: "١. ماوەی بەشداریکردنی پێویست و ڕێگەی پارەدان دیاری بکە:",
      selectedPlanLabel: "ماوەی بەشداریکردنی هەڵبژێردراو",
      requiredAmountLabel: "بڕی پارەی پێویست",
      activationStepCode: "٢. کۆدی چالاککردنەکە لێرە بنووسە:",
      haveCodeNotice: "تکایە دڵنیابەرەوە لەوەی کەکۆدی چالاککردنەکەت لایە پێش ئەوەی بەشداریکردنەکە چالاک بکەیت.",
      activationSuccessNotice: "کاتێک کۆدەکەت دەستکەوت و پڕۆسەی چالاککردنەکەت تەواو کرد، بەشداریکردنەکەت بە سەرکەوتوویی چالاک دەبێت.",
      qiInstructions: "بڕی پارەی بەشداریکردنەکە بنێرە بۆ جزدانی سوپەر کی (Super Qi) لە خوارەوە. ژمارەی جزدانەکە کۆپی بکە، پارەکە بنێرە، و پاشان وێنەی شاشەکە بۆ ساڤان ئامێدی بنێرە لە سناپچات.",
      copyQiAccount: "کۆپیکردنی مۆبایلی جزدانی Super Qi",
      qiAccountNumber: "ژمارەی جزدانی سوپەر کی (Super Qi)",
      createSubscriptionBtn: "دروستکردنی پلانی بەشداریکردن ⚡",
      subscriptionSuccessNoticeText: "بەشداریکردنەکەت بە سەرکەوتوویی دروستکرا! تکایە پارەکە بنێرە بۆ وەرگرتنی کۆدی فەرمی.",
      lockNotice: "🔐 تکایە سەرەتا هەنگاوی یەکەم (دروستکردنی بەشداریکردن) تەواو بکە بۆ کردنەوەی ئەم بەشە.",
      watchAdTitle: "سەیرکردنی ڕێکلام بۆ کردنەوەی بێبەرامبەر",
      watchAdDesc: "کەناڵە نایابەکان بۆ ٢٤ کاتژمێر بکەرەوە بە سەیرکردنی ڕێکلامێکی سپۆنسەر بۆ ماوەی ١٥ چرکە بەبێ پێویستی بە پارەدان.",
      watchAdBtn: "سەیری ڕێکلام بکە و تیڤی بکەرەوە 🔓",
      adTitle: "ڕێکلامی سپۆنسەرکراو",
      adTicking: "کردنەوەی بەشداریکردنی نایاب لە ماوەی",
      seconds: "چرکە",
      adFinished: "ڕێکلامی سپۆنسەر کۆتایی هات! هیوای بینینێکی خۆش بۆ ئامێدی تیڤی! ⚡",
      processing: "چالاککردنی بەشداریکردن...",
    },
    Badini: {
      title: "چالاککرن یا پێدڤییە",
      description: "تکایە کۆدێ چالاککرنێ بنڤیسە بۆ ڤەکرن و دیتنا کەناڵێن نایاب. چالاککرن لایەنەکێ گرنگە بۆ دەستکەفتنا خێرایەکا مەزن.",
      placeholder: "کۆدێ چالاککرنێ لێرە بنڤیسە...",
      button: "نوکە چالاک بکە",
      contactLabel: "کۆدێ چالاککرنێ ل دەف تە نینە؟ پەیوەندیێ ب ساڤان ئامێدی بکە",
      successMsg: "ب سەرکەفتی هاتە چالاککرن! بینینەکا خۆش بۆ ئامێدی تیڤی.",
      errorMsg: "کۆدێ چالاککرنێ خەلەتە. تکایە جارەکا دی تاقی بکە یان پەیوەندیێ ب گەشەپێدەر بکە.",
      payToGet: "💳 پارەدان ب رێكا FIB یان سوپەر کی بۆ وەرگرتنا کۆدی",
      payInstructions: "رێکا پارەدانەکێ هەلبژێره و بهایێ پشکداریێ ل دیف پلانا خۆ فرێکە. پشتی فرێکرنێ پێدڤییە وێنێ شاشەیێ بۆ ساڤان ئامێدی بفرێکی ل سەر سناپچاتی دا کۆدێ تە ب خێرایی بۆ تە بهێتە فرێکرن.",
      copyAccount: "کۆپیکرنا ژمارا هەژمارا FIB",
      copied: "ب سەرکەفتی هاتە کۆپیکرن! 🎉",
      orContact: "وێنێ شاشەیێ بفرێكه یان پەیوەندیێ ب ساڤانی بكە:",
      pricingTitle: "بهایێ کۆدێ چالاککرنێ",
      oneMonthLabel: "١ هەیڤ",
      sixMonthsLabel: "٦ هەیڤ",
      oneYearLabel: "١ ساڵ",
      iqd: "دینار",
      selectPeriodPrompt: "١. ماوێ پشکداریا خۆ و رێکا پارەدانێ دەستنیشان بکە:",
      selectedPlanLabel: "ماوێ پشکداریا دەستنیشانکری",
      requiredAmountLabel: "کۆژمێ پارەیێ کەتێ پێدڤی",
      activationStepCode: "٢. کۆدێ چالاککرنێ بنڤیسە:",
      haveCodeNotice: "تکایە پشتراست بە کو تە کۆدێ چالاککرنێ ل دەف تە هەیە پێش هندێ تو پشکداریێ چالاک بکەی.",
      activationSuccessNotice: "دەمێ کۆدێ خۆ تە وەرگرت و پڕۆسێسا چالاککرنێ ب دوماهی ئینا، پشکداریا تە دێ ب سەرکەفتی هێتە چالاککرن.",
      qiInstructions: "بها یێ پشکداریێ فرێکە بۆ سەر جزدانا سوپەر کی (Super Qi) ل خوارێ. ژمارا جزدانێ کۆپی بکە، پارەی فڕێکە، و پشتی هینگێ وێنێ شاشەیێ بۆ سناپێ ساڤانی فرێکە.",
      copyQiAccount: "کۆپیکرنا مۆبایلا جزدانا Super Qi",
      qiAccountNumber: "ژمارا جزدانا سوپەر کی (Super Qi)",
      createSubscriptionBtn: "دروستکرنا پلانا پشکداریێ ⚡",
      subscriptionSuccessNoticeText: "پشکداریا تە ب سەرکەفتی هاتە دروستکرن! تکایە بهای فرێکە بۆ بدەستڤەئینانا کۆدێ فەرمی.",
      lockNotice: "🔐 تکایە پشک یا ئێکێ (دروستکرنا پشکداریێ) ب دوماهی بینە بۆ ڤەکرنا ڤی بەشی.",
      watchAdTitle: "سەیرکرنا رێکلامێ بۆ ڤەکرنا بێبەرامبەر",
      watchAdDesc: "کەناڵێن نایاب بۆ ٢٤ دەمژمێران ڤەکە ب دیتنا رێکلامەکا سپۆنسەری بۆ ماوێ ١٥ چرکان بێی پێدڤی ب پارەدانێ.",
      watchAdBtn: "سەیری رێکلامێ بکە و تیڤیێ ڤەکە 🔓",
      adTitle: "رێکلاما سپۆنسەرکری",
      adTicking: "ڤەکرنا پشکداریا نایاب د ماوێ",
      seconds: "چرکان",
      adFinished: "رێکلاما سپۆنسەری ب دوماهی هات! بینینەکا خۆش بۆ ئامێدی تیڤی! ⚡",
      processing: "چالاککرنا پشکداریێ...",
    },
    Arabic: {
      title: "مطلوب التفعيل",
      description: "يرجى إدخال رمز التفعيل الخاص بك لفتح والوصول إلى القنوات المميزة. التفعيل يضمن لك بثاً فائق السرعة بدون انقطاع.",
      placeholder: "أدخل رمز التفعيل هنا...",
      button: "تفعيل الآن",
      contactLabel: "ليس لديك رمز تفعيل؟ تواصل مع سافان أميدي",
      successMsg: "تم التفعيل بنجاح! مشاهدة ممتعة على أوليمبياد وأميدي تي في.",
      errorMsg: "رمز التفعيل غير صحيح. يرجى المحاولة مرة أخرى أو الاتصال بالمطور.",
      payToGet: "💳 الدفع عبر FIB أو سوبر كي للحصول على الرمز",
      payInstructions: "اختر طريقة الدفع المناسبة وقم بتحويل رسوم الاشتراك وفقاً للمدة المحددة. بعد إتمام الدفع، أرسل لقطة الشاشة إلى سافان أميدي على سناب شات لاستلام رمز التفعيل فوراً.",
      copyAccount: "نسخ رقم حساب FIB",
      copied: "تم الرفع بنجاح! 🎉",
      orContact: "تواصل مع المطور أو أرسل لقطة الشاشة:",
      pricingTitle: "أسعار كود التفعيل",
      oneMonthLabel: "شهر واحد",
      sixMonthsLabel: "٦ أشهر",
      oneYearLabel: "سنة كاملة",
      iqd: "د.ع",
      selectPeriodPrompt: "١. اختر مدة الاشتراك المطلوبة وطريقة الدفع:",
      selectedPlanLabel: "مدة الاشتراك المحددة",
      requiredAmountLabel: "المبلغ المطلوب تحويله",
      activationStepCode: "٢. أدخل كود التفعيل الذي استلمته هنا:",
      haveCodeNotice: "يرجى التأكد من أن لديك كود تفعيل خاص بك قبل تفعيل الاشتراك.",
      activationSuccessNotice: "بمجرد حصولك على الكود وإتمام عملية التفعيل، سيتم تفعيل اشتراكك بنجاح.",
      qiInstructions: "قم بتحويل رسوم الاشتراك إلى محفظة سوبر كي (Super Qi) أدناه. انسخ رقم المحفظة، وأكمل التحويل، ثم أرسل لقطة الشاشة إلى سافان أميدي على سناب شات.",
      copyQiAccount: "نسخ رقم محفظة Super Qi",
      qiAccountNumber: "رقم محفظة سوبر كي (Super Qi)",
      createSubscriptionBtn: "إنشاء خطة الاشتراك ⚡",
      subscriptionSuccessNoticeText: "تم إنشاء الاشتراك بنجاح! يرجى تحويل المبلغ للحصول على كود التفعيل الخاص بك.",
      lockNotice: "🔐 يرجى إتمام الخطوة الأولى (إنشاء الاشتراك) أولاً لفتح هذا القسم وتحريك التفعيل.",
      watchAdTitle: "شاهد الإعلانات لفتح الوصول المجاني",
      watchAdDesc: "افتح القنوات المميزة لمدة 24 ساعة بمشاهدة إعلان راعي لمدة 15 ثانية دون أي رسوم دفع.",
      watchAdBtn: "شاهد الإعلان وافتح التلفزيون 🔓",
      adTitle: "إعلان الممول",
      adTicking: "سيتم فتح الوصول المميز بعد",
      seconds: "ثانية",
      adFinished: "اكتمل إعلان الممول! تم تفعيل اشتراكك المجاني لمدة 24 ساعة الآن. مشاهدة ممتعة! ⚡",
      processing: "تفعيل الاشتراك المميز...",
    }
  };

  const currentAct = actText[language] || actText.English;

  const handleActivate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activationCode.trim()) return;

    setValidating(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const response = await fetch('/api/activation/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activationCode })
      });
      const data = await response.json();

      if (data.success) {
        setStatus({ type: 'success', message: currentAct.successMsg });
        try {
          localStorage.setItem('amedi_tv_activated', 'true');
          localStorage.setItem('amedi_tv_activated_plan', selectedPeriod);
          localStorage.setItem('amedi_tv_activated_at', Date.now().toString());
        } catch (_) {}
        setTimeout(() => {
          onActivateSuccess(selectedPeriod);
        }, 1200);
      } else {
        setStatus({ type: 'error', message: currentAct.errorMsg });
      }
    } catch (err) {
      console.error("Activation failure:", err);
      setStatus({ type: 'error', message: "Connection lost. Please try again later." });
    } finally {
      setValidating(false);
    }
  };

  const handleCopyFIB = async () => {
    try {
      await navigator.clipboard.writeText('P7AZPUOWHQFL');
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } catch (err) {
      console.warn("Failed to copy FIB text", err);
    }
  };

  const handleCopyQi = async () => {
    try {
      await navigator.clipboard.writeText('1149575266');
      setCopiedQi(true);
      setTimeout(() => setCopiedQi(false), 2000);
    } catch (err) {
      console.warn("Failed to copy Qi text", err);
    }
  };



  return (
    <div className="fixed inset-0 z-[90] bg-[#0c081c] flex flex-col items-center justify-center p-6 select-none overflow-y-auto no-scrollbar" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="absolute inset-x-0 top-1/10 bottom-1/10 m-auto w-80 h-80 bg-brand-accent/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-10 right-10 w-44 h-44 bg-purple-600/5 blur-[90px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-44 h-44 bg-pink-500/5 blur-[90px] rounded-full pointer-events-none" />

      <main className="w-full max-w-md bg-white/5 border border-white/5 backdrop-blur-xl rounded-[32px] p-6 md:p-8 flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative z-10 my-8">
        <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-[0_0_35px_rgba(147,51,234,0.3)] border border-white/10 p-0.5 bg-[#17112d] flex items-center justify-center mb-6 relative group">
          <img 
            src="https://i.postimg.cc/QxGcmFd3/file-0000000004b47246b78b315ac6479e1d.png" 
            alt="AMEDI TV Logo" 
            className="w-full h-full object-cover rounded-[14px]" 
            referrerPolicy="no-referrer" 
          />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-white uppercase italic leading-none mb-2">
          AMEDI <span className="text-brand-accent">TV</span>
        </h1>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/25 mb-5 text-[10px] font-black uppercase tracking-wider text-pink-400">
          <Sparkles className="w-3 h-3 text-pink-400 animate-pulse" />
          <span>{language === 'Kurdish' || language === 'Badini' ? 'ڤەکرنا بێبەرامبەر' : language === 'Arabic' ? 'دخول مجاني' : 'FREE ACCESS'}</span>
        </div>

        <h2 className="text-lg font-black text-white mb-2 leading-tight">
          {currentAct.watchAdTitle}
        </h2>

        <p className="text-xs text-brand-text-muted leading-relaxed mb-6 px-1">
          {currentAct.watchAdDesc}
        </p>

        {/* Watch Ad Bypass Card */}
        <div className="w-full bg-gradient-to-br from-purple-950/30 to-pink-950/25 border border-brand-accent/20 rounded-2xl p-5 text-start flex flex-col gap-4 relative overflow-hidden backdrop-blur-md" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/5 blur-xl rounded-full pointer-events-none" />
          <div className="flex gap-2.5 items-start">
            <div className="p-1.5 rounded-xl bg-pink-500/15 text-pink-400 mt-0.5 shrink-0 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-black uppercase text-pink-400 tracking-wider">
                {currentAct.watchAdTitle}
              </span>
              <p className="text-[11px] text-white/80 font-bold leading-normal">
                {currentAct.watchAdDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStartAd}
            className="w-full py-4 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 active:scale-[0.98] text-white font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-md flex items-center justify-between cursor-pointer mt-1"
          >
            <Lock className="w-3.5 h-3.5 text-yellow-300 shrink-0 select-none" />
            <span className="flex-1 text-center">{currentAct.watchAdBtn.replace('🔓', '').replace('🔐', '').trim()}</span>
            <Play className="w-3.5 h-3.5 text-white shrink-0 select-none" />
          </button>
        </div>

        {status.type !== 'idle' && (
          <div className={`w-full mt-4 p-3 rounded-xl border text-[11px] font-black leading-snug ${
            status.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {status.message}
          </div>
        )}

        {/* Toggleable Direct Activation Code Form for legacy/master users */}
        <div className="w-full mt-4 border-t border-white/5 pt-4 text-center">
          {!showDirectActivationCodeForm ? (
            <button
              onClick={() => {
                setShowDirectActivationCodeForm(true);
                if (status.type !== 'idle') setStatus({ type: 'idle', message: '' });
              }}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors cursor-pointer bg-transparent py-2 border-none"
            >
              🔑 {language === 'Kurdish' ? 'کۆدی چالاککردنت هەیە؟' : language === 'Badini' ? 'کۆدێ چالاککرنێ ل دەف تە هەیە؟' : language === 'Arabic' ? 'هل لديك كود تفعيل؟' : 'Have Activation Code?'}
            </button>
          ) : (
            <div className="w-full flex flex-col gap-3 mt-1 text-left" dir={isRtl ? 'rtl' : 'ltr'}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  {currentAct.activationStepCode}
                </span>
                <button
                  type="button"
                  onClick={() => setShowDirectActivationCodeForm(false)}
                  className="text-[9.5px] font-bold text-pink-400 hover:text-pink-300 cursor-pointer bg-transparent border-none"
                >
                  {isRtl ? 'داخستن' : 'Close'}
                </button>
              </div>

              <form onSubmit={handleActivate} className="w-full flex flex-col gap-2.5">
                <input
                  type="text"
                  value={activationCode}
                  onChange={(e) => {
                    setActivationCode(e.target.value);
                    if (status.type !== 'idle') setStatus({ type: 'idle', message: '' });
                  }}
                  placeholder={currentAct.placeholder}
                  className="w-full bg-black/40 border border-white/10 focus:outline-none focus:border-brand-accent/60 rounded-2xl py-3 px-4 text-xs font-mono text-center text-white tracking-widest placeholder-white/20 uppercase transition-all"
                />

                <button
                  type="submit"
                  disabled={validating || !activationCode.trim()}
                  className="w-full py-3 rounded-xl bg-brand-accent hover:bg-purple-700 disabled:opacity-40 text-white font-black text-[10px] tracking-wider uppercase transition-all active:scale-[0.98] cursor-pointer"
                >
                  {validating ? 'VALIDATING...' : currentAct.button}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="flex flex-row flex-wrap justify-center gap-2.5 border-t border-white/5 pt-5 mt-6 w-full">
          {(['English', 'Kurdish', 'Badini', 'Arabic'] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                language === lang 
                  ? 'bg-white/10 text-white border border-white/10' 
                  : 'bg-transparent text-white/30 hover:text-white/60 border border-transparent'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </main>

      {isAdPlaying && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-none" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="w-full max-w-lg bg-slate-900/80 border border-white/10 rounded-3xl p-6 flex flex-col gap-5 items-center relative overflow-hidden backdrop-blur-3xl shadow-2xl">
            {/* Ambient visual background glow */}
            <div className="absolute inset-x-0 -top-20 m-auto w-60 h-60 bg-brand-accent/25 blur-[90px] rounded-full pointer-events-none" />

            {/* Header: Ad state indicator */}
            <div className="w-full flex items-center justify-between z-10 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-brand-accent animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#a855f7] font-mono">
                  {currentAct.adTitle}
                </span>
              </div>
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-accent shrink-0 animate-pulse" />
                <span className="text-[9px] font-black text-white tracking-widest font-mono">
                  {adCountdown > 0 ? `${currentAct.adTicking} ${adCountdown} ${currentAct.seconds}` : currentAct.processing}
                </span>
              </div>
            </div>

            {/* Beautiful video element looping */}
            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative border border-white/10 shadow-inner group/ad-player">
              <video
                className="w-full h-full object-cover"
                src="https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4"
                autoPlay
                loop
                muted={adMuted}
                playsInline
              />
              {/* Media Controls inside simulated player */}
              <div className="absolute bottom-3 right-3 z-10">
                <button
                  type="button"
                  onClick={() => setAdMuted(!adMuted)}
                  className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors border border-white/15 cursor-pointer flex items-center justify-center shadow-lg"
                >
                  {adMuted ? <BellOff className="w-4 h-4 text-white" /> : <Bell className="w-4 h-4 text-brand-accent animate-pulse" />}
                </button>
              </div>

              {adCountdown > 0 && (
                <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none">
                  <div className="absolute inset-0 bg-slate-900/15 animate-none" />
                  <div className="p-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center scale-90 md:scale-100">
                    <Sparkles className="w-6 h-6 text-yellow-500 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Ad Progress Bar */}
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5 shrink-0">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-1000 ease-linear" 
                style={{ width: `${((15 - adCountdown) / 15) * 100}%` }}
              />
            </div>

            {/* Informational Text & Claim Button */}
            <div className="text-center w-full z-10">
              {isAdReadyToClaim ? (
                <button
                  type="button"
                  onClick={handleClaimAdPass}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs tracking-widest uppercase transition-all shadow-xl shadow-emerald-500/10 active:scale-95 cursor-pointer flex items-center justify-center gap-2.5"
                >
                  <Check className="w-4 h-4 text-white font-black" />
                  <span>{currentAct.watchAdBtn.replace('🔓', '⚡')}</span>
                </button>
              ) : (
                <p className="text-[11px] text-brand-text-muted leading-relaxed uppercase font-black tracking-wider py-2">
                  🎁 {currentAct.watchAdDesc}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const MUSIC_TRACKS = [
  {
    id: 'kurdish-folk-saz',
    title: 'polad majd xushtren dawat 2026',
    artist: 'Polad Majd',
    url: 'https://youtu.be/BHGxSpPSYHA?si=9GBtGEcNayoPFThI',
    cover: 'https://i.postimg.cc/ykrfVcXb/image.png',
    duration: '26:14',
    category: 'Kurdish',
    playCount: '124,512'
  },
  {
    id: 'slemani-rain',
    title: 'polad majd xushtren ga3da 2026',
    artist: 'Polad Majd',
    url: 'https://youtu.be/gTHk6H_SJQA?si=AK6ig5H3HOVhqLeW',
    cover: 'https://i.postimg.cc/ykrfVcXb/image.png',
    duration: '12:38',
    category: 'Kurdish',
    playCount: '194,512'
  }
];

// Music filter helper is now defined inside App component using stateful musicTracks

const getYoutubeId = (url: string) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
};

const formatTimeSec = (seconds: number) => {
  if (isNaN(seconds) || seconds === Infinity) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const parseDurationToSeconds = (durStr: string) => {
  if (!durStr) return 0;
  const parts = durStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }
  if (parts.length === 3) {
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
  }
  return parseInt(durStr, 10) || 0;
};


export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('language');
      if (saved === 'Kurdish' || saved === 'Arabic' || saved === 'English' || saved === 'Badini') {
        return saved as Language;
      }
    } catch (e) {
      console.warn("localStorage is blocked or unavailable:", e);
    }
    return 'Badini';
  });

  const t = TRANSLATIONS[language];

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        return Notification.permission;
      } catch (e) {
        console.warn("Could not read Notification.permission:", e);
      }
    }
    return 'default';
  });

  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState<boolean>(false);
  const [checkingUpdate, setCheckingUpdate] = useState<boolean>(false);
  const [manualUpdateChecked, setManualUpdateChecked] = useState<boolean>(false);

  const triggerNotification = useCallback((title: string, body: string, iconUrl?: string) => {
    if (typeof window === 'undefined') return;
    const isGranted = 'Notification' in window && Notification.permission === 'granted';
    if (isGranted) {
      const icon = iconUrl || 'https://i.postimg.cc/QxGcmFd3/file-0000000004b47246b78b315ac6479e1d.png';
      
      // Prioritize Service Worker registration's showNotification (more robust on mobile & PWAs)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, {
            body,
            icon,
            badge: icon,
            vibrate: [100, 50, 100],
            data: { url: window.location.origin }
          } as any).catch(err => {
            console.warn("Failed standard SW notification, falling back to constructor:", err);
            try {
              new Notification(title, { body, icon });
            } catch (fallbackErr) {
              console.error("All notification methods failed:", fallbackErr);
            }
          });
        }).catch(() => {
          // Fallback if service worker ready fails
          try {
            new Notification(title, { body, icon });
          } catch (e) {
            console.error("Failed notification constructor:", e);
          }
        });
      } else {
        // Direct constructor fallback if service worker is not supported
        try {
          new Notification(title, { body, icon });
        } catch (e) {
          console.error("Failed notification constructor fallback:", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Check for service worker registration status for updating the app
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      setSwRegistration(reg);

      // If a waiting service worker is active on mounting
      if (reg.waiting) {
        setSwUpdateAvailable(true);
      }

      // If a service worker is installing or found
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // A new app build/version is ready and waiting to reload
                setSwUpdateAvailable(true);
              }
            }
          });
        }
      });
    });

    // Handle controller change (automatically reload when skip_waiting triggers)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  // Trigger system notification when a service worker/app update is available
  useEffect(() => {
    if (swUpdateAvailable) {
      const title = t.websiteUpdateTitle || 'Website Update Available';
      const desc = t.websiteUpdateDesc || 'An update for AMEDI TV is ready. Apply it to get the newest features and streams.';
      triggerNotification(title, desc);
    }
  }, [swUpdateAvailable, language, triggerNotification]);

  const handleApplySwUpdate = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  const handleManualCheckUpdate = async () => {
    if (typeof window === 'undefined') return;
    setCheckingUpdate(true);
    setManualUpdateChecked(false);
    
    let foundUpdate = false;
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
          if (reg.waiting) {
            setSwUpdateAvailable(true);
            foundUpdate = true;
          }
        }
      }
    } catch (e) {
      console.warn("Service worker registration update check error:", e);
    }

    try {
      const serverUpdate = await checkUpdate();
      if (serverUpdate) {
        foundUpdate = true;
      }
    } catch (e) {
      console.warn("Server update check error:", e);
    }

    setTimeout(() => {
      setCheckingUpdate(false);
      setManualUpdateChecked(true);
    }, 1200);
  };

  const handleRequestNotificationPermission = async () => {
    const title = t.notificationSuccessTitle || 'Amedi TV Notifications';
    const desc = t.notificationSuccessDesc || 'You will now receive alerts whenever channels are added or updated!';

    if (typeof window === 'undefined') return;

    if (!('Notification' in window) || typeof Notification.requestPermission !== 'function') {
      // Direct in-app fallback simulation for unsupported/sandboxed environments (e.g. iframes)
      setNotificationPermission('granted');
      setLiveAnnouncement({ title, desc });
      return;
    }

    try {
      // Wrapper supporting promise and callback-style Notification.requestPermission
      const requestPermissionPromise = new Promise<NotificationPermission>((resolve) => {
        try {
          const res = Notification.requestPermission(resolve);
          if (res && typeof res.then === 'function') {
            res.then(resolve).catch(() => {
              // Ignore promise rejection and let callback resolve
            });
          }
        } catch (e) {
          try {
            Notification.requestPermission().then(resolve).catch((err) => {
              console.error("Callback-less requestPermission failed:", err);
              resolve('default');
            });
          } catch (innerErr) {
            console.error("All notification request methods failed:", innerErr);
            resolve('default');
          }
        }
      });
      const permission = await requestPermissionPromise;
      setNotificationPermission(permission);
      
      // Always trigger in-app announcement banner as a fallback/visual confirmation
      setLiveAnnouncement({ title, desc });

      if (permission === 'granted') {
        triggerNotification(title, desc);
      }
    } catch (err) {
      console.error("Error requesting notification permission, falling back to in-app simulation:", err);
      setNotificationPermission('granted');
      setLiveAnnouncement({ title, desc });
    }
  };

  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [adsConfig, setAdsConfig] = useState<any>({
    adsEnabled: false,
    adSenseEnabled: false,
    adSenseAutoAdsEnabled: false,
    autoChangeAdsEnabled: false,
    autoChangeInterval: 10,
    adSenseClientId: "ca-pub-3940256099942544",
    adSenseSlotId: "1234567890",
    customBannerActive: false,
    customBanners: [
      {
        id: "ad-banner-1",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop",
        url: "https://www.snapchat.com/add/savan10.ten?share_id=P_WZNoKBOyw&locale=en-US",
        title: "AMEDI TV Sponsor Banner Slot!",
        desc: "Sponsor or display your business, website, or social media handle here. Dynamically configured with Google AdSense and custom graphic rotation. Tap/Click to contact Savan Amedi!"
      }
    ],
    placements: {
      belowCategories: false,
      insidePlayer: false
    }
  });

  // Root-level Auto Ads script injection for Google AdSense
  useEffect(() => {
    const scriptId = 'google-adsense-autoads-script';
    if (adsConfig && adsConfig.adsEnabled && adsConfig.adSenseEnabled && adsConfig.adSenseAutoAdsEnabled && adsConfig.adSenseClientId) {
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsConfig.adSenseClientId}`;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
        console.log(`[AdSense] Auto Ads script dynamically injected for client: ${adsConfig.adSenseClientId}`);
      } else {
        const expectedSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsConfig.adSenseClientId}`;
        if (script.src !== expectedSrc) {
          script.src = expectedSrc;
          console.log(`[AdSense] Auto Ads script updated for client: ${adsConfig.adSenseClientId}`);
        }
      }
    } else {
      const script = document.getElementById(scriptId);
      if (script) {
        script.remove();
        console.log(`[AdSense] Auto Ads script removed from head as it was disabled in settings`);
      }
    }
  }, [adsConfig]);

  const handleSaveAdsConfig = async (newConfig: any) => {
    try {
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });
      if (response.ok) {
        setAdsConfig(newConfig);
        if (newConfig.adsEnabled) {
          setStartupAdDismissed(false);
        }
        return true;
      }
    } catch (err) {
      console.error('Failed to programmatic update ads settings:', err);
    }
    return false;
  };

  const [proxyConfig, setProxyConfig] = useState<{ proxyType: 'local' | 'cloudflare'; cloudflareWorkerUrl: string }>({
    proxyType: 'local',
    cloudflareWorkerUrl: 'https://ameditv.kurdiish.workers.dev'
  });

  const handleSaveProxyConfig = async (newConfig: { proxyType: 'local' | 'cloudflare'; cloudflareWorkerUrl: string }) => {
    try {
      const response = await fetch('/api/proxy-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });
      if (response.ok) {
        setProxyConfig(newConfig);
        return true;
      }
    } catch (err) {
      console.error('Failed to update proxy configuration:', err);
    }
    return false;
  };

  const [activationConfig, setActivationConfig] = useState<{ requireActivation: boolean; validCodes: string[] }>({
    requireActivation: false,
    validCodes: ["AMEDI2029", "SAVAN10", "ACTIVE-TV"]
  });

  const [activatedPeriod, setActivatedPeriod] = useState<'1month' | '6months' | '1year' | 'ad_24h'>(() => {
    try {
      const plan = localStorage.getItem('amedi_tv_activated_plan');
      if (plan === '1month' || plan === '6months' || plan === '1year' || plan === 'ad_24h') {
        return plan as any;
      }
    } catch (_) {}
    return '6months';
  });

  const [activatedAt, setActivatedAt] = useState<number>(() => {
    try {
      const atStr = localStorage.getItem('amedi_tv_activated_at');
      if (atStr) return parseInt(atStr, 10);
    } catch (_) {}
    return Date.now();
  });

  const [isActivated, setIsActivated] = useState<boolean>(() => {
    try {
      const isAct = localStorage.getItem('amedi_tv_activated') === 'true';
      if (!isAct) return false;

      const atStr = localStorage.getItem('amedi_tv_activated_at');
      const plan = localStorage.getItem('amedi_tv_activated_plan') || '6months';
      if (!atStr) return true; // fallback for pre-existing activations

      const at = parseInt(atStr, 10);
      let durationDays = 180;
      if (plan === '1month') durationDays = 30;
      else if (plan === '1year') durationDays = 365;
      else if (plan === 'ad_24h') durationDays = 1;

      const expirationTime = at + (durationDays * 24 * 60 * 60 * 1000);
      const isExpired = Date.now() > expirationTime;

      if (isExpired) {
        localStorage.removeItem('amedi_tv_activated');
        localStorage.removeItem('amedi_tv_activated_plan');
        localStorage.removeItem('amedi_tv_activated_at');
        return false;
      }
      return true;
    } catch (_) {
      return false;
    }
  });

  const handleSaveActivationConfig = async (newConfig: { requireActivation: boolean; validCodes: string[] }) => {
    try {
      const response = await fetch('/api/admin/activation-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });
      if (response.ok) {
        setActivationConfig(newConfig);
        return true;
      }
    } catch (err) {
      console.error('Failed to update activation configuration:', err);
    }
    return false;
  };

  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [startupAdDismissed, setStartupAdDismissed] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [activeTab, setActiveTab] = useState<'tv' | 'music'>('tv');
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [moviesModalOpen, setMoviesModalOpen] = useState(false);
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(true);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [addChannelModalOpen, setAddChannelModalOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstallBannerVisible, setIsInstallBannerVisible] = useState(false);

  const getCustomChannels = (): Channel[] => {
    try {
      return JSON.parse(localStorage.getItem('amedi_custom_channels') || '[]');
    } catch (e) {
      return [];
    }
  };

  const handleAddNewChannel = (newChannel: Channel) => {
    setChannels(prev => [newChannel, ...prev]);
    try {
      const existing = getCustomChannels();
      localStorage.setItem('amedi_custom_channels', JSON.stringify([newChannel, ...existing]));
    } catch (e) {
      console.warn("localStorage block:", e);
    }
  };

  const [xtreamModalOpen, setXtreamModalOpen] = useState(false);

  const handleImportXtreamChannels = (newChannels: Channel[], newCats: string[]) => {
    setChannels(prev => {
      const filtered = prev.filter(c => !c.id.startsWith('xtream-'));
      return [...newChannels, ...filtered];
    });
    if (newCats && newCats.length > 0) {
      setCategories(prev => {
        const set = new Set([...prev, ...newCats.map(c => c as Category)]);
        return Array.from(set);
      });
      setCategory(newCats[0] as Category);
    }
    setActiveTab('tv');
    setSelectedChannel(null);
  };
  
  const [liveAnnouncement, setLiveAnnouncement] = useState<{ title: string; desc: string; logo?: string } | null>(null);

  // Music Section specific states
  const [musicTracks, setMusicTracks] = useState(MUSIC_TRACKS);
  const [activeMusicTrack, setActiveMusicTrack] = useState<{ id: string, title: string, artist: string, url: string, cover: string, duration: string, category: string, playCount: string } | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicProgress, setMusicProgress] = useState(0); // 0 to 100
  const [musicDurationSec, setMusicDurationSec] = useState(0);
  const [musicCurrentTimeSec, setMusicCurrentTimeSec] = useState(0);
  const [musicVolume, setMusicVolume] = useState(80); // 0 to 100
  const [musicFilter, setMusicFilter] = useState<'All' | 'Kurdish' | 'Arabic' | 'Ambient'>('All');
  const [musicMuted, setMusicMuted] = useState(false);

  const getFilteredTracks = (filter: string) => {
    return musicTracks.filter(t => {
      if (filter === 'All') return true;
      return t.category === filter;
    });
  };

  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || c.categories.includes(category);
      return matchesSearch && matchesCategory;
    });
  }, [search, category, channels]);

  const isRtl = language === 'Kurdish' || language === 'Badini' || language === 'Arabic';

  const availableCategories = useMemo(() => {
    const used = new Set<Category>(['All']);
    channels.forEach(c => c.categories.forEach(cat => used.add(cat)));
    return categories.filter(cat => used.has(cat) && cat !== 'Music');
  }, [channels, categories]);

  // Real-time Update Stream Listener (Server-Sent Events)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const eventSource = new EventSource('/api/updates/stream');

    eventSource.addEventListener('connected', () => {
      console.log('[SSE] Live updates connection established successfully!');
    });

    const handleChannelUpdate = (event: MessageEvent, isEdit: boolean) => {
      try {
        const data = JSON.parse(event.data);
        if (data.version) {
          setCurrentVersion(data.version);
        }

        if (data.channel) {
          const chName = data.channel.name;
          const chLogo = data.channel.logo;

          // Local state hot update - updates the active listing immediately
          setChannels(prev => {
            const index = prev.findIndex(c => c.name.toLowerCase() === chName.toLowerCase());
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = data.channel;
              return updated;
            } else {
              return [...prev, data.channel];
            }
          });

          // Compile localized notification banners with explicit update instructions
          let title = '';
          let desc = '';
          switch (language) {
            case 'Kurdish':
              title = isEdit ? 'کەناڵی تەلەفزیۆنی نوێکرایەوە!' : 'کەناڵێکی نوێ زیادکرا!';
              desc = `«${chName}» بەردەستە لەسەر ئامێدی تیڤی! تکایە ئەپەکە نوێ بکەرەوە بۆ تەماشاکردن.`;
              break;
            case 'Badini':
              title = isEdit ? 'کەنال هاتە نوژەنکرن!' : 'کەنالەک د نوێ هاتە زێدەکرن!';
              desc = `«${chName}» یا بەرهەڤە ل سەر ئامێدی تیڤی! هیڤی دکەین ئەپی نوژەن بکەی بۆ دیتنێ.`;
              break;
            case 'Arabic':
              title = isEdit ? 'تم تحديث القناة!' : 'تم إضافة قناة جديدة!';
              desc = `«${chName}» متاحة الآن على أميدي تي في! يرجى تحديث التطبيق لمشاهدتها.`;
              break;
            default:
              title = isEdit ? 'Channel Updated!' : 'New Channel Added!';
              desc = `«${chName}» is now available on AMEDI TV! Please update the app to watch.`;
              break;
          }

          // Trigger System Notification
          triggerNotification(title, desc, chLogo);

          // Update Live Overlay banner
          setLiveAnnouncement({ title, desc, logo: chLogo });
        }
      } catch (err) {
        console.error('[SSE] Error processing update payload:', err);
      }
    };

    const onAdded = (e: MessageEvent) => handleChannelUpdate(e, false);
    const onUpdated = (e: MessageEvent) => handleChannelUpdate(e, true);
    const onCustomAnnouncement = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.title && data.desc) {
          triggerNotification(data.title, data.desc, data.logo);
          setLiveAnnouncement({ title: data.title, desc: data.desc, logo: data.logo });
        }
      } catch (err) {
        console.error('[SSE] Error processing custom-announcement:', err);
      }
    };

    const onAdsConfigUpdated = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.config) {
          setAdsConfig(data.config);
          console.log('[SSE] Ads configurations modified by admin in real-time!', data.config);
        }
      } catch (err) {
        console.error('[SSE] Error processing ads-config-updated:', err);
      }
    };

    const onActivationConfigUpdated = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.config) {
          setActivationConfig(data.config);
          console.log('[SSE] Activation configurations modified by admin in real-time!', data.config);
        }
      } catch (err) {
        console.error('[SSE] Error processing activation-config-updated:', err);
      }
    };

    const onProxyConfigUpdated = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.config) {
          setProxyConfig(data.config);
          console.log('[SSE] Proxy configurations modified by admin in real-time!', data.config);
        }
      } catch (err) {
        console.error('[SSE] Error processing proxy-config-updated:', err);
      }
    };

    eventSource.onerror = () => {
      // Quiet down standard automatic reconnections to ensure console remains pristine
      if (eventSource.readyState === EventSource.CONNECTING) {
        console.debug('[SSE] EventSource is attempting to reconnect smoothly...');
      } else {
        console.debug('[SSE] EventSource connection was closed or encountered a reset.');
      }
    };

    eventSource.addEventListener('channel-added', onAdded as any);
    eventSource.addEventListener('channel-updated', onUpdated as any);
    eventSource.addEventListener('custom-announcement', onCustomAnnouncement as any);
    eventSource.addEventListener('ads-config-updated', onAdsConfigUpdated as any);
    eventSource.addEventListener('activation-config-updated', onActivationConfigUpdated as any);
    eventSource.addEventListener('proxy-config-updated', onProxyConfigUpdated as any);

    return () => {
      eventSource.removeEventListener('channel-added', onAdded as any);
      eventSource.removeEventListener('channel-updated', onUpdated as any);
      eventSource.removeEventListener('custom-announcement', onCustomAnnouncement as any);
      eventSource.removeEventListener('ads-config-updated', onAdsConfigUpdated as any);
      eventSource.removeEventListener('activation-config-updated', onActivationConfigUpdated as any);
      eventSource.removeEventListener('proxy-config-updated', onProxyConfigUpdated as any);
      eventSource.close();
    };
  }, [language]);

  // Clear announcement after 6 seconds if active
  useEffect(() => {
    if (!liveAnnouncement) return;
    const timer = setTimeout(() => {
      setLiveAnnouncement(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [liveAnnouncement]);

  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [pipChannel, setPipChannel] = useState<Channel | null>(null);

  useEffect(() => {
    if (selectedChannel) {
      setPipChannel(null);
      setIsMusicPlaying(false);
      const audio = document.getElementById('music-audio-element') as HTMLAudioElement;
      if (audio) {
        audio.pause();
      }
      setActiveTab('tv');
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (category !== 'All' && activeTab === 'music') {
      setActiveTab('tv');
    }
  }, [category, activeTab]);

  // Initializer / Reset when a music track changes
  useEffect(() => {
    if (!activeMusicTrack) return;
    const isYoutube = activeMusicTrack.url.includes('youtube.com') || activeMusicTrack.url.includes('youtu.be');
    if (isYoutube) {
      setMusicCurrentTimeSec(0);
      setMusicProgress(0);
      const totalSec = parseDurationToSeconds(activeMusicTrack.duration);
      setMusicDurationSec(totalSec);
    }
  }, [activeMusicTrack?.id]);

  // Handle Play/Pause operations for HTML5 Audio & YouTube PostMessage commands
  useEffect(() => {
    if (!activeMusicTrack) return;
    const isYoutube = activeMusicTrack.url.includes('youtube.com') || activeMusicTrack.url.includes('youtu.be');
    
    // Control HTML5 element
    const audio = document.getElementById('music-audio-element') as HTMLAudioElement;
    if (audio) {
      if (isMusicPlaying && !isYoutube) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    }

    // Control YouTube iframe using postMessage API
    if (isYoutube) {
      const iframe = document.getElementById('youtube-hidden-player') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        try {
          if (isMusicPlaying) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
          } else {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
          }
        } catch (e) {
          console.error('[YouTube Control error]', e);
        }
      }
    }
  }, [activeMusicTrack, isMusicPlaying]);

  // Synchronize music volume & mute state dynamically on both HTML5 audio and YouTube hidden player
  useEffect(() => {
    const targetVol = musicMuted ? 0 : musicVolume;

    // HTML5 element
    const audio = document.getElementById('music-audio-element') as HTMLAudioElement;
    if (audio) {
      audio.volume = targetVol / 100;
      audio.muted = musicMuted;
    }

    // YouTube iframe
    const isYoutube = activeMusicTrack?.url.includes('youtube.com') || activeMusicTrack?.url.includes('youtu.be');
    if (isYoutube) {
      const iframe = document.getElementById('youtube-hidden-player') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        try {
          if (musicMuted) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: '' }), '*');
          } else {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: '' }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [targetVol] }), '*');
          }
        } catch (e) {
          console.error('[YouTube Volume Control Error]', e);
        }
      }
    }
  }, [activeMusicTrack, musicVolume, musicMuted, isMusicPlaying]);

  // Continuous timer tick updater for YouTube track progress bar
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const isYoutube = activeMusicTrack?.url.includes('youtube.com') || activeMusicTrack?.url.includes('youtu.be');

    if (isMusicPlaying && isYoutube && activeMusicTrack) {
      const totalSec = parseDurationToSeconds(activeMusicTrack.duration);
      interval = setInterval(() => {
        setMusicCurrentTimeSec(prev => {
          if (prev >= totalSec) { // Finished playing
            const filtered = getFilteredTracks(musicFilter);
            const currentIdx = filtered.findIndex(t => t.id === activeMusicTrack.id);
            if (currentIdx !== -1 && currentIdx < filtered.length - 1) {
              setActiveMusicTrack(filtered[currentIdx + 1]);
            } else if (filtered.length > 0) {
              setActiveMusicTrack(filtered[0]);
            }
            return 0;
          }
          const next = prev + 1;
          setMusicProgress((next / totalSec) * 100);
          return next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMusicPlaying, activeMusicTrack, musicFilter]);

  const [tvMode, setTvMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tvModeEnabled');
      if (saved) return saved === 'true';
    } catch (_) {}
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      // Expanded matching for Android TV, Google TV, Firestick, Apple TV, Mi Box, Mi TV, Sony, Bravia, Philips, LG webOS, Samsung Tizen
      return /android.*tv|smart[- ]?tv|googletv|appletv|firetv|firestick|tizen|webos|netcast|viera|maemo|xbox|playstation|hdmi|chromecast|bravia|philips|sharp|mibox|mitv|roku/i.test(ua);
    }
    return false;
  });

  const [tvFocusZone, setTvFocusZone] = useState<'info' | 'categories' | 'channels'>('channels');
  const [tvFocusIndex, setTvFocusIndex] = useState<number>(0);

  const [cols, setCols] = useState(2);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      const w = window.innerWidth;
      const c = w >= 1280 ? 6 : w >= 1024 ? 5 : w >= 768 ? 4 : w >= 640 ? 3 : 2;
      setCols(c);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // TV Remote navigation handler for main screen
  useEffect(() => {
    const handleTvKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        if (['Escape', 'Esc', 'BrowserBack', 'XF86Back', 'GoBack'].includes(e.key)) {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      const isBackKey = ['Backspace', 'Escape', 'Esc', 'BrowserBack', 'XF86Back', 'GoBack'].includes(e.key);
      const isEnterKey = ['Enter', 'OK', 'Select'].includes(e.key);
      const isArrowUp = ['ArrowUp', 'Up'].includes(e.key);
      const isArrowDown = ['ArrowDown', 'Down'].includes(e.key);
      const isArrowLeft = ['ArrowLeft', 'Left'].includes(e.key);
      const isArrowRight = ['ArrowRight', 'Right'].includes(e.key);

      const keys = [
        'ArrowUp', 'Up', 'ArrowDown', 'Down', 
        'ArrowLeft', 'Left', 'ArrowRight', 'Right', 
        'Enter', 'OK', 'Select', 
        'Backspace', 'Escape', 'Esc', 'BrowserBack', 'XF86Back', 'GoBack'
      ];
      if (!keys.includes(e.key)) return;

      // Auto-enable TV mode on first remote control arrow or Enter press
      if (!tvMode && (isArrowUp || isArrowDown || isArrowLeft || isArrowRight || isEnterKey)) {
        setTvMode(true);
        try {
          localStorage.setItem('tvModeEnabled', 'true');
        } catch (_) {}
        
        setLiveAnnouncement({
          title: t.deviceModeTV || 'Smart TV Mode Active',
          desc: t.tvRemoteGuide || 'Use Arrows to browse, Enter to play, Backspace to exit player.'
        });
        e.preventDefault();
        return;
      }

      if (!tvMode) return;

      // If player view is open, PlayerView handles its own keydowns
      if (selectedChannel) {
        if (isBackKey) {
          setSelectedChannel(null);
          e.preventDefault();
        }
        return;
      }

      // If modal is open, backspace/escape closes it
      if (langModalOpen || infoModalOpen || settingsModalOpen || installModalOpen || voicePanelOpen) {
        if (isBackKey) {
          setLangModalOpen(false);
          setInfoModalOpen(false);
          setSettingsModalOpen(false);
          setInstallModalOpen(false);
          setVoicePanelOpen(false);
          e.preventDefault();
        }
        return;
      }

      // Main Navigation logic
      e.preventDefault();

      if (isArrowUp) {
        if (tvFocusZone === 'channels') {
          const nextIdx = tvFocusIndex - cols;
          if (nextIdx < 0) {
            setTvFocusZone('categories');
            setTvFocusIndex(Math.min(availableCategories.length - 1, Math.max(0, Math.floor(availableCategories.length / 2))));
          } else {
            setTvFocusIndex(nextIdx);
          }
        } else if (tvFocusZone === 'categories') {
          setTvFocusZone('info');
          setTvFocusIndex(0); // Search bar
        }
      } else if (isArrowDown) {
        if (tvFocusZone === 'info') {
          setTvFocusZone('categories');
          setTvFocusIndex(0);
        } else if (tvFocusZone === 'categories') {
          if (filteredChannels.length > 0) {
            setTvFocusZone('channels');
            setTvFocusIndex(0);
          }
        } else if (tvFocusZone === 'channels') {
          const nextIdx = tvFocusIndex + cols;
          if (nextIdx < filteredChannels.length) {
            setTvFocusIndex(nextIdx);
          }
        }
      } else if (isArrowLeft) {
        if (tvFocusZone === 'info') {
          setTvFocusIndex(prev => (prev === 0 ? 1 : 0));
        } else if (tvFocusZone === 'categories') {
          setTvFocusIndex(prev => {
            const nextVal = isRtl ? prev + 1 : prev - 1;
            if (nextVal < 0) return availableCategories.length - 1;
            if (nextVal >= availableCategories.length) return 0;
            return nextVal;
          });
        } else if (tvFocusZone === 'channels') {
          setTvFocusIndex(prev => {
            const nextVal = isRtl ? prev + 1 : prev - 1;
            if (nextVal < 0) return filteredChannels.length - 1;
            if (nextVal >= filteredChannels.length) return 0;
            return nextVal;
          });
        }
      } else if (isArrowRight) {
        if (tvFocusZone === 'info') {
          setTvFocusIndex(prev => (prev === 0 ? 1 : 0));
        } else if (tvFocusZone === 'categories') {
          setTvFocusIndex(prev => {
            const nextVal = isRtl ? prev - 1 : prev + 1;
            if (nextVal < 0) return availableCategories.length - 1;
            if (nextVal >= availableCategories.length) return 0;
            return nextVal;
          });
        } else if (tvFocusZone === 'channels') {
          setTvFocusIndex(prev => {
            const nextVal = isRtl ? prev - 1 : prev + 1;
            if (nextVal < 0) return filteredChannels.length - 1;
            if (nextVal >= filteredChannels.length) return 0;
            return nextVal;
          });
        }
      } else if (isEnterKey) {
        if (tvFocusZone === 'info') {
          if (tvFocusIndex === 0) {
            searchInputRef.current?.focus();
          } else {
            setInfoModalOpen(true);
          }
        } else if (tvFocusZone === 'categories') {
          setCategory(availableCategories[tvFocusIndex]);
          setTvFocusIndex(0);
        } else if (tvFocusZone === 'channels') {
          if (filteredChannels[tvFocusIndex]) {
            setSelectedChannel(filteredChannels[tvFocusIndex]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleTvKeyDown);
    return () => window.removeEventListener('keydown', handleTvKeyDown);
  }, [tvMode, tvFocusZone, tvFocusIndex, filteredChannels, availableCategories, cols, selectedChannel, langModalOpen, infoModalOpen, settingsModalOpen, installModalOpen, isRtl, voicePanelOpen]);

  // Smooth Focus Scroll handler for TV & Android TV remote navigation
  useEffect(() => {
    if (!tvMode) return;
    if (tvFocusZone === 'channels') {
      const activeCh = filteredChannels[tvFocusIndex];
      if (activeCh) {
        const el = document.getElementById(`grid-ch-${activeCh.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } else if (tvFocusZone === 'categories') {
      const el = document.getElementById(`grid-cat-${tvFocusIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    } else if (tvFocusZone === 'info') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [tvMode, tvFocusZone, tvFocusIndex, filteredChannels]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchClick = () => {
    setSelectedChannel(null);
    setCategory('All');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIos(isIosDevice);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    // Show install options only if we are not running as a standalone app already
    setShowInstallBtn(!isStandalone);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (showInstallBtn) {
      const isDismissed = localStorage.getItem('pwa_banner_dismissed') === 'true';
      if (!isDismissed) {
        const timer = setTimeout(() => {
          setIsInstallBannerVisible(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsInstallBannerVisible(false);
    }
  }, [showInstallBtn]);

  const handleDismissInstallBanner = () => {
    setIsInstallBannerVisible(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    setIsInstallBannerVisible(false);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('Install outcome:', outcome);
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    } else {
      setInstallModalOpen(true);
    }
  };

  // Global Escape key close modal handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedChannel) {
          setSelectedChannel(null);
        } else if (langModalOpen) {
          setLangModalOpen(false);
        } else if (infoModalOpen) {
          setInfoModalOpen(false);
        } else if (settingsModalOpen) {
          setSettingsModalOpen(false);
        } else if (installModalOpen) {
          setInstallModalOpen(false);
        } else if (voicePanelOpen) {
          setVoicePanelOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedChannel, langModalOpen, infoModalOpen, settingsModalOpen, installModalOpen, voicePanelOpen]);

  useEffect(() => {
    let minTimeElapsed = false;
    let dataLoaded = false;

    const timer = setTimeout(() => {
      minTimeElapsed = true;
      if (!dataLoaded) {
        console.warn('Initial data load took too long, bypassing with local channels & categories layout.');
        setChannels(CHANNELS);
        setCategories(CATEGORIES);
        setLoading(false);
        dataLoaded = true;
      }
      setShowSplash(false);
    }, 2800);

    async function loadData() {
      try {
        const adsRes = await fetch('/api/ads');
        if (adsRes.ok) {
          const adsData = await adsRes.json();
          setAdsConfig(adsData);
          if (adsData.adsEnabled) {
            setStartupAdDismissed(false);
          }
        }
      } catch (err) {
        console.warn('Failed to load initial ads configuration:', err);
      }

      try {
        const proxyRes = await fetch('/api/proxy-config');
        if (proxyRes.ok) {
          const proxyData = await proxyRes.json();
          setProxyConfig(proxyData);
        }
      } catch (err) {
        console.warn('Failed to load initial proxy configuration:', err);
      }

      try {
        const actRes = await fetch('/api/admin/activation-config');
        if (actRes.ok) {
          const actData = await actRes.json();
          setActivationConfig(actData);
        }
      } catch (err) {
        console.warn('Failed to load initial activation configuration:', err);
      }

      try {
        const response = await fetch('/api/channels');
        const custom = getCustomChannels();
        if (response.ok) {
          const data = await response.json();
          setChannels([...custom, ...(data.channels || CHANNELS)]);
          setCategories(data.categories || CATEGORIES);
          if (data.version) {
            setCurrentVersion(data.version);
          }
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error: any) {
        // Safe robust offline/restart local fallback
        if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
          console.debug('Failed to fetch channels, falling back to local list');
        } else {
          console.warn('Failed to load channels from API:', error?.message || error);
        }
        const custom = getCustomChannels();
        setChannels([...custom, ...CHANNELS]);
        setCategories(CATEGORIES);
      } finally {
        setLoading(false);
        dataLoaded = true;
        if (minTimeElapsed) {
          setShowSplash(false);
        }
      }
    }
    loadData();

    return () => clearTimeout(timer);
  }, []);

  // Sync / update channels from the server
  const updateChannels = async (silent = false) => {
    if (!silent) {
      setIsSyncing(true);
    }
    try {
      const response = await fetch('/api/channels');
      const custom = getCustomChannels();
      if (response.ok) {
        const data = await response.json();
        setChannels([...custom, ...(data.channels || CHANNELS)]);
        if (data.categories) {
          setCategories(data.categories);
        }
        if (data.version) {
          setCurrentVersion(data.version);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (e: any) {
      if (e?.name === 'TypeError' && e?.message?.includes('fetch')) {
        console.debug('Failed to sync channels (server is offline or restarting)');
      } else {
        console.warn('Silent channel sync failure:', e?.message || e);
      }
    } finally {
      if (!silent) {
        setTimeout(() => {
          setIsSyncing(false);
        }, 1200);
      }
    }
  };

  // Check for updates periodically in the background
  const checkUpdate = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
    try {
      const response = await fetch('/api/channels/version');
      if (response.ok) {
        const data = await response.json();
        if (data.version && currentVersion && data.version !== currentVersion) {
          setCurrentVersion(data.version);
          updateChannels(true); // Silent sync in the background
          return true;
        }
      }
    } catch (e: any) {
      if (e?.name === 'TypeError' && e?.message?.includes('fetch')) {
        console.debug('Could not check channel list version heartbeat (offline or server restart)');
      } else {
        console.warn('Could not check channel list version:', e?.message || e);
      }
    }
    return false;
  };

  useEffect(() => {
    if (loading || showSplash) return;

    const runCheck = () => {
      checkUpdate();
    };

    // Check version every 30 seconds for optimal background performance
    const interval = setInterval(runCheck, 30000);
    return () => clearInterval(interval);
  }, [currentVersion, loading, showSplash, language]);




  if (loading && !showSplash) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
          <p className="font-bold uppercase tracking-widest text-xs opacity-50">{t.initializingServer}</p>
        </div>
      </div>
    );
  }

  if (activationConfig.requireActivation && !isActivated) {
    return (
      <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen relative bg-brand-bg overflow-x-hidden selection:bg-brand-accent/30">
        <AnimatePresence>
          {showSplash && <SplashScreen key="splash-screen" t={t} />}
        </AnimatePresence>

        {!showSplash && (
          <ActivationScreen
            onActivateSuccess={(plan) => {
              setIsActivated(true);
              setActivatedPeriod(plan);
              setActivatedAt(Date.now());
            }}
            language={language}
            setLanguage={(lang) => {
              setLanguage(lang);
              try {
                localStorage.setItem('language', lang);
              } catch (e) {
                console.warn("localStorage block:", e);
              }
            }}
            t={t}
            isRtl={isRtl}
            adsConfig={adsConfig}
          />
        )}
      </div>
    );
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen pb-24 relative bg-brand-bg overflow-x-hidden selection:bg-brand-accent/30">
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash-screen" t={t} />}
      </AnimatePresence>

      {/* App Header */}
      <header className="w-full max-w-6xl mx-auto px-4 pt-10 pb-4 flex flex-row items-center justify-between shrink-0">
        <div className="flex flex-row items-center">
          <div className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-[#1a1433] shadow-md flex items-center justify-center ${isRtl ? 'ml-3' : 'mr-3'}`}>
            <img 
              src="https://i.postimg.cc/QxGcmFd3/file-0000000004b47246b78b315ac6479e1d.png" 
              alt="AMEDI TV Logo" 
              className="w-12 h-12 object-cover block shrink-0" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">AMEDI <span className="text-brand-accent">TV</span></h1>
            <div className="flex flex-row items-center mt-1">
              <span className={`w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ${isRtl ? 'ml-1.5' : 'mr-1.5'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{t.networkOnline}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-row items-center">
          {showInstallBtn && (
            <button
              onClick={handleInstallClick}
              className={`px-4 py-2.5 text-[11px] md:text-xs font-black uppercase tracking-widest rounded-full bg-brand-accent/20 hover:bg-brand-accent/30 text-white border border-brand-accent/30 flex flex-row items-center transition-all cursor-pointer shadow-lg shadow-brand-accent/5 hover:scale-[1.03] active:scale-95 ${isRtl ? 'ml-2' : 'mr-2'}`}
            >
              <Download className={`w-3.5 h-3.5 text-brand-accent ${isRtl ? 'ml-1.5' : 'mr-1.5'}`} />
              <span>{t.installApp}</span>
            </button>
          )}



          <button 
            onClick={() => setInfoModalOpen(true)}
            className={`p-3 rounded-full transition-all focus:outline-none focus:ring-4 focus:ring-brand-accent outline-none flex items-center justify-center shrink-0 ${tvMode && tvFocusZone === 'info' && tvFocusIndex === 1 ? 'ring-4 ring-purple-600 bg-brand-accent text-white scale-105' : 'bg-white/5 text-white/40 hover:text-white'}`}
          >
             <Info className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="w-full max-w-6xl mx-auto">
        {activeTab === 'tv' && (
          <>
            {tvMode && (
              <div className="mx-4 mb-3 bg-brand-accent/15 border border-brand-accent/25 rounded-2xl p-3.5 flex items-center justify-between text-xs animate-none" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-brand-accent animate-pulse" />
                  <span className="font-extrabold text-white">{t.deviceModeTV || 'Smart TV Mode'}</span>
                </div>
                <span className="text-[10px] text-brand-text-muted font-bold opacity-85 leading-tight">{t.tvRemoteGuide || 'Use Arrows to browse, Enter to select, Esc to return.'}</span>
              </div>
            )}

            <SearchBar 
              value={search} 
              onChange={setSearch} 
              placeholder={t.searchPlaceholder} 
              inputRef={searchInputRef}
              isRtl={isRtl}
              isTvFocused={tvMode && tvFocusZone === 'info' && tvFocusIndex === 0}
            />
                
            <div className="w-full overflow-x-auto no-scrollbar px-4 flex flex-row pb-4">
              {availableCategories.map((cat, idx) => {
                const isTvFocused = tvMode && tvFocusZone === 'categories' && tvFocusIndex === idx;
                return (
                  <button
                    key={cat}
                    id={`grid-cat-${idx}`}
                    onClick={() => {
                      setCategory(cat);
                      setTvFocusIndex(0);
                    }}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap outline-none flex items-center justify-center ${
                      category === cat
                        ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20 scale-105'
                        : 'bg-brand-card/50 text-brand-text-muted hover:bg-brand-card/80'
                    } ${isTvFocused ? 'ring-4 ring-purple-600 border-purple-500 scale-105 bg-brand-accent' : 'focus:outline-none focus:ring-4 focus:ring-brand-accent/50 focus:scale-105'} ${isRtl ? 'ml-2' : 'mr-2'}`}
                  >
                    {t[`category${cat}`] || cat}
                  </button>
                );
              })}
            </div>

            <AdBanner adsConfig={adsConfig} placement="belowCategories" isRtl={isRtl} />
          </>
        )}



            <audio
              id="music-audio-element"
              src={activeMusicTrack?.url || ''}
              onPlay={() => setIsMusicPlaying(true)}
              onPause={() => setIsMusicPlaying(false)}
              onTimeUpdate={(e) => {
                const audio = e.currentTarget;
                setMusicCurrentTimeSec(audio.currentTime);
                if (audio.duration) {
                  setMusicProgress((audio.currentTime / audio.duration) * 100);
                }
              }}
              onLoadedMetadata={(e) => {
                setMusicDurationSec(e.currentTarget.duration);
              }}
              onEnded={() => {
                const filtered = getFilteredTracks(musicFilter);
                const currentIdx = filtered.findIndex(t => t.id === activeMusicTrack?.id);
                if (currentIdx !== -1 && currentIdx < filtered.length - 1) {
                  setActiveMusicTrack(filtered[currentIdx + 1]);
                  setIsMusicPlaying(true);
                } else {
                  setActiveMusicTrack(filtered[0]);
                  setIsMusicPlaying(true);
                }
              }}
            />

            {activeTab === 'music' ? (
              <div className="px-4 py-6 max-w-6xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
                {/* Custom Music Hero Banner */}
                <div className="relative w-full h-[220px] md:h-[280px] rounded-[36px] overflow-hidden border border-white/10 group shadow-2xl bg-gradient-to-br from-purple-900/40 via-[#110c22] to-black mb-8 p-6 md:p-8 flex flex-col justify-end">
                  <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&q=80&w=1200')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                      <span className="flex items-center gap-1.5 text-brand-accent font-black text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 w-fit">
                        <Music2 className="w-3.5 h-3.5 animate-pulse" />
                        {language === 'English' ? 'Amedi Music Center' : language === 'Arabic' ? 'مركز عمادية للموسيقى' : 'سەنتەرا مۆزیکا ئامێدیێ'}
                      </span>
                      <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                        {language === 'English' ? 'Discover Kurdish & Oriental Melodies' : language === 'Arabic' ? 'اكتشف الألحان الكردية والشرقية' : 'ئاوازێن کوردی و رۆژهەلاتی دۆز بکە'}
                      </h2>
                      <p className="text-white/60 text-xs md:text-sm max-w-xl font-medium">
                        {language === 'English' ? 'Enjoy local curated music, live acoustic instruments, custom modern lo-fi beats, and traditional folklore, entirely commercial-free.' : 'استمتع بالموسيقى المحلية المنسقة، والآلات الحية، ونغمات اللو-فاي والفلولكلور الكردي بدون إعلانات.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Internal Genres/Filter Nav within Music Section */}
                <div className="flex gap-2.5 mb-6 overflow-x-auto no-scrollbar pb-2">
                  {(['All', 'Kurdish', 'Arabic', 'Ambient'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setMusicFilter(f)}
                      className={`px-5 py-2 rounded-2xl text-xs font-black tracking-wider uppercase transition-all duration-155 cursor-pointer ${
                        musicFilter === f
                          ? 'bg-white text-black font-extrabold shadow-lg shadow-white/10 scale-105'
                          : 'bg-brand-card/45 text-white/50 hover:bg-white/5 hover:text-white border border-white/5'
                      }`}
                    >
                      {f === 'All' ? (language === 'English' ? 'All Tracks' : 'هەموو') : f}
                    </button>
                  ))}
                </div>

                {/* Two-Column Layout: Tracks list and Active Player Block */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Track listing (spanning 12 cols on lg, or 8 on xl) */}
                  <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-3">
                    <div className="flex items-center justify-between px-3 text-xs font-bold text-white/40 tracking-wider uppercase pb-2 border-b border-white/5">
                      <div className="flex items-center gap-4">
                        <span className="w-6 text-center">#</span>
                        <span>{language === 'English' ? 'Title' : 'ناونیشان'}</span>
                      </div>
                      <div className="flex items-center gap-8">
                        <span>{language === 'English' ? 'Plays' : 'بینین'}</span>
                        <span className="w-12 text-center">{language === 'English' ? 'Time' : 'کاتی'}</span>
                      </div>
                    </div>

                    {getFilteredTracks(musicFilter)
                      .map((track, trackIdx) => {
                        const isCurrent = activeMusicTrack?.id === track.id;
                        return (
                          <div 
                            key={track.id}
                            onClick={() => {
                              setActiveMusicTrack(track);
                              setIsMusicPlaying(true);
                              setSelectedChannel(null);
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-3xl cursor-pointer border transition-all duration-150 group ${
                              isCurrent 
                                ? 'bg-gradient-to-r from-purple-900/30 to-brand-card/60 border-brand-accent/40 shadow-xl' 
                                : 'bg-brand-card/25 border-white/5 hover:bg-brand-card/45 hover:border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <span className="w-6 text-center text-xs text-white/30 font-bold font-mono">
                                {isCurrent && isMusicPlaying ? (
                                  <div className="flex items-end justify-center gap-0.5 w-4 h-4 mx-auto">
                                    <span className="w-0.5 bg-brand-accent rounded-full animate-[bounce_0.8s_infinite] h-4" />
                                    <span className="w-0.5 bg-brand-accent rounded-full animate-[bounce_0.6s_infinite_0.15s] h-4" />
                                    <span className="w-0.5 bg-brand-accent rounded-full animate-[bounce_0.9s_infinite_0.3s] h-4" />
                                    <span className="w-0.5 bg-brand-accent rounded-full animate-[bounce_0.7s_infinite_0.45s] h-4" />
                                  </div>
                                ) : (
                                  trackIdx + 1
                                )}
                              </span>
                              
                              <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md">
                                <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                  {isCurrent && isMusicPlaying ? (
                                    <Play className="w-4 h-4 fill-white text-white" />
                                  ) : (
                                    <Play className="w-4 h-4 fill-white text-white translate-x-0.5 scale-90" />
                                  )}
                                </div>
                              </div>

                              <div className="min-w-0 flex-1 text-left" dir="ltr">
                                <span className={`block font-extrabold text-sm truncate ${isCurrent ? 'text-brand-accent' : 'text-white group-hover:text-brand-accent'}`}>
                                  {track.title}
                                </span>
                                <span className="block text-[11px] text-brand-text-muted font-semibold truncate">
                                  {track.artist}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-5 shrink-0">
                              <span className="text-[10px] text-white/30 font-bold font-mono hidden sm:inline">
                                {track.playCount}
                              </span>
                              <span className="w-12 text-center text-xs text-brand-text-muted font-bold font-mono">
                                {track.duration}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMusicTracks(prev => prev.filter(t => t.id !== track.id));
                                  if (activeMusicTrack?.id === track.id) {
                                    setActiveMusicTrack(null);
                                    setIsMusicPlaying(false);
                                  }
                                }}
                                className="p-2 text-white/40 hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                                title="Remove Track"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Active Player Card Widget Panel (spanning 4 cols on lg screens, or visible at top/bottom) */}
                  {activeMusicTrack && (
                    <div className="lg:col-span-12 xl:col-span-4 glass-card border border-white/10 rounded-[36px] overflow-hidden p-6 shadow-2xl relative w-full flex flex-col items-center text-center">
                      <div className="absolute inset-0 bg-gradient-to-b from-[#1c1435]/40 via-transparent to-[#0a0614] pointer-events-none" />
                      
                      <span className="text-[9px] font-black tracking-widest text-brand-accent uppercase block mb-6 animate-pulse">
                        {language === 'English' ? 'NOW PLAYING MUSIC' : 'پەخشا نوکە یا مۆزیکێ'}
                      </span>

                      {/* Disc Cover Art with Hidden YouTube backend source for 'not video' selection */}
                      <div className="relative w-44 h-44 mb-6 shrink-0 shadow-2xl">
                        <div className="absolute inset-0 rounded-full border border-white/5 bg-black/40" />
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/10 animate-[spin_12s_linear_infinite]" style={{ animationPlayState: isMusicPlaying ? 'running' : 'paused' }}>
                          <img src={activeMusicTrack.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300'} alt={activeMusicTrack.title} className="w-full h-full object-cover shadow-2xl" />
                        </div>
                        {/* Center core disc hub */}
                        <div className="absolute inset-[37.5%] bg-[#0a0614] rounded-full border-4 border-white/10 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-brand-accent shadow" />
                        </div>

                        {/* Hidden YouTube Player for background audio stream playback when 'not video' preferred */}
                        {(activeMusicTrack.url.includes('youtube.com') || activeMusicTrack.url.includes('youtu.be')) && (
                          <iframe
                            id="youtube-hidden-player"
                            src={`https://www.youtube.com/embed/${getYoutubeId(activeMusicTrack.url)}?autoplay=1&enablejsapi=1`}
                            className="w-1 h-1 opacity-0 pointer-events-none absolute -z-50"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        )}
                      </div>

                      {/* Text info */}
                      <div className="w-full mb-6">
                        <span className="block font-black text-lg text-white tracking-tight leading-snug line-clamp-1">
                          {activeMusicTrack.title}
                        </span>
                        <span className="block text-xs font-bold text-brand-text-muted mt-1 uppercase tracking-wide">
                          {activeMusicTrack.artist}
                        </span>
                      </div>

                      {/* Equalizer animation bar */}
                      <div className="flex items-end justify-center gap-1.5 h-10 w-full mb-6 max-w-[200px]" dir="ltr">
                        {[16, 24, 32, 45, 12, 55, 30, 25, 40, 15, 35, 12].map((val, b) => (
                          <span 
                            key={b} 
                            style={{ 
                              height: isMusicPlaying ? `${val + Math.sin(Date.now() / 200 + b) * 10}%` : '8px',
                              transition: 'height 0.1s ease-in-out'
                            }}
                            className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full min-h-[4px]" 
                          />
                        ))}
                      </div>

                      {/* Timeline & seek track bar */}
                      <div className="w-full space-y-2 mb-6" dir="ltr">
                        <div className="relative pt-1">
                          <input 
                            type="range"
                            min="0"
                            max="100"
                            value={musicProgress || 0}
                            onChange={(e) => {
                              const nextProgress = parseFloat(e.target.value);
                              setMusicProgress(nextProgress);
                              const isYoutube = activeMusicTrack.url.includes('youtube.com') || activeMusicTrack.url.includes('youtu.be');
                              
                              if (isYoutube) {
                                const totalSec = parseDurationToSeconds(activeMusicTrack.duration);
                                const newTime = (nextProgress / 100) * totalSec;
                                setMusicCurrentTimeSec(newTime);
                                
                                const iframe = document.getElementById('youtube-hidden-player') as HTMLIFrameElement;
                                if (iframe && iframe.contentWindow) {
                                  try {
                                    iframe.contentWindow.postMessage(JSON.stringify({
                                      event: 'command',
                                      func: 'seekTo',
                                      args: [newTime, true]
                                    }), '*');
                                  } catch (err) {
                                    console.error('Failed seeking YouTube:', err);
                                  }
                                }
                              } else {
                                const audio = document.getElementById('music-audio-element') as HTMLAudioElement;
                                if (audio && audio.duration) {
                                  audio.currentTime = (nextProgress / 100) * audio.duration;
                                }
                              }
                            }}
                            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-white/10 accent-brand-accent hover:accent-purple-500 transition-all focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-black font-mono text-white/30">
                          <span>{formatTimeSec(musicCurrentTimeSec)}</span>
                          <span>{musicDurationSec > 0 ? formatTimeSec(musicDurationSec) : activeMusicTrack.duration}</span>
                        </div>
                      </div>

                      {/* Control Deck */}
                      <div className="flex items-center justify-center gap-6 w-full" dir="ltr">
                        <button 
                          onClick={() => {
                            const filtered = getFilteredTracks(musicFilter);
                            const currentIdx = filtered.findIndex(t => t.id === activeMusicTrack.id);
                            if (currentIdx > 0) {
                              setActiveMusicTrack(filtered[currentIdx - 1]);
                              setIsMusicPlaying(true);
                            } else {
                              setActiveMusicTrack(filtered[filtered.length - 1]);
                              setIsMusicPlaying(true);
                            }
                          }}
                          className="p-3.5 rounded-full bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5 active:scale-90 transition-all cursor-pointer"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button 
                          onClick={() => {
                            const isYoutube = activeMusicTrack.url.includes('youtube.com') || activeMusicTrack.url.includes('youtu.be');
                            if (isYoutube) {
                              setIsMusicPlaying(!isMusicPlaying);
                            } else {
                              const audio = document.getElementById('music-audio-element') as HTMLAudioElement;
                              if (audio) {
                                if (isMusicPlaying) {
                                  audio.pause();
                                } else {
                                  audio.play().catch(() => {});
                                }
                              }
                            }
                          }}
                          className="w-16 h-16 rounded-full bg-brand-accent hover:bg-purple-700 text-white flex items-center justify-center shadow-lg shadow-brand-accent/30 active:scale-95 transition-all cursor-pointer"
                        >
                          {isMusicPlaying ? (
                            <svg className="w-6 h-6 fill-white text-white" viewBox="0 0 24 24">
                              <rect x="5" y="4" width="4" height="16" rx="1" />
                              <rect x="15" y="4" width="4" height="16" rx="1" />
                            </svg>
                          ) : (
                            <Play className="w-6 h-6 fill-white text-white translate-x-0.5" />
                          )}
                        </button>

                        <button 
                          onClick={() => {
                            const filtered = getFilteredTracks(musicFilter);
                            const currentIdx = filtered.findIndex(t => t.id === activeMusicTrack.id);
                            if (currentIdx !== -1 && currentIdx < filtered.length - 1) {
                              setActiveMusicTrack(filtered[currentIdx + 1]);
                              setIsMusicPlaying(true);
                            } else {
                              setActiveMusicTrack(filtered[0]);
                              setIsMusicPlaying(true);
                            }
                          }}
                          className="p-3.5 rounded-full bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5 active:scale-90 transition-all cursor-pointer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Quick volume widget at bottom of panel */}
                      <div className="flex items-center gap-3 w-full mt-6 pt-6 border-t border-white/5" dir="ltr">
                        <button onClick={() => setMusicMuted(!musicMuted)} className="text-white/40 hover:text-white transition-colors cursor-pointer">
                          {musicMuted || musicVolume === 0 ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6L4.5 9H1.5v6h3l4.5 3.75V5.25z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-brand-accent animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            </svg>
                          )}
                        </button>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={musicMuted ? 0 : musicVolume}
                          onChange={(e) => {
                            const nextVol = parseInt(e.target.value, 10);
                            setMusicVolume(nextVol);
                            setMusicMuted(false);
                            const audio = document.getElementById('music-audio-element') as HTMLAudioElement;
                            if (audio) {
                              audio.volume = nextVol / 100;
                            }
                          }}
                          className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-brand-accent"
                        />
                      </div>

                    </div>
                  )}

                </div>
              </div>
            ) : (
              <main className="px-4 py-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {filteredChannels.map((channel: Channel, idx: number) => {
                    const globalIdx = channels.findIndex(c => c.id === channel.id) + 1;

                    return (
                      <ChannelCard 
                        key={channel.id} 
                        id={`grid-ch-${channel.id}`}
                        name={channel.name} 
                        logo={channel.logo} 
                        onClick={() => setSelectedChannel(channel)}
                        isTvFocused={tvMode && tvFocusZone === 'channels' && tvFocusIndex === idx}
                        chNumber={tvMode && globalIdx > 0 ? globalIdx : undefined}
                      />
                    );
                  })}
                </div>
                
                {filteredChannels.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-brand-text-muted">
                    <Search className="w-12 h-12 mb-4 opacity-20" />
                    <p>{t.noChannels}</p>
                  </div>
                )}
              </main>
            )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 h-20 glass-card rounded-[32px] flex flex-row items-center justify-around px-4 z-40 w-[92%] max-w-lg border border-white/10 shadow-2xl ring-1 ring-white/5">
        <button 
           onClick={() => { setActiveTab('tv'); setCategory('All'); setSearch(''); setSelectedChannel(null); }}
           className={`flex flex-col items-center gap-1 transition-all focus:outline-none focus:text-brand-accent focus:scale-110 duration-150 outline-none ${activeTab === 'tv' && !search && !selectedChannel ? 'text-brand-accent' : 'text-white/40 hover:text-white'}`}
        >
          <Home className="w-5.5 h-5.5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">{t.home}</span>
        </button>
        
        <button 
          onClick={() => setLangModalOpen(true)}
          className="flex flex-col items-center gap-1 text-white/40 hover:text-white focus:outline-none focus:text-brand-accent focus:scale-110 duration-150 outline-none transition-all"
        >
          <Globe className="w-5.5 h-5.5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">{t.language}</span>
        </button>

        <button 
           onClick={() => { setActiveTab('music'); setSelectedChannel(null); }}
           className={`flex flex-col items-center gap-1 transition-all focus:outline-none focus:text-brand-accent focus:scale-110 duration-150 outline-none ${activeTab === 'music' && !selectedChannel ? 'text-brand-accent' : 'text-white/40 hover:text-white'}`}
        >
          <Music2 className="w-5.5 h-5.5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">{t.categoryMusic}</span>
        </button>

        <button 
          onClick={() => setVoicePanelOpen(true)}
          className="relative group focus:outline-none focus:scale-105 duration-150 outline-none"
          title={language === 'English' ? 'Voice Control Assistance (Press V)' : 'هاریکاریا دەنگی (V دابگرە)'}
          id="btn-voice-nav-trigger"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#ff2d55] via-purple-500 to-indigo-500 flex items-center justify-center shadow-xl shadow-purple-500/40 -translate-y-8 border-8 border-brand-bg relative z-50 group-hover:scale-110 transition-transform active:scale-95 group-focus:scale-110 group-focus:ring-4 group-focus:ring-[#ff2d55]/50">
            <Mic className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
          <div className="absolute inset-0 bg-[#ff2d55]/20 blur-2xl rounded-full -translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button 
           onClick={() => setMoviesModalOpen(true)}
           className={`flex flex-col items-center gap-1 transition-all focus:outline-none focus:text-brand-accent focus:scale-110 duration-150 outline-none ${moviesModalOpen ? 'text-brand-accent' : 'text-white/40 hover:text-white'}`}
        >
          <Film className="w-5.5 h-5.5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">{t.categoryMovies}</span>
        </button>

        <button 
          onClick={() => setSettingsModalOpen(true)}
          className="flex flex-col items-center gap-1 text-white/40 hover:text-white focus:outline-none focus:text-brand-accent focus:scale-110 duration-150 outline-none transition-all"
        >
          <Settings className="w-5.5 h-5.5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">{t.settings}</span>
        </button>

        <button 
          onClick={() => setInfoModalOpen(true)}
          className="flex flex-col items-center gap-1 text-white/40 hover:text-white focus:outline-none focus:text-brand-accent focus:scale-110 duration-150 outline-none transition-all"
        >
          <Info className="w-5.5 h-5.5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">{t.info}</span>
        </button>
      </nav>

      <AnimatePresence>
        {selectedChannel && (
          <PlayerView 
            channel={selectedChannel} 
            onBack={() => setSelectedChannel(null)} 
            onSelectChannel={setSelectedChannel}
            onMinimizeToPip={(ch) => setPipChannel(ch)}
            t={t}
            allChannels={channels}
            adsConfig={adsConfig}
            isRtl={isRtl}
            proxyConfig={proxyConfig}
          />
        )}
        {pipChannel && !selectedChannel && (
          <MiniPlayer 
            channel={pipChannel}
            onExpand={() => {
              setSelectedChannel(pipChannel);
              setPipChannel(null);
            }}
            onClose={() => setPipChannel(null)}
            t={t}
            proxyConfig={proxyConfig}
          />
        )}
      </AnimatePresence>

      <LanguageModal 
        isOpen={langModalOpen} 
        onClose={() => setLangModalOpen(false)} 
        onSelect={(lang) => {
          setLanguage(lang);
          try {
            localStorage.setItem('language', lang);
          } catch (e) {
            console.warn("localStorage is blocked or unavailable:", e);
          }
        }}
        t={t}
      />

      <MoviesModal 
        isOpen={moviesModalOpen}
        onClose={() => setMoviesModalOpen(false)}
        language={language}
      />

      <InfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        t={t}
        language={language}
        notificationPermission={notificationPermission}
        onRequestPermission={handleRequestNotificationPermission}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        t={t}
        language={language}
        onLanguageChange={(lang) => {
          setLanguage(lang);
          try {
            localStorage.setItem('language', lang);
          } catch (e) {
            console.warn("localStorage is blocked or unavailable:", e);
          }
        }}
        currentVersion={currentVersion}
        onCheckUpdate={handleManualCheckUpdate}
        swUpdateAvailable={swUpdateAvailable}
        checkingUpdate={checkingUpdate}
        onApplySwUpdate={handleApplySwUpdate}
        tvMode={tvMode}
        onToggleTvMode={() => {
          const nextVal = !tvMode;
          setTvMode(nextVal);
          try {
            localStorage.setItem('tvModeEnabled', String(nextVal));
          } catch (_) {}
        }}
        adsConfig={adsConfig}
        onSaveAdsConfig={handleSaveAdsConfig}
        activationConfig={activationConfig}
        onSaveActivationConfig={handleSaveActivationConfig}
        isActivated={isActivated}
        activatedPeriod={activatedPeriod}
        activatedAt={activatedAt}
        onDeactivate={() => {
          try {
            localStorage.removeItem('amedi_tv_activated');
            localStorage.removeItem('amedi_tv_activated_plan');
            localStorage.removeItem('amedi_tv_activated_at');
          } catch (_) {}
          setIsActivated(false);
          setSettingsModalOpen(false);
        }}
        proxyConfig={proxyConfig}
        onSaveProxyConfig={handleSaveProxyConfig}
      />

      <PwaInstallModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        t={t}
        isIos={isIos}
        language={language}
      />




      {/* App Code/Website Version Update Notification Banner */}
      <AnimatePresence>
        {swUpdateAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-28 right-6 left-6 ${isRtl ? 'md:left-6 md:right-auto' : 'md:right-6 md:left-auto'} md:max-w-md bg-gradient-to-tr from-brand-bg to-brand-card border border-brand-accent/40 rounded-[30px] p-5 shadow-2xl z-[100] flex flex-col gap-4 text-white`}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[18px] bg-brand-accent/20 flex items-center justify-center border border-brand-accent/30 shrink-0">
                <RefreshCw className="w-6 h-6 text-brand-accent animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                <h4 className="text-xs font-black text-brand-accent uppercase tracking-wider flex items-center gap-1.5 justify-start">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.websiteUpdateTitle || 'Website Update Available'}</span>
                </h4>
                <p className="text-[11px] text-white/90 mt-1 leading-normal font-medium">
                  {t.websiteUpdateDesc || 'An update for AMEDI TV is ready. Apply it to get the newest features and streams.'}
                </p>
              </div>
              <button 
                onClick={() => setSwUpdateAvailable(false)} 
                className="p-1.5 rounded-full hover:bg-white/5 text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className={`flex ${isRtl ? 'justify-start' : 'justify-end'} gap-2`}>
              <button
                onClick={() => setSwUpdateAvailable(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all text-[11px]"
              >
                Later
              </button>
              <button
                onClick={handleApplySwUpdate}
                className="px-4 py-2 bg-brand-accent hover:opacity-90 active:scale-95 text-white font-black rounded-xl text-[11px] shadow-lg shadow-brand-accent/25 transition-all"
              >
                {t.websiteUpdateBtn || 'Reload & Update'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Channels Real-time Hot Notification Banner */}
      <AnimatePresence>
        {liveAnnouncement && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-28 right-6 left-6 ${isRtl ? 'md:left-6 md:right-auto' : 'md:right-6 md:left-auto'} md:max-w-md bg-brand-card/95 backdrop-blur-xl border border-pink-500/30 rounded-[30px] p-5 shadow-2xl z-[99] flex items-center gap-4 text-white`}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {liveAnnouncement.logo && (
              <div className="w-12 h-12 rounded-[18px] overflow-hidden bg-black/40 p-0.5 border border-white/10 shrink-0">
                <img src={liveAnnouncement.logo} alt="Channel Logo" className="w-full h-full object-cover rounded-[14px]" referrerPolicy="no-referrer" />
              </div>
            )}
            <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
              <h4 className="text-xs font-black text-pink-400 uppercase tracking-wider flex items-center gap-1.5 justify-start">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>{liveAnnouncement.title}</span>
              </h4>
              <p className="text-[11px] text-white/90 mt-1 leading-normal font-medium">{liveAnnouncement.desc}</p>
            </div>
            <button 
              onClick={() => setLiveAnnouncement(null)} 
              className="p-1.5 rounded-full hover:bg-white/5 text-white/40 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Bottom PWA Install Banner */}
      <AnimatePresence>
        {isInstallBannerVisible && (
          <motion.div
            initial={{ opacity: 0, y: 70, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-28 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-md bg-[#130f24]/95 backdrop-blur-xl border border-white/10 rounded-[28px] p-5 shadow-2xl z-[98] flex items-center justify-between gap-4 text-white"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center shrink-0 shadow-inner">
                <Tv className="w-7 h-7 text-brand-accent animate-pulse" />
              </div>
              <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
                <h4 className="text-sm md:text-base font-black text-white leading-snug tracking-tight truncate">
                  {language === 'Kurdish' ? 'دابەزاندنی ئامێدی تیڤی' :
                   language === 'Badini' ? 'داگرتنا ئامێدی تیڤی' :
                   language === 'Arabic' ? 'تثبيت أميدي تي في' : 'Install Amedi TV'}
                </h4>
                <p className="text-[11px] text-white/70 mt-0.5 leading-normal font-medium">
                  {language === 'Kurdish' ? 'بیخە سەر شاشەی سەرەکی بۆ بینینێکی بێ کێشە.' :
                   language === 'Badini' ? 'بێخە سەر شاشەیا سەرەکی بۆ دیتنەکا بێ ئاریشە.' :
                   language === 'Arabic' ? 'أضفه إلى الشاشة الرئيسية للاستخدام بملء الشاشة.' : 
                   'Add to home screen for a native, full-screen experience.'}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-5 py-2.5 bg-brand-accent hover:opacity-90 active:scale-95 text-white font-extrabold rounded-2xl text-[11px] md:text-xs shadow-lg shadow-brand-accent/20 transition-all cursor-pointer"
              >
                {language === 'Kurdish' || language === 'Badini' ? 'دامەزراندن' :
                 language === 'Arabic' ? 'تثبيت' : 'Install'}
              </button>
              <button
                onClick={handleDismissInstallBanner}
                className="text-white/40 hover:text-white hover:underline text-[10px] md:text-[11px] font-bold mt-1.5 transition-all cursor-pointer bg-transparent border-0 outline-none"
              >
                {language === 'Kurdish' || language === 'Badini' ? 'پاشان' :
                 language === 'Arabic' ? 'لاحقاً' : 'Later'}
              </button>
            </div>
          </motion.div>
        )}
        {!showSplash && !startupAdDismissed && (
          <motion.div
            key="startup-ad"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0f0a1e]/98 backdrop-blur-2xl z-[999] flex flex-col items-center justify-center p-4 selection:bg-brand-accent/30 overflow-y-auto font-sans"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <StartupAdModal
              adsConfig={adsConfig}
              isRtl={isRtl}
              language={language}
              onDismiss={() => setStartupAdDismissed(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Syncing Overlay */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/75 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-white"
          >
            <RefreshCw className="w-12 h-12 text-brand-accent animate-spin" />
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-bold uppercase tracking-[0.25em] text-xs text-brand-accent/90"
            >
              {t.updatingChannels}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessibility Voice Control Assistant */}
      <VoiceAssistant
        channels={channels}
        category={category}
        setCategory={setCategory}
        selectedChannel={selectedChannel}
        setSelectedChannel={setSelectedChannel}
        language={language}
        isRtl={isRtl}
        showPanel={voicePanelOpen}
        setShowPanel={setVoicePanelOpen}
      />
    </div>
  );
}
