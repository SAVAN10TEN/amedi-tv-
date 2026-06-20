import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Sparkles, X, HelpCircle, MonitorPlay, VolumeX, ShieldAlert } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  logo: string;
  streamUrl: string;
  categories: string[];
}

type Category = 'All' | 'Kurdish' | 'Arabic' | 'General' | 'News' | 'Sports' | 'Movies' | 'Radio' | 'Islamic' | 'Kids';

interface VoiceAssistantProps {
  channels: Channel[];
  category: Category;
  setCategory: (cat: Category) => void;
  selectedChannel: Channel | null;
  setSelectedChannel: (ch: Channel | null) => void;
  language: 'English' | 'Kurdish' | 'Badini' | 'Arabic';
  isRtl: boolean;
  showPanel: boolean;
  setShowPanel: (show: boolean) => void;
}

// Convert English, Kurdish, and Arabic spoken words for digits into numeric characters
const wordsToNumber = (text: string): number | null => {
  const norm = text.trim().toLowerCase();

  const numMap: { [key: string]: number } = {
    // English
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 
    'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
    
    // Kurdish (Sorani & Badini text / latinized)
    'یەک': 1, 'ئێک': 1, 'دوو': 2, 'سێ': 3, 'چوار': 4, 'پێنج': 5, 'شەش': 6, 'حەوت': 7, 'حەفت': 7, 'هەشت': 8, 'نۆ': 9, 'نەهـ': 9, 'دە': 10, 'ده': 10,
    'یازدە': 11, 'دوازدە': 12, 'سێزدە': 13, 'چواردە': 14, 'پێنجدە': 15, 'پانزدە': 15, 'پازدە': 15, 'شەزدە': 16, 'شازدە': 16, 'حەفدە': 17, 'حەڤدە': 17, 'هەژدە': 18, 'نۆزدە': 19, 'بیست': 20,
    'yek': 1, 'du': 2, 'sê': 3, 'çwar': 4, 'pênc': 5, 'şeş': 6, 'hevt': 7, 'heft': 7, 'heşt': 8, 'neh': 9, 'deh': 10,

    // Arabic
    'واحد': 1, 'اثنين': 2, 'إثنين': 2, 'ثلاثة': 3, 'اربعة': 4, 'أربعة': 4, 'خمسة': 5, 'ستة': 6, 'سبعة': 7, 'ثمانية': 8, 'تسعة': 9, 'عشرة': 10,
    'أحد عشر': 11, 'اثنا عشر': 12, 'عشرون': 20, 'ثلاثون': 30, 'أربعون': 40, 'خمسون': 50
  };

  // Check if it matches direct map
  if (numMap[norm] !== undefined) {
    return numMap[norm];
  }

  // Check regex for raw digits anywhere in string
  const digitMatch = norm.match(/\d+/);
  if (digitMatch) {
    return parseInt(digitMatch[0], 10);
  }

  return null;
};

