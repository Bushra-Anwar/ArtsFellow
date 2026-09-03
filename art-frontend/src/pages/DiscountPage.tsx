import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Palette, ShieldCheck, Truck, Heart,
  ChevronRight, ArrowRight, Star, Globe, Users,
  Layers, Sliders, Menu, X, ShoppingBag,
  Upload, Download, Wand2, RefreshCw, Printer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ArtistService } from '../services/artist.service';
import { ArtworkService } from '../services/artwork.service';
import { useDashboardStore } from '../store/dashboardStore';

// --- Paint by Numbers Utility ---
interface ColorSwatch {
  number: number;
  hex: string;
  r: number;
  g: number;
  b: number;
  name: string;
}

function getColorName(r: number, g: number, b: number): string {
  const colors: [number, number, number, string][] = [
    [255, 0, 0, 'Crimson Red'], [220, 53, 69, 'Rose Red'], [255, 69, 0, 'Vermillion'],
    [255, 165, 0, 'Golden Orange'], [255, 215, 0, 'Sunflower Yellow'], [255, 255, 0, 'Canary Yellow'],
    [0, 128, 0, 'Forest Green'], [34, 139, 34, 'Fern Green'], [0, 255, 127, 'Mint Green'],
    [0, 191, 255, 'Sky Blue'], [30, 144, 255, 'Cobalt Blue'], [0, 0, 255, 'Royal Blue'],
    [75, 0, 130, 'Deep Indigo'], [148, 0, 211, 'Violet'], [255, 0, 255, 'Magenta'],
    [255, 20, 147, 'Deep Pink'], [255, 182, 193, 'Baby Pink'], [139, 69, 19, 'Saddle Brown'],
    [210, 180, 140, 'Tan Beige'], [245, 222, 179, 'Wheat'], [255, 255, 255, 'Pure White'],
    [128, 128, 128, 'Stone Gray'], [64, 64, 64, 'Charcoal'], [0, 0, 0, 'Jet Black'],
    [0, 128, 128, 'Teal'], [64, 224, 208, 'Turquoise'], [255, 127, 80, 'Coral'],
    [152, 251, 152, 'Pale Green'], [70, 130, 180, 'Steel Blue'], [188, 143, 143, 'Rosy Brown'],
  ];
  let minDist = Infinity, closest = 'Custom Mix';
  for (const [cr, cg, cb, name] of colors) {
    const d = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2);
    if (d < minDist) { minDist = d; closest = name; }
  }
  return closest;
}

function quantizeColors(imageData: ImageData, numColors: number): ColorSwatch[] {
  const data = imageData.data;
  const colorMap: Map<string, { r: number; g: number; b: number; count: number }> = new Map();

  for (let i = 0; i < data.length; i += 4 * 8) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = `${r},${g},${b}`;
    const existing = colorMap.get(key);
    if (existing) existing.count++;
    else colorMap.set(key, { r, g, b, count: 1 });
  }

  const sorted = Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, numColors);

  return sorted.map((c, i) => ({
    number: i + 1,
    hex: `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`,
    r: c.r, g: c.g, b: c.b,
    name: getColorName(c.r, c.g, c.b)
  }));
}

function isEdge(quantized: Uint8Array, x: number, y: number, width: number, height: number): boolean {
  const qi = y * width + x;
  const val = quantized[qi];
  if (x > 0 && quantized[qi - 1] !== val) return true;
  if (x < width - 1 && quantized[qi + 1] !== val) return true;
  if (y > 0 && quantized[qi - width] !== val) return true;
  if (y < height - 1 && quantized[qi + width] !== val) return true;
  return false;
}

function generateOutlineCanvas(
  srcCanvas: HTMLCanvasElement,
  outCanvas: HTMLCanvasElement,
  swatches: ColorSwatch[]
): void {
  const ctx = srcCanvas.getContext('2d')!;
  const outCtx = outCanvas.getContext('2d')!;
  const { width, height } = srcCanvas;
  outCanvas.width = width;
  outCanvas.height = height;

  const imgData = ctx.getImageData(0, 0, width, height);

  // ── Step 1: Build quantized map ──
  const quantized = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = imgData.data[idx], g = imgData.data[idx + 1], b = imgData.data[idx + 2];
      let minD = Infinity, nearest = 0;
      for (const sw of swatches) {
        const d = (r - sw.r) ** 2 + (g - sw.g) ** 2 + (b - sw.b) ** 2;
        if (d < minD) { minD = d; nearest = sw.number; }
      }
      quantized[y * width + x] = nearest;
    }
  }

  // ── Step 2: Real paint-by-numbers style ──
  // Light pastel tint fill (85% white mix) + thin dark outline at 1px boundaries
  const filled = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const qi = y * width + x;
      const fi = qi * 4;
      const sw = swatches[quantized[qi] - 1];

      // Check immediate 1-pixel neighbors only (thin crisp line)
      const isEdgePx =
        (x > 0 && quantized[qi - 1] !== quantized[qi]) ||
        (x < width - 1 && quantized[qi + 1] !== quantized[qi]) ||
        (y > 0 && quantized[qi - width] !== quantized[qi]) ||
        (y < height - 1 && quantized[qi + width] !== quantized[qi]);

      if (isEdgePx) {
        // Soft pencil-gray outline — light and easy to draw along
        filled[fi] = 90; filled[fi + 1] = 90; filled[fi + 2] = 100; filled[fi + 3] = 255;
      } else {
        // Very light pastel tint — 95% white + 5% actual color (barely-there hint)
        filled[fi]     = Math.round(sw.r * 0.05 + 255 * 0.95);
        filled[fi + 1] = Math.round(sw.g * 0.05 + 255 * 0.95);
        filled[fi + 2] = Math.round(sw.b * 0.05 + 255 * 0.95);
        filled[fi + 3] = 255;
      }
    }
  }
  outCtx.putImageData(new ImageData(filled, width, height), 0, 0);

  // ── Step 3: Dense small numbers — placed every cell across the image ──
  // Like a real Chapturia kit: tiny numbers scattered throughout each region
  const cellSize = Math.max(20, Math.floor(Math.min(width, height) / 18));
  const fontSize = Math.max(8, Math.floor(cellSize * 0.48));

  outCtx.textAlign = 'center';
  outCtx.textBaseline = 'middle';
  outCtx.font = `bold ${fontSize}px Arial`;

  for (let row = 0; row < Math.ceil(height / cellSize); row++) {
    for (let col = 0; col < Math.ceil(width / cellSize); col++) {
      const cx0 = col * cellSize;
      const cy0 = row * cellSize;
      const cx1 = Math.min(cx0 + cellSize, width);
      const cy1 = Math.min(cy0 + cellSize, height);
      const midX = Math.round((cx0 + cx1) / 2);
      const midY = Math.round((cy0 + cy1) / 2);
      const num = quantized[midY * width + midX];
      const sw = swatches[num - 1];
      if (!sw) continue;

      // Skip if center is on an outline pixel
      const qi = midY * width + midX;
      const isEdgePx =
        (midX > 0 && quantized[qi - 1] !== quantized[qi]) ||
        (midX < width - 1 && quantized[qi + 1] !== quantized[qi]) ||
        (midY > 0 && quantized[qi - width] !== quantized[qi]) ||
        (midY < height - 1 && quantized[qi + width] !== quantized[qi]);
      if (isEdgePx) continue;

      // Decide text color: dark on light tint, light on dark tint
      const tintLum = (sw.r * 0.12 + 255 * 0.88) * 0.299 +
                      (sw.g * 0.12 + 255 * 0.88) * 0.587 +
                      (sw.b * 0.12 + 255 * 0.88) * 0.114;
      const textColor = tintLum > 140 ? '#6b6b80' : '#ffffffcc';

      outCtx.save();
      outCtx.fillStyle = textColor;
      outCtx.fillText(String(num), midX, midY);
      outCtx.restore();
    }
  }
}

