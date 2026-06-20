import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Film, Star, Clock, Calendar, Search, Play, Sparkles } from 'lucide-react';
import { Channel, Language } from '../types';
import { MOVIES } from '../data';

interface MoviesSectionProps {
  language: Language;
  onSelectMovie: (movie: Channel) => void;
}

export const MoviesSection = ({ language, onSelectMovie }: MoviesSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Kids' | 'Drama' | 'Kurdish' | 'Badini'>('All');

  const isRtl = language === 'Kurdish' || language === 'Badini' || language === 'Arabic';

  // Translate labels based on active user language
  const labels = {
    English: {
      title: 'Amedi Cinema',
      subtitle: 'Premium Kurdish movies and dubbed animations',
      searchPlaceholder: 'Search movies...',
      featuredTitle: 'Featured Selection',
      watchNow: 'Watch Now',
      all: 'All Movies',
      kurdish: 'Kurdish Cinema',
      badini: 'Kurdish Badini',
      kids: 'Kids & Dubbed',
      drama: 'Drama',
      rating: 'Rating',
      year: 'Year',
      duration: 'Duration',
      noMovies: 'No movies found matching your criteria'
    },
    Kurdish: {
      title: 'سیـنەمای ئامێدی',
      subtitle: 'بینەری ناوازەترین فیلم و کارتۆنە کوردی و دۆبلاژکراوەکان بن',
      searchPlaceholder: 'بگەڕێ بۆ فیلمەکان...',
      featuredTitle: 'هەڵبژاردەی نایاب',
      watchNow: 'ئێستا سەیر بکە',
      all: 'هەموو فیلمەکان',
      kurdish: 'سینەمای کوردی',
      badini: 'دۆبلاژی بادینی',
      kids: 'منداڵان و دۆبلاژ',
      drama: 'دراما',
      rating: 'هەڵسەنگاندن',
      year: 'ساڵ',
      duration: 'ماوە',
      noMovies: 'هیچ فیلمێک نەدۆزرایەوە'
    },
    Badini: {
      title: 'سیـنەما ئامێدی',
      subtitle: 'بینەری ناوازەترین فیلم و کارتۆنێن دۆبلاژکری بن',
      searchPlaceholder: 'بگەڕە بۆ فیلم و جاران...',
      featuredTitle: 'هەلبژاردەی نایاب',
      watchNow: 'نوکە تەماشا بکە',
      all: 'هەمی فیلم',
      kurdish: 'سینەمایا کوردی',
      badini: 'دۆبلاژێ بادینی',
      kids: 'زارۆک و دۆبلاژ',
      drama: 'دراما',
      rating: 'پێداچوونەوە',
      year: 'سال',
      duration: 'دەم',
      noMovies: 'چ فیلم نەهاتنە دیتن'
    },
    Arabic: {
      title: 'سينما عمادية',
      subtitle: 'أحدث الأفلام الكردية والرسوم المتحركة المدبلجة',
      searchPlaceholder: 'البحث عن أفلام...',
      featuredTitle: 'فيلم الأسبوع',
      watchNow: 'شاهد الآن',
      all: 'جميع الأفلام',
      kurdish: 'السينما الكردية',
      badini: 'دبلجة بادينية',
      kids: 'أطفال ومدبلج',
      drama: 'دراما',
      rating: 'التقييم',
      year: 'السنة',
      duration: 'المدة',
      noMovies: 'لم يتم العثور على أفلام مطابقة للبحث'
    }
  }[language];

  // Pick first movie as the "Featured Movie"
  const featuredMovie = MOVIES[0];

  // Filter & Search Logic
  const filteredMovies = useMemo(() => {
    return MOVIES.filter(movie => {
      const matchesSearch = movie.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (movie.description && movie.description.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesFilter = true;
      if (selectedFilter === 'Kids') {
        matchesFilter = movie.categories.includes('Kids');
      } else if (selectedFilter === 'Drama') {
        matchesFilter = movie.categories.includes('Drama');
      } else if (selectedFilter === 'Kurdish') {
        matchesFilter = movie.categories.includes('Kurdish');
      } else if (selectedFilter === 'Badini') {
        matchesFilter = movie.categories.includes('Badini');
      }

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, selectedFilter]);

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Movies Hero Banner (Featured Movie) */}
      {featuredMovie && (
        <div className="relative w-full min-h-[300px] md:min-h-[380px] rounded-[36px] overflow-hidden border border-white/10 group shadow-2xl bg-gradient-to-br from-red-950/40 via-[#0f0a1e] to-black mb-8 p-6 md:p-8 flex flex-col justify-end transition-all hover:border-brand-accent/20">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay transition-transform duration-700 group-hover:scale-105" 
            style={{ backgroundImage: `url('${featuredMovie.banner || featuredMovie.logo}')` }} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-transparent z-0" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="flex items-center gap-1.5 text-brand-accent font-black text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 w-fit">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                {labels.featuredTitle}
              </span>
              
              <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {featuredMovie.name}
              </h2>
              
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/70 font-semibold">
                <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span>{featuredMovie.rating}</span>
                </span>
                <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>{featuredMovie.year}</span>
                </span>
                <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>{featuredMovie.duration}</span>
                </span>
              </div>

              <p className="text-white/60 text-xs md:text-sm leading-relaxed line-clamp-3 md:line-clamp-none">
                {featuredMovie.description}
              </p>
            </div>

            <button 
              onClick={() => onSelectMovie(featuredMovie)}
              className="flex items-center gap-2 px-7 py-3.5 font-bold uppercase tracking-wider text-xs md:text-sm rounded-full bg-brand-accent hover:bg-brand-accent/90 text-white shadow-xl shadow-brand-accent/25 hover:scale-[1.04] active:scale-95 transition-all self-start md:self-end shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{labels.watchNow}</span>
            </button>
          </div>
        </div>
      )}

      {/* Movies Sub-Header & Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white">{labels.title}</h1>
          <p className="text-xs text-brand-text-muted mt-0.5">{labels.subtitle}</p>
        </div>

        {/* Local Search and Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Movie Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-white/40`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className={`w-full py-2.5 ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'} rounded-full bg-brand-card/50 border border-white/10 text-white placeholder-white/40 text-xs font-bold outline-none focus:border-brand-accent/55 focus:ring-1 focus:ring-brand-accent/30 transition-all`}
            />
          </div>

          {/* Genre Tabs */}
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-full gap-1 overflow-x-auto no-scrollbar shrink-0">
            {[
              { id: 'All', label: labels.all },
              { id: 'Badini', label: labels.badini },
              { id: 'Kurdish', label: labels.kurdish },
              { id: 'Drama', label: labels.drama },
              { id: 'Kids', label: labels.kids }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id as any)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap outline-none ${
                  selectedFilter === f.id
                    ? 'bg-brand-accent text-white shadow-md'
                    : 'text-white/65 hover:text-white hover:bg-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredMovies.map((movie) => (
            <motion.div
              layout
              key={movie.id}
              onClick={() => onSelectMovie(movie)}
              className="group cursor-pointer select-none"
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <div id={`movie-card-${movie.id}`} className="relative aspect-[2/3] rounded-[24px] overflow-hidden border border-white/10 bg-brand-card/30 group-hover:border-brand-accent/40 shadow-lg group-hover:shadow-brand-accent/5 transition-all">
                {/* Poster Background */}
                <img
                  src={movie.logo}
                  alt={movie.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Category Overlay tag */}
                <div className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} z-10`}>
                  <span className="px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest uppercase bg-brand-accent text-white shadow-md">
                    {movie.categories.includes('Badini')
                      ? (language === 'English' ? 'BADINI DUB' : language === 'Badini' ? 'دۆبلاژێ بادینی' : 'دۆبلاژی بادینی')
                      : movie.categories.includes('Kids')
                        ? (language === 'English' ? 'DUBBED' : 'دۆبلاژ')
                        : (language === 'English' ? 'SUBBED' : 'ژێرنووس')}
                  </span>
                </div>

                {/* Info Overlay (Visible on Hover and Desktop) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="space-y-1.5 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-2 text-[10px] text-white/80 font-black">
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {movie.rating?.split('/')[0]}
                      </span>
                      <span>•</span>
                      <span>{movie.year}</span>
                    </div>
                    
                    <p className="text-[10px] text-white/60 leading-normal line-clamp-3">
                      {movie.description}
                    </p>

                    <div className="pt-2">
                      <span className="w-8 h-8 rounded-full bg-brand-accent text-white flex items-center justify-center shadow-md">
                        <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Decorative border gloss */}
                <div className="absolute inset-0 border border-white/5 rounded-[24px] pointer-events-none group-hover:border-brand-accent/20 transition-all" />
              </div>

              {/* Title & Duration (Below Card for readability) */}
              <div className="mt-2.5 px-0.5">
                <span className="block font-black text-xs text-white tracking-tight group-hover:text-brand-accent line-clamp-1 transition-colors leading-snug">
                  {movie.name}
                </span>
                
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-brand-text-muted font-bold uppercase tracking-wider">
                  <span>{movie.year}</span>
                  <span>•</span>
                  <span>{movie.duration}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-brand-text-muted">
          <Film className="w-12 h-12 mb-4 opacity-25" />
          <p className="text-sm font-semibold">{labels.noMovies}</p>
        </div>
      )}
    </div>
  );
};
