import { create } from 'zustand';

export interface DashboardState {
  maxPrice: number;
  categories: string[];
  style: string | null;
  orientation: string | null;
  selectedArtwork: any;
  cart: any[];
  uploadedReference: any;
  similarArtworks: any[];
  
  setMaxPrice: (price: number) => void;
  setCategories: (categories: string[]) => void;
  setStyle: (style: string | null) => void;
  setOrientation: (orientation: string | null) => void;
  setSelectedArtwork: (artwork: any) => void;
  setUploadedReference: (ref: any) => void;
  setSimilarArtworks: (artworks: any[]) => void;
  resetFilters: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  maxPrice: 2000,
  categories: [],
  style: 'All',
  orientation: 'All',
  selectedArtwork: null,
  cart: [],
  uploadedReference: null,
  similarArtworks: [],

  setMaxPrice: (price) => set({ maxPrice: price }),
  setCategories: (categories) => set({ categories }),
  setStyle: (style) => set({ style }),
  setOrientation: (orientation) => set({ orientation }),
  setSelectedArtwork: (artwork) => set({ selectedArtwork: artwork }),
  setUploadedReference: (ref) => set({ uploadedReference: ref }),
  setSimilarArtworks: (artworks) => set({ similarArtworks: artworks }),
  resetFilters: () => set({ maxPrice: 2000, categories: [], style: 'All', orientation: 'All' }),
}));
