import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Ghost, Music2, Youtube, Instagram, Bell, BellOff } from 'lucide-react';
import { Language } from '../types';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: any;
  language: Language;
  notificationPermission: NotificationPermission;
  onRequestPermission: () => Promise<void>;
}

export const InfoModal = ({
  isOpen,
  onClose,
  t,
  language,
  notificationPermission,
  onRequestPermission,
}: InfoModalProps) => {
  const isRtl = language === 'Kurdish' || language === 'Badini' || language === 'Arabic';

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
            className={`fixed inset-4 m-auto h-fit glass-card rounded-[40px] z-[71] p-6 md:p-8 max-w-md w-[calc(100%-2rem)] flex flex-col gap-5 shadow-2xl border border-white/10 text-white max-h-[95vh] overflow-y-auto no-scrollbar`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">{t.appTitle} Info Hub</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Social Follow Links */}
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
            <div className="bg-white/5 border border-white/5 rounded-3xl p-5 flex flex-col gap-3" dir={isRtl ? 'rtl' : 'ltr'}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl flex-shrink-0 ${
                  notificationPermission === 'granted' ? 'bg-green-500/20 text-green-400' : 'bg-brand-accent/20 text-brand-accent'
                }`}>
                  {notificationPermission === 'granted' ? <Bell className="w-5 h-5 flex-shrink-0" /> : <BellOff className="w-5 h-5 flex-shrink-0" />}
                </div>
                <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm font-black text-white leading-none">{t.notificationSetup}</p>
                  <p className="text-[11px] text-brand-text-muted mt-1.5 leading-relaxed">{t.notificationSetupDesc}</p>
                </div>
              </div>

              <div className="h-px bg-white/10 w-full my-0.5" />

              <div className="flex items-center justify-between">
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
            <div className="bg-brand-accent/5 rounded-3xl p-6 border border-brand-accent/10 space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
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