// Help suggestions based on user choice
const voiceSuggestions = {
  English: [
    { label: 'Switch to Channel 4', voice: 'بگوهۆڕە بۆ کەنالێ چوار' },
    { label: 'Play Waar TV', voice: 'وار لێبدە' },
    { label: 'Go to Sports Category', voice: 'بچۆ بۆ وەرزش' },
    { label: 'Pause/Play stream', voice: 'ڕاگرتن' }
  ],
  Kurdish: [
    { label: 'گۆڕین بۆ کەناڵی ٣', voice: 'بگۆڕە بۆ کەناڵی سێ' },
    { label: 'پەخشی ڕووداو لێبدە', voice: 'ڕووداو لێبدە' },
    { label: 'کاتیگۆری وەرزش نیشان بدە', voice: 'بچۆ بۆ وەرزش' },
    { label: 'تەماشاکردن ڕاگرە', voice: 'ڕاگرتن' }
  ],
  Badini: [
    { label: 'گوهۆڕین بۆ کەنالێ ٤', voice: 'بگوهۆڕە بۆ کەنالێ چوار' },
    { label: 'پەخشێ وار تیڤی لێبدە', voice: 'وار لێبدە' },
    { label: 'هاوپۆلا وەرزش نیشان بدە', voice: 'بچۆ بۆ وەرزش' },
    { label: 'ڤیدیۆیێ ڕاگرە', voice: 'ڕاگرتن' }
  ],
  Arabic: [
    { label: 'الذهاب إلى قناة ٢', voice: 'قناة اثنان' },
    { label: 'تشغيل قناة رووداو', voice: 'شغل رووداو' },
    { label: 'قسم الرياضة', voice: 'تغيير إلى قسم الرياضة' },
    { label: 'إيقاف مؤقت للبث', voice: 'ايقاف مؤقت' }
  ]
};

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  channels,
  category,
  setCategory,
  selectedChannel,
  setSelectedChannel,
  language,
  isRtl,
  showPanel,
  setShowPanel
}) => {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [hasPermissionError, setHasPermissionError] = useState<boolean>(false);
  const [voiceLocale, setVoiceLocale] = useState<string>(() => {
    if (language === 'English') return 'ckb-IQ';
    if (language === 'Arabic') return 'ar-SA';
    return 'ckb-IQ';
  });
  
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showPanel && isSupported && !isListening) {
      triggerListening();
    }
  }, [showPanel]);

  // Synchronize voiceLocale if user switches main app language
  useEffect(() => {
    if (language === 'English') {
      setVoiceLocale('ckb-IQ');
    } else if (language === 'Arabic') {
      setVoiceLocale('ar-SA');
    } else {
      setVoiceLocale('ckb-IQ');
    }
  }, [language]);

  useEffect(() => {
    // Check Web Speech API safety support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      console.warn('[Web Speech API] Speech Recognition is not supported on this browser context.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    
    // Set appropriate language locale from our dynamic state
    rec.lang = voiceLocale;

    rec.onstart = () => {
      setIsListening(true);
      setTranscript('');
      // Set a safety auto-timeout to turn off microphone if user doesn't say anything
      resetSilenceTimeout();
    };

    rec.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setTranscript(resultText);
      parseVoiceCommand(resultText);
    };

    rec.onerror = (err: any) => {
      console.error('[Web Speech API] Error: ', err.error);
      if (err.error === 'not-allowed') {
        setHasPermissionError(true);
        showFeedback(
          language === 'English' 
            ? 'Microphone permission blocked.' 
            : language === 'Arabic' 
              ? 'تم رفض الوصول إلى الميكروفون.' 
              : language === 'Badini'
                ? 'دەستپێگەهشتنا مایکرۆفۆنی هاتە ڕەتکرن.'
                : 'دەستپێگەیشتن بە مایکرۆفۆن ڕەتکرایەوە.'
        );
      } else if (err.error === 'no-speech') {
        showFeedback(
          language === 'English' 
            ? 'No speech was detected.' 
            : language === 'Arabic' 
              ? 'لم يتم الكشف عن أي صوت.' 
              : language === 'Badini'
                ? 'چ دەنگ نەهاتنە بیستن.'
                : 'چ دەنگێک تۆمار نەکرا.'
        );
      } else if (err.error === 'network') {
        console.warn('[Web Speech API] Network or language engine error. Voice recognition language failed for:', voiceLocale);
        if (voiceLocale === 'ckb-IQ') {
          // Auto fallback to widely supported Arabic recognizer for Middle Eastern networks/browsers lacking ckb server pack
          setVoiceLocale('ar-SA');
          showFeedback(
            language === 'English'
              ? 'Kurdish voice engine unsupported. Switched to Arabic capturing.'
              : language === 'Arabic'
                ? 'المساعد الكردي غير مدعوم على هذا الخادم. تم التحويل للعربية.'
                : language === 'Badini'
                  ? 'گوهداریێ زمانێ کوردی نەهاتیە پاڵپشتیکرن ل سەر سێرڤەری. زمان هاتە گۆڕین بۆ عەرەبی.'
                  : 'تۆمارکەری کوردی پاڵپشتی ناکرێت لەلایەن سێرڤەرەوە. گۆڕدرا بۆ زمانی عەرەبی.'
          );
        } else {
          showFeedback(
            language === 'English'
              ? 'Speech service offline. Check internet connection.'
              : language === 'Arabic'
                ? 'خادم الصوت غير متصل بالإنترنت. يرجى التحقق من الشبكة.'
                : language === 'Badini'
                  ? 'سێرڤەرێ دەنگی نە د گرێدایی یە. هیڤییە هێلا ئینتەرنێتێ کەنترۆل بکە.'
                  : 'سێرڤەری دەنگی کار ناکات. تکایە هێڵی ئینتەرنێتەکەت بپشکنە.'
          );
        }
      }
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    // Hotkey listener: pressing 'v' or 'V' starts voice commands
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return; // ignore when typing
      }
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setShowPanel(true);
        triggerListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, [voiceLocale, channels]);

  // Handle auto-change of recognition language if the voice locale state changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = voiceLocale;
    }
  }, [voiceLocale]);

  const resetSilenceTimeout = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    silenceTimeoutRef.current = setTimeout(() => {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }, 8500); // 8.5 seconds limit
  };

  const triggerListening = () => {
    if (!isSupported) return;
    try {
      setHasPermissionError(false);
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      } else {
        setTranscript('');
        recognitionRef.current?.start();
      }
    } catch (e) {
      console.warn('[Web Speech API] Recognition start error safely bypassed:', e);
    }
  };

  // Speaks feedback message using synthesis
  const speakFeedback = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Match TTS locales
        if (language === 'English') {
          utterance.lang = 'ckb-IQ';
          utterance.rate = 0.95;
        } else if (language === 'Arabic') {
          utterance.lang = 'ar-EG';
          utterance.rate = 1.0;
        } else {
          // Kurdish fallback
          utterance.lang = 'ckb-IQ';
          utterance.rate = 0.95;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('[Web TTS] Error in SpeechSynthesis:', err);
      }
    }
  };

  const showFeedback = (text: string) => {
    setLastAction(text);
    speakFeedback(text);
    // Clear feedback label after 5 seconds
    setTimeout(() => {
      setLastAction(prev => {
        if (prev === text) return null;
        return prev;
      });
    }, 5000);
  };

  // The brains of parsing voices
  const parseVoiceCommand = (rawSpeech: string) => {
    const text = rawSpeech.toLowerCase().trim();
    console.log('[Web Speech Assistant] Heard raw speech:', text);

    // 1. Playback commands: pause, play, resume
    const isPauseWord = /pause|stop|hold|ڕاگرە|ڕاگرتن|بووەستە|تەرا بکە|إيقاف|وقف|اسكت|بوەستە/i.test(text);
    const isPlayWord = /play|resume|start|لێبدە|لێدان|دەستپێکە|شغل|شغلي|لعب/i.test(text);

    if (isPauseWord) {
      const video = document.querySelector('video');
      if (video) {
        video.pause();
        showFeedback(
          language === 'English' 
            ? 'Playback paused' 
            : language === 'Arabic' 
              ? 'تم الإيقاف مؤقتاً' 
              : language === 'Badini'
                ? 'پەخش هاتە ڕاگرتن'
                : 'پەخش ڕاگیرا'
        );
        return;
      }
    }

    if (isPlayWord && !/play\s+\w+/i.test(text) && !/شغل\s+\w+/i.test(text)) {
      const video = document.querySelector('video');
      if (video) {
        video.play().catch(() => {});
        showFeedback(
          language === 'English' 
            ? 'Playback started' 
            : language === 'Arabic' 
              ? 'تم تشغيل البث' 
              : language === 'Badini'
                ? 'پەخش دەستپێکر'
                : 'پەخش دەست پێکرایەوە'
        );
        return;
      }
    }

    // 2. Category matching logic
    // We can list all categories mapping to their string regex
    const categoriesMap: { category: Category; pattern: RegExp; feedbackName: string }[] = [
      { 
        category: 'Sports', 
        pattern: /sport|sports|وەرزش|وه رزش|رياضة|رياضه/i, 
        feedbackName: language === 'English' ? 'Sports' : language === 'Arabic' ? 'الرياضة' : 'وەرزش' 
      },
      { 
        category: 'News', 
        pattern: /news|هەواڵ|ده نگ و باس|أخبار|اخبار|نووچە/i, 
        feedbackName: language === 'English' ? 'News' : language === 'Arabic' ? 'الأخبار' : language === 'Badini' ? 'نووچە' : 'هەواڵ' 
      },
      { 
        category: 'Movies', 
        pattern: /movie|movies|film|فیلم|ڤیلم|سینەما|أفلام|افلام/i, 
        feedbackName: language === 'English' ? 'Movies' : language === 'Arabic' ? 'الأفلام' : 'فیلم' 
      },
      { 
        category: 'Kids', 
        pattern: /kid|kids|mndal|منداڵ|منداڵان|بچووک|أطفال|اطفال|زارۆک/i, 
        feedbackName: language === 'English' ? 'Kids' : language === 'Arabic' ? 'الأطفال' : language === 'Badini' ? 'زارۆک' : 'منداڵان' 
      },
      { 
        category: 'Radio', 
        pattern: /radio|ڕادیۆ|راديو|اذاعة|إذاعة|رادیو/i, 
        feedbackName: language === 'English' ? 'Radio' : language === 'Arabic' ? 'الراديو' : 'ڕادیۆ' 
      },
      { 
        category: 'Kurdish', 
        pattern: /kurdish|kurd|کوردی|کوردیی|كردي/i, 
        feedbackName: language === 'English' ? 'Kurdish' : language === 'Arabic' ? 'الكردية' : 'کوردی' 
      },
      { 
        category: 'Arabic', 
        pattern: /arabic|arab|عەرەبی|عەرب|عربي|عربية/i, 
        feedbackName: language === 'English' ? 'Arabic' : language === 'Arabic' ? 'العربية' : 'عەرەبی' 
      },
      { 
        category: 'Islamic', 
        pattern: /islamic|islam|quran|ئیسلامی|قورئان|إسلامي|اسلامي|قرآن/i, 
        feedbackName: language === 'English' ? 'Islamic' : language === 'Arabic' ? 'الإسلامية' : 'ئیسلامی' 
      },
      { 
        category: 'General', 
        pattern: /general|گشتی|گشتیی|عام/i, 
        feedbackName: language === 'English' ? 'General' : language === 'Arabic' ? 'العامة' : 'گشتی' 
      },
      { 
        category: 'All', 
        pattern: /all|every|هەموو|هه موو|الكل|جميع|هەمی|هەمی کەنال/i, 
        feedbackName: language === 'English' ? 'All Channels' : language === 'Arabic' ? 'كل القنوات' : language === 'Badini' ? 'هەمی کەنال' : 'هەموو کەناڵەکان' 
      }
    ];

    for (const item of categoriesMap) {
      if (item.pattern.test(text)) {
        setCategory(item.category);
        showFeedback(
          language === 'English' 
            ? `Changed to ${item.feedbackName} category` 
            : language === 'Arabic' 
              ? `تم الانتقال إلى قسم ${item.feedbackName}` 
              : language === 'Badini'
                ? `هاوپۆل هاتە گوهۆڕین بۆ ${item.feedbackName}`
                : `کاتێگۆری گۆڕدرا بۆ ${item.feedbackName}`
        );
        return;
      }
    }

    // 3. Channel switching by Index Number (e.g. "Switch to Channel 5" or "Channel 7")
    const chNumber = wordsToNumber(text);
    if (chNumber !== null && chNumber > 0 && chNumber <= channels.length) {
      const selectedCh = channels[chNumber - 1];
      setSelectedChannel(selectedCh);
      showFeedback(
        language === 'English' 
          ? `Playing Channel ${chNumber}: ${selectedCh.name}` 
          : language === 'Arabic' 
            ? `تشغيل القناة رقم ${chNumber}: ${selectedCh.name}` 
            : language === 'Badini'
              ? `کەنالێ ژمارە ${chNumber} دهێتە لێدان: ${selectedCh.name}`
              : `کەناڵی ژمارە ${chNumber} لێدەدرێت: ${selectedCh.name}`
      );
      return;
    }

    // 4. Substring channel name search
    // Filter clean name words
    let searchName = text
      .replace(/switch to|go to|change to|play|channel|ch|ch\.|tv/g, '')
      .replace(/بگۆڕە بۆ|بگوهۆڕە بۆ|بگۆڕە بو|بگوهۆڕە بو|بچۆ بۆ|کەناڵی|کەنالێ|لێبدە/g, '')
      .replace(/شغل|شغلي|قناة|قناه|افتح/g, '')
      .trim();

    if (searchName.length >= 2) {
      const matched = channels.find(c => c.name.toLowerCase().includes(searchName));
      if (matched) {
        setSelectedChannel(matched);
        showFeedback(
          language === 'English' 
            ? `Playing ${matched.name}` 
            : language === 'Arabic' 
              ? `تشغيل ${matched.name}` 
              : language === 'Badini'
                ? `کەنالێ ${matched.name} دهێتە لێدان`
                : `${matched.name} لێدەدرێت`
        );
        return;
      }
    }

    // Unrecognized command
    showFeedback(
      language === 'English' 
        ? 'Command not recognized. Try saying "channel number".' 
        : language === 'Arabic' 
          ? 'أمر غير مفهوم. جرب قول "قناة ٥".' 
          : language === 'Badini'
            ? 'فەرمان نەهاتە تێگەهشتن. بێژە "کەنالێ پێنج".'
            : 'فەرمانەکە تێنەگەیشتم. بڵێ "کەناڵی پێنج".'
    );
  };

  const suggestions = voiceSuggestions[language] || voiceSuggestions.English;

  return (
    <>
      {/* Modern High-contrast Voice Control Console Panel */}
      <AnimatePresence>
        {showPanel && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-[#1c1c1e] border border-white/10 rounded-[36px] w-full max-w-lg p-6 relative overflow-hidden shadow-2xl flex flex-col gap-6"
              id="voice-panel-container"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {/* Background ambient light */}
              <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-sm text-white tracking-wider uppercase">
                      {language === 'English' ? 'Accessibility Voice Control' : language === 'Arabic' ? 'مساعد التحكم الصوتي' : language === 'Badini' ? 'هاریکارێ کۆنترۆڵا دەنگی' : 'کۆنترۆڵی دەنگیی ئاسانکاری'}
                    </h3>
                    <p className="text-[10px] text-brand-text-muted mt-0.5">
                      {language === 'English' ? 'Talk to navigate and stream channels hands-free' : language === 'Arabic' ? 'تحدث لتوجيه وتشغيل القنوات بدون استخدام اليدين' : language === 'Badini' ? 'ب ڕێکا دەنگی کەناڵان ب لڤینە بێ دەستپێدان' : 'بە دەنگ کەناڵەکان بگۆڕە بەبێ دەستپێدان'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (recognitionRef.current) recognitionRef.current.stop();
                    setShowPanel(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/5 text-brand-text-muted hover:text-white transition-all duration-150"
                  id="voice-panel-close-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status & Mic wave */}
              <div className="flex flex-col items-center justify-center gap-4 py-4">
                {isSupported ? (
                  <>
                    {hasPermissionError && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col items-center gap-2 text-center w-full max-w-sm">
                        <ShieldAlert className="w-8 h-8 text-amber-400" />
                        <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                          {language === 'English' ? 'Microphone Access Denied' : language === 'Arabic' ? 'تم رفض الوصول إلى الميكروفون' : language === 'Badini' ? 'ڕێپێدانا مایکرۆفۆنی هاتە ڕەتکرن' : 'دەستپێگەیشتن بە مایکرۆفۆن ڕەتکرایەوە'}
                        </span>
                        <p className="text-[10px] text-brand-text-muted leading-relaxed">
                          {language === 'English'
                            ? 'Please grant microphone access in your browser or click the "Open in new tab" icon above to bypass sandbox restriction.'
                            : language === 'Arabic' 
                              ? 'يرجى السماح بالوصول إلى الميكروفون في المتصفح الخاص بك أو انقر فوق رمز "الفتح في علامة تبويب جديدة" أعلاه.'
                              : language === 'Badini'
                                ? 'هیڤییە ڕێپێدانێ بدەی مایکڕۆفۆنی د برۆسەری دا یان کلیكا ل سەر "د پەنجەرەکا نوو دا ڤەکە" د سەر دا بکە.'
                                : 'تکایە ڕێگە بدە بە مایکرۆفۆن لە برۆسەرەکەتدا یان دوگمەی "لەسەر پەڕەیەکی نوێ بکەرەوە" دابگرە.'}
                        </p>
                      </div>
                    )}

                    <motion.button
                      onClick={triggerListening}
                      animate={isListening ? { scale: [1, 1.08, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 shadow-2xl relative cursor-pointer ${
                        isListening 
                          ? 'bg-[#ff2d55] border-[#ff2d55]/40 text-white shadow-[#ff2d55]/30' 
                          : 'bg-black/30 border-white/10 text-brand-text-muted hover:text-white hover:border-white/20 transition-all duration-300'
                      }`}
                      id="voice-panel-mic"
                    >
                      {isListening ? (
                        <>
                          <Mic className="w-11 h-11" />
                          <span className="text-[10px] font-black tracking-widest uppercase mt-2 select-none animate-pulse">
                            {language === 'English' ? 'Listening' : language === 'Arabic' ? 'جاري الاستماع' : language === 'Badini' ? 'خەریکی بیستنێ یە' : 'خەریکی بیستنە'}
                          </span>
                        </>
                      ) : (
                        <>
                          <MicOff className="w-11 h-11 text-white/50" />
                          <span className="text-[10px] font-black tracking-widest uppercase mt-2 select-none">
                            {language === 'English' ? 'Tap to Talk' : language === 'Arabic' ? 'انقر للحديث' : language === 'Badini' ? 'دابگرە بۆ گۆتنێ' : 'دابگرە بۆ قسەکردن'}
                          </span>
                        </>
                      )}
                    </motion.button>

                    {/* Microphone volume wave simulations */}
                    {isListening && (
                      <div className="flex items-center gap-1 h-6">
                        {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((val, idx) => (
                          <motion.div
                            key={idx}
                            animate={{ scaleY: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: idx * 0.05 }}
                            className="w-1 rounded-full bg-[#ff2d55] h-full"
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-center gap-2 text-center w-full max-w-sm">
                    <VolumeX className="w-8 h-8 text-red-400" />
                    <span className="text-xs font-black text-red-400 uppercase tracking-wider">
                      {language === 'English' ? 'Speech Recognition Unsupported' : language === 'Arabic' ? 'التعرف على الصوت غير مدعوم' : language === 'Badini' ? 'تۆمارکرنا دەنگی نەهاتیە پاڵپشتیکرن' : 'ناسینی دەنگ پاڵپشتی ناکرێت'}
                    </span>
                    <p className="text-[10px] text-brand-text-muted leading-relaxed">
                      {language === 'English'
                        ? 'Your browser or device platform does not support inline microphone capturing. Please use Chrome context, Safari iOS, or Android TV.'
                        : language === 'Arabic'
                          ? 'المتصفح أو نظام التشغيل الخاص بك لا يدعم تسجيل الصوت المدمج. يرجى استخدام متصفح كروم أو سفاري.'
                          : language === 'Badini'
                            ? 'ئامێر یان برۆسەرێ تە مایکڕۆفۆنا ناڤخۆیی قەبوول ناکەت. هیڤییە مایکڕۆفۆنەکا گونجای یان برۆسەرێ کۆرۆمی بکاربینی.'
                            : 'برۆسەر یان مۆبایلەکەت مایکڕۆفۆنی ناوخۆیی قبووڵ ناکات. تکایە برۆسەری گونجاو یان وەک کڕۆم بەکاربهێنە.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Dynamic Voice Language Input Override Selector */}
              {isSupported && (
                <div className="flex flex-col gap-1.5 bg-black/20 border border-white/5 rounded-[20px] p-2">
                  <span className="text-[9px] text-[#8e8e93] font-black tracking-widest uppercase text-center select-none block">
                    {language === 'English' ? 'Microphone Language' : language === 'Arabic' ? 'لغة الميكروفون' : language === 'Badini' ? 'زاراڤێ کۆنترۆڵا دەنگی' : 'زمانی کۆنترۆڵی دەنگی'}
                  </span>
                  <div className="grid grid-cols-2 gap-1 bg-black/40 p-0.5 rounded-xl border border-white/5">
                    <button
                      onClick={() => {
                        setVoiceLocale('ckb-IQ');
                        showFeedback(
                          language === 'English' 
                            ? 'Microphone set to Kurdish Badini' 
                            : language === 'Arabic' 
                              ? 'تم تغيير لغة الميكروفون إلى الكردية البادينية' 
                              : language === 'Badini'
                                ? 'زاراڤێ دەنگی بۆ کوردی بادینی هاتە گوهۆڕین'
                                : 'زمانی دەنگی بۆ کوردی بادینی گۆڕدرا'
                        );
                      }}
                      className={`py-1 rounded-lg text-[9px] font-black transition-all ${
                        voiceLocale === 'ckb-IQ'
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-[#8e8e93] hover:text-white'
                      }`}
                    >
                      Kurdish Badini (ckb-IQ)
                    </button>
                    <button
                      onClick={() => {
                        setVoiceLocale('ar-SA');
                        showFeedback(
                          language === 'English' 
                            ? 'Microphone set to Arabic' 
                            : language === 'Arabic' 
                              ? 'تم تغيير لغة الميكروفون إلى العربية' 
                              : language === 'Badini'
                                ? 'زاراڤێ دەنگی بۆ عەرەبی هاتە گوهۆڕین'
                                : 'زمانی دەنگی بۆ عەرەبی گۆڕدرا'
                        );
                      }}
                      className={`py-1 rounded-lg text-[9px] font-black transition-all ${
                        voiceLocale === 'ar-SA'
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-[#8e8e93] hover:text-white'
                      }`}
                    >
                      Arabic (ar-SA)
                    </button>
                  </div>
                </div>
              )}

              {/* Subtitles & Outputs */}
              {isSupported && (
                <div className="flex flex-col gap-2 bg-black/40 border border-white/5 rounded-3xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-brand-text-muted font-black tracking-widest uppercase select-none">
                      {language === 'English' ? 'Heard Text' : language === 'Arabic' ? 'النص المسموع' : language === 'Badini' ? 'ئەوا هاتیە گۆتن' : 'دەقە بیستراوەکە'}
                    </span>
                    {transcript && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                  </div>
                  {transcript ? (
                    <p className="text-sm font-bold text-white leading-relaxed italic bg-white/5 rounded-2xl py-3 px-4 text-center border border-white/5 font-sans">
                      "{transcript}"
                    </p>
                  ) : (
                    <p className="text-xs text-white/30 italic py-3 text-center">
                      {language === 'English' ? 'Speak a channel number or name...' : language === 'Arabic' ? 'انطق اسم القناة أو رقمها...' : language === 'Badini' ? 'ناڤ یان ژمارەیا کەنالەکێ بێژە...' : 'ناو یان ژمارەی کەناڵێک بڵێ...'}
                    </p>
                  )}
                </div>
              )}

              {/* Feedback Alert Toast line inside modal */}
              {lastAction && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 bg-purple-600/20 border border-purple-500/30 rounded-2xl py-3 px-4 text-center"
                >
                  <Volume2 className="w-4 h-4 text-purple-400 shrink-0 animate-bounce" />
                  <span className="text-xs font-bold text-purple-300">
                    {lastAction}
                  </span>
                </motion.div>
              )}

              {/* Help & Suggestions */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[9px] text-brand-text-muted font-black tracking-widest uppercase flex items-center gap-2 select-none">
                  <HelpCircle className="w-3.5 h-3.5" />
                  {language === 'English' ? 'Suggestions to Try' : language === 'Arabic' ? 'اقتراحات لتجربتها' : language === 'Badini' ? 'پێشنیارێن تو دکاری بکەی' : 'پیشنیارەکان بۆ تاقیکردنەوە'}
                </span>
                <div className="grid grid-cols-2 gap-2 text-left">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTranscript(item.voice);
                        parseVoiceCommand(item.voice);
                      }}
                      className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-purple-500/20 text-start group transition-all duration-200 outline-none active:scale-[0.98]"
                    >
                      <div className="text-[10px] font-bold text-white group-hover:text-purple-400 transition-colors uppercase leading-snug">
                        {item.label}
                      </div>
                      <div className="text-[9px] text-brand-text-muted font-mono mt-1 opacity-70">
                        "{item.voice}"
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active TV Mode Hint */}
              <div className="flex items-center justify-center gap-2 bg-white/5 rounded-2xl py-2 px-3 text-[9px] text-brand-text-muted font-black uppercase tracking-wider select-none border border-white/5">
                <MonitorPlay className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
                <span>
                  {language === 'English' ? 'Hotkey Indicator: Press "V" key anywhere to start' : language === 'Arabic' ? 'مفتاح الاختصار: اضغط على مفتاح "V" في أي مكان للبدء' : language === 'Badini' ? 'پەنجەکێ ل سەر پیت و دوگمەیا "V" دابنە بۆ دەستپێکرنا کۆنترۆڵا دەنگی' : 'نیشاندەری دوگمە: دوگمەی "V" داگرە لە هەر شوێنێک بیت بۆ دەستپێکردن'}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
