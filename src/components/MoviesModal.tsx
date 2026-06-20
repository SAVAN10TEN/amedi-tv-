import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Film, Star, Calendar, Clock, ArrowLeft, Lock } from 'lucide-react';
import { Language, Channel, Episode } from '../types';
import { MoviesSection } from './MoviesSection';
import Hls from 'hls.js';

interface CountdownTimerProps {
  releaseTime?: number;
  language: Language;
  size?: 'small' | 'large';
}

const CountdownTimer = ({ releaseTime, language, size = 'small' }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!releaseTime) return;
    
    // Initial calculation
    setTimeLeft(Math.max(0, releaseTime - Date.now()));

    const interval = setInterval(() => {
      const remaining = releaseTime - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [releaseTime]);

  if (!releaseTime || timeLeft <= 0) {
    return null;
  }

  // Aggregate days into hours as requested: "no days, only time"
  const hoursVal = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesVal = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const secondsVal = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const t = {
    English: { hours: 'h', minutes: 'm', seconds: 's', label: 'Coming Soon' },
    Kurdish: { hours: 'کاژێر', minutes: 'خولەک', seconds: 'چرکە', label: 'بەمزوانە' },
    Badini: { hours: 'دەمژمێر', minutes: 'خولەک', seconds: 'چرکە', label: 'ب نێزیک دەم' },
    Arabic: { hours: 'ساعة', minutes: 'دقيقة', seconds: 'ثانية', label: 'قريباً' }
  }[language];

  const toNativeDigits = (num: number): string => {
    const padded = num.toString().padStart(2, '0');
    if (language === 'English') return padded;
    const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return padded
      .split('')
      .map(char => {
        const digit = parseInt(char, 10);
        return isNaN(digit) ? char : digits[digit];
      })
      .join('');
  };

  const h = toNativeDigits(hoursVal);
  const m = toNativeDigits(minutesVal);
  const s = toNativeDigits(secondsVal);

  if (size === 'large') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="bg-amber-400/10 border border-amber-400/20 px-3.5 py-2 rounded-2xl min-w-[70px] text-center shadow-lg shadow-amber-500/5">
          <span className="block text-2xl font-black text-amber-400 tracking-tight">{h}</span>
          <span className="block text-[10px] text-amber-400/70 uppercase font-black tracking-widest mt-0.5">{t.hours}</span>
        </div>
        <div className="bg-amber-400/10 border border-amber-400/20 px-3.5 py-2 rounded-2xl min-w-[70px] text-center shadow-lg shadow-amber-500/5">
          <span className="block text-2xl font-black text-amber-400 tracking-tight">{m}</span>
          <span className="block text-[10px] text-amber-400/70 uppercase font-black tracking-widest mt-0.5">{t.minutes}</span>
        </div>
        <div className="bg-amber-400/10 border border-amber-400/20 px-3.5 py-2 rounded-2xl min-w-[70px] text-center shadow-lg shadow-amber-500/5 animate-pulse">
          <span className="block text-2xl font-black text-amber-400 tracking-tight">{s}</span>
          <span className="block text-[10px] text-amber-400/70 uppercase font-black tracking-widest mt-0.5">{t.seconds}</span>
        </div>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 shadow-sm animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
      <span>{t.label} (</span>
      <span>{h}:{m}:{s}</span>
      <span>)</span>
    </span>
  );
};

