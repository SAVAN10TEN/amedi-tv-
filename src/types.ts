export type Category = 'All' | 'Kurdish' | 'Arabic' | 'General' | 'News' | 'Sports' | 'Music' | 'Radio' | 'Islamic' | 'Kids' | 'Drama' | 'Badini';

export interface Episode {
  id: string;
  number: number;
  name: string;
  streamUrl: string;
  duration?: string;
  description?: string;
  releaseTime?: number;
  image?: string;
}

export interface Channel {
  id: string;
  name: string;
  logo: string;
  categories: Category[];
  streamUrl?: string;
  isMovie?: boolean;
  year?: string;
  duration?: string;
  rating?: string;
  description?: string;
  banner?: string;
  episodes?: Episode[];
}

export type Language = 'Kurdish' | 'Arabic' | 'English' | 'Badini';
