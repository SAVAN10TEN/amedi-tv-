import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Tv, Trash, RefreshCw, Lock, Shield, Send, Megaphone, ChevronLeft, Plus, Check } from 'lucide-react';
import { Language } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: any;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currentVersion: string;
  onCheckUpdate: () => Promise<void>;
  swUpdateAvailable: boolean;
  checkingUpdate: boolean;
  onApplySwUpdate: () => void;
  tvMode: boolean;
  onToggleTvMode: () => void;
  adsConfig: any;
  onSaveAdsConfig: (newConfig: any) => Promise<boolean>;
  activationConfig: { requireActivation: boolean; validCodes: string[] };
  onSaveActivationConfig: (newConfig: { requireActivation: boolean; validCodes: string[] }) => Promise<boolean>;
  isActivated: boolean;
  activatedPeriod: '1month' | '6months' | '1year' | 'ad_24h';
  activatedAt: number;
  onDeactivate: () => void;
  proxyConfig: { proxyType: 'local' | 'cloudflare'; cloudflareWorkerUrl: string };
  onSaveProxyConfig: (newConfig: { proxyType: 'local' | 'cloudflare'; cloudflareWorkerUrl: string }) => Promise<boolean>;
}

export const SettingsModal = ({
  isOpen,
  onClose,
  t,
  language,
  onLanguageChange,
  currentVersion,
  onCheckUpdate,
  swUpdateAvailable,
  checkingUpdate,
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
  onDeactivate,
  proxyConfig,
  onSaveProxyConfig
}: SettingsModalProps) => {
  const isRtl = language === 'Kurdish' || language === 'Badini' || language === 'Arabic';

  // Broadcast Alert Form States
  const [bcTitle, setBcTitle] = useState('');
  const [bcDesc, setBcDesc] = useState('');
  const [bcLogo, setBcLogo] = useState('');
  const [bcSubmitting, setBcSubmitting] = useState(false);
  const [bcMessage, setBcMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Streaming Proxy Server States
  const [proxyType, setProxyType] = useState<'local' | 'cloudflare'>('local');
  const [cloudflareWorkerUrl, setCloudflareWorkerUrl] = useState('https://ameditv.kurdiish.workers.dev');
  const [savingProxy, setSavingProxy] = useState(false);
  const [saveProxyMsg, setSaveProxyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Ad Management State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [badPin, setBadPin] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<'proxy' | 'codes' | 'broadcast'>('proxy');

  // Form states local to SettingsModal (preloaded from adsConfig)
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [adSenseEnabled, setAdSenseEnabled] = useState(false);
  const [adSenseAutoAdsEnabled, setAdSenseAutoAdsEnabled] = useState(false);
  const [autoChangeAdsEnabled, setAutoChangeAdsEnabled] = useState(false);
  const [autoChangeInterval, setAutoChangeInterval] = useState(10);
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
      setAdSenseAutoAdsEnabled(!!adsConfig.adSenseAutoAdsEnabled);
      setAutoChangeAdsEnabled(!!adsConfig.autoChangeAdsEnabled);
      setAutoChangeInterval(typeof adsConfig.autoChangeInterval === 'number' ? adsConfig.autoChangeInterval : 10);
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

  // Synchronize when proxyConfig updates
  useEffect(() => {
    if (proxyConfig) {
      setProxyType(proxyConfig.proxyType || 'local');
      setCloudflareWorkerUrl(proxyConfig.cloudflareWorkerUrl || 'https://ameditv.kurdiish.workers.dev');
    }
  }, [proxyConfig]);

  const handleSaveProxy = async () => {
    setSavingProxy(true);
    setSaveProxyMsg(null);
    const success = await onSaveProxyConfig({
      proxyType,
      cloudflareWorkerUrl
    });
    setSavingProxy(false);
    if (success) {
      setSaveProxyMsg({ type: 'success', text: 'Proxy settings saved and synchronized!' });
    } else {
      setSaveProxyMsg({ type: 'error', text: 'Failed to save proxy settings.' });
    }
  };

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
      adSenseAutoAdsEnabled,
      autoChangeAdsEnabled,
      autoChangeInterval,
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
      adSenseAutoAds: 'AdSense Auto Ads Mode',
      adSenseAutoAdsDesc: 'Google Automated Placements',
      autoChangeAds: 'Auto Change Ads (Alternate Custom & AdSense)',
      autoChangeAdsDesc: 'Automatically alternate between Custom Sponsor and AdSense ads',
      autoChangeInterval: 'Change Duration (seconds)',
      clientId: 'AdSense Client ID (ca-pub-xxx)',
      slotId: 'AdSense Slot ID (10 digits)',
      slotIdPlaceholder: '10-digit numeric ID',
      slotIdDisabledPlaceholder: 'Not needed for auto ads!',
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
      adSenseAutoAds: 'ڕیکلامی ئۆتۆماتیکی ئەدسێنس',
      adSenseAutoAdsDesc: 'شوێنمای ئۆتۆماتیکی لەلایەن گووگڵ',
      autoChangeAds: 'گۆڕینی خۆکاری ڕیکلامەکان',
      autoChangeAdsDesc: 'ئاڵوگۆڕی خۆکار لە نێوان ئەدسێنس و پانێڵی دەستی سپۆنسەر',
      autoChangeInterval: 'ماوەی گۆڕین (چرکە)',
      clientId: 'ناسنامەی کڕیاری ئەدسێنس (Client ID)',
      slotId: 'ناسنامەی شوێنی ڕیکلام (Slot ID)',
      slotIdPlaceholder: 'کۆدی شوێنەکە (١٠ ژمارە)',
      slotIdDisabledPlaceholder: 'پێویست نییە بۆ ڕیکلامی ئۆتۆماتیکی!',
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
      adSenseAutoAds: 'ریکلامێن ئۆتۆماتیکی یێن ئەدسێنس',
      adSenseAutoAdsDesc: 'بەلاڤکرنا ئۆتۆماتیکی ل لایێ گووگڵ',
      autoChangeAds: 'گهۆرینا ئۆتۆماتیکی یا ریکلامان',
      autoChangeAdsDesc: 'ئاڵۆگۆڕکرنا خۆکار د ناڤبەرا ئەدسێنس و پانێلا دەستی یا سپۆنسەری',
      autoChangeInterval: 'دەمێ گهۆرینێ (سەکنە)',
      clientId: 'ناسنامەیا کڕیارێ ئەدسێنس (Client ID)',
      slotId: 'ناسنامەیا شوینێ ریکلامێ (Slot ID)',
      slotIdPlaceholder: 'کۆدێ شوینێ (١٠ ژمارە)',
      slotIdDisabledPlaceholder: 'نەیێ پێتڤییە بۆ ریکلامێن ئۆتۆماتیکی!',
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
      adSenseAutoAds: 'وضع الإعلانات التلقائية (Auto Ads)',
      adSenseAutoAdsDesc: 'تحديد أماكن عروض قوقل التلقائية',
      autoChangeAds: 'التغيير التلقائي للإعلانات',
      autoChangeAdsDesc: 'التناوب التلقائي بين إعلانات أدسنس والبنرات المخصصة',
      autoChangeInterval: 'فترة التغيير (بالثواني)',
      clientId: 'معرّف الناشر (Client ID)',
      slotId: 'معرّف الإعلان (Slot ID)',
      slotIdPlaceholder: 'معرّف الإعلان (10 أرقام)',
      slotIdDisabledPlaceholder: 'غير مطلوب للإعلانات التلقائية!',
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
      descLabel: 'پەیاما سەرەکی یا ئاگەهداریێ',
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
        title: 'نویکرنا مالپەری به ردەستە',
        desc: 'وەشانەکێ نوی یێ ئامێدی تیڤی ئامادەیە. دابەزینە بۆ بدەستڤەئینانا باشترین تایبەتمەندیێن نوی.'
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
              <h2 className="text-xl font-black">{t.settingsTitle}</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Application Settings Section */}
            <div className="bg-white/5 border border-white/5 rounded-3xl p-5 flex flex-col gap-4" dir={isRtl ? 'rtl' : 'ltr'}>
              {/* 1. In-place Quick Language Selector */}
              <div className="space-y-2">
                <span className="text-[10px] text-brand-text-muted font-bold block uppercase tracking-widest text-left">{t.selectLanguage}</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'Kurdish', flag: '🇹🇯', label: 'کوردی (S)' },
                    { id: 'Badini', flag: '🇹🇯', label: 'بادینی' },
                    { id: 'Arabic', flag: '🇦🇪', label: 'العربية' },
                    { id: 'English', flag: '🇬🇧', label: 'English' }
                  ].map((cand) => (
                    <button
                      key={cand.id}
                      onClick={() => onLanguageChange(cand.id as Language)}
                      className={`py-1.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        language === cand.id 
                          ? 'bg-brand-accent/20 border-brand-accent text-white scale-[1.02]' 
                          : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-base leading-none">{cand.flag}</span>
                      <span className="text-[9px] font-black tracking-tighter leading-none">{cand.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/5 w-full" />

              {/* 2. Device Mode (Smart TV Mode) Switch */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col flex-1 text-left">
                  <span className="text-xs font-black text-white flex items-center gap-1.5 select-none text-left">
                    <Tv className="w-4 h-4 text-purple-400 shrink-0" />
                    {t.smartTvMode}
                  </span>
                  <span className="text-[10px] text-brand-text-muted mt-1 leading-snug text-left select-none">
                    {t.smartTvModeDesc}
                  </span>
                </div>
                <button
                  onClick={onToggleTvMode}
                  className={`w-11 h-6 rounded-full transition-all duration-200 relative shrink-0 ${tvMode ? 'bg-[#ff2d55]' : 'bg-white/15'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200 ${tvMode ? (isRtl ? 'right-6' : 'left-6') : (isRtl ? 'right-1' : 'left-1')}`} />
                </button>
              </div>

              <div className="h-px bg-white/5 w-full" />

              {/* 3. Cache Clearing / Diagnostics Button */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col flex-1 text-left">
                  <span className="text-xs font-black text-white flex items-center gap-1.5 select-none text-left">
                    <Trash className="w-4 h-4 text-red-400 shrink-0" />
                    {t.clearCache}
                  </span>
                  <span className="text-[10px] text-brand-text-muted mt-1 leading-snug text-left select-none">
                    {t.clearCacheDesc}
                  </span>
                </div>
                <button
                  onClick={() => {
                    try { localStorage.clear(); } catch (_) {}
                    window.location.reload();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/10 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                >
                  Reset
                </button>
              </div>

              <div className="h-px bg-white/5 w-full" />

              {/* 4. App Update status */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col flex-1 text-left">
                  <span className="text-xs font-black text-white flex items-center gap-1.5 select-none text-left">
                    <RefreshCw className={`w-4 h-4 text-green-400 shrink-0 ${checkingUpdate ? 'animate-spin' : ''}`} />
                    {t.appVersion}: v{currentVersion || '2.0.0'}
                  </span>
                  <span className="text-[10px] text-brand-text-muted mt-1 leading-snug text-left select-none">
                    {swUpdateAvailable ? t.updateReady : t.upToDate}
                  </span>
                </div>
                {swUpdateAvailable ? (
                  <button
                    onClick={onApplySwUpdate}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-green-500 hover:bg-green-600 text-white animate-pulse"
                  >
                    {t.websiteUpdateBtn}
                  </button>
                ) : (
                  <button
                    onClick={onCheckUpdate}
                    disabled={checkingUpdate}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold border border-white/5 disabled:opacity-50 transition-all"
                  >
                    {checkingUpdate ? t.checking : t.checkUpdates}
                  </button>
                )}
              </div>
            </div>

            <button
               onClick={onClose}
               className="py-3.5 w-full rounded-2xl bg-brand-accent hover:bg-purple-700 text-white font-bold text-xs tracking-widest uppercase transition-all shadow-lg active:scale-[0.98] mt-1"
            >
               {t.close}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