// --- Types & Interfaces ---
interface ArtworkCard {
  id: string;
  title: string;
  artist: string;
  price: string;
  category: string;
  image: string;
  likes: number;
}

interface ArtistCard {
  id: string;
  name: string;
  country: string;
  style: string;
  followers: string;
  avatar: string;
}

export default function DiscountPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});

  const setCategories = useDashboardStore(state => state.setCategories);

  const { user, role } = useAuth();
  const { addToCart } = useCart();
  const [trendingArtworks, setTrendingArtworks] = useState<any[]>([]);
  const [featuredArtists, setFeaturedArtists] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artRes, artistRes]: any[] = await Promise.all([
          ArtworkService.getLatestArt(4),
          ArtistService.getTopArtists(3)
        ]);
        if (artRes.status === "ok") {
          setTrendingArtworks(artRes.artworks);
        }
        if (artistRes.status === "ok") {
          setFeaturedArtists(artistRes.artists);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleDeleteArtwork = async (id: string) => {
    try {
      await ArtistService.deleteArtwork(id);
      setTrendingArtworks(prev => prev.filter(art => art._id !== id));
    } catch (err) {
      console.error("Failed to delete artwork", err);
    }
  };

  // --- Paint by Numbers State ---
  const [pbnImage, setPbnImage] = useState<string | null>(null);
  const [pbnSwatches, setPbnSwatches] = useState<ColorSwatch[]>([]);
  const [pbnProcessing, setPbnProcessing] = useState(false);
  const [pbnReady, setPbnReady] = useState(false);
  const [pbnColorCount, setPbnColorCount] = useState(12);
  const [pbnOutputUrl, setPbnOutputUrl] = useState<string | null>(null);
  const [pbnColorMode, setPbnColorMode] = useState<'colorful' | 'bw'>('colorful');
  const [pbnPrintModal, setPbnPrintModal] = useState(false);
  const [pbnPrintSize, setPbnPrintSize] = useState<'A4' | 'A3' | 'Letter' | '4x6'>('A4');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const srcCanvasRef = useRef<HTMLCanvasElement>(null);
  const outCanvasRef = useRef<HTMLCanvasElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const processPbnImage = useCallback((dataUrl: string, numColors: number) => {
    setPbnProcessing(true);
    setPbnReady(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const MAX = 800;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const srcCanvas = srcCanvasRef.current!;
      srcCanvas.width = w; srcCanvas.height = h;
      const ctx = srcCanvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const swatches = quantizeColors(imgData, numColors);
      setPbnSwatches(swatches);
      generateOutlineCanvas(srcCanvas, outCanvasRef.current!, swatches);
      setPbnOutputUrl(outCanvasRef.current!.toDataURL('image/png'));
      setPbnProcessing(false);
      setPbnReady(true);
    };
    img.src = dataUrl;
  }, []);

  const printCanvas = useCallback((size: string) => {
    if (!pbnOutputUrl) return;
    const sizemap: Record<string, string> = {
      'A4': '210mm 297mm', 'A3': '297mm 420mm',
      'Letter': '8.5in 11in', '4x6': '4in 6in'
    };
    const pageSize = sizemap[size] || '210mm 297mm';
    const swatchesHtml = pbnSwatches.map(sw => {
      const grey = Math.round(0.299 * sw.r + 0.587 * sw.g + 0.114 * sw.b);
      const hex = pbnColorMode === 'bw' ? `#${grey.toString(16).padStart(2,'0').repeat(3)}` : sw.hex;
      const lum = pbnColorMode === 'bw' ? grey : (0.299 * sw.r + 0.587 * sw.g + 0.114 * sw.b);
      const tc = lum > 128 ? '#1a1a2e' : '#fff';
      const nm = pbnColorMode === 'bw' ? `Grey ${grey}` : sw.name;
      return `<div style="display:flex;align-items:center;gap:5px;padding:3px 5px;border:1px solid #e2e8f0;border-radius:6px;background:#fafafa"><div style="width:28px;height:28px;border-radius:4px;background:${hex};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:10px;color:${tc};flex-shrink:0;border:1px solid rgba(0,0,0,0.1)">${sw.number}</div><div><div style="font-size:8px;font-weight:700;color:#111;white-space:nowrap">${nm}</div><div style="font-size:7px;color:#666;font-family:monospace">${hex.toUpperCase()}</div></div></div>`;
    }).join('');
    const win = window.open('', '_blank')!;
    win.document.write(`<!DOCTYPE html><html><head><title>Paint by Numbers — ${size}</title>
      <style>@page{size:${pageSize};margin:8mm}body{margin:0;font-family:Arial,sans-serif;background:#fff}.pbn-img{width:100%;max-height:60vh;object-fit:contain;display:block}.legend{margin-top:10px;padding:10px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;page-break-inside:avoid}.legend-title{font-size:11px;font-weight:700;color:#0f172a;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e2e8f0}.legend-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:3px}</style>
      </head><body><img src="${pbnOutputUrl}" class="pbn-img"/><div class="legend"><div class="legend-title">🎨 Color Legend — ${pbnSwatches.length} Paints Required</div><div class="legend-grid">${swatchesHtml}</div></div></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  }, [pbnOutputUrl, pbnSwatches, pbnColorMode]);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPbnImage(dataUrl);
      setPbnReady(false);
      setPbnSwatches([]);
      setPbnOutputUrl(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const downloadWithLegend = useCallback(() => {
    if (!pbnOutputUrl || !pbnSwatches.length) return;
    const img = new Image();
    img.onload = () => {
      const cols = 6;
      const sw32 = 32, itemW = 115, itemH = 40, pad = 18, titleH = 26;
      const rows = Math.ceil(pbnSwatches.length / cols);
      const legendH = pad * 2 + titleH + rows * itemH;
      const cw = Math.max(img.width, cols * itemW + pad * 2);
      const cvs = document.createElement('canvas');
      cvs.width = cw; cvs.height = img.height + legendH;
      const c = cvs.getContext('2d')!;
      c.fillStyle = '#ffffff';
      c.fillRect(0, 0, cw, cvs.height);
      c.drawImage(img, Math.floor((cw - img.width) / 2), 0);
      const ly = img.height;
      c.fillStyle = '#f8fafc';
      c.fillRect(0, ly, cw, legendH);
      c.strokeStyle = '#cbd5e1'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, ly); c.lineTo(cw, ly); c.stroke();
      c.fillStyle = '#0f172a'; c.font = 'bold 13px Arial';
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('Color Legend — Paints Required', pad, ly + pad + 6);
      pbnSwatches.forEach((sw, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const sx = pad + col * itemW, sy = ly + pad + titleH + row * itemH;
        const grey = Math.round(0.299 * sw.r + 0.587 * sw.g + 0.114 * sw.b);
        const hex = pbnColorMode === 'bw' ? `#${grey.toString(16).padStart(2,'0').repeat(3)}` : sw.hex;
        const lum = pbnColorMode === 'bw' ? grey : (0.299 * sw.r + 0.587 * sw.g + 0.114 * sw.b);
        const tc = lum > 128 ? '#1a1a2e' : '#fff';
        const nm = pbnColorMode === 'bw' ? `Grey ${grey}` : sw.name;
        c.fillStyle = hex; c.fillRect(sx, sy + 2, sw32, sw32);
        c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 0.5; c.strokeRect(sx, sy + 2, sw32, sw32);
        c.fillStyle = tc; c.font = 'bold 11px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(String(sw.number), sx + sw32 / 2, sy + 2 + sw32 / 2);
        c.fillStyle = '#0f172a'; c.font = 'bold 9px Arial'; c.textAlign = 'left'; c.textBaseline = 'top';
        c.fillText(nm.slice(0, 13), sx + sw32 + 4, sy + 4);
        c.fillStyle = '#64748b'; c.font = '8px Arial';
        c.fillText(hex.toUpperCase(), sx + sw32 + 4, sy + 16);
      });
      const a = document.createElement('a');
      a.download = 'paint-by-numbers-with-legend.png';
      a.href = cvs.toDataURL('image/png'); a.click();
    };
    img.src = pbnOutputUrl;
  }, [pbnOutputUrl, pbnSwatches, pbnColorMode]);

  // --- Mock Data Setups optimized for UI Render ---
  const categories = ['Paintings', 'Digital Art', 'Sculptures', 'Photography', 'Sketches', 'Handcrafted Decor'];

  const features = [
    {
      icon: <Palette className="w-8 h-8 text-[#008080]" />,
      title: "Original Artwork",
      desc: "Buy authentic creations directly from talented independent artists."
    },
    {
      icon: <Layers className="w-8 h-8 text-[#008080]" />,
      title: "Curated Collections",
      desc: "Explore carefully selected artwork for every style and space."
    },
    {
      icon: <Truck className="w-8 h-8 text-[#008080]" />,
      title: "Secure Worldwide Delivery",
      desc: "Purchase with confidence and receive your artwork safely at your doorstep."
    }
  ];

  const toggleLike = (id: string) => {
    setLikedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0F0F0F] text-[#1F2937] dark:text-slate-100 font-sans antialiased pt-20 selection:bg-[#008080]/20">

      {/* Mobile Drawer menu container */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 w-full bg-[#FAFAFA] dark:bg-[#1A1A1A] border-b border-[#1F2937]/10 dark:border-white/10 z-40 p-6 flex flex-col gap-4 shadow-xl md:hidden"
          >
            <a href="#gallery" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">Explore Gallery</a>
            <a href="#why-us" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">About Us</a>
            <a href="#artists" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">Artists</a>
            <a href="#trending" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">Trending</a>
            <hr className="border-[#1F2937]/5" />
            <button className="w-full bg-[#008080] text-white py-3 rounded-xl font-medium">Join Platform</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION --- */}
      <section className="relative px-6 lg:px-16 pt-12 pb-24 overflow-hidden max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col justify-center z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-[#1F2937] dark:text-white leading-none mb-6">
              Discover Art <br />
              <span className="text-[#008080] dark:text-teal-400">That Inspires.</span>
            </h1>
            <p className="text-lg text-[#1F2937]/70 dark:text-slate-400 font-normal max-w-xl mb-8 leading-relaxed">
              Explore original paintings, digital artworks, sculptures, and handcrafted creations from talented artists around the world.
            </p>
          </motion.div>

          {/* Interactive Artwork Discovery Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white/70 dark:bg-white/5 backdrop-blur-md p-3 rounded-2xl shadow-xl shadow-[#1F2937]/5 border border-white/80 dark:border-white/10 max-w-xl flex flex-col md:flex-row gap-2 mb-10"
          >
            <div className="flex-1 flex items-center gap-3 px-3 py-2 border-b md:border-b-0 md:border-r border-[#1F2937]/10">
              <Search className="text-[#008080] w-5 h-5 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search artworks, style, medium..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm font-medium placeholder-[#1F2937]/40 dark:text-white dark:placeholder-white/30"
              />
            </div>
            <div className="flex items-center justify-between gap-4 px-3 py-2">
              <span 
                onClick={() => navigate('/explore')}
                className="cursor-pointer text-xs font-bold text-[#1F2937]/60 dark:text-white/50 tracking-wider uppercase flex items-center gap-1.5 hover:text-[#008080] dark:hover:text-teal-400 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" /> Filter
              </span>
              <button 
                onClick={() => { if (searchQuery.trim()) navigate(`/search?query=${searchQuery}`); }}
                className="w-full md:w-auto bg-[#008080] hover:bg-[#026363] text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-[#008080]/10"
              >
                Find Art
              </button>
            </div>
          </motion.div>

          {/* Core Call to Actions */}
          <div className="flex flex-wrap gap-4 items-center">
            <button 
              onClick={() => navigate('/explore')}
              className="bg-[#1F2937] dark:bg-white dark:text-[#1F2937] hover:bg-[#111827] dark:hover:bg-slate-200 text-white font-medium px-8 py-4 rounded-full transition-all flex items-center gap-2 group shadow-lg shadow-[#1F2937]/10"
            >
              Browse Gallery <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigate('/register-artist')}
              className="border-2 border-[#1F2937]/10 dark:border-white/20 hover:border-[#1F2937] dark:hover:border-white text-[#1F2937] dark:text-white font-medium px-8 py-4 rounded-full transition-all"
            >
              Become an Artist
            </button>
          </div>
        </div>

        {/* Dynamic Canvas Feature/Illustration Array Grid */}
        <div className="lg:col-span-5 relative w-full h-[550px] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#008080]/10 to-transparent rounded-full blur-3xl -z-10" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative w-full h-full grid grid-cols-2 grid-rows-2 gap-4 p-2"
          >
            {/* Top Left: Abstract Art */}
            <Link to="/art/art-1" className="relative group rounded-3xl overflow-hidden shadow-md transform hover:-translate-y-1 transition-all duration-300 block cursor-pointer">
              <img src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&q=80" loading="lazy" alt="Abstract Art" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent p-4 flex items-end"><span className="text-white text-xs font-semibold uppercase tracking-widest">Abstract Art</span></div>
            </Link>
            {/* Top Right: Landscape Painting */}
            <Link to="/art/art-2" className="relative group rounded-3xl overflow-hidden shadow-md transform translate-y-6 hover:translate-y-5 transition-all duration-300 block cursor-pointer">
              <img src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=400&q=80" loading="lazy" alt="Landscape" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent p-4 flex items-end"><span className="text-white text-xs font-semibold uppercase tracking-widest">Landscape Painting</span></div>
            </Link>
            {/* Bottom Left: Modern Portrait */}
            <Link to="/art/art-3" className="relative group rounded-3xl overflow-hidden shadow-md transform -translate-y-6 hover:-translate-y-7 transition-all duration-300 block cursor-pointer">
              <img src="https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=400&q=80" loading="lazy" alt="Portrait" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent p-4 flex items-end"><span className="text-white text-xs font-semibold uppercase tracking-widest">Modern Portrait</span></div>
            </Link>
            {/* Bottom Right: Digital Illustration */}
            <Link to="/art/art-4" className="relative group rounded-3xl overflow-hidden shadow-md transform hover:-translate-y-1 transition-all duration-300 block cursor-pointer">
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80" loading="lazy" alt="Digital" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent p-4 flex items-end"><span className="text-white text-xs font-semibold uppercase tracking-widest">Digital Illustration</span></div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* --- WHY CHOOSE ARTSFELLOW (Relaxed Premium) --- */}
      <section id="why-us" className="relative bg-white dark:bg-[#12131A] py-28 px-6 lg:px-16 overflow-hidden border-t border-b border-gray-100 dark:border-white/5">

        {/* Soft ambient glow blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section label + heading */}
          <div className="text-center mb-20">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-[#008080] dark:text-teal-400 mb-4 px-4 py-1.5 rounded-full bg-[#008080]/15 dark:bg-teal-400/10">
              Our Promise
            </span>
            <h2 className="text-3xl lg:text-5xl font-light tracking-tight text-[#111827] dark:text-white mt-4 mb-4">
              Why Choose <span className="font-semibold italic">ArtsFellow</span>
            </h2>
            <p className="text-[#374151] dark:text-white/40 text-sm max-w-md mx-auto leading-relaxed font-normal">
              We prioritize trust, artistic integrity, and museum-grade logistics — so you can collect with peace of mind.
            </p>
          </div>

          {/* Three relaxing feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
            {features.map((feat, index) => (
              <div
                key={index}
                className="group relative bg-white/80 dark:bg-white/[0.04] backdrop-blur-sm border border-gray-200/80 dark:border-white/[0.07] rounded-3xl p-8 hover:shadow-xl hover:shadow-teal-500/5 hover:-translate-y-1 transition-all duration-500"
              >
                {/* Subtle gradient top line on hover */}
                <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#008080]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />

                {/* Step number watermark */}
                <span className="absolute top-6 right-7 text-5xl font-black text-[#1F2937]/10 dark:text-white/5 select-none leading-none">
                  0{index + 1}
                </span>

                {/* Icon */}
                <div className="mb-7 w-14 h-14 rounded-2xl bg-[#008080]/10 dark:bg-teal-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {feat.icon}
                </div>

                <h3 className="text-lg font-semibold mb-3 tracking-tight text-[#111827] dark:text-white/90">{feat.title}</h3>
                <p className="text-[#4B5563] dark:text-white/45 text-sm leading-relaxed font-normal">{feat.desc}</p>

                {/* Bottom accent */}
                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#008080]/50 dark:bg-teal-400/50" />
                  <span className="text-[10px] font-semibold text-[#008080] dark:text-teal-400/50 uppercase tracking-widest">Guaranteed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- RELAXING WALL MASTERPIECE (The Curator's Wall) --- */}
      <section className="w-full bg-[#EAE8E3] dark:bg-[#1C1A18] py-28 relative flex flex-col items-center justify-center overflow-hidden border-t border-b border-[#1F2937]/5 dark:border-white/5">
        {/* Soft lighting gradients to simulate a relaxing gallery wall */}
        <div className="absolute top-0 left-1/4 w-1/2 h-full bg-white/40 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-1/3 h-1/2 bg-[#6D28D9]/5 blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-8 w-full flex flex-col items-center z-10 text-center mb-16">
          <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#6D28D9] mb-4">The Curator's Wall</span>
          <h2 className="text-3xl md:text-5xl font-light text-[#1F2937] dark:text-slate-100 tracking-tight">
            Breathe <span className="italic font-serif text-gray-500 dark:text-slate-400">Life</span> into Your Space.
          </h2>
          <p className="text-sm text-[#1F2937]/60 dark:text-slate-400 max-w-md mx-auto mt-6 leading-relaxed font-normal">
            Immerse your environment in tranquility. This large-format centerpiece brings undeniable calm and architectural elegance to modern living spaces.
          </p>
        </div>

        {/* The Large Art Piece on the Wall */}
        <div className="relative z-10 w-full max-w-5xl px-8 mx-auto group mb-20">
          {/* Outer Frame (Wood/Metal simulation) */}
          <div className="bg-[#FAF9F6] dark:bg-[#2A2825] p-4 md:p-6 lg:p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] border border-[#D1CEC7] dark:border-[#4A4640] rounded-sm transform transition-transform duration-1000 ease-out group-hover:scale-[1.02]">
            {/* Inner mount/mat board */}
            <div className="bg-white dark:bg-[#1A1A1A] p-3 md:p-5 shadow-inner border border-gray-100 dark:border-white/5">
              {/* Actual Art Canvas */}
              <div className="relative overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-gray-200">
                <img
                  src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1600&q=80"
                  alt="Relaxing Wall Art"
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-1000 ease-in-out scale-105 group-hover:scale-100"
                />
              </div>
            </div>
          </div>

          {/* Artwork Placard (Gallery style) */}
          <div className="absolute -bottom-10 md:-bottom-12 right-12 md:right-32 bg-white/95 dark:bg-[#2A2825]/95 backdrop-blur-md px-8 py-6 shadow-xl border border-[#1F2937]/5 dark:border-white/10 rounded-sm max-w-xs text-left transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
            <h3 className="text-base font-medium text-[#1F2937] dark:text-slate-100">Fractured Geometry</h3>
            <p className="text-[10px] text-[#1F2937]/50 dark:text-slate-500 uppercase tracking-widest mt-1 mb-4">Siddharth Roy • 2026</p>
            <div className="flex items-center justify-between gap-6">
              <span className="text-lg font-normal text-[#6D28D9]">₹1,85,000</span>
              <button className="text-xs uppercase tracking-widest font-medium border-b border-[#1F2937] dark:border-white dark:text-white pb-0.5 hover:text-[#6D28D9] hover:border-[#6D28D9] transition-all">
                Acquire
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURED CATEGORIES --- */}
      <section id="gallery" className="py-24 px-6 lg:px-16 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#1F2937] dark:text-white mb-3">Featured Categories</h2>
            <p className="text-[#1F2937]/60 dark:text-slate-400 text-sm">Discover carefully segmented art mediums curated by structural aesthetics.</p>
          </div>
          <button onClick={() => navigate('/explore')} className="mt-4 md:mt-0 text-sm font-bold text-[#008080] dark:text-teal-400 flex items-center gap-1 hover:gap-2 transition-all">
            See All Mediums <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => {
                setCategories([cat]);
                navigate(`/explore?category=${encodeURIComponent(cat)}`);
              }}
              className={`cursor-pointer group relative p-6 rounded-2xl transition-all border text-center flex flex-col items-center justify-center gap-3 ${
                selectedCategory === cat
                  ? 'bg-[#008080] border-[#008080] text-white shadow-lg shadow-[#008080]/20'
                  : 'bg-white dark:bg-[#1A1A1A] border-[#1F2937]/5 dark:border-white/10 hover:border-[#1F2937]/20 dark:hover:border-white/20 shadow-sm dark:text-slate-300'
              }`}
            >
              <div className={`p-3 rounded-xl transition-colors ${selectedCategory === cat ? 'bg-white/20' : 'bg-[#FAFAFA] dark:bg-white/5'}`}>
                <Palette className={`w-5 h-5 ${selectedCategory === cat ? 'text-white' : 'text-[#008080]'}`} />
              </div>
              <span className="text-sm font-bold tracking-tight">{cat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* --- PAINT BY NUMBERS GENERATOR SECTION --- */}
      {/* ======================================================== */}
      <section className="py-20 px-6 lg:px-16 bg-gradient-to-br from-[#f0f9ff] via-white to-[#f0fdf4] dark:from-[#0d1117] dark:via-[#111827] dark:to-[#0d1117] border-t border-b border-gray-100 dark:border-white/5">
        {/* Hidden processing canvases */}
        <canvas ref={srcCanvasRef} style={{ display: 'none' }} />
        <canvas ref={outCanvasRef} style={{ display: 'none' }} />

        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-[#008080] dark:text-teal-400 mb-4 px-4 py-1.5 rounded-full bg-[#008080]/10 dark:bg-teal-400/10">
              <Wand2 className="w-3 h-3" /> Paint by Numbers Studio
            </span>
            <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-[#1F2937] dark:text-white mt-3 mb-3">
              Turn Any Image into a{' '}
              <span className="text-[#008080] dark:text-teal-400">Numbered Canvas</span>
            </h2>
            <p className="text-[#1F2937]/60 dark:text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              Upload your photo and we'll generate a professional outlined & numbered paint-by-numbers canvas — ready to download and paint.
            </p>
          </div>

          {/* Main Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-10">

            {/* LEFT: Upload Box */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-5"
            >
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer border-2 border-dashed border-[#008080]/40 dark:border-teal-400/30 hover:border-[#008080] dark:hover:border-teal-400 rounded-3xl bg-white dark:bg-[#1A1A1A] transition-all duration-300 overflow-hidden"
                style={{ minHeight: '340px' }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                />

                {pbnImage ? (
                  <div className="relative w-full h-full" style={{ minHeight: '340px' }}>
                    <img
                      src={pbnImage}
                      alt="Uploaded"
                      className="w-full h-full object-contain rounded-3xl"
                      style={{ minHeight: '340px', maxHeight: '400px' }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center">
                      <div className="text-white text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-semibold">Change Image</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-[#008080]/10 dark:bg-teal-400/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-9 h-9 text-[#008080] dark:text-teal-400" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1F2937] dark:text-white mb-2">Drop your image here</h3>
                    <p className="text-sm text-[#1F2937]/50 dark:text-slate-500 mb-4">or click to browse from your device</p>
                    <span className="text-xs px-4 py-1.5 rounded-full bg-[#008080]/10 dark:bg-teal-400/10 text-[#008080] dark:text-teal-400 font-semibold">
                      PNG, JPG, WEBP supported
                    </span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="bg-white dark:bg-[#1A1A1A] border border-[#1F2937]/5 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#1F2937] dark:text-white">
                    Number of Colors: <span className="text-[#008080] dark:text-teal-400">{pbnColorCount}</span>
                  </label>
                  <div className="flex gap-2">
                    {[8, 12, 16, 20].map(n => (
                      <button
                        key={n}
                        onClick={() => setPbnColorCount(n)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${pbnColorCount === n ? 'bg-[#008080] text-white shadow-md' : 'bg-gray-100 dark:bg-white/5 text-[#1F2937] dark:text-slate-400 hover:bg-[#008080]/10'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  disabled={!pbnImage || pbnProcessing}
                  onClick={() => pbnImage && processPbnImage(pbnImage, pbnColorCount)}
                  className="w-full flex items-center justify-center gap-2 bg-[#008080] hover:bg-[#026363] disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:cursor-not-allowed text-white disabled:text-gray-400 dark:disabled:text-white/30 font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-[#008080]/20"
                >
                  {pbnProcessing ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Canvas...</>
                  ) : (
                    <><Wand2 className="w-4 h-4" /> Generate Paint by Numbers</>
                  )}
                </button>
              </div>
            </motion.div>

            {/* RIGHT: Generated Outlined Canvas Output */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col gap-5"
            >
              <div className="relative bg-white dark:bg-[#1A1A1A] border border-[#1F2937]/5 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm" style={{ minHeight: '340px' }}>

                {/* Gallery-style label */}
                <div className="absolute top-3 left-3 z-10 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md border border-[#1F2937]/10 dark:border-white/10 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#008080] dark:text-teal-400">Outlined &amp; Numbered Canvas</span>
                </div>

                {pbnReady ? (
                  <div className="w-full h-full flex items-center justify-center p-4" style={{ minHeight: '340px' }}>
                    <img
                      src={pbnOutputUrl ?? ''}
                      alt="Paint by Numbers Canvas"
                      id="pbn-output-img"
                      className="max-w-full max-h-[380px] object-contain rounded-2xl shadow-md border border-gray-100 dark:border-white/10"
                      style={{ background: '#fff' }}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8">
                    {pbnProcessing ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-[#008080]/10 flex items-center justify-center">
                          <RefreshCw className="w-7 h-7 text-[#008080] animate-spin" />
                        </div>
                        <p className="text-sm font-semibold text-[#1F2937] dark:text-white">Generating your canvas…</p>
                        <p className="text-xs text-[#1F2937]/50 dark:text-slate-500">Extracting colors &amp; drawing outlines</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                          <Palette className="w-7 h-7 text-gray-300 dark:text-white/20" />
                        </div>
                        <p className="text-sm font-medium text-[#1F2937]/40 dark:text-slate-600">
                          Your outlined canvas will appear here
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">

                {/* Print Modal */}
                {pbnPrintModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setPbnPrintModal(false)}>
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-7 shadow-2xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                      <h4 className="text-base font-bold text-[#1F2937] dark:text-white mb-1">Print Canvas</h4>
                      <p className="text-xs text-[#1F2937]/50 dark:text-slate-500 mb-5">Choose your paper size</p>
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {(['A4','A3','Letter','4x6'] as const).map(sz => (
                          <button key={sz} onClick={() => setPbnPrintSize(sz)}
                            className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${
                              pbnPrintSize === sz
                                ? 'border-[#008080] bg-[#008080]/10 text-[#008080] dark:text-teal-400'
                                : 'border-[#1F2937]/10 dark:border-white/10 text-[#1F2937] dark:text-slate-400 hover:border-[#008080]/40'
                            }`}>
                            {sz}
                            <span className="block text-[10px] font-normal opacity-60 mt-0.5">
                              {sz==='A4'?'210×297mm':sz==='A3'?'297×420mm':sz==='Letter'?'8.5×11in':'4×6 in'}
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setPbnPrintModal(false)} className="flex-1 py-3 rounded-xl border border-[#1F2937]/10 dark:border-white/10 text-sm font-semibold text-[#1F2937] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">Cancel</button>
                        <button onClick={() => { printCanvas(pbnPrintSize); setPbnPrintModal(false); }} className="flex-1 py-3 rounded-xl bg-[#008080] hover:bg-[#026363] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#008080]/20">
                          <Printer className="w-4 h-4" /> Print Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Print Button */}
                <button
                  disabled={!pbnReady}
                  onClick={() => setPbnPrintModal(true)}
                  className="w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl transition-all disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: pbnReady ? '#1F2937' : '#e5e7eb',
                    color: pbnReady ? '#ffffff' : '#9ca3af',
                    border: 'none',
                  }}
                >
                  <Printer className="w-4 h-4" />
                  {pbnReady ? 'Print Canvas…' : 'Generate canvas first'}
                </button>

                {/* Download Button */}
                <button
                  disabled={!pbnReady}
                  onClick={downloadWithLegend}
                  className="w-full flex items-center justify-center gap-2 border-2 border-[#008080] dark:border-teal-400 text-[#008080] dark:text-teal-400 hover:bg-[#008080] hover:text-white dark:hover:bg-teal-400 dark:hover:text-[#0d1117] disabled:border-gray-200 dark:disabled:border-white/10 disabled:text-gray-400 dark:disabled:text-white/20 disabled:cursor-not-allowed font-semibold py-3.5 rounded-xl transition-all"
                >
                  <Download className="w-4 h-4" />
                  {pbnReady ? 'Download with Color Legend (PNG)' : 'Generate canvas first'}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Color Palette Strip — appears after generation */}
          <AnimatePresence>
            {pbnReady && pbnSwatches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-[#1A1A1A] border border-[#1F2937]/5 dark:border-white/10 rounded-3xl p-7 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Palette className="w-5 h-5 text-[#008080] dark:text-teal-400" />
                  <h3 className="text-base font-bold text-[#1F2937] dark:text-white tracking-tight">
                    Color Legend — Paints Required
                  </h3>
                  {/* Colorful / B&W Toggle */}
                  <div className="ml-auto flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
                    <button
                      onClick={() => setPbnColorMode('colorful')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        pbnColorMode === 'colorful'
                          ? 'bg-white dark:bg-[#2A2A2A] text-[#008080] shadow-sm'
                          : 'text-[#1F2937]/50 dark:text-slate-500 hover:text-[#008080]'
                      }`}
                    >
                      🎨 Colorful
                    </button>
                    <button
                      onClick={() => setPbnColorMode('bw')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        pbnColorMode === 'bw'
                          ? 'bg-white dark:bg-[#2A2A2A] text-[#1F2937] dark:text-white shadow-sm'
                          : 'text-[#1F2937]/50 dark:text-slate-500 hover:text-[#1F2937]'
                      }`}
                    >
                      ⬛ B&amp;W
                    </button>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-[#008080]/10 dark:bg-teal-400/10 text-[#008080] dark:text-teal-400 font-semibold">
                    {pbnSwatches.length} colors
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {pbnSwatches.map((sw) => {
                    const luminance = (0.299 * sw.r + 0.587 * sw.g + 0.114 * sw.b) / 255;
                    // B&W mode: convert to grey
                    const grey = Math.round(0.299 * sw.r + 0.587 * sw.g + 0.114 * sw.b);
                    const displayHex = pbnColorMode === 'bw'
                      ? `#${grey.toString(16).padStart(2,'0').repeat(3)}`
                      : sw.hex;
                    const dispLum = pbnColorMode === 'bw' ? grey / 255 : luminance;
                    const textColor = dispLum > 0.5 ? '#1F2937' : '#FFFFFF';
                    return (
                      <div
                        key={sw.number}
                        className="group relative flex flex-col items-center rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border border-[#1F2937]/5 dark:border-white/10"
                      >
                        {/* Color Block */}
                        <div
                          className="w-full flex items-center justify-center py-5 transition-colors duration-300"
                          style={{ backgroundColor: displayHex }}
                        >
                          <span
                            className="text-xl font-black leading-none"
                            style={{ color: textColor, textShadow: dispLum > 0.5 ? 'none' : '0 1px 3px rgba(0,0,0,0.4)' }}
                          >
                            {sw.number}
                          </span>
                        </div>
                        {/* Color Info */}
                        <div className="w-full bg-white dark:bg-[#242424] px-2 py-2 text-center">
                          <p className="text-[9px] font-bold text-[#1F2937] dark:text-white leading-tight truncate">
                            {pbnColorMode === 'bw' ? `Grey ${grey}` : sw.name}
                          </p>
                          <p className="text-[8px] text-[#1F2937]/40 dark:text-slate-600 font-mono mt-0.5">{displayHex.toUpperCase()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* --- TRENDING COLLECTIONS --- */}
      <section id="trending" className="py-12 px-6 lg:px-16 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#1F2937] dark:text-white mb-2">Trending Collections</h2>
            <p className="text-[#1F2937]/60 dark:text-slate-400 text-sm">Most viewed and collected pieces this season.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingArtworks.map((art) => {
            const isOwner = user && role === "artist" && (art.artist?._id === user._id || art.artist === user._id || art.artistId === user._id);
            return (
              <div key={art._id || art.id} className="bg-white dark:bg-[#1A1A1A] border border-[#1F2937]/5 dark:border-white/10 rounded-3xl overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  <img
                    src={art.images?.[0] || art.image || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80'}
                    loading="lazy"
                    alt={art.title || art.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    onClick={() => toggleLike(art._id || art.id)}
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-white/80 backdrop-blur-md shadow-md text-[#1F2937] hover:scale-110 transition-transform"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${likedItems[art._id || art.id] ? 'fill-red-500 text-red-500' : 'text-[#1F2937]/70'}`} />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-[#1F2937]/80 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md">
                    {art.category || 'Art'}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-[#1F2937] dark:text-white tracking-tight mb-1 truncate">{art.title || art.name}</h3>
                  <p className="text-[#1F2937]/60 dark:text-slate-400 text-xs font-medium mb-4">By {art.artistName || art.artist?.name || art.artist || 'Unknown Artist'}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-[#1F2937]/5 dark:border-white/10">
                    <span className="text-lg font-extrabold text-[#008080]">₹{Number(art.price).toLocaleString()}</span>
                    {isOwner ? (
                      <button onClick={() => handleDeleteArtwork(art._id || art.id)} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1">
                        Delete
                      </button>
                    ) : (
                      <button onClick={() => addToCart(art)} className="bg-[#1F2937] hover:bg-[#008080] text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5" /> Collect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- FEATURED ARTISTS --- */}
      <section id="artists" className="py-24 bg-white dark:bg-[#111111] border-t border-b border-gray-100 dark:border-white/5 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#1F2937] dark:text-white mb-3">Featured Artists</h2>
            <p className="text-[#1F2937]/60 dark:text-slate-400 text-sm">Meet premium creators shaping modern culture across visual domains.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredArtists.map((artist) => (
              <div key={artist._id || artist.id} className="bg-white dark:bg-[#1A1A1A] border border-[#1F2937]/5 dark:border-white/10 p-6 rounded-3xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-[#008080]/20 p-1">
                  <img src={artist.avatar || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'} loading="lazy" alt={artist.name} className="w-full h-full object-cover rounded-full" />
                </div>
                <h3 className="text-xl font-bold text-[#1F2937] dark:text-white tracking-tight">{artist.brandName || artist.name}</h3>
                <p className="text-xs font-semibold text-[#008080] dark:text-teal-400 uppercase tracking-wider mb-2">{artist.artStyles?.[0] || artist.style || 'Artist'}</p>

                <div className="flex items-center gap-4 my-4 text-xs text-[#1F2937]/60 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {artist.country || 'Global'}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {artist.followers || '0'}</span>
                </div>

                <button onClick={() => navigate(`/artist/${artist._id || artist.id}`)} className="w-full mt-2 border border-[#1F2937] dark:border-white/30 hover:bg-[#1F2937] dark:hover:bg-white hover:text-white dark:hover:text-[#1F2937] text-[#1F2937] dark:text-white font-semibold text-sm py-2.5 rounded-xl transition-all">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-24 px-6 lg:px-16 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#1F2937] dark:text-white mb-3">How It Works</h2>
          <p className="text-[#1F2937]/60 dark:text-slate-400 text-sm">A seamless end-to-end framework built for decentralized creator economy.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {[
            { step: "01", title: "Discover Artwork", desc: "Filter through thousands of certified authentic masterworks easily." },
            { step: "02", title: "Connect with Artists", desc: "Follow or message creators directly for commissions and history." },
            { step: "03", title: "Purchase Securely", desc: "Escrow integration protects transactions until art clears inspection." },
            { step: "04", title: "Receive Your Art", desc: "Museum-grade transit setup ensures delivery safely to your space." }
          ].map((item, idx) => (
            <div key={idx} className="relative flex flex-col items-start p-4 group">
              <span className="text-5xl font-black text-[#008080]/10 dark:text-teal-400/20 group-hover:text-[#008080]/20 dark:group-hover:text-teal-400/40 transition-colors duration-300 mb-4">{item.step}</span>
              <h3 className="text-lg font-bold text-[#1F2937] dark:text-white mb-2 tracking-tight">{item.title}</h3>
              <p className="text-[#1F2937]/70 dark:text-slate-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- PREMIUM FOOTER CTA PANEL --- */}
      <section className="px-6 lg:px-16 pb-24 max-w-7xl mx-auto">
        <div className="w-full bg-gradient-to-br from-[#1F2937] to-[#111827] text-white rounded-[40px] p-12 lg:p-20 text-center relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#008080]/10 rounded-full blur-3xl -z-0" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -z-0" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">Bring Creativity Home.</h2>
            <p className="text-white/70 text-base mb-10 max-w-lg mx-auto leading-relaxed">
              Own unique artwork and support independent artists worldwide.
            </p>

            <div className="flex flex-wrap gap-4 items-center justify-center">
              <button onClick={() => navigate('/explore')} className="bg-[#008080] hover:bg-[#026363] text-white font-semibold px-8 py-4 rounded-full transition-all shadow-lg shadow-[#008080]/20">
                Explore Gallery
              </button>
              <button onClick={() => navigate('/register-artist')} className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-full border border-white/10 transition-all">
                Sell Your Art
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER LINKS & CREDITS --- */}
      <footer className="bg-white border-t border-[#1F2937]/5 px-6 lg:px-16 py-12 flex flex-col md:flex-row items-center justify-between gap-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#008080]" />
          <span className="text-lg font-bold tracking-tight text-[#1F2937]">ARTSFellow</span>
          <span className="text-xs text-[#1F2937]/40 ml-2">© 2026. All Rights Reserved.</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-[#1F2937]/60">
          <a href="#" className="hover:text-[#008080] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#008080] transition-colors">Terms & Conditions</a>
          <a href="#" className="hover:text-[#008080] transition-colors">Help & Global Support</a>
        </div>
      </footer>

    </div>
  );
}
