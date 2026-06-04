import { motion, AnimatePresence } from 'motion/react';
import { Search, Globe, Home, Info, X, ChevronLeft, LayoutGrid, MonitorPlay, Cast, Play, Download, Smartphone, RefreshCw, Sparkles, Bell, BellOff, Share, Compass, Plus, Tv, Megaphone, Phone, MessageCircle, Ghost, Youtube, Instagram, Music2, Key, ExternalLink, Check } from 'lucide-react';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { Category, Language, Channel } from './types';
import { CHANNELS, CATEGORIES } from './data';

// --- Subcomponents ---

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
}

const ChannelCard: React.FC<ChannelCardProps> = ({ id, name, logo, onClick, isTvFocused }) => (
  <motion.button
    id={id}
    layout
    type="button"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`w-full bg-brand-card/40 rounded-[28px] p-5 flex flex-col items-center justify-center gap-4 text-center cursor-pointer border hover:bg-brand-card/60 transition-all shadow-xl hover:scale-[1.03] outline-none duration-150 ${isTvFocused ? 'ring-4 ring-purple-600 bg-brand-card/80 border-purple-500/50 scale-105' : 'border-white/5 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-accent focus:bg-brand-card/85'}`}
  >
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
  if (lowerUrl.includes('/hls/')) return true;
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