interface MoviesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('ok.ru/video/')) {
    return url.replace('ok.ru/video/', 'ok.ru/videoembed/');
  }
  if (url.includes('drive.google.com')) {
    let id = '';
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      id = match[1];
    } else {
      try {
        const urlObj = new URL(url);
        id = urlObj.searchParams.get('id') || '';
      } catch (e) {
        console.warn('Invalid Google Drive URL:', url, e);
      }
    }
    if (id) {
      return `https://drive.google.com/file/d/${id}/preview`;
    }
  }
  if (url.includes('t.me/') || url.includes('telegram.me/')) {
    if (url.includes('?embed=1') || url.includes('&embed=1')) {
      return url;
    }
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}embed=1`;
  }
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

const isDirectVideoUrl = (url: string) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes('.mp4') ||
    lowerUrl.includes('.m3u8') ||
    lowerUrl.includes('.webm') ||
    lowerUrl.includes('.ogg') ||
    lowerUrl.includes('.mov')
  );
};

interface CinematicPlayerProps {
  url: string;
  title: string;
}

const CinematicPlayer = ({ url, title }: CinematicPlayerProps) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (url.toLowerCase().includes('m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls({
          maxMaxBufferLength: 10,
          enableWorker: true
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((err) => console.log('Autoplay blocked:', err));
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch((err) => console.log('Autoplay blocked:', err));
        });
      }
    } else {
      video.src = url;
      video.load();
      video.play().catch((err) => console.log('Autoplay blocked:', err));
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full bg-black object-contain focus:outline-none"
      controls
      autoPlay
      playsInline
      title={title}
    />
  );
};

export const MoviesModal = ({ isOpen, onClose, language }: MoviesModalProps) => {
  const [activeMovie, setActiveMovie] = useState<Channel | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);

  const isRtl = language === 'Kurdish' || language === 'Badini' || language === 'Arabic';

  const labels = {
    English: {
      cinemaHeader: 'AMEDI CINEMA',
      backToCatalog: 'Back to Catalog',
      duration: 'Duration',
      rating: 'Rating',
      year: 'Release Year',
      episodes: 'Episodes',
      playingEpisode: 'Now Playing: ',
      watchExternal: 'Open External Player 📱 (Android / iOS Support)',
      linkUnavailable: 'Episode not yet available'
    },
    Kurdish: {
      cinemaHeader: 'سیـنەمای ئامێدی',
      backToCatalog: 'گەڕانەوە بۆ پێڕست',
      duration: 'ماوە',
      rating: 'هەڵسەنگاندن',
      year: 'ساڵی بڵاوکردنەوە',
      episodes: 'ئەڵقەکان',
      playingEpisode: 'ئێستا پەخش دەکرێت: ',
      watchExternal: 'کردنەوە لە پەخشی دەرەکی 📱 (مۆبایل / تابلێت)',
      linkUnavailable: 'ئەم ئەڵقەیە هێشتا بەردەست نییە'
    },
    Badini: {
      cinemaHeader: 'سیـنەما ئامێدی',
      backToCatalog: 'زڤرین بۆ لیستی',
      duration: 'دەم',
      rating: 'پێداچوونەوە',
      year: 'سالا بەلاڤکرنێ',
      episodes: 'خەلەک',
      playingEpisode: 'نوکە دهێتە نیشاندان: ',
      watchExternal: 'پەخش ل سەر لێدەرێ دەرەکی 📱 (ئەندرۆید / ئای ئۆ ئێس)',
      linkUnavailable: 'ئەڤ خەلەکە هێشتا بەردەست نینە'
    },
    Arabic: {
      cinemaHeader: 'سينما عمادية',
      backToCatalog: 'العودة إلى الدليل',
      duration: 'المدة',
      rating: 'التقييم',
      year: 'سنة الإصدار',
      episodes: 'الحلقات',
      playingEpisode: 'يعرض الآن: ',
      watchExternal: 'فتح في مشغل خارجي 📱 (دعم أندرويد وايفون)',
      linkUnavailable: 'هذه الحلقة غير متوفرة بعد'
    }
  }[language];

  const handleSelectMovie = (movie: Channel | null) => {
    setActiveMovie(movie);
    if (movie && movie.episodes && movie.episodes.length > 0) {
      setActiveEpisode(movie.episodes[0]);
    } else {
      setActiveEpisode(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-[#07040f]/98 backdrop-blur-2xl z-[500] flex flex-col font-sans text-white overflow-y-auto no-scrollbar"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Cinema Navigation / Top Header */}
        <header className="sticky top-0 bg-[#07040f]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-3">
            {activeMovie ? (
              <button
                onClick={() => handleSelectMovie(null)}
                className="p-2 -mx-2 hover:bg-white/5 rounded-full transition-colors flex items-center gap-2 text-brand-accent font-bold text-xs uppercase cursor-pointer"
              >
                {isRtl ? <ArrowLeft className="w-5 h-5 rotate-180" /> : <ArrowLeft className="w-5 h-5" />}
                <span className="hidden sm:inline">{labels.backToCatalog}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-accent/20 flex items-center justify-center border border-brand-accent/30 shadow-lg shadow-brand-accent/5">
                  <Film className="w-4.5 h-4.5 text-brand-accent" />
                </div>
                <h2 className="text-sm font-black tracking-widest uppercase italic bg-gradient-to-r from-white via-white to-brand-accent/80 bg-clip-text text-transparent">
                  {labels.cinemaHeader}
                </h2>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              handleSelectMovie(null);
              onClose();
            }}
            className="p-2 hover:bg-white/5 rounded-full transition-colors border border-white/5 hover:border-white/10 cursor-pointer"
            title="Close Cinema"
          >
            <X className="w-5 h-5 text-white/60 hover:text-white" />
          </button>
        </header>

        {activeMovie ? (
          /* Cinematic Theater Player Mode */
          <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 md:py-10 flex flex-col gap-6 md:gap-8 min-h-full">
            {/* Embedded Video/YouTube Container with Cinema ratio */}
            <div className="flex flex-col gap-3">
              <div className="relative w-full aspect-video rounded-[32px] overflow-hidden border border-white/10 bg-black shadow-2xl">
                {(() => {
                  const isLocked = activeEpisode && activeEpisode.releaseTime && activeEpisode.releaseTime > Date.now();
                  
                  if (isLocked && activeEpisode) {
                    return (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0c051f] via-[#05020a] to-[#120024] text-center overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)] animate-pulse" />
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 shrink-0 shadow-lg shadow-amber-500/5 animate-bounce">
                          <Lock className="w-7 h-7 text-amber-400" />
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-white px-4 tracking-tight">
                          {activeEpisode.name}
                        </h4>
                        <p className="text-xs text-white/50 mt-2 max-w-[380px] px-6">
                          {language === 'English' ? 'New episodes are released every night at 8:00 PM.' : 
                           language === 'Arabic' ? 'يتم نشر الحلقات الجديدة كل ليلة في الساعة 8:00 مساءً.' :
                           language === 'Badini' ? 'ئەڤ درامایە هەر شەڤ ل دەمژمێر 8:00 ئێڤاری دێ هێتە بەلاڤکرن.' :
                           'ئەم درامایە هەموو شەوێک کاژێر 8:00ی ئێوارە بڵاودەکرێتەوە.'}
                        </p>
                        <div className="mt-5">
                          <CountdownTimer releaseTime={activeEpisode.releaseTime!} language={language} size="large" />
                        </div>
                      </div>
                    );
                  }

                  const streamUrl = activeEpisode ? activeEpisode.streamUrl : (activeMovie.streamUrl || '');
                  if (!streamUrl) {
                    return (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0c081d] text-center">
                        <Film className="w-12 h-12 text-[#9333ea]/45 mb-4 animate-pulse" />
                        <h4 className="text-base sm:text-xl font-extrabold text-white">
                          {labels.linkUnavailable}
                        </h4>
                        <p className="text-xs text-white/50 mt-1.5 max-w-[340px]">
                          {language === 'English' ? 'Please check back later for updates.' : 
                           language === 'Arabic' ? 'يرجى مراجعة الصفحة لاحقاً لمتابعة التحديثات.' :
                           'هیڤیە ل دەمەکێ دی سەرا بکەی بۆ دیتنا خەلەکێن نوی.'}
                        </p>
                      </div>
                    );
                  }
                  if (isDirectVideoUrl(streamUrl)) {
                    return (
                      <CinematicPlayer
                        url={streamUrl}
                        title={activeEpisode ? activeEpisode.name : activeMovie.name}
                      />
                    );
                  } else {
                    return (
                      <iframe
                        className="absolute inset-0 w-full h-full border-0"
                        src={getYouTubeEmbedUrl(streamUrl)}
                        title={activeEpisode ? activeEpisode.name : activeMovie.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                        allowFullScreen
                        webkitallowfullscreen="true"
                        mozallowfullscreen="true"
                        referrerPolicy="no-referrer"
                      />
                    );
                  }
                })()}
              </div>


            </div>

            {/* Movie Description Card */}
            <div className="glass-card rounded-[32px] p-6 md:p-8 border border-white/5 shadow-xl bg-brand-card/25 backdrop-blur-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-5">
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <h3 className="text-xl md:text-3xl font-extrabold text-white tracking-tight leading-normal">
                    {activeMovie.name}
                    {activeEpisode && (
                      <span className="text-brand-accent text-sm md:text-lg block md:inline-block md:ml-3 md:mr-3 mt-1 md:mt-0 font-medium">
                        - {activeEpisode.name}
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-semibold text-white/50">
                    <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span>{activeMovie.rating}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>{activeMovie.year}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>{activeEpisode ? activeEpisode.duration : activeMovie.duration}</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectMovie(null)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 self-start md:self-center cursor-pointer active:scale-95"
                >
                  <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                  <span>{labels.backToCatalog}</span>
                </button>
              </div>

              {/* Bio description */}
              <div className={`space-y-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#a855f7] block mb-1">Synopsis</span>
                  <p className="text-white/70 text-xs md:text-sm leading-relaxed max-w-3xl">
                    {activeMovie.description}
                  </p>
                </div>

                {activeEpisode?.description && (
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <span className="text-[10px] uppercase font-black tracking-widest text-brand-accent block mb-1">
                      {labels.playingEpisode} {activeEpisode.name}
                    </span>
                    <p className="text-white/80 text-xs md:text-sm leading-relaxed">
                      {activeEpisode.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Episodes List Section */}
            {activeMovie.episodes && activeMovie.episodes.length > 0 && (
              <div className="glass-card rounded-[32px] p-6 md:p-8 border border-white/5 shadow-xl bg-brand-card/25 backdrop-blur-md">
                <h4 className={`text-lg font-black uppercase tracking-widest text-white/90 mb-5 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="w-1.5 h-6 bg-brand-accent rounded-full inline-block" />
                  <span>
                    {labels.episodes} ({activeMovie.episodes.length})
                  </span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeMovie.episodes.map((episode) => {
                    const isPlaying = activeEpisode?.id === episode.id;
                    const isLocked = episode.releaseTime && episode.releaseTime > Date.now();
                    return (
                      <button
                        key={episode.id}
                        onClick={() => setActiveEpisode(episode)}
                        className={`group text-left flex items-start gap-4 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isPlaying
                            ? isLocked 
                              ? 'bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/5'
                              : 'bg-brand-accent/15 border-brand-accent/40 shadow-lg shadow-brand-accent/5'
                            : isLocked
                              ? 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10 hover:border-amber-500/20'
                              : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                        dir={isRtl ? 'rtl' : 'ltr'}
                      >
                        {/* Widescreen Thumbnail indicator with number overlay */}
                        <div className="relative aspect-video w-24 sm:w-28 rounded-xl bg-black/40 border border-white/5 shrink-0 overflow-hidden group-hover:border-white/15 transition-all">
                          {episode.image ? (
                            <img 
                              src={episode.image} 
                              alt={episode.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-brand-accent/5">
                              <Film className="w-5 h-5 text-white/20" />
                            </div>
                          )}
                          {/* Number Badge overlay */}
                          <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md font-mono text-[10px] font-black shrink-0 ${
                            isPlaying
                              ? isLocked ? 'bg-amber-500 text-black' : 'bg-brand-accent text-white shadow-md'
                              : isLocked
                                ? 'bg-amber-500/30 text-amber-300 backdrop-blur-sm'
                                : 'bg-black/60 text-white/90 backdrop-blur-sm'
                          }`}>
                            {episode.number}
                          </div>
                        </div>

                        {/* Text details */}
                        <div className={`min-w-0 flex-1 self-center ${isRtl ? 'text-right' : 'text-left'}`}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-extrabold text-sm truncate ${
                              isPlaying 
                                ? isLocked ? 'text-amber-400' : 'text-brand-accent' 
                                : isLocked ? 'text-white/70 group-hover:text-amber-400' : 'text-white group-hover:text-brand-accent'
                            }`}>
                              {episode.name}
                            </span>
                            {isLocked && <Lock className="w-3.5 h-3.5 text-amber-500 inline shrink-0" />}
                          </div>
                          
                          {isLocked ? (
                            <div className="mt-1.5">
                              <CountdownTimer releaseTime={episode.releaseTime!} language={language} size="small" />
                            </div>
                          ) : episode.description ? (
                            <span className="block text-[11px] text-brand-text-muted font-semibold line-clamp-1 mt-0.5">
                              {episode.description}
                            </span>
                          ) : null}
                        </div>

                        {/* Duration badge */}
                        {episode.duration && !isLocked && (
                          <span className="text-[10px] text-white/30 font-bold font-mono bg-white/5 px-2 py-1 rounded-md shrink-0 self-center">
                            {episode.duration}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Movie Catalog View */
          <div className="flex-1">
            <MoviesSection
              language={language}
              onSelectMovie={handleSelectMovie}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