const PlayerView = ({ channel, onBack, onSelectChannel, t, allChannels, adsConfig, isRtl }: { channel: Channel, onBack: () => void, onSelectChannel: (c: Channel) => void, t: any, allChannels: Channel[], adsConfig: any, isRtl: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [canCast, setCanCast] = useState(false);
  const [tvFocusedChId, setTvFocusedChId] = useState<string | null>(channel.id);

  const resolvedStreamUrl = useMemo(() => {
    if (!channel.streamUrl) return '';
    if (channel.streamUrl.startsWith('https://ameditv.kurdiish.workers.dev')) {
      return channel.streamUrl;
    }
    if (channel.streamUrl.startsWith('/') || channel.streamUrl.startsWith('http://localhost') || channel.streamUrl.startsWith('https://localhost')) {
      return channel.streamUrl;
    }
    return `/api/proxy?url=${encodeURIComponent(channel.streamUrl)}`;
  }, [channel.streamUrl]);

  useEffect(() => {
    setTvFocusedChId(channel.id);
  }, [channel.id]);

  useEffect(() => {
    const handlePlayerKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if typing in any text fields
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const keys = ['ArrowLeft', 'Left', 'ArrowRight', 'Right', 'ArrowUp', 'Up', 'ArrowDown', 'Down', 'Enter', 'Backspace', 'Escape', 'Esc'];
      if (!keys.includes(e.key)) return;

      e.preventDefault();

      if (e.key === 'Backspace' || e.key === 'Escape' || e.key === 'Esc') {
        onBack();
        return;
      }

      const currentIndex = allChannels.findIndex(c => c.id === (tvFocusedChId || channel.id));
      if (currentIndex === -1) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'Left': {
          const prevIdx = currentIndex === 0 ? allChannels.length - 1 : currentIndex - 1;
          onSelectChannel(allChannels[prevIdx]);
          break;
        }
        case 'ArrowRight':
        case 'Right': {
          const nextIdx = currentIndex === allChannels.length - 1 ? 0 : currentIndex + 1;
          onSelectChannel(allChannels[nextIdx]);
          break;
        }
        case 'ArrowUp':
        case 'Up': {
          const prevIdx = currentIndex === 0 ? allChannels.length - 1 : currentIndex - 1;
          setTvFocusedChId(allChannels[prevIdx].id);
          const el = document.getElementById(`ch-btn-${allChannels[prevIdx].id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          break;
        }
        case 'ArrowDown':
        case 'Down': {
          const nextIdx = currentIndex === allChannels.length - 1 ? 0 : currentIndex + 1;
          const activeId = nextIdx === -1 ? allChannels[0].id : allChannels[nextIdx].id;
          setTvFocusedChId(activeId);
          const el = document.getElementById(`ch-btn-${activeId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          break;
        }
        case 'Enter': {
          const focusedCh = allChannels.find(c => c.id === tvFocusedChId);
          if (focusedCh) {
            onSelectChannel(focusedCh);
          }
          break;
        }
        default:
          break;
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
        if (err.name !== 'NotAllowedError' && !err.message?.includes('dismissed')) {
          console.error('Remote playback prompt failed', err);
        }
      }
    } else if ((video as any).webkitShowPlaybackTargetPicker) {
      (video as any).webkitShowPlaybackTargetPicker();
    }
  };

  useEffect(() => {
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
                  setError("noStream");
                  hls?.destroy();
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = resolvedStreamUrl;
          video.addEventListener('loadedmetadata', () => {
            video.play().catch(() => {});
          });
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
        <div className="flex-1 flex items-center justify-center relative group/player">

          <video 
            ref={videoRef}
            className="w-full h-full object-contain" 
            controls 
            playsInline
            autoPlay
            {...{ 
              "x-webkit-airplay": "allow",
              "disableRemotePlayback": false 
            }}
          />

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
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
          {allChannels.map((ch) => (
            <button
              key={ch.id}
              id={`ch-btn-${ch.id}`}
              onClick={() => onSelectChannel(ch)}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all border outline-none ${
                ch.id === channel.id 
                  ? 'bg-brand-accent/20 border-brand-accent/40 scale-[1.02]' 
                  : 'bg-brand-card/30 border-transparent hover:bg-brand-card/50'
              } ${ch.id === tvFocusedChId ? 'ring-4 ring-purple-600 border-purple-500 bg-brand-accent/15 scale-[1.02]' : 'focus:outline-none focus:ring-4 focus:ring-brand-accent focus:bg-brand-card/70 focus:scale-[1.02] focus:border-brand-accent/50'}`}
            >
              <img src={ch.logo} alt={ch.name} className="w-10 h-10 rounded-xl object-cover bg-black/20" referrerPolicy="no-referrer" />
              <div className="flex-1 text-start">
                <div className={`font-bold text-xs ${ch.id === channel.id ? 'text-brand-accent' : 'text-white'}`}>{ch.name}</div>
                <div className="text-[10px] text-brand-text-muted line-clamp-1">
                   {ch.categories.map(cat => t[`category${cat}`] || cat).join(', ')}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// --- Modals ---

const InfoModal = ({
  isOpen,
  onClose,
  t,
  language,
  notificationPermission,
  onRequestPermission,
  currentVersion,
  onCheckUpdate,
  swUpdateAvailable,
  checkingUpdate,
  manualUpdateChecked,
  onApplySwUpdate,
  tvMode,
  onToggleTvMode,
  adsConfig,
  onSaveAdsConfig,
  activationConfig,
  onSaveActivationConfig,
  isActivated,
  activatedPeriod,
  activatedAt,
  onDeactivate
}: {
  isOpen: boolean;
  onClose: () => void;
  t: any;
  language: Language;
  notificationPermission: NotificationPermission;
  onRequestPermission: () => Promise<void>;
  currentVersion: string;
  onCheckUpdate: () => Promise<void>;
  swUpdateAvailable: boolean;
  checkingUpdate: boolean;
  manualUpdateChecked: boolean;
  onApplySwUpdate: () => void;
  tvMode: boolean;
  onToggleTvMode: () => void;
  adsConfig: any;
  onSaveAdsConfig: (newConfig: any) => Promise<boolean>;
  activationConfig: { requireActivation: boolean; validCodes: string[] };
  onSaveActivationConfig: (newConfig: { requireActivation: boolean; validCodes: string[] }) => Promise<boolean>;
  isActivated: boolean;
  activatedPeriod: '1month' | '6months' | '1year';
  activatedAt: number;
  onDeactivate: () => void;
}) => {
  const isRtl = language === 'Kurdish' || language === 'Badini' || language === 'Arabic';

  // Broadcast Alert Form States
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [bcTitle, setBcTitle] = useState('');
  const [bcDesc, setBcDesc] = useState('');
  const [bcLogo, setBcLogo] = useState('');
  const [bcSubmitting, setBcSubmitting] = useState(false);
  const [bcMessage, setBcMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Ad Management State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [badPin, setBadPin] = useState(false);

  // Form states local to InfoModal (preloaded from adsConfig)
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [adSenseEnabled, setAdSenseEnabled] = useState(false);
  const [adSenseClientId, setAdSenseClientId] = useState('');
  const [adSenseSlotId, setAdSenseSlotId] = useState('');
  const [customBannerActive, setCustomBannerActive] = useState(true);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerDesc, setBannerDesc] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [placementBelowCat, setPlacementBelowCat] = useState(true);
  const [placementInsidePlayer, setPlacementInsidePlayer] = useState(true);

  const [savingAds, setSavingAds] = useState(false);
  const [saveAdsMsg, setSaveAdsMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Activation Management States
  const [newCodeInput, setNewCodeInput] = useState('');
  const [saveActMsg, setSaveActMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAddCode = async () => {
    if (!newCodeInput.trim()) return;
    const clean = newCodeInput.trim().toUpperCase();
    if (activationConfig.validCodes.map(c => c.toUpperCase()).includes(clean)) {
      setSaveActMsg({ type: 'error', text: 'This code is already active!' });
      return;
    }
    const nextCodes = [...activationConfig.validCodes, clean];
    const success = await onSaveActivationConfig({
      ...activationConfig,
      validCodes: nextCodes
    });
    if (success) {
      setNewCodeInput('');
      setSaveActMsg({ type: 'success', text: `Successfully added active code: ${clean}` });
    } else {
      setSaveActMsg({ type: 'error', text: 'Failed to add. Try again.' });
    }
  };

  const handleRemoveCode = async (codeToRemove: string) => {
    const nextCodes = activationConfig.validCodes.filter(c => c !== codeToRemove);
    const success = await onSaveActivationConfig({
      ...activationConfig,
      validCodes: nextCodes
    });
    if (success) {
      setSaveActMsg({ type: 'success', text: `Revoked code: ${codeToRemove}` });
    } else {
      setSaveActMsg({ type: 'error', text: 'Failed to revoke code.' });
    }
  };

  // Synchronize when adsConfig props updates
  useEffect(() => {
    if (adsConfig) {
      setAdsEnabled(!!adsConfig.adsEnabled);
      setAdSenseEnabled(!!adsConfig.adSenseEnabled);
      setAdSenseClientId(adsConfig.adSenseClientId || '');
      setAdSenseSlotId(adsConfig.adSenseSlotId || '');
      setCustomBannerActive(!!adsConfig.customBannerActive);
      if (adsConfig.customBanners?.[0]) {
        setBannerTitle(adsConfig.customBanners[0].title || '');
        setBannerDesc(adsConfig.customBanners[0].desc || '');
        setBannerImage(adsConfig.customBanners[0].image || '');
        setBannerUrl(adsConfig.customBanners[0].url || '');
      }
      if (adsConfig.placements) {
        setPlacementBelowCat(adsConfig.placements.belowCategories !== false);
        setPlacementInsidePlayer(adsConfig.placements.insidePlayer !== false);
      }
    }
  }, [adsConfig]);

  const handleUnlockAdmin = () => {
    if (pinInput === '2029') {
      setIsAdminUnlocked(true);
      setBadPin(false);
    } else {
      setBadPin(true);
    }
  };

  const handleSaveAds = async () => {
    setSavingAds(true);
    setSaveAdsMsg(null);
    const updated = {
      adsEnabled,
      adSenseEnabled,
      adSenseClientId,
      adSenseSlotId,
      customBannerActive,
      customBanners: [
        {
          id: 'ad-banner-1',
          image: bannerImage,
          url: bannerUrl,
          title: bannerTitle,
          desc: bannerDesc
        }
      ],
      placements: {
        belowCategories: placementBelowCat,
        insidePlayer: placementInsidePlayer
      }
    };
    
    const success = await onSaveAdsConfig(updated);
    setSavingAds(false);
    if (success) {
      setSaveAdsMsg({ type: 'success', text: 'Ad configuration successfully persisted!' });
    } else {
      setSaveAdsMsg({ type: 'error', text: 'Failed to update. Try again.' });
    }
  };

  const adLabels = {
    English: {
      sectionTitle: 'Monetization & Ads 📢',
      adminPinLabel: 'Enter Admin PIN (Default: 2029)',
      unlockBtn: 'Unlock Tools',
      pinError: 'Incorrect PIN!',
      globalEnable: 'Global Ads Enable',
      adSenseMode: 'Google AdSense Mode',
      clientId: 'AdSense Client ID (ca-pub-xxx)',
      slotId: 'AdSense Slot ID (10 digits)',
      customBannerMode: 'Custom Banners Mode',
      bannerTitle: 'Sponsor Banner Title',
      bannerDesc: 'Sponsor Banner Text / Hook',
      bannerImage: 'Banner Logo / Image URL',
      bannerUrl: 'Sponsor Link (Snapchat, Shop, etc.)',
      placementsTitle: 'Active Ad Placements',
      placeBelowCat: 'Show Below Channel Categories',
      placeInPlayer: 'Show Inside Video Player',
      saveBtn: 'Save Settings',
      saving: 'Saving...',
    },
    Kurdish: {
      sectionTitle: 'پڕۆگرامی ڕیکلام 📢',
      adminPinLabel: 'پینی بەڕێوەبەر بنووسە (بنەڕەتی: 2029)',
      unlockBtn: 'بیکەرەوە',
      pinError: 'کۆدی پین هەڵەیە!',
      globalEnable: 'چالاککردنی سەرجەم ڕیکلامەکان',
      adSenseMode: 'دۆخی گووڵ ئەدسێنس',
      clientId: 'ناسنامەی کڕیاری ئەدسێنس (Client ID)',
      slotId: 'ناسنامەی شوێنی ڕیکلام (Slot ID)',
      customBannerMode: 'دۆخی پانێڵی سپۆنسەری',
      bannerTitle: 'ناونیشانی ڕیکلامی سپۆنسەر',
      bannerDesc: 'دەقی سەرەکی ڕیکلامی سپۆنسەر',
      bannerImage: 'لینک یان هێڵکاری لۆگۆی سپۆنسەر',
      bannerUrl: 'بەستەری کلیک (سناپچات، دوکان، هتد.)',
      placementsTitle: 'شوێنی چالاکی ڕیکلامەکان',
      placeBelowCat: 'پیشاندان لە ژێر بەشەکان',
      placeInPlayer: 'پیشاندان لە ناو ڤیدیۆ پلەیەر',
      saveBtn: 'پاشەکەوت بکە',
      saving: 'خەریکی پاشەکەوتکردنە...',
    },
    Badini: {
      sectionTitle: 'سیستەما ریکلامێ 📢',
      adminPinLabel: 'کۆدێ پینێ رێڤەبەری بنڤیسە (دیاری: 2029)',
      unlockBtn: 'ڤەکە',
      pinError: 'کۆدێ پین خەلەتە!',
      globalEnable: 'چالاککرنا هەمی ریکلامان',
      adSenseMode: 'دۆخێ گوگل ئەدسێنس',
      clientId: 'ناسنامەیا کڕیارێ ئەدسێنس (Client ID)',
      slotId: 'ناسنامەیا شوینێ ریکلامێ (Slot ID)',
      customBannerMode: 'سیستەما پانێلا سپۆنسەری',
      bannerTitle: 'ناڤ و نیشانێ رەنگێ ریکلامێ',
      bannerDesc: 'پەیاما سەرەکی یا ریکلامێ',
      bannerImage: 'لینک یان نیشانی وێنەکێ سپۆنسەری',
      bannerUrl: 'بەحیات کەنالی (سناپ، مارکێت، هتد.)',
      placementsTitle: 'سوینێن بەلاڤکرنا ریکلامان',
      placeBelowCat: 'نیشاندان د بن بەشێن کەنالان دا',
      placeInPlayer: 'نیشاندان د ناڤ ڤیدیۆ پلەیەری دا',
      saveBtn: 'کۆپی بکە / پاشەکەوت بکە',
      saving: 'یێ دپارێزیت...',
    },
    Arabic: {
      sectionTitle: 'الإعلانات والربح 📢',
      adminPinLabel: 'أدخل رمز PIN للمسؤول (الافتراضي: 2029)',
      unlockBtn: 'تأكيد',
      pinError: 'رمز PIN غير صحيح!',
      globalEnable: 'تمكين الإعلانات العام',
      adSenseMode: 'وضع قوقل أدسنس (Google AdSense)',
      clientId: 'معرّف الناشر (Client ID)',
      slotId: 'معرّف الإعلان (Slot ID)',
      customBannerMode: 'وضع الإعلانات والبنرات المخصصة',
      bannerTitle: 'عنوان بنر الراعي',
      bannerDesc: 'نص ووصف الإعلان',
      bannerImage: 'رابط صورة أو شعار الراعي',
      bannerUrl: 'رابط التوجيه عند الضغط (سناب شات، متجر، إلخ)',
      placementsTitle: 'أماكن عرض الإعلانات',
      placeBelowCat: 'العرض تحت تبويبات القنوات',
      placeInPlayer: 'العرض داخل مشغل القنوات',
      saveBtn: 'حفظ الإعدادات',
      saving: 'جاري الحفظ والرفع...',
    }
  };

  const adl = adLabels[language] || adLabels.English;

  const broadcastLabels = {
    English: {
      btnToggle: 'Send Notification (Update App)',
      titleLabel: 'Alert Title',
      descLabel: 'Alert Message / Instructions',
      logoLabel: 'Logo/Icon URL (Optional)',
      placeholderTitle: 'e.g. Critical Update Available!',
      placeholderDesc: 'We added dynamic channels! Reload the app to sync.',
      placeholderLogo: 'https://example.com/icon.png',
      sendBtn: 'Broadcast Live Notification',
      sending: 'Broadcasting live...',
      success: 'Update notification broadcasted to all active devices!',
      errorRequired: 'Title and message are required!',
      errorServer: 'Communication error, please try again.',
      prefillBtn: 'Prefill App Update Presets',
    },
    Kurdish: {
      btnToggle: 'ناردنی ئاگاداریی نوێکردنەوە',
      titleLabel: 'ناونیشانی ئاگاداری',
      descLabel: 'ناوەرۆکی ئاگاداری / ڕێنمایی',
      logoLabel: 'بەستەری وێنە یان لۆگۆ (ئارەزوومەندانە)',
      placeholderTitle: 'بۆ نموونە: نوێکردنەوەیەکی گرنگ بەردەستە!',
      placeholderDesc: 'کەناڵی نوێ زیادکراوە! ئەپەکە دابخە و بیکەرەوە بۆ بینین.',
      placeholderLogo: 'هێڵکاری یان نیشانی وێنە',
      sendBtn: 'پەخش و بڵاوکردنەوە',
      sending: 'خەریکی پەخشکردنە...',
      success: 'ئاگاداری بۆ هەموو ئامێرەکان بەسەرکەوتوویی نێردرا!',
      errorRequired: 'تکایە هەردوو خانەکە پڕبکەرەوە!',
      errorServer: 'پەیوەندی سێرڤەر سەرکەوتوو نەبوو.',
      prefillBtn: 'نووسینی ئامادەکراوی وەشان',
    },
    Badini: {
      btnToggle: 'شاندنا ئاگەهداریا راستەوخۆ',
      titleLabel: 'ناڤ و نیشانێ ئاگەهداریێ',
      descLabel: 'پیام یان رێنماییێن ئاگەهداریێ',
      logoLabel: 'لینکێ وێنەیێ لۆگۆیی (ئارەزوومەندانە)',
      placeholderTitle: 'بۆ نموونە: نوژەنکرنەکا گرنگ یا بەرهەڤە!',
      placeholderDesc: 'مە کەنالێن نوێ زێدەکرینە! هیڤی دکەین ئەپی نوژەن بکەن.',
      placeholderLogo: 'لینکێ لۆگۆیی کەنالی',
      sendBtn: 'ئاگەهداریا گشتی بەلاڤکە',
      sending: 'ل هەمبەر بەلاڤکرنێ...',
      success: 'ئاگەهداریا راستەوخۆ بۆ هەمی ئامیران هاتە شاندن!',
      errorRequired: 'ناڤ و نیشان و پەیام د پێتڤینە!',
      errorServer: 'خەلەتیەک د گرێدانا سێرڤەری دا هەیە.',
      prefillBtn: 'تێکستێ ئامادەکراوێ وەشانێ',
    },
    Arabic: {
      btnToggle: 'بث تنبيه تحديث التطبيق',
      titleLabel: 'عنوان التنبيه',
      descLabel: 'نص التنبيه / التعليمات',
      logoLabel: 'رابط صورة الشعار (اختياري)',
      placeholderTitle: 'مثال: تحديث هام متاح الآن!',
      placeholderDesc: 'لقد أضفنا قنوات جديدة، يرجى تحديث التطبيق الآن.',
      placeholderLogo: 'رابط الشعار المخصص',
      sendBtn: 'بث التنبيه المباشر',
      sending: 'جاري البث المباشر...',
      success: 'تم بث التنبيه لجميع الأجهزة النشطة بنجاح!',
      errorRequired: 'العنوان والرسالة مطلوبان!',
      errorServer: 'فشل الاتصال بالخادم.',
      prefillBtn: 'تعبئة نص تحديث التطبيق الجاهز',
    }
  };

  const bcl = broadcastLabels[language] || broadcastLabels.English;

  const handlePresetUpdateNotification = () => {
    const presets = {
      English: {
        title: 'Website Update Available',
        desc: 'A new version of AMEDI TV is ready! Please apply the update to get the latest channels and streams.'
      },
      Kurdish: {
        title: 'نوێکردنەوەی ماڵپەڕ بەردەستە',
        desc: 'وەشانێکی نوێی ئامێدی تیڤی ئامادەیە. دایبەزێنە بۆ بەدەستهێنانی نوێترین تایبەتمەندییەکان.'
      },
      Badini: {
        title: 'نووکرنا مالپەری بەرهەڤە',
        desc: 'وەشانەکێ نوێ یێ ئامێدی تیڤی ب دەست کەفت. نوکە نوژەن بکە بۆ دیتنا تایبەتمەندیێن نوێ.'
      },
      Arabic: {
        title: 'تحديث الموقع متاح',
        desc: 'هناك تحديث جديد لموقع أميدي تي في. يرجى التحديث للحصول على أحدث الميزات والبث.'
      }
    };
    const preset = presets[language] || presets.English;
    setBcTitle(preset.title);
    setBcDesc(preset.desc);
    setBcLogo('https://i.postimg.cc/QxGcmFd3/file-0000000004b47246b78b315ac6479e1d.png');
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcTitle.trim() || !bcDesc.trim()) {
      setBcMessage({ type: 'error', text: bcl.errorRequired });
      return;
    }

    setBcSubmitting(true);
    setBcMessage(null);

    try {
      const res = await fetch('/api/updates/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bcTitle.trim(),
          desc: bcDesc.trim(),
          logo: bcLogo.trim() || 'https://i.postimg.cc/QxGcmFd3/file-0000000004b47246b78b315ac6479e1d.png'
        })
      });

      if (res.ok) {
        setBcMessage({ type: 'success', text: bcl.success });
        setBcTitle('');
        setBcDesc('');
      } else {
        throw new Error('Server returned error status');
      }
    } catch (err) {
      console.error("Broadcast failed:", err);
      setBcMessage({ type: 'error', text: bcl.errorServer });
    } finally {
      setBcSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-4 m-auto h-fit glass-card rounded-[40px] z-[71] p-6 md:p-8 max-w-md w-[calc(100%-2rem)] flex flex-col gap-5 shadow-2xl border border-white/10 text-white max-h-[95vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">{t.appTitle} Hub</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            {/* Premium Subscription Card */}
            {isActivated && (
              <div className="bg-gradient-to-br from-[#1c1236]/90 to-[#0f0a20]/95 rounded-3xl p-5 border border-brand-accent/30 shadow-[0_4px_25px_rgba(147,51,234,0.15)] relative overflow-hidden flex flex-col gap-3">
                <div className="absolute top-0 right-0 bg-brand-accent text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-bl-xl shadow-md">
                  PREMIUM
                </div>
                
                <div className="flex items-center gap-3" dir={isRtl ? 'rtl' : 'ltr'}>
                  <div className="w-10 h-10 rounded-xl bg-brand-accent/20 border border-brand-accent/35 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-5 h-5 text-brand-accent" />
                  </div>
                  <div className={isRtl ? 'text-right' : 'text-left'}>
                    <p className="text-xs font-bold text-white/50 uppercase tracking-wider leading-none">
                      {language === 'Kurdish' ? 'دۆخی بەشداریکردن' : language === 'Badini' ? 'بارێ پشکداریێ' : language === 'Arabic' ? 'حالة الاشتراك' : 'Subscription Status'}
                    </p>
                    <p className="text-sm font-black text-brand-accent mt-1 leading-none">
                      {activatedPeriod === '1month' 
                        ? (language === 'Kurdish' ? 'بەشداریکردنی ١ مانگی' : language === 'Badini' ? 'پشکداریا ١ هەیڤی' : language === 'Arabic' ? 'اشتراك شهر واحد' : '1 Month Premium')
                        : activatedPeriod === '6months'
                        ? (language === 'Kurdish' ? 'بەشداریکردنی ٦ مانگی' : language === 'Badini' ? 'پشکداریا ٦ هەیڤی' : language === 'Arabic' ? 'اشتراك ٦ أشهر' : '6 Months Premium')
                        : (language === 'Kurdish' ? 'بەشداریکردنی ١ ساڵیی' : language === 'Badini' ? 'پشکداریا ١ سالی' : language === 'Arabic' ? 'اشتراك سنة كاملة' : '1 Year Premium')}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-white/5 w-full my-1" />

                <div className="grid grid-cols-2 gap-2 text-xs" dir={isRtl ? 'rtl' : 'ltr'}>
                  <div className={`p-2.5 bg-black/20 rounded-xl border border-white/5 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                      {language === 'Kurdish' ? 'چالاککراوە لە' : language === 'Badini' ? 'چالاککریە ل' : language === 'Arabic' ? 'تاريخ التفعيل' : 'Activated At'}
                    </p>
                    <p className="font-extrabold text-white mt-1">
                      {new Date(activatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`p-2.5 bg-black/20 rounded-xl border border-white/5 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                      {language === 'Kurdish' ? 'ڕۆژانی ماوە' : language === 'Badini' ? 'رووژێن ماین' : language === 'Arabic' ? 'الأيام المتبقية' : 'Days Remaining'}
                    </p>
                    <p className="font-extrabold text-emerald-400 mt-1 flex items-baseline gap-1">
                      {(() => {
                        let durationDays = 180;
                        if (activatedPeriod === '1month') durationDays = 30;
                        else if (activatedPeriod === '1year') durationDays = 365;
                        const expirationTime = activatedAt + (durationDays * 24 * 60 * 60 * 1000);
                        const daysLeft = Math.ceil((expirationTime - Date.now()) / (24 * 60 * 60 * 1000));
                        return daysLeft > 0 ? daysLeft : 0;
                      })()} {language === 'Kurdish' ? 'ڕۆژ' : language === 'Badini' ? 'روژ' : language === 'Arabic' ? 'يوم' : 'Days'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold text-white/30 uppercase">
                    {language === 'Kurdish' ? 'ئامێری پارێزراو' : language === 'Badini' ? 'ئامیرێ پاراستی' : language === 'Arabic' ? 'الربط الآمن للجهاز' : 'Secure Device Linked'}
                  </span>
                  <button 
                    onClick={onDeactivate}
                    className="text-[9px] font-black uppercase text-red-400 hover:text-red-300 transition-colors bg-red-400/10 hover:bg-red-400/20 px-2.5 py-1 rounded-lg border border-red-500/20 cursor-pointer animate-none"
                  >
                    {language === 'Kurdish' ? 'گۆڕینی کۆد / دەرچوون' : language === 'Badini' ? 'گوهارتنا کۆدی' : language === 'Arabic' ? 'تغيير الكود / إلغاء' : 'Change Code'}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3" dir={isRtl ? 'rtl' : 'ltr'}>
               {[
                 { icon: 'Ghost', label: 'Snapchat', sub: t.socialFollow, color: 'bg-yellow-400/20 text-yellow-500', link: 'https://www.snapchat.com/add/savan10.ten?share_id=P_WZNoKBOyw&locale=en-US' },
                 { icon: 'Music2', label: 'TikTok', sub: t.socialTikTok, color: 'bg-pink-600/20 text-pink-500', link: 'https://tiktok.com/@savaneditor' },
                 { icon: 'Youtube', label: 'YouTube', sub: t.socialYoutube, color: 'bg-red-600/20 text-red-500', link: 'https://www.youtube.com/@savan.mussicc' },
                 { icon: 'Instagram', label: 'Instagram', sub: t.socialInstagram, color: 'bg-purple-600/20 text-purple-500', link: 'https://www.instagram.com/savan.mussicc?igsh=MWx6cWZ6Z2F3eXhjaQ==' }
               ].map((social) => (
                 <a 
                   key={social.label} 
                   href={social.link}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2 hover:bg-white/10 transition-all cursor-pointer group"
                 >
                   <div className={`w-8 h-8 rounded-lg ${social.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      {social.label === 'Snapchat' && <Ghost className="w-5 h-5" />}
                      {social.label === 'TikTok' && <Music2 className="w-5 h-5" />}
                      {social.label === 'YouTube' && <Youtube className="w-5 h-5" />}
                      {social.label === 'Instagram' && <Instagram className="w-5 h-5" />}
                   </div>
                   <div className="flex flex-col">
                     <span className="text-sm font-bold text-white line-clamp-1">{social.label}</span>
                     <span className="text-[10px] text-brand-text-muted uppercase font-bold tracking-widest">{social.sub}</span>
                   </div>
                 </a>
               ))}
            </div>

            {/* Notification Section */}
            <div className="bg-white/5 border border-white/5 rounded-3xl p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl flex-shrink-0 ${
                  notificationPermission === 'granted' ? 'bg-green-500/20 text-green-400' : 'bg-brand-accent/20 text-brand-accent'
                }`}>
                  {notificationPermission === 'granted' ? <Bell className="w-5 h-5 flex-shrink-0" /> : <BellOff className="w-5 h-5 flex-shrink-0" />}
                </div>
                <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
                  <p className="text-sm font-black text-white leading-none">{t.notificationSetup}</p>
                  <p className="text-[11px] text-brand-text-muted mt-1.5 leading-relaxed">{t.notificationSetupDesc}</p>
                </div>
              </div>

              <div className="h-px bg-white/10 w-full my-0.5" />

              <div className="flex items-center justify-between" dir={isRtl ? 'rtl' : 'ltr'}>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                  notificationPermission === 'granted'
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : notificationPermission === 'denied'
                    ? 'bg-red-500/10 border-red-500/30 text-red-500'
                    : 'bg-white/5 border-white/10 text-white/50'
                }`}>
                  {notificationPermission === 'granted'
                    ? t.notificationEnabled
                    : notificationPermission === 'denied'
                    ? t.notificationDisabled
                    : 'Status: Default'}
                </span>

                {notificationPermission !== 'granted' && (
                  <button
                    onClick={onRequestPermission}
                    className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl bg-brand-accent hover:bg-purple-700 text-white transition-all active:scale-95 shadow-md shadow-brand-accent/10 cursor-pointer"
                  >
                    {t.notificationAllowBtn}
                  </button>
                )}
              </div>
            </div>

            {/* FIB Donation & Support Section */}
            <div className="bg-brand-accent/5 rounded-3xl p-6 border border-brand-accent/10 space-y-4">
               <p className="text-xs text-brand-text-muted text-center font-medium leading-relaxed">{t.supportMsg}</p>
               <div className="bg-black/20 rounded-2xl p-4 border border-white/5 text-center">
                  <p className="text-[10px] text-brand-accent font-black uppercase tracking-[0.2em] mb-1">FIB Account</p>
                  <p className="text-lg font-black text-white tracking-widest">{t.donorAccount}</p>
                  <p className="text-xs text-white/40 mt-1 uppercase font-bold">{t.donorName}</p>
               </div>
               <div className="w-32 h-32 mx-auto bg-white rounded-2xl p-2 flex items-center justify-center animate-none">
                  <img 
                    src="https://i.postimg.cc/J0Y5zQCz/IMG-20260518-053546.jpg" 
                    alt="FIB QR Code" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=P7AZPUOWHQFL';
                    }}
                  />
               </div>
            </div>

            {/* Activation System Admin Section Removed */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

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
    allChannels: 'All Channels',
    noChannels: 'No channels found in this category',
    noStream: 'No stream available for this channel',
    searchPlaceholder: 'Search channels...',
    supportMsg: 'You can support us by donating to this FIB account:',
    selectLang: 'Select Language',
    playbackError: 'Playback Error',
    reconnect: 'Reconnect',
    selectLanguage: 'Select Language',
    appTitle: 'AMEDI TV',
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
    categoryRadio: 'Radio',
    categoryIslamic: 'Islamic',
    categoryKids: 'Kids',
    liveNow: 'Live Now',
    openLink: 'Open Link',
    welcomeDesc: 'Welcome to Amedi TV to watch Kurdish, international, Arabic, and sports channels live',
    initializing: 'Initializing',
    networkOnline: 'Network Online',
    initializingServer: 'Initializing Server...',
    castDevice: 'Cast to Device',
    installApp: 'Install App',
    installAppDesc: 'Install AMEDI TV on your device for a fast, immersive viewing experience.',
    installInstructions: 'To install this application on your iOS device, tap the Share button in Safari, then select "Add to Home Screen".',
    close: 'Close',
    addChannel: 'Add Channel',
    addChannelDesc: 'Add a new Kurdish or international live television channel.',
    channelName: 'Channel Name',
    streamUrl: 'Stream URL (HLS .m3u8)',
    logoUrl: 'Logo URL (Image Link)',
    selectCategories: 'Select Categories',
    adding: 'Adding...',
    addedSuccess: 'Channel added successfully!',
    validationError: 'Please fill in all fields with valid values',
    updateBannerTitle: 'Channel Updates Ready',
    updateBannerDesc: 'New channels have been added to the network. Update now to watch them!',
    updateNow: 'Update Now',
    updatingChannels: 'Syncing satellite receivers...',
    websiteUpdateTitle: 'Website Update Available',
    websiteUpdateDesc: 'An update for AMEDI TV is ready. Apply it to get the newest features and streams.',
    websiteUpdateBtn: 'Reload & Update',
    notificationSetup: 'Enable Notifications',
    notificationSetupDesc: 'Get alerts when new channels are added or critical website updates occur.',
    notificationEnabled: 'Notifications Enabled',
    notificationDisabled: 'Notifications Disabled',
    notificationAllowBtn: 'Allow Alerts',
    notificationSuccessTitle: 'Amedi TV Notifications',
    notificationSuccessDesc: 'You will now receive alerts whenever channels are added or updated!',
    systemStatus: 'System & Notifications',
    appVersion: 'App Version',
    checkUpdates: 'Check for Updates',
    checking: 'Checking...',
    upToDate: 'App is Up to Date',
    updateReady: 'New Update Available!',
    deviceModeTV: 'Smart TV Mode',
    deviceModePhone: 'Mobile Phone Mode',
    deviceModeAuto: 'Auto Optimize',
    deviceSelectorLabel: 'Screen Optimization',
    tvRemoteGuide: 'TV REMOTE SYSTEM ACTIVE: Use Arrows [↑ / ↓ / ← / →] to navigate, [Enter] to play, [Backspace/Esc] to go back.',
    phoneGestureGuide: 'Mobile Mode: Swipe left/right on player screen to quickly flip channels!',
    supportPhone: 'Telephone Support',
    supportPhoneDesc: 'For support via Phone call or WhatsApp chat, contact us directly.',
    clickToCall: 'Call Us Now',
    clickToChat: 'WhatsApp Support',
    advertiseHeader: '📢 Advertise on AMEDI TV & Skyrocket Your Business!',
    advertiseText: 'Promote your Snapchat, shop, Youtube channel, or business here to reach tens of thousands of active viewers daily. Click to start earning together!',
    contactToAdvertise: 'Advertise With Us',
    supportUsWithFib: 'Support App (FIB)'
  },
  Kurdish: {
    home: 'سەرەکی',
    language: 'زمان',
    search: 'گەڕان',
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
    categoryRadio: 'ڕادیۆ',
    categoryIslamic: 'ئیسلامی',
    categoryKids: 'منداڵان',
    liveNow: 'پەخشی ڕاستەوخۆ',
    openLink: 'کردنەوەی بەستەر',
    welcomeDesc: 'بەخێربێن بۆ ئامێدی تیڤی بۆ بینینی کەناڵە کوردی، بیانی، عەرەبی و وەرزشییەکان بە شێوازی ڕاستەوخۆ',
    initializing: 'دەستپێکردن',
    networkOnline: 'تۆڕ چالاکە',
    initializingServer: 'خەریکی ئامادەکردنی سێرڤەر...',
    castDevice: 'ئاراستەکردن بۆ ئامێر',
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
    advertiseText: 'سناپچات، دوکان، کەناڵی یوتیوب یان بزنسەکەت لێرە بڵاوبکەرەوە بۆ گەیشتن بە دەیان هەزار بینەری چالاکی ڕۆژانە. کرتە بکە بۆ ڕیکلامی خێرا!',
    contactToAdvertise: 'ڕیکلام لێرە بکە',
    supportUsWithFib: 'پاڵپشتی دارایی (FIB)'
  },
  Badini: {
    home: 'سەرەکی',
    language: 'زمان',
    search: 'گەڕیان',
    allChannels: 'هەمی کەناڵ',
    noChannels: 'چ کەناڵ نەهاتنە دیتن د ڤی بەشی دا',
    noStream: 'چ پەخش نینە بۆ ڤی کەناڵی',
    searchPlaceholder: 'ل کەناڵان بگەڕیێ...',
    supportMsg: 'تو دشێی پشکداریێ د پشتەڤانییا مە دا بکەی ب رێکا ڤی هەژمارا FIB:',
    selectLang: 'زمانەکێ هەلبژێرە',
    playbackError: 'خەلەتیا پەخشێ',
    reconnect: 'دوبارە گرێدان',
    selectLanguage: 'زمانەکی هەلبژێرە',
    appTitle: 'ئامێدی تیڤی',
    socialFollow: 'سناپ چات',
    socialTikTok: 'تیکتۆک',
    socialYoutube: 'یوتیوب',
    socialInstagram: 'ئینستاگرام',
    donorName: 'ساڤان ئامێدی',
    donorAccount: 'P7AZPUOWHQFL',
    categoryAll: 'هەمی',
    categoryKurdish: 'کوردی',
    categoryArabic: 'عەرەبی',
    categoryGeneral: 'گشتی',
    categoryNews: 'نووچە',
    categorySports: 'وەرزش',
    categoryMovies: 'فیلم',
    categoryRadio: 'ڕادیۆ',
    categoryIslamic: 'ئیسلامی',
    categoryKids: 'زارۆک',
    liveNow: 'پەخشێ ڕاستەوخۆ',
    openLink: 'ڤەکرنا لینکی',
    welcomeDesc: 'بخێر بهێن بو ئامێدی تیڤی بو بەرێ خودانا کەنالێن کوردی و بیانی و عەرەبی و وەرزشی ب شێوازێ راستەوخو',
    initializing: 'دەستپێکرن',
    networkOnline: 'تۆڕ یا کارایە',
    initializingServer: 'ل هەمبەر ئامادەکرنا سێرڤەری...',
    castDevice: 'گرێدانا ئامێری',
    installApp: 'داگرتنا ئەپی',
    installAppDesc: 'ئەپێ ئامێدی تیڤی دابەزینە سەر ئامیرێ خۆ بو دیتنەکا بلەز و تمام.',
    installInstructions: 'بۆ دابەزاندنا ڤی ئەپی ل سەر ئامیرێ iOS (ئایفۆن)، دوگمەیا Share ل Safari دابگرە، پاشان "Add to Home Screen" هەلبژێرە.',
    close: 'داخستن',
    addChannel: 'زێدەکرنا کەنالی',
    addChannelDesc: 'کەنالەکێ تەلەفزیۆنیێ کوردی یان بیانی یێ نوێ زێدە بکە.',
    channelName: 'ناڤێ کەنالی',
    streamUrl: 'لینکێ پەخشێ (HLS .m3u8)',
    logoUrl: 'لینکێ لۆگۆیی (لینکێ وێنەی)',
    selectCategories: 'فۆڵدەر و هۆپۆلان دەستنیشان بکە',
    adding: 'خەریکە زێدە دکەت...',
    addedSuccess: 'کەنال ب سەرکەفتیانە هاتە زێدەکرن!',
    validationError: 'هیڤی دکەین هەمی خانەیان ب دروستی پر بکەن',
    updateBannerTitle: 'کەنالێن نوێ بەرهەڤن',
    updateBannerDesc: 'کەنالێن د نوێ بۆ تورا مە هاتینە زێدەکرن. نوکە نوژەن بکە بۆ دیتنێ!',
    updateNow: 'نوکە نوژەن بکە',
    updatingChannels: 'خەریکە کەنالێن نوێ وەردگریت...',
    websiteUpdateTitle: 'نووکرنا مالپەری بەرهەڤە',
    websiteUpdateDesc: 'وەشانەکێ نوێ یێ ئامێدی تیڤی ب دەست کەفت. نوکە نوژەن بکە بۆ دیتنا تایبەتمەندیێن نوێ.',
    websiteUpdateBtn: 'نووکرن ب دووبارە بارکرن',
    notificationSetup: 'ئاگەدارکرنان چالاک بکە',
    notificationSetupDesc: 'ئاگەدارکرن بۆ تە دێ هێن کاتێ کەنالێن نوێ یان نوژەنکرنێن مالپەری دبن.',
    notificationEnabled: 'ئاگەدارکرن هاتنە چالاککرن',
    notificationDisabled: 'ئاگەدارکرن هاتنە ناچالاککرن',
    notificationAllowBtn: 'رێگە پێدان پێ بکە',
    notificationSuccessTitle: 'ئاگەدارکرنێن ئامێدی تیڤی',
    notificationSuccessDesc: 'نوکە م دێ تە ئاگەدار کەین دەما کەنالێن نوێ زێدە دبن یان دهێنە نوژەنکرن!',
    systemStatus: 'سیستەم و ئاگەدارکرن',
    appVersion: 'وەشانێ ئەپێ',
    checkUpdates: 'لێگەریان بۆ نووکرنێ',
    checking: 'خەریکە لێدگەریێت...',
    upToDate: 'ئەپ د نوێترین وەشاندایە',
    updateReady: 'نووکرنا نوێ یا بەرهەڤە!',
    deviceModeTV: 'شێوازێ تەلەفزیۆنێ',
    deviceModePhone: 'شێوازێ موبایلێ',
    deviceModeAuto: 'سیستەمێ خۆکار',
    deviceSelectorLabel: 'رێکخستنا شاشێ',
    tvRemoteGuide: 'کۆنترۆلا تیڤیێ یا چاڵاکە: دوگمەیێن ئاراستە بۆ تەماشاکرنێ، [Enter] بۆ لێدانێ، [Backspace/Esc] بۆ زڤرینێ.',
    phoneGestureGuide: 'شێوازێ موبایلێ: دەستێ خۆ بکێشە ل سەر ڤیدیۆیێ بۆ گۆڕینا کەنالان!',
    supportPhone: 'پشتەڤانیا تەلەفۆنێ',
    supportPhoneDesc: 'بۆ پشتەڤانیێ ب ڕێکارێن پەیوەندیا تەلەفۆنی یان کۆمێن واتسئەپ، ڕاستەوخۆ پەیوەندیێ مە بکە.',
    clickToCall: 'پەیوەندیێ بکە',
    clickToChat: 'واتسئەپا پشتەڤانیێ',
    advertiseHeader: '📢 ریکلامێ ل سەر ئامێدی تیڤی بەلاڤبکە و کارێ خۆ گەشەپێبدە!',
    advertiseText: 'سناپچات، کەنال، یان کارێ خۆ لێرە بەلاڤبکە بۆ گەهشتن ب ہزاران بینەرێن چالاک یێن رۆژانە. کلیک بکە بۆ دەستپێکرنا ریکلامێ!',
    contactToAdvertise: 'ریکلامێ لێرە بکە',
    supportUsWithFib: 'پشتەڤانیا دارایی (FIB)'
  },
  Arabic: {
    noChannels: 'لم يتم العثور على قنوات في هذه الفئة',
    noStream: 'لا يوجد بث متاح لهذه القناة',
    searchPlaceholder: 'ابحث عن القنوات...',
    supportMsg: 'يمكنك دعمنا من خلال التبرع لحساب FIB التالي:',
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
    categoryRadio: 'راديو',
    categoryIslamic: 'إسلامي',
    categoryKids: 'أطفال',
    liveNow: 'بث مباشر',
    openLink: 'فتح الرابط',
    welcomeDesc: 'أهلاً بكم في أميدي تي في لمشاهدة القنوات الكردية والعالمية العربية والرياضية بثاً مباشرًا',
    initializing: 'جاري التحضير',
    networkOnline: 'الشبكة متصلة',
    initializingServer: 'جاري تهيئة الخادم...',
    castDevice: 'البث إلى جهاز',
    installApp: 'تثبيت التطبيق',
    installAppDesc: 'قم بتثبيت تطبيق أميدي تي في على جهازك لتجربة مشاهدة سريعة وبملء الشاشة.',
    installInstructions: 'لتثبيت هذا التطبيق على جهاز iOS الخاص بك، اضغط على زر المشاركة في Safari، ثم اختر "إضافة إلى الشاشة الرئيسية".',
    close: 'إغلاق',
    addChannel: 'إضافة قناة',
    addChannelDesc: 'إضافة قناة تلفزيونية كردية أو عالمية جديدة للبث المباشر.',
    channelName: 'اسم القناة',
    streamUrl: 'رابط البث (HLS .m3u8)',
    logoUrl: 'رابط الشعار (رابط صورة)',
    selectCategories: 'اختر التصنيفات',
    adding: 'جاري الإضافة...',
    addedSuccess: 'تم إضافة القناة بنجاح!',
    validationError: 'يرجى ملء جميع الحقول بشكل صحيح',
    updateBannerTitle: 'تحديث قنوات جديد متاح',
    updateBannerDesc: 'تمت إضافة قنوات جديدة إلى الشبكة. حدث الآن لمشاهدتها!',
    updateNow: 'تحديث القنوات',
    updatingChannels: 'جاري جلب القنوات الجديدة وتحديث البث...',
    websiteUpdateTitle: 'تحديث الموقع متاح',
    websiteUpdateDesc: 'هناك تحديث جديد لموقع أميدي تي في. يرجى التحديث للحصول على أحدث الميزات والبث.',
    websiteUpdateBtn: 'تحديث وإعادة التحميل',
    notificationSetup: 'تفعيل الإشعارات',
    notificationSetupDesc: 'احصل على تنبيهات فورية عند إضافة قنوات جديدة أو تحديثات هامة للموقع.',
    notificationEnabled: 'الإشعارات مفعلة',
    notificationDisabled: 'الإشعارات معطلة',
    notificationAllowBtn: 'السماح بالتنبيهات',
    notificationSuccessTitle: 'إشهارات أميدي تي في',
    notificationSuccessDesc: 'ستتلقى الآن تنبيهات عندما يتم إضافة قنوات جديدة أو تحديثها!',
    systemStatus: 'النظام والإشعارات',
    appVersion: 'إصدار التطبيق',
    checkUpdates: 'التحقق من التحديثات',
    checking: 'جاري التحقق...',
    upToDate: 'التطبيق محدث بالكامل',
    updateReady: 'تحديث جديد متاح!',
    deviceModeTV: 'وضع التلفاز الذكي',
    deviceModePhone: 'وضع الهاتف المحمول',
    deviceModeAuto: 'تحديد تلقائي',
    deviceSelectorLabel: 'تحسين العرض',
    tvRemoteGuide: 'وضع التلفاز نشط: استخدم الأسهم للتنقل بين القنوات، [Enter] للتشغيل، [Backspace/Esc] للرجوع.',
    phoneGestureGuide: 'وضع الهاتف: اسحب يميناً أو يساراً لتغيير القنوات بسهولة!',
    supportPhone: 'الدعم الهاتفي',
    supportPhoneDesc: 'للحصول على الدعم عبر مكالمة هاتفية أو واتساب، تواصل معنا مباشرة.',
    clickToCall: 'اتصل بنا الآن',
    clickToChat: 'دعم واتساب',
    advertiseHeader: '📢 روّج لأعمالك وقناتك وتواجدك على أميدي تي في!',
    advertiseText: 'أعلن عن حسابك في سناب شات، متجرك، قناتك على يوتيوب، أو أعمالك التجارية هنا لتصل إلى عشرات الآلاف من المشاهدين النشطين يومياً.',
    contactToAdvertise: 'أعلن معنا الآن',
    supportUsWithFib: 'دعم التطبيق (FIB)'
  }
};

// --- Splash Screen Logo Loader ---
const SplashScreen = ({ t }: { t: any; key?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-[#0f0a1e] flex flex-col items-center justify-center p-6 select-none"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Glow ambient background sphere */}
        <div className="absolute inset-x-0 top-1/4 bottom-1/4 m-auto w-64 h-64 bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

        {/* Animated logo container */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0, rotate: -5 }}
          animate={{ scale: [0.75, 1.05, 1], opacity: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-32 h-32 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.25)] border border-white/10 p-1 bg-[#1a1433] flex items-center justify-center relative z-10"
        >
          <img 
            src="https://i.postimg.cc/QxGcmFd3/file-0000000004b47246b78b315ac6479e1d.png" 
            alt="AMEDI TV Logo" 
            className="w-full h-full object-cover rounded-2xl" 
            referrerPolicy="no-referrer" 
          />
        </motion.div>

        {/* Text and Branding animations */}
        <div className="text-center relative z-10">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none"
          >
            AMEDI <span className="text-brand-accent">TV</span>
          </motion.h1>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "80px" }}
            transition={{ delay: 0.6, duration: 0.8, ease: "easeInOut" }}
            className="h-[3px] bg-gradient-to-r from-transparent via-purple-600 to-transparent mx-auto mt-3 rounded-full"
          />

          <motion.p
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 0.7 }}
            transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
            className="text-xs md:text-sm font-semibold text-slate-300 mt-4 max-w-sm md:max-w-md mx-auto leading-relaxed px-4 text-center"
          >
            {t.welcomeDesc}
          </motion.p>
        </div>

        {/* Linear Loading Progress */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="mt-8 flex flex-col items-center gap-3 relative z-10"
        >
          <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden relative">
            <motion.div 
              className="h-full bg-purple-600 rounded-full"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              style={{ width: "50%" }}
            />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-white/30">{t.initializing}</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

const ActivationScreen = ({ 
  onActivateSuccess, 
  language, 
  setLanguage, 
  t, 
  isRtl 
}: { 
  onActivateSuccess: (plan: '1month' | '6months' | '1year') => void; 
  language: Language; 
  setLanguage: (lang: Language) => void; 
  t: any; 
  isRtl: boolean; 
}) => {
  const [activationCode, setActivationCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [showPayDetails, setShowPayDetails] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedQi, setCopiedQi] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'fib' | 'qi'>('fib');
  const [selectedPeriod, setSelectedPeriod] = useState<'1month' | '6months' | '1year'>('6months');



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
      orContact: "Send screenshot on Snapchat:",
      pricingTitle: "Subscription Pricing",
      oneMonthLabel: "1 Month",
      sixMonthsLabel: "6 Months",
      oneYearLabel: "1 Year",
      iqd: "IQD",
      selectPeriodPrompt: "1. Specify subscription duration:",
      selectedPlanLabel: "Selected Subscription Duration",
      requiredAmountLabel: "Required Payment Amount",
      activationStepCode: "2. Enter your activation code:",
      haveCodeNotice: "Make sure you have your code before activating the subscription.",
      activationSuccessNotice: "Once you have the code and complete the activation process, the subscription will be activated successfully.",
      qiInstructions: "Transfer the subscription fee via Super Qi Wallet. Copy our Wallet ID below, complete the transfer, and send the screenshot to Savan Amedi on Snapchat.",
      copyQiAccount: "Copy Super Qi Wallet ID",
      qiAccountNumber: "Super Qi Wallet Number",
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
      orContact: "وێنەی شاشەکە بنێرە بۆ سناپچاتی ساڤان:",
      pricingTitle: "نرخی کۆدی چالاککردن",
      oneMonthLabel: "١ مانگ",
      sixMonthsLabel: "٦ مانگ",
      oneYearLabel: "١ ساڵ",
      iqd: "دینار",
      selectPeriodPrompt: "١. ماوەی بەشداریکردنی پێویست دیاری بکە:",
      selectedPlanLabel: "ماوەی بەشداریکردنی هەڵبژێردراو",
      requiredAmountLabel: "بڕی پارەی پێویست",
      activationStepCode: "٢. کۆدی چالاککردنەکە لێرە بنووسە:",
      haveCodeNotice: "تکایە دڵنیابەرەوە لەوەی کەکۆدی چالاککردنەکەت لایە پێش ئەوەی بەشداریکردنەکە چالاک بکەیت.",
      activationSuccessNotice: "کاتێک کۆدەکەت دەستکەوت و پڕۆسەی چالاککردنەکەت تەواو کرد، بەشداریکردنەکەت بە سەرکەوتوویی چالاک دەبێت.",
      qiInstructions: "بڕی پارەی بەشداریکردنەکە بنێرە بۆ جزدانی سوپەر کی (Super Qi) لە خوارەوە. ژمارەی جزدانەکە کۆپی بکە، پارەکە بنێرە، و پاشان وێنەی شاشەکە بۆ ساڤان ئامێدی بنێرە لە سناپچات.",
      copyQiAccount: "کۆپیکردنی مۆبایلی جزدانی Super Qi",
      qiAccountNumber: "ژمارەی جزدانی سوپەر کی (Super Qi)",
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
      orContact: "وێنێ شاشەیێ بۆ سناپێ ساڤانی فرێکە:",
      pricingTitle: "بهایێ کۆدێ چالاککرنێ",
      oneMonthLabel: "١ هەیڤ",
      sixMonthsLabel: "٦ هەیڤ",
      oneYearLabel: "١ ساڵ",
      iqd: "دینار",
      selectPeriodPrompt: "١. ماوێ پشکداریا خۆ دەستنیشان بکە:",
      selectedPlanLabel: "ماوێ پشکداریا دەستنیشانکری",
      requiredAmountLabel: "کۆژمێ پارەیێ کەتێ پێدڤی",
      activationStepCode: "٢. کۆدێ چالاککرنێ بنڤیسە:",
      haveCodeNotice: "تکایە پشتراست بە کو تە کۆدێ چالاککرنێ ل دەف تە هەیە پێش هندێ تو پشکداریێ چالاک بکەی.",
      activationSuccessNotice: "دەمێ کۆدێ خۆ تە وەرگرت و پڕۆسێسا چالاککرنێ ب دوماهی ئینا، پشکداریا تە دێ ب سەرکەفتی هێتە چالاککرن.",
      qiInstructions: "بها یێ پشکداریێ فرێکە بۆ سەر جزدانا سوپەر کی (Super Qi) ل خوارێ. ژمارا جزدانێ کۆپی بکە، پارەی فڕێکە، و پشتی هینگێ وێنێ شاشەیێ بۆ سناپێ ساڤانی فرێکە.",
      copyQiAccount: "کۆپیکرنا مۆبایلا جزدانا Super Qi",
      qiAccountNumber: "ژمارا جزدانا سوپەر کی (Super Qi)",
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
      orContact: "أرسل لقطة الشاشة إلى سناب شات المطور:",
      pricingTitle: "أسعار كود التفعيل",
      oneMonthLabel: "شهر واحد",
      sixMonthsLabel: "٦ أشهر",
      oneYearLabel: "سنة كاملة",
      iqd: "د.ع",
      selectPeriodPrompt: "١. اختر مدة الاشتراك المطلوبة:",
      selectedPlanLabel: "مدة الاشتراك المحددة",
      requiredAmountLabel: "المبلغ المطلوب تحويله",
      activationStepCode: "٢. أدخل كود التفعيل الذي استلمته هنا:",
      haveCodeNotice: "يرجى التأكد من أن لديك كود تفعيل خاص بك قبل تفعيل الاشتراك.",
      activationSuccessNotice: "بمجرد حصولك على الكود وإتمام عملية التفعيل، سيتم تفعيل اشتراكك بنجاح.",
      qiInstructions: "قم بتحويل رسوم الاشتراك إلى محفظة سوبر كي (Super Qi) أدناه. انسخ رقم المحفظة، وأكمل التحويل، ثم أرسل لقطة الشاشة إلى سافان أميدي على سناب شات.",
      copyQiAccount: "نسخ رقم محفظة Super Qi",
      qiAccountNumber: "رقم محفظة سوبر كي (Super Qi)",
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

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/25 mb-5 text-[10px] font-black uppercase tracking-wider text-brand-accent">
          <Key className="w-3 h-3" />
          <span>SECURITY LOCK</span>
        </div>

        <h2 className="text-lg font-black text-white mb-2 leading-tight">
          {currentAct.title}
        </h2>

        <p className="text-xs text-brand-text-muted leading-relaxed mb-6 px-1">
          {currentAct.description}
        </p>

        {/* Dynamic Warning and success guide block */}
        <div className="w-full bg-brand-accent/10 border border-brand-accent/20 rounded-2xl p-4 mb-6 text-start flex gap-3 items-start backdrop-blur-md relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 blur-xl rounded-full pointer-events-none" />
          <div className="p-1.5 rounded-xl bg-brand-accent/20 text-brand-accent mt-0.5 shrink-0 flex items-center justify-center">
            <Info className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-1 z-10">
            <span className="text-[10px] font-black uppercase text-brand-accent tracking-wider">
              {language === 'Kurdish' ? 'ڕێنمایی گرنگ' : language === 'Badini' ? 'رێنماییا گرنگ' : language === 'Arabic' ? 'تعليمات هامة' : 'Important Guide'}
            </span>
            <p className="text-xs font-black text-white leading-normal">
              {currentAct.haveCodeNotice}
            </p>
            <p className="text-[10.5px] text-brand-text-muted font-medium leading-relaxed mt-1">
              {currentAct.activationSuccessNotice}
            </p>
          </div>
        </div>

        <form onSubmit={handleActivate} className="w-full flex flex-col gap-3">
          <div className="text-left" dir={isRtl ? 'rtl' : 'ltr'}>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              {currentAct.activationStepCode}
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={activationCode}
              onChange={(e) => {
                setActivationCode(e.target.value);
                if (status.type !== 'idle') setStatus({ type: 'idle', message: '' });
              }}
              placeholder={currentAct.placeholder}
              className="w-full bg-black/40 border border-white/10 focus:outline-none focus:border-brand-accent/60 rounded-2xl py-3 px-4 text-xs font-mono text-center text-white tracking-widest placeholder-white/20 uppercase transition-all"
              autoFocus
              disabled={validating}
            />
          </div>

          <button
            type="submit"
            disabled={validating || !activationCode.trim()}
            className="w-full py-3.5 rounded-2xl bg-brand-accent hover:bg-purple-700 disabled:opacity-40 text-white font-black text-xs tracking-widest uppercase transition-all shadow-lg shadow-brand-accent/10 active:scale-[0.98] cursor-pointer animate-none"
          >
            {validating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>VALIDATING...</span>
              </span>
            ) : (
              currentAct.button
            )}
          </button>
        </form>

        {status.type !== 'idle' && (
          <div className={`w-full mt-4 p-3 rounded-xl border text-[11px] font-black leading-snug ${
            status.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {status.message}
          </div>
        )}

        {/* Dynamic active code payment area */}
        <div className="w-full mt-6 border-t border-white/5 pt-5 text-left" dir={isRtl ? 'rtl' : 'ltr'}>
          <button
            onClick={() => setShowPayDetails(!showPayDetails)}
            className="w-full flex items-center justify-between py-2 text-xs font-black uppercase text-brand-accent hover:text-white/80 cursor-pointer animate-none bg-transparent"
          >
            <span>{currentAct.payToGet}</span>
            <span className="text-[10px] transform transition-transform duration-200" style={{ transform: showPayDetails ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
          </button>

          {showPayDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-3 bg-black/30 md:bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col gap-4 overflow-hidden"
            >
              <p className="text-[11px] text-brand-text-muted leading-relaxed">
                {currentAct.payInstructions}
              </p>

              {/* Payment Method Selector Tabs */}
              <div className="flex p-1 bg-black/40 border border-white/5 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('fib')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer text-center ${
                    paymentMethod === 'fib'
                      ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/20'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                  }`}
                >
                  FIB (First Iraqi Bank)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qi')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer text-center ${
                    paymentMethod === 'qi'
                      ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/20'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                  }`}
                >
                  Super Qi Pay
                </button>
              </div>

              {/* Subscription Pricing Grid */}
              <div className="flex flex-col gap-2 mt-1">
                <span className="text-[10px] font-black uppercase text-brand-accent tracking-wider block text-center mb-1">
                  {currentAct.selectPeriodPrompt}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {/* 1 Month */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPeriod('1month');
                      if (status.type !== 'idle') setStatus({ type: 'idle', message: '' });
                    }}
                    className={`rounded-xl p-2.5 flex flex-col items-center justify-center text-center backdrop-blur-md relative overflow-hidden group transition-all cursor-pointer border ${
                      selectedPeriod === '1month'
                        ? 'bg-brand-accent/20 border-brand-accent shadow-[0_0_15px_rgba(147,51,234,0.3)]'
                        : 'bg-white/5 border-white/10 hover:border-white/35 hover:bg-white/10 text-white/60'
                    }`}
                  >
                    <span className="text-[10px] font-bold block text-white/95">
                      {currentAct.oneMonthLabel}
                    </span>
                    <span className="text-sm font-black mt-1 text-white">5,000</span>
                    <span className="text-[8px] font-semibold leading-none text-slate-400">
                      {currentAct.iqd}
                    </span>
                  </button>

                  {/* 6 Months */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPeriod('6months');
                      if (status.type !== 'idle') setStatus({ type: 'idle', message: '' });
                    }}
                    className={`rounded-xl p-2.5 flex flex-col items-center justify-center text-center backdrop-blur-md relative overflow-hidden group transition-all cursor-pointer border ${
                      selectedPeriod === '6months'
                        ? 'bg-[#1e133d]/60 border-brand-accent shadow-[0_0_20px_rgba(147,51,234,0.4)] ring-1 ring-brand-accent/30'
                        : 'bg-white/5 border-white/10 hover:border-white/35 hover:bg-white/10 text-white/60'
                    }`}
                  >
                    <div className="absolute top-0 right-0 bg-brand-accent text-white text-[7px] font-black uppercase px-1 leading-none py-0.5 rounded-bl-lg">
                      🔥
                    </div>
                    <span className="text-[10px] font-bold block text-brand-accent">
                      {currentAct.sixMonthsLabel}
                    </span>
                    <span className="text-sm font-black mt-1 text-brand-accent">15,000</span>
                    <span className="text-[8px] font-semibold leading-none text-brand-accent">
                      {currentAct.iqd}
                    </span>
                  </button>

                  {/* 1 Year */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPeriod('1year');
                      if (status.type !== 'idle') setStatus({ type: 'idle', message: '' });
                    }}
                    className={`rounded-xl p-2.5 flex flex-col items-center justify-center text-center backdrop-blur-md relative overflow-hidden group transition-all cursor-pointer border ${
                      selectedPeriod === '1year'
                        ? 'bg-amber-500/10 border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-white/5 border-white/10 hover:border-white/35 hover:bg-white/10 text-white/60'
                    }`}
                  >
                    <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[6px] font-black uppercase px-1 leading-none py-0.5 rounded-bl-lg">
                      BEST
                    </div>
                    <span className="text-[10px] font-bold block text-amber-400">
                      {currentAct.oneYearLabel}
                    </span>
                    <span className="text-sm font-black mt-1 text-amber-400">20,000</span>
                    <span className="text-[8px] font-semibold leading-none text-amber-400">
                      {currentAct.iqd}
                    </span>
                  </button>
                </div>
              </div>

              {/* Selection Feedback Panel */}
              <div className="bg-[#1a1433]/70 border border-white/5 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{currentAct.selectedPlanLabel}</span>
                    <span className="text-xs font-black text-white mt-0.5">
                      {selectedPeriod === '1month' ? currentAct.oneMonthLabel : selectedPeriod === '6months' ? currentAct.sixMonthsLabel : currentAct.oneYearLabel}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{currentAct.requiredAmountLabel}</span>
                    <span className="text-sm font-black text-emerald-400 mt-0.5 flex items-baseline gap-0.5">
                      {selectedPeriod === '1month' ? '5,000' : selectedPeriod === '6months' ? '15,000' : '20,000'}
                      <span className="text-[9px] font-bold text-slate-400">{currentAct.iqd}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Conditional payment instruction details card */}
              {paymentMethod === 'fib' ? (
                <>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center flex flex-col items-center justify-center gap-1">
                    <span className="text-[9px] text-brand-accent uppercase tracking-widest font-black">FIB Account Number</span>
                    <span className="text-sm font-black text-white tracking-wider font-mono">P7AZPUOWHQFL</span>
                    <span className="text-[10px] text-white/40 font-bold uppercase shrink-0">Savan Amedi</span>
                    <button
                      type="button"
                      onClick={handleCopyFIB}
                      className="mt-2 text-[10px] font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 rounded-lg px-3 py-1.5 cursor-pointer border border-white/5"
                    >
                      {copiedAccount ? currentAct.copied : currentAct.copyAccount}
                    </button>
                  </div>

                  <div className="w-28 h-28 mx-auto bg-white rounded-xl p-1.5 flex items-center justify-center border border-white/10">
                    <img 
                      src="https://i.postimg.cc/J0Y5zQCz/IMG-20260518-053546.jpg" 
                      alt="FIB QR Code For Payments" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=P7AZPUOWHQFL';
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center flex flex-col items-center justify-center gap-1">
                    <span className="text-[9px] text-brand-accent uppercase tracking-widest font-black">
                      {currentAct.qiAccountNumber}
                    </span>
                    <span className="text-sm font-black text-white tracking-wider font-mono">1149575266</span>
                    <span className="text-[10px] text-white/40 font-bold uppercase shrink-0">Savan Amedi</span>
                    <button
                      type="button"
                      onClick={handleCopyQi}
                      className="mt-2 text-[10px] font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 rounded-lg px-3 py-1.5 cursor-pointer border border-white/5"
                    >
                      {copiedQi ? currentAct.copied : currentAct.copyQiAccount}
                    </button>
                  </div>

                  <div className="w-28 h-28 mx-auto bg-[#fff] rounded-xl p-1.5 flex items-center justify-center border border-white/10">
                    <img 
                      src="https://i.postimg.cc/Qx3RskcL/IMG-20260604-133817.png" 
                      alt="Super Qi QR Code For Payments" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=1149575266';
                      }}
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col items-center gap-2 mt-1 border-t border-white/5 pt-3">
                <span className="text-[10px] font-bold text-white/60">{currentAct.orContact}</span>
                <a
                  href="https://www.snapchat.com/add/savan10.ten?share_id=P_WZNoKBOyw&locale=en-US"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white hover:text-brand-accent px-4 py-2 bg-yellow-400 hover:bg-yellow-500 rounded-xl transition-all shadow-md text-slate-900 shadow-yellow-500/10 cursor-pointer"
                >
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping shrink-0" />
                  <span>Savan Snapchat 💬</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            </motion.div>
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
    </div>
  );
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
    adsEnabled: true,
    adSenseEnabled: false,
    adSenseClientId: "",
    adSenseSlotId: "",
    customBannerActive: true,
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
      belowCategories: true,
      insidePlayer: true
    }
  });

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
        return true;
      }
    } catch (err) {
      console.error('Failed to programmatic update ads settings:', err);
    }
    return false;
  };

  const [activationConfig, setActivationConfig] = useState<{ requireActivation: boolean; validCodes: string[] }>({
    requireActivation: true,
    validCodes: ["AMEDI2029", "SAVAN10", "ACTIVE-TV"]
  });

  const [activatedPeriod, setActivatedPeriod] = useState<'1month' | '6months' | '1year'>(() => {
    try {
      const plan = localStorage.getItem('amedi_tv_activated_plan');
      if (plan === '1month' || plan === '6months' || plan === '1year') {
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
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstallBannerVisible, setIsInstallBannerVisible] = useState(false);
  
  const [liveAnnouncement, setLiveAnnouncement] = useState<{ title: string; desc: string; logo?: string } | null>(null);

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
    return categories.filter(cat => used.has(cat));
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

    return () => {
      eventSource.removeEventListener('channel-added', onAdded as any);
      eventSource.removeEventListener('channel-updated', onUpdated as any);
      eventSource.removeEventListener('custom-announcement', onCustomAnnouncement as any);
      eventSource.removeEventListener('ads-config-updated', onAdsConfigUpdated as any);
      eventSource.removeEventListener('activation-config-updated', onActivationConfigUpdated as any);
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

  const [tvMode, setTvMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tvModeEnabled');
      if (saved) return saved === 'true';
    } catch (_) {}
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      return /smarttv|googletv|appletv|firetv|tizen|webos|netcast|viera|maemo|xbox|playstation|hdmi/i.test(ua);
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
        if (e.key === 'Escape' || e.key === 'Esc') {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      const keys = ['ArrowUp', 'Up', 'ArrowDown', 'Down', 'ArrowLeft', 'Left', 'ArrowRight', 'Right', 'Enter', 'Backspace', 'Escape', 'Esc'];
      if (!keys.includes(e.key)) return;

      // Auto-enable TV mode on first remote control arrow key press
      if (!tvMode && keys.slice(0, 8).includes(e.key)) {
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
        if (e.key === 'Backspace' || e.key === 'Escape' || e.key === 'Esc') {
          setSelectedChannel(null);
          e.preventDefault();
        }
        return;
      }

      // If modal is open, backspace/escape closes it
      if (langModalOpen || infoModalOpen || installModalOpen) {
        if (e.key === 'Backspace' || e.key === 'Escape' || e.key === 'Esc') {
          setLangModalOpen(false);
          setInfoModalOpen(false);
          setInstallModalOpen(false);
          e.preventDefault();
        }
        return;
      }

      // Main Navigation logic
      e.preventDefault();

      switch (e.key) {
        case 'ArrowUp':
        case 'Up':
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
          break;

        case 'ArrowDown':
        case 'Down':
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
          break;

        case 'ArrowLeft':
        case 'Left':
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
          break;

        case 'ArrowRight':
        case 'Right':
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
          break;

        case 'Enter':
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
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleTvKeyDown);
    return () => window.removeEventListener('keydown', handleTvKeyDown);
  }, [tvMode, tvFocusZone, tvFocusIndex, filteredChannels, availableCategories, cols, selectedChannel, langModalOpen, infoModalOpen, installModalOpen, isRtl]);

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
        } else if (installModalOpen) {
          setInstallModalOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedChannel, langModalOpen, infoModalOpen, installModalOpen]);

  useEffect(() => {
    let minTimeElapsed = false;
    let dataLoaded = false;

    const timer = setTimeout(() => {
      minTimeElapsed = true;
      if (dataLoaded) {
        setShowSplash(false);
      }
    }, 2800);

    async function loadData() {
      try {
        const adsRes = await fetch('/api/ads');
        if (adsRes.ok) {
          const adsData = await adsRes.json();
          setAdsConfig(adsData);
        }
      } catch (err) {
        console.warn('Failed to load initial ads configuration:', err);
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
        if (response.ok) {
          const data = await response.json();
          setChannels(data.channels || CHANNELS);
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
        setChannels(CHANNELS);
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
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels);
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

        <main className="px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredChannels.map((channel: Channel, idx: number) => (
              <ChannelCard 
                key={channel.id} 
                id={`grid-ch-${channel.id}`}
                name={channel.name} 
                logo={channel.logo} 
                onClick={() => setSelectedChannel(channel)}
                isTvFocused={tvMode && tvFocusZone === 'channels' && tvFocusIndex === idx}
              />
            ))}
          </div>
          
          {filteredChannels.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-brand-text-muted">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p>{t.noChannels}</p>
            </div>
          )}
        </main>
      </div>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 h-20 glass-card rounded-[32px] flex items-center justify-around px-8 z-40 w-[90%] max-w-md border border-white/10 shadow-2xl ring-1 ring-white/5 ${language === 'Arabic' || language === 'Kurdish' || language === 'Badini' ? 'flex-row-reverse' : 'flex-row'}`}>
        <button 
           onClick={() => { setCategory('All'); setSearch(''); setSelectedChannel(null); }}
           className={`flex flex-col items-center gap-1 transition-all focus:outline-none focus:text-brand-accent focus:scale-110 duration-150 outline-none ${category === 'All' && !search && !selectedChannel ? 'text-brand-accent' : 'text-white/40 hover:text-white'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{t.home}</span>
        </button>
        
        <button 
          onClick={handleSearchClick}
          className="relative group focus:outline-none focus:scale-105 duration-150 outline-none"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-accent via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-brand-accent/40 -translate-y-8 border-8 border-brand-bg relative z-50 group-hover:scale-110 transition-transform active:scale-95 group-focus:scale-110 group-focus:ring-4 group-focus:ring-brand-accent/50">
            <Search className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
          <div className="absolute inset-0 bg-brand-accent/30 blur-2xl rounded-full -translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button 
          onClick={() => setLangModalOpen(true)}
          className="flex flex-col items-center gap-1 text-white/40 hover:text-white focus:outline-none focus:text-brand-accent focus:scale-110 duration-150 outline-none transition-all"
        >
          <Globe className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{t.language}</span>
        </button>
      </nav>

      <AnimatePresence>
        {selectedChannel && (
          <PlayerView 
            channel={selectedChannel} 
            onBack={() => setSelectedChannel(null)} 
            onSelectChannel={setSelectedChannel}
            t={t}
            allChannels={channels}
            adsConfig={adsConfig}
            isRtl={isRtl}
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

      <InfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        t={t}
        language={language}
        notificationPermission={notificationPermission}
        onRequestPermission={handleRequestNotificationPermission}
        currentVersion={currentVersion}
        onCheckUpdate={handleManualCheckUpdate}
        swUpdateAvailable={swUpdateAvailable}
        checkingUpdate={checkingUpdate}
        manualUpdateChecked={manualUpdateChecked}
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
          setInfoModalOpen(false);
        }}
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
    </div>
  );
}
