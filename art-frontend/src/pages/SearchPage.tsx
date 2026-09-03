import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Compass,
  Frame,
  Grid3X3,
  Heart,
  ImagePlus,
  Mic,
  Play,
  Palette,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Upload,
  UserRound,
  WandSparkles,
  X,
  ArrowUpRight,
  Pause
} from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { useDashboardStore } from "../store/dashboardStore";
import { ArtworkService } from "../services/artwork.service";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import "../components/explore.css";

type ArtworkRecord = {
  _id: string;
  title: string;
  artistName?: string;
  artistBrandName?: string;
  category?: string;
  description?: string;
  price?: number;
  stock?: number;
  images?: string[];
  averageRating?: number;
  downloads?: number;
};

type FilterSectionKey = "category" | "style" | "orientation";
type OrientationOption = "All" | "Portrait" | "Landscape" | "Square";
type MoodOption = "Dreamy" | "Dark" | "Calm" | "Energetic";

const styleRules = [
  { name: "Abstract", keywords: ["abstract", "expression", "surreal", "fluid"] },
  { name: "Contemporary", keywords: ["contemporary", "modern", "mixed", "digital"] },
  { name: "Minimal", keywords: ["minimal", "line", "clean", "mono"] },
  { name: "Figurative", keywords: ["portrait", "figure", "human", "character"] },
  { name: "Nature", keywords: ["flora", "botanical", "nature", "landscape", "garden"] },
  { name: "Textural", keywords: ["texture", "impasto", "charcoal", "sculpt", "woven"] },
];

const orientationLabels: OrientationOption[] = ["All", "Portrait", "Landscape", "Square"];
const moodOptions: MoodOption[] = ["Dreamy", "Dark", "Calm", "Energetic"];
type ThemeConfig = { accent: string; bg: string; glow: string; text: string };

const moodThemes: Record<MoodOption, { light: ThemeConfig; dark: ThemeConfig }> = {
  Dreamy: {
    light: {
      accent: "from-fuchsia-200/70 via-rose-200/60 to-sky-200/70",
      bg: "radial-gradient(circle at 20% 20%, rgba(244, 114, 182, 0.22), transparent 28%), radial-gradient(circle at 80% 10%, rgba(125, 211, 252, 0.18), transparent 24%), linear-gradient(180deg, #fffafc 0%, #f7f7ff 42%, #eef6ff 100%)",
      glow: "rgba(244,114,182,0.18)",
      text: "text-fuchsia-900",
    },
    dark: {
      accent: "from-fuchsia-500/40 via-rose-500/40 to-sky-500/40",
      bg: "radial-gradient(circle at 20% 20%, rgba(192, 38, 211, 0.12), transparent 28%), radial-gradient(circle at 80% 10%, rgba(14, 165, 233, 0.1), transparent 24%), linear-gradient(180deg, #020617 0%, #0f172a 100%)",
      glow: "rgba(192,38,211,0.25)",
      text: "text-fuchsia-200",
    },
  },
  Dark: {
    light: {
      accent: "from-slate-300/80 via-zinc-400/60 to-gray-400/80",
      bg: "radial-gradient(circle at 20% 20%, rgba(100, 116, 139, 0.15), transparent 28%), radial-gradient(circle at 80% 10%, rgba(82, 82, 91, 0.12), transparent 24%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 42%, #e2e8f0 100%)",
      glow: "rgba(100,116,139,0.12)",
      text: "text-slate-800",
    },
    dark: {
      accent: "from-slate-600/40 via-zinc-700/40 to-gray-700/40",
      bg: "radial-gradient(circle at 20% 20%, rgba(71, 85, 105, 0.18), transparent 28%), radial-gradient(circle at 80% 10%, rgba(63, 63, 70, 0.15), transparent 24%), linear-gradient(180deg, #000000 0%, #09090b 100%)",
      glow: "rgba(71,85,105,0.3)",
      text: "text-slate-300",
    },
  },
  Calm: {
    light: {
      accent: "from-teal-200/70 via-emerald-200/60 to-cyan-200/70",
      bg: "radial-gradient(circle at 20% 20%, rgba(20, 184, 166, 0.18), transparent 28%), radial-gradient(circle at 80% 10%, rgba(6, 182, 212, 0.15), transparent 24%), linear-gradient(180deg, #f0fdfa 0%, #f0fdf4 42%, #ecfeff 100%)",
      glow: "rgba(20,184,166,0.15)",
      text: "text-teal-900",
    },
    dark: {
      accent: "from-teal-500/40 via-emerald-500/40 to-cyan-500/40",
      bg: "radial-gradient(circle at 20% 20%, rgba(20, 184, 166, 0.12), transparent 28%), radial-gradient(circle at 80% 10%, rgba(6, 182, 212, 0.1), transparent 24%), linear-gradient(180deg, #022c22 0%, #064e3b 100%)",
      glow: "rgba(20,184,166,0.25)",
      text: "text-teal-200",
    },
  },
  Energetic: {
    light: {
      accent: "from-orange-200/70 via-amber-200/60 to-yellow-200/70",
      bg: "radial-gradient(circle at 20% 20%, rgba(249, 115, 22, 0.18), transparent 28%), radial-gradient(circle at 80% 10%, rgba(245, 158, 11, 0.15), transparent 24%), linear-gradient(180deg, #fff7ed 0%, #fffbeb 42%, #fefce8 100%)",
      glow: "rgba(249,115,22,0.15)",
      text: "text-orange-900",
    },
    dark: {
      accent: "from-orange-500/40 via-amber-500/40 to-yellow-500/40",
      bg: "radial-gradient(circle at 20% 20%, rgba(249, 115, 22, 0.12), transparent 28%), radial-gradient(circle at 80% 10%, rgba(245, 158, 11, 0.1), transparent 24%), linear-gradient(180deg, #431407 0%, #78350f 100%)",
      glow: "rgba(249,115,22,0.25)",
      text: "text-orange-200",
    },
  },
};

const exhibitionsData = [
  { id: 1, state: "Delhi NCR", category: "National & International Fairs", name: "India Art Fair 2027", loc: "NSIC Exhibition Grounds, New Delhi", time: "Feb 04–07, 2027", rating: "4.9", img: "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&q=80&w=800", tickets: "₹800 to ₹1000 (Preview Passes up to ₹3,000+). Student discounts up to 50% available.", inside: "Features over 70 massive national and international galleries, outdoor sculpture parks, live art installations, interactive digital artwork pavilions, and a high-end food and beverage lounge.", link: "https://indiaartfair.in" },
  { id: 2, state: "Delhi NCR", category: "National & International Fairs", name: "India Art Festival - Delhi", loc: "Constitution Club of India, New Delhi", time: "Nov 20–22, 2026", rating: "4.8", img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800", tickets: "₹299 to ₹499", inside: "Focuses heavily on democratic art access. 150+ booths displaying over 4,500 independent paintings and sculptures.", link: "https://indiaartfestival.com" },
  { id: 3, state: "Delhi NCR", category: "District & Local Gallery Shows", name: "Kiran Nadar Museum of Art (KNMA)", loc: "DLF South Court Mall, Saket, New Delhi", time: "10:30 AM to 6:30 PM (Closed Mondays)", rating: "4.9", img: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&q=80&w=800", tickets: "Completely Free Entry for all visitors.", inside: "A fully air-conditioned, world-class private art museum layout. They offer free on-site guided walk-throughs where art historians explain modern Indian masterpieces. Important Rule: No large bags or outside water bottles. Store them inside complimentary locker desks at the entry gate.", link: "https://www.knma.in" },
  { id: 4, state: "Delhi NCR", category: "District & Local Gallery Shows", name: "Confronting 'Digital' Sacre", loc: "Triveni Kala Sangam, New Delhi", time: "Through Feb 01, 2027", rating: "4.7", img: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&q=80&w=800", link: "https://trivenikalasangam.org" },
  { id: 5, state: "Maharashtra", category: "State & Metro Level Fairs", name: "Kalaa Spandan Art Fair", loc: "Nehru Centre, Mumbai", time: "Dec 18–20, 2026", rating: "4.6", img: "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?auto=format&fit=crop&q=80&w=800", link: "https://indianartpromoter.com" },
  { id: 6, state: "Maharashtra", category: "State & Metro Level Fairs", name: "India Art Festival - Mumbai", loc: "Nehru Centre, 2nd and Ground Floor, Worli, Mumbai", time: "Jan 29 – 31, 2027 (11 AM - 8 PM)", rating: "4.8", img: "https://images.unsplash.com/photo-1518998053401-a4149019da8e?auto=format&fit=crop&q=80&w=800", tickets: "₹299 to ₹499", inside: "Focuses heavily on democratic art access. 150+ booths displaying over 4,500 independent paintings, sculptures, and mixed media installations. Buyers can speak directly with local artists.", link: "https://indiaartfestival.com" },
  { id: 7, state: "Maharashtra", category: "District / Local City Shows", name: "Kalaa Spandan - Pune", loc: "Siddhi Banquet Hall, Pune", time: "May 2027", rating: "4.5", img: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80&w=800", link: "https://indianartpromoter.com" },
  { id: 8, state: "Maharashtra", category: "District / Local City Shows", name: "Jehangir Art Gallery", loc: "Kala Ghoda, Fort, South Mumbai", time: "Rotating weekly (11 AM - 7 PM)", rating: "4.9", img: "https://images.unsplash.com/photo-1545989253-02cc26577f88?auto=format&fit=crop&q=80&w=800", tickets: "Completely Free Entry for all visitors.", inside: "Divided cleanly into 4 air-conditioned display wings. Walk in informally, browse seasonal sketches by local fine-arts graduates, and chat with artists over coffee outside in the courtyard.", link: "https://jehangirartgallery.com" },
  { id: 9, state: "Karnataka", category: "State Level Fairs", name: "India Art Festival - Bengaluru", loc: "Palace Grounds, Gate 5, Bengaluru", time: "Dec 11–13, 2026 (11 AM - 8 PM)", rating: "4.7", img: "https://images.unsplash.com/photo-1501472312651-726afe119ff1?auto=format&fit=crop&q=80&w=800", tickets: "₹299 to ₹499", inside: "Focuses heavily on democratic art access. Buyers can speak directly with independent local artists to purchase affordable art.", link: "https://indiaartfestival.com" },
  { id: 10, state: "Karnataka", category: "District Gallery Shows", name: "Paper Gardens: Art & Botany", loc: "MAP, Bengaluru", time: "Through July 2026", rating: "4.8", img: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800", link: "https://map-india.org" },
  { id: 11, state: "Kerala", category: "International Biennale", name: "Kochi-Muziris Biennale (7th Ed)", loc: "Fort Kochi & Mattancherry", time: "Launches Dec 12, 2027", rating: "5.0", img: "https://images.unsplash.com/photo-1560157362-e6129fa03db5?auto=format&fit=crop&q=80&w=800", tickets: "General admission ₹100 to ₹150. Weekly/monthly passes available.", inside: "South Asia's longest-running contemporary art festival. A single standard ticket grants entry to all scattered heritage properties. Expect grand site-specific installations, and boundary-pushing audio-visual rooms.", link: "https://kochimuzirisbiennale.org" },
  { id: 12, state: "West Bengal", category: "Local District Shows", name: "We Need To Talk in Whispers", loc: "Experimenter Ballygunge, Kolkata", time: "Mid-2026", rating: "4.8", img: "https://images.unsplash.com/photo-1577083165350-14eb0233496b?auto=format&fit=crop&q=80&w=800", link: "https://experimenter.in" },
  { id: 13, state: "West Bengal", category: "Local District Shows", name: "The Cage Broke", loc: "Experimenter Outpost, Kolkata", time: "Seasonal 2026", rating: "4.7", img: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&q=80&w=800", link: "https://experimenter.in" },
  { id: 14, state: "Telangana", category: "Regional Art Fairs", name: "Kalaa Spandan - Hyderabad", loc: "Kalinga Cultural Centre, Hyderabad", time: "Oct 30–Nov 01, 2026", rating: "4.6", img: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800", link: "https://indianartpromoter.com" },
  { id: 15, state: "Goa", category: "National Festival", name: "Serendipity Arts Festival", loc: "Mandovi Riverfront, Panaji", time: "Dec 12–21, 2026", rating: "4.9", img: "https://images.unsplash.com/photo-1518998053401-a4149019da8e?auto=format&fit=crop&q=80&w=800", link: "https://serendipityartsfestival.com" }
];

const heroFrames = [
  "/real_abstract.png",
  "/pearl_earring_art.png",
  "/real_oil_painting.png",
  "/real_watercolor.png",
  "/real_charcoal.png",
];

const normalizeImage = (art: ArtworkRecord) => {
  const image = art.images?.[0];
  if (!image) return "/art_feature_image.png";
  if (image.startsWith("http")) return image;
  if (image.includes("/assets") || image.startsWith("/")) {
    return image.startsWith("/") ? `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") || "http://localhost:5005"}${image}` : image;
  }
  return `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") || "http://localhost:5005"}/${image}`;
};

const inferStyle = (art: ArtworkRecord) => {
  const haystack = `${art.title} ${art.category || ""} ${art.description || ""}`.toLowerCase();
  const match = styleRules.find((rule) => rule.keywords.some((keyword) => haystack.includes(keyword)));
  return match?.name || "Curated";
};

const inferOrientation = (art: ArtworkRecord, index: number): OrientationOption => {
  const width = Number((art as any).width || (art as any).dimensions?.width || 0);
  const height = Number((art as any).height || (art as any).dimensions?.height || 0);

  if (width > 0 && height > 0) {
    if (Math.abs(width - height) <= 40) return "Square";
    return width > height ? "Landscape" : "Portrait";
  }

  return ["Portrait", "Landscape", "Square"][index % 3] as OrientationOption;
};

const getRecommendationScore = (art: ArtworkRecord & { derivedStyle: string }, query: string) => {
  const term = query.trim().toLowerCase();
  const searchable = `${art.title} ${art.artistBrandName || art.artistName || ""} ${art.category || ""} ${art.description || ""} ${art.derivedStyle}`.toLowerCase();
  const queryBoost = term && searchable.includes(term) ? 18 : 0;
  const ratingBoost = Number(art.averageRating || 0) * 12;
  const downloadBoost = Math.min(Number(art.downloads || 0), 40);
  const stockBoost = Number(art.stock || 0) > 0 ? 8 : -10;

  return queryBoost + ratingBoost + downloadBoost + stockBoost;
};

const getMasonryHeightClass = (index: number) => {
  const pattern = ["h-[240px]", "h-[320px]", "h-[280px]", "h-[360px]", "h-[260px]", "h-[340px]"];
  return pattern[index % pattern.length];
};

const inferMood = (art: ArtworkRecord & { derivedStyle?: string }, index: number): MoodOption => {
  const haystack = `${art.title} ${art.category || ""} ${art.description || ""} ${art.derivedStyle || ""}`.toLowerCase();
  if (haystack.includes("dark") || haystack.includes("charcoal") || haystack.includes("night")) return "Dark";
  if (haystack.includes("dream") || haystack.includes("surreal") || haystack.includes("ethereal")) return "Dreamy";
  if (haystack.includes("minimal") || haystack.includes("calm") || haystack.includes("botanical")) return "Calm";
  if (haystack.includes("abstract") || haystack.includes("bold") || haystack.includes("vivid")) return "Energetic";
  return moodOptions[index % moodOptions.length];
};

const ArtworkModel = ({ url }: { url: string }) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      },
      undefined,
      () => {
        loader.load("/art_feature_image.png", (fallbackTex) => {
          fallbackTex.colorSpace = THREE.SRGBColorSpace;
          setTexture(fallbackTex);
        });
      }
    );
  }, [url]);

  if (!texture) return null;

  return (
    <mesh>
      <boxGeometry args={[3.2, 4.5, 0.1]} />
      <meshStandardMaterial map={texture} roughness={0.1} metalness={0.2} />
    </mesh>
  );
};

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const initialCategory = searchParams.get("category") || "";
  const navigate = useNavigate();
  const { user, toggleWishlist } = useAuth();
  const { addToCart, cart, removeFromCart } = useCart();
  const { isDarkMode } = useTheme();

  const [artworks, setArtworks] = useState<ArtworkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [selectedExhibitionState, setSelectedExhibitionState] = useState("Delhi NCR");
  const [activeExhibitionId, setActiveExhibitionId] = useState<number | null>(null);
  const [savedExhibitions, setSavedExhibitions] = useState<number[]>([]);
  const [exhibitionRadius, setExhibitionRadius] = useState("Radius: 10km");
  const dashboardStore = useDashboardStore();
  const { maxPrice: priceCap, setMaxPrice: setPriceCap, categories: selectedCategories, setCategories: setSelectedCategories, style: selectedStyle, setStyle: setSelectedStyle, orientation: selectedOrientation, setOrientation: setSelectedOrientation, resetFilters } = dashboardStore;
  const [visibleCount, setVisibleCount] = useState(12);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
  const [hoverPreviewId, setHoverPreviewId] = useState<string | null>(null);
  const [uploadedReference, setUploadedReference] = useState<string | null>(null);
  const [uploadedReferenceName, setUploadedReferenceName] = useState("");
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodOption>("Calm");
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(36);
  const [scrollY, setScrollY] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [openSections, setOpenSections] = useState<Record<FilterSectionKey, boolean>>({
    category: true,
    style: true,
    orientation: true,
  });
  const loadMoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleHoverStart = (id: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverPreviewId(id);
    }, 600); // stable intent-based opening
  };

  const handleHoverEnd = (id: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverPreviewId((current) => (current === id ? null : current));
    }, 2000); // very relaxed closing window
  };
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setSearchValue(initialQuery);
    if (initialCategory && !selectedCategories.includes(initialCategory)) {
      setSelectedCategories([initialCategory]);
    }
    if (initialQuery || initialCategory) {
      setTimeout(() => {
        const el = document.getElementById("search-results");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [initialQuery, initialCategory]);

  useEffect(() => {
    const fetchArtworks = async () => {
      setLoading(true);
      try {
        const term = searchValue.trim();
        if (term.length > 2) {
          const res = await ArtworkService.aiSearchArtworks(term);
          if (res.status === "ok") {
            setArtworks((res.artworks || []) as ArtworkRecord[]);
          }
        } else {
          const res = await ArtworkService.getAllArtworks({
            maxPrice: priceCap,
            categories: selectedCategories,
            style: selectedStyle || undefined,
            orientation: selectedOrientation || undefined,
          });
          if (res.status === "ok") {
            setArtworks((res.artworks || []) as ArtworkRecord[]);
          }
        }
      } catch (error) {
        console.error("Failed to load artworks", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchArtworks();
    }, 600);

    return () => clearTimeout(debounce);
  }, [priceCap, selectedCategories, selectedStyle, selectedOrientation, searchValue]);

  const enrichedArtworks = useMemo(
    () =>
      artworks.map((art, index) => ({
        ...art,
        derivedStyle: inferStyle(art),
        derivedOrientation: inferOrientation(art, index),
        derivedMood: inferMood({ ...art, derivedStyle: inferStyle(art) }, index),
      })),
    [artworks],
  );

  const maxAvailablePrice = 2000;

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(enrichedArtworks.map((art) => art.category).filter((value): value is string => Boolean(value))),
      ).sort(),
    ],
    [enrichedArtworks],
  );

  const styles = useMemo(
    () => ["All", ...Array.from(new Set(enrichedArtworks.map((art) => art.derivedStyle))).sort()],
    [enrichedArtworks],
  );

  const filteredResults = useMemo(() => {
    const term = searchValue.trim().toLowerCase();

    return enrichedArtworks.filter((art) => {
      const artist = art.artistBrandName || art.artistName || "Unknown Artist";
      const searchable = `${art.title} ${artist} ${art.category || ""} ${art.description || ""} ${art.derivedStyle}`.toLowerCase();

      // If AI Search is active (term > 2), we trust the backend results and skip strict local string matching
      const matchesQuery = term.length > 2 ? true : (!term || searchable.includes(term));

      const matchesCategory = selectedCategories.length === 0 || (art.category && selectedCategories.includes(art.category));
      const matchesStyle = selectedStyle === "All" || art.derivedStyle === selectedStyle;
      const matchesOrientation =
        selectedOrientation === "All" || art.derivedOrientation === selectedOrientation;
      const matchesPrice = Number(art.price || 0) <= priceCap;

      return matchesQuery && matchesCategory && matchesStyle && matchesOrientation && matchesPrice;
    });
  }, [
    enrichedArtworks,
    searchValue,
    selectedCategories,
    selectedStyle,
    selectedOrientation,
    priceCap,
  ]);

  const recommendedArtworks = useMemo(
    () =>
      [...enrichedArtworks]
        .sort((left, right) => getRecommendationScore(right, searchValue) - getRecommendationScore(left, searchValue))
        .slice(0, 8),
    [enrichedArtworks, searchValue],
  );

  const featuredCount = filteredResults.filter((art) => Number(art.averageRating || 0) >= 4).length;
  const visibleResults = filteredResults.slice(0, visibleCount);
  const hasMoreResults = visibleCount < filteredResults.length;
  const hoverPreviewArt = useMemo(
    () => visibleResults.find((art) => art._id === hoverPreviewId) || null,
    [hoverPreviewId, visibleResults],
  );

  const [autoNavigated, setAutoNavigated] = useState(false);

  useEffect(() => {
    if (!loading && initialQuery && !autoNavigated && filteredResults.length > 0) {
      const term = initialQuery.toLowerCase();
      const exactMatch = filteredResults.find((a) => a.title.toLowerCase() === term);
      if (exactMatch) {
        setAutoNavigated(true);
        navigate(`/art/${exactMatch._id}`, { replace: true });
        return;
      }
      if (filteredResults.length === 1) {
        setAutoNavigated(true);
        navigate(`/art/${filteredResults[0]._id}`, { replace: true });
        return;
      }
    }
  }, [loading, initialQuery, filteredResults, autoNavigated, navigate]);

  useEffect(() => {
    setVisibleCount(12);
    setLoadingMore(false);
  }, [searchValue, selectedCategories, selectedStyle, selectedOrientation, priceCap, filteredResults.length]);

  useEffect(() => {
    if (!hasMoreResults || !loadMoreRef.current) return;

    const node = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || loadingMore) return;

        setLoadingMore(true);
        loadMoreTimeoutRef.current = setTimeout(() => {
          setVisibleCount((current) => Math.min(current + 9, filteredResults.length));
          setLoadingMore(false);
        }, 700);
      },
      { rootMargin: "900px 0px" },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [filteredResults.length, hasMoreResults, loadingMore]);

  useEffect(() => {
    return () => {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
      if (uploadedReference) {
        URL.revokeObjectURL(uploadedReference);
      }
    };
  }, [uploadedReference]);

  const handleReferenceFile = async (file: File | null) => {
    if (!file) return;

    if (uploadedReference) {
      URL.revokeObjectURL(uploadedReference);
    }

    const objectUrl = URL.createObjectURL(file);
    setUploadedReference(objectUrl);
    setUploadedReferenceName(file.name);

    try {
      const res = await ArtworkService.visionSearch(file);
      if (res.status === "ok") {
        dashboardStore.setSimilarArtworks(res.artworks || []);
      }
    } catch (error) {
      console.error("Vision search failed:", error);
    }
  };

  const similarArtworks = dashboardStore.similarArtworks;

  const artistSpotlights = useMemo(() => {
    const seen = new Set<string>();
    return enrichedArtworks
      .filter((art) => {
        const artist = art.artistBrandName || art.artistName || "Unknown Artist";
        if (seen.has(artist)) return false;
        seen.add(artist);
        return true;
      })
      .slice(0, 4);
  }, [enrichedArtworks]);

  const moodDiscoveryArt = useMemo(
    () => enrichedArtworks.filter((art) => art.derivedMood === selectedMood).slice(0, 6),
    [enrichedArtworks, selectedMood],
  );

  const checkoutHighlights = useMemo(
    () => recommendedArtworks.slice(0, 3),
    [recommendedArtworks],
  );

  const moodTheme = isDarkMode ? moodThemes[selectedMood].dark : moodThemes[selectedMood].light;

  const toggleSection = (section: FilterSectionKey) => {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const submitSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchValue.trim()) {
      params.set("query", searchValue.trim());
    } else {
      params.delete("query");
    }
    navigate(`/search?${params.toString()}`);
  };

  const handleCategorySelect = (val: string) => {
    if (val === "All") {
      setSelectedCategories([]);
      return;
    }
    const newCategories = selectedCategories.includes(val) 
      ? selectedCategories.filter(c => c !== val) 
      : [...selectedCategories, val];
    setSelectedCategories(newCategories);
  };

  const renderFilterChips = (
    options: string[],
    selected: string | string[],
    onSelect: (value: string) => void,
  ) => (
    <div className="flex flex-wrap gap-2.5">
      {options.map((option) => {
        const active = Array.isArray(selected)
          ? (option === "All" ? selected.length === 0 : selected.includes(option))
          : selected === option;
        return (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-300 ${active
              ? isDarkMode
                ? "border-teal-400/50 bg-teal-500/20 text-teal-200 shadow-[0_10px_30px_rgba(20,184,166,0.18)]"
                : "border-teal-300 bg-teal-500/16 text-teal-900 shadow-[0_10px_30px_rgba(14,165,163,0.12)]"
              : isDarkMode
                ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                : "border-slate-200 bg-white/60 text-slate-600 hover:border-teal-200 hover:bg-teal-500/5 hover:text-teal-800"
              }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      className={`${isDarkMode ? "dark-premium-page" : "light-premium-page"} search-luxury-bg min-h-screen overflow-hidden px-4 pb-16 pt-24 transition-[background] duration-700 md:px-8 md:pt-28 ${moodTheme.text}`}
      style={{ background: moodTheme.bg }}
    >
      {/* 🔥 SIDE WAVES */}
      <div className="explore-wave left" />
      <div className="explore-wave right" />

      <div className="relative w-full">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-archive-stage relative mb-10 overflow-hidden rounded-none px-4 pb-14 pt-4 md:px-10 md:pb-18 xl:px-14 min-h-screen flex flex-col items-center justify-center"
        >
          {/* --- IMAGE 1 & 2 DYNAMIC DECORATIONS --- */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Left Liquid Splash (Black/Gold) */}
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: -20, opacity: 0.9 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="hero-ribbon hero-ribbon-left"
            >
              <img src="/black_liquid_splash_1776965143445.png" alt="" className="hero-ribbon-image w-[500px]" />
            </motion.div>

            {/* Right Liquid Splash (Gold) */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 20, opacity: 0.9 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="hero-ribbon hero-ribbon-right"
            >
              <img src="/gold_liquid_splash_1776965168409.png" alt="" className="hero-ribbon-image w-[500px]" />
            </motion.div>

            {/* Floating Paint Brush */}
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [-15, -12, -15] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[5%] top-[25%] z-20 w-32"
            >
              <img src="/luxury_paint_brush_1776965214553.png" alt="" className="drop-shadow-2xl" />
            </motion.div>

            {/* Floating Paint Tube */}
            <motion.div
              animate={{ y: [0, 15, 0], rotate: [15, 18, 15] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-[5%] bottom-[25%] z-20 w-40"
            >
              <img src="/luxury_paint_tube_1776965236310.png" alt="" className="drop-shadow-2xl" />
            </motion.div>

            {/* Ornate Frames (Image 2) */}
            <motion.div
              animate={{ y: [0, -20, 0], rotate: [-5, 5, -5] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[15%] top-[10%] z-10 w-24 opacity-60"
            >
              <img src="/floating_gold_frames_1776965188756.png" alt="" />
            </motion.div>

            <div className="hero-ambient hero-ambient-left" />
            <div className="hero-ambient hero-ambient-right" />
            <div className="hero-light-column hero-light-column-left" />
            <div className="hero-light-column hero-light-column-right" />
          </div>

          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-[1800px] flex-col justify-between">
            <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-4 py-2 text-sm font-semibold text-slate-500 shadow-[0_10px_30px_rgba(148,163,184,0.12)] transition-colors hover:text-teal-700"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 0 rgba(45,212,191,0.05)",
                    "0 0 36px rgba(45,212,191,0.16)",
                    "0 0 0 rgba(45,212,191,0.05)",
                  ],
                }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                className="hero-search-shell"
              >
                <form onSubmit={submitSearch} className="hero-search-bar group">
                  <button type="submit" className="text-slate-500 hover:text-[var(--color-primary)] transition-colors">
                    <Search size={18} />
                  </button>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Search artworks, artists, styles..."
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <button className="hero-voice-pill" type="button">
                    <Mic size={15} />
                    Voice
                  </button>
                </form>
              </motion.div>
            </div>

            <div className="relative text-center">
              <div className="mx-auto mb-5 flex max-w-md items-center justify-center gap-5 text-[11px] font-semibold uppercase tracking-[0.42em] text-slate-500">
                <div className="h-px flex-1 bg-teal-200/80" />
                THE VAULT
                <div className="h-px flex-1 bg-teal-200/80" />
              </div>
              <div className="hero-title-oval" />
              <motion.h1
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="hero-archive-title"
              >
                ART
                <br />
                ARCHIVE
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.18 }}
                className="mx-auto mt-4 max-w-3xl text-lg italic text-slate-600"
              >
                Traverse through the curated echoes of human creativity, where every stroke is a timeless whisper.
              </motion.p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setSelectedCategories([])}
                  className="hero-pill"
                  type="button"
                >
                  <Star size={12} />
                  All Masterpieces
                </button>
                <button
                  onClick={() => setPriceCap(2000)}
                  className="hero-pill"
                  type="button"
                >
                  All Prices
                </button>
              </div>

              <div className="mt-12 grid items-end gap-8 xl:grid-cols-[220px_minmax(0,1fr)_220px]">
                <motion.div
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.65, delay: 0.16 }}
                  className="hero-side-card left"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-slate-950 via-teal-900 to-cyan-400 text-white shadow-[0_20px_40px_rgba(15,23,42,0.18)]">
                    <Compass size={20} />
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900">Discover Art Around You</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Ahmedabad is hosting 12 exhibitions this week. Rare pieces, hidden stories arranged like a living exhibition.
                  </p>
                  <button className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-900" type="button">
                    Explore Nearby <ArrowRight size={14} />
                  </button>
                </motion.div>

                <div className="hero-center-gallery relative mx-auto flex min-h-[350px] w-full max-w-6xl items-end justify-center mb-10">
                  {/* Image 1 Navigation Arrows */}
                  <button
                    onClick={() => setGalleryIndex((prev) => (prev - 1 + heroFrames.length) % heroFrames.length)}
                    className="absolute left-[3%] top-1/2 -translate-y-1/2 z-[60] w-14 h-14 rounded-full bg-white/80 border border-slate-100 flex items-center justify-center shadow-xl hover:scale-110 transition-all text-slate-900">
                    <ArrowLeft size={20} />
                  </button>
                  <button
                    onClick={() => setGalleryIndex((prev) => (prev + 1) % heroFrames.length)}
                    className="absolute right-[3%] top-1/2 -translate-y-1/2 z-[60] w-14 h-14 rounded-full bg-white/80 border border-slate-100 flex items-center justify-center shadow-xl hover:scale-110 transition-all text-slate-900">
                    <ArrowRight size={20} />
                  </button>

                  {heroFrames.map((frame, index) => {
                    // Pattern for 5 polaroids fan
                    const transforms = [
                      "translate-x-[-70%] rotate-[-15deg] z-10",
                      "translate-x-[-35%] rotate-[-8deg] z-20",
                      "translate-y-[-10%] z-30 scale-[1.1]",
                      "translate-x-[35%] rotate-[8deg] z-20",
                      "translate-x-[70%] rotate-[15deg] z-10",
                    ];

                    const normalizedIndex = (index - galleryIndex + heroFrames.length) % heroFrames.length;
                    const targetArt = recommendedArtworks[index % Math.max(recommendedArtworks.length, 1)];

                    return (
                      <motion.button
                        key={frame}
                        initial={false}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        whileHover={{ y: -20, rotate: 0, scale: 1.15, zIndex: 100 }}
                        onClick={() => {
                          if (targetArt?._id) navigate(`/art/${targetArt._id}`);
                        }}
                        className={`hero-polaroid-card transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${transforms[normalizedIndex] || "opacity-0 pointer-events-none absolute"}`}
                        type="button"
                      >
                        <img src={frame} alt="" className="hero-polaroid-image" />
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.65, delay: 0.16 }}
                  onClick={() => {
                    setVideoPlaying((current) => !current);
                    setVideoProgress((current) => (current > 82 ? 18 : current + 16));
                    document.getElementById("exhibition-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hero-preview-orb"
                  type="button"
                >
                  <div className="hero-preview-play">
                    <Play size={22} className="ml-1" fill="currentColor" />
                  </div>
                  <span className="mt-5 block text-center text-lg font-semibold text-slate-900">Live Exhibitions</span>
                </motion.button>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <div className="hero-metric-card">
                  <span className="hero-metric-label">Visible</span>
                  <span className="hero-metric-value">{filteredResults.length}</span>
                </div>
                <div className="hero-metric-card">
                  <span className="hero-metric-label">Featured</span>
                  <span className="hero-metric-value">{featuredCount}</span>
                </div>
              </div>

              <div className="hero-thumbnail-strip">
                {(recommendedArtworks.length > 0 ? recommendedArtworks.slice(0, 5) : []).map((art, index) => (
                  <motion.button
                    key={`${art._id}-thumb`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.38 + index * 0.06 }}
                    whileHover={{ y: -8, scale: 1.03 }}
                    onClick={() => navigate(`/art/${art._id}`)}
                    className="hero-thumb-card"
                    type="button"
                  >
                    <img src={normalizeImage(art)} alt={art.title} className="hero-thumb-image" />
                  </motion.button>
                ))}
              </div>

              <motion.div
                animate={{ y: [0, 8, 0], opacity: [0.75, 1, 0.75] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="hero-scroll-indicator flex flex-col items-center"
              >
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="h-px w-16 bg-teal-200/90" />
                  <span className="text-[10px] font-black tracking-[0.5em]">Scroll to Explore</span>
                  <div className="h-px w-16 bg-teal-200/90" />
                </div>
                <div className="w-6 h-10 rounded-full border-2 border-slate-900/30 flex items-start justify-center p-1.5">
                  <motion.div
                    animate={{ y: [0, 12, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1 h-2 bg-slate-900/80 rounded-full"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* --- EXHIBITION SECTION --- */}
        <motion.section
          id="exhibition-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full max-w-[1800px] mx-auto mb-16"
        >
          <div className="search-glass-panel rounded-[32px] overflow-hidden border border-white/40 dark:border-white/10 shadow-[0_20px_60px_rgba(32,178,170,0.1)]">
            <div className="p-6 md:p-10 border-b border-white/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.4em] text-[var(--color-primary)] mb-2">Location Based Discovery</p>
                <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter text-slate-900">City <span className="text-[var(--color-primary)]">Exhibitions</span></h2>
                <p className="text-slate-500 font-medium mt-2">Discover physical events currently happening right near you.</p>
              </div>
              <div className="flex bg-white/50 backdrop-blur-md rounded-full shadow-sm p-1.5 items-center gap-2 border border-white/60">
                <div className="bg-white rounded-full px-4 py-2 text-sm font-bold text-slate-800 flex items-center gap-2 shadow-sm border border-slate-100">
                  📍 {selectedExhibitionState === "All" ? "India" : selectedExhibitionState}
                </div>
                <button onClick={() => {
                  const el = document.getElementById('state-filters');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[var(--color-primary)]">Change</button>
                <div className="w-px h-6 bg-slate-200 mx-2" />
                <select value={exhibitionRadius} onChange={(e) => setExhibitionRadius(e.target.value)} className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 cursor-pointer pr-2">
                  <option value="Radius: 5km">Radius: 5km</option>
                  <option value="Radius: 10km">Radius: 10km</option>
                  <option value="Radius: 50km">Radius: 50km</option>
                </select>
              </div>
            </div>

            <div id="state-filters" className="flex flex-wrap items-center gap-3 px-6 md:px-10 py-5 bg-black/5 dark:bg-white/5 border-b border-white/20">
              {["All", "Delhi NCR", "Maharashtra", "Karnataka", "Kerala", "West Bengal", "Telangana", "Goa"].map(state => (
                <button
                  key={state}
                  onClick={() => setSelectedExhibitionState(state)}
                  className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${selectedExhibitionState === state ? "bg-[var(--color-primary)] border-transparent text-white" : "border-slate-300 dark:border-slate-700 text-slate-600 hover:bg-[var(--color-primary)] hover:border-transparent hover:text-white"}`}
                >
                  {state}
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-[1fr_450px] xl:grid-cols-[1fr_600px] min-h-[800px] lg:h-[600px] lg:min-h-0">
              {/* Left Side: Exhibition Cards List */}
              <div className="overflow-y-auto p-6 md:p-10 space-y-6">

                {/* GLOBAL RULES PANEL */}
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-2xl p-5 mb-8">
                  <h4 className="text-sm font-bold text-orange-800 dark:text-orange-400 mb-3 flex items-center gap-2">
                    <span>⚠️</span> Important Visitor Policies
                  </h4>
                  <div className="space-y-3 text-xs text-orange-900/80 dark:text-orange-300/80">
                    <p><strong>Security & Cloakrooms:</strong> Government-run spaces and private museums (like KNMA or NGMA) mandate strict bag searches. Carry only a pocket wallet/phone if you want to skip the long baggage drop-off lines.</p>
                    <p><strong>Photography Policies:</strong> Cell phone photography is openly welcomed at commercial fairs like the India Art Fair. However, individual paintings inside permanent galleries may feature strict "No Flash" or "No Photography" signs to protect copyright and canvas textures. Always check booth placards first.</p>
                  </div>
                </div>

                {exhibitionsData
                  .filter(ex => selectedExhibitionState === "All" || ex.state === selectedExhibitionState)
                  .map(ex => (
                    <div key={ex.id} className="group flex flex-col sm:flex-row gap-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl p-3 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                      <div className="sm:w-48 h-48 sm:h-auto min-h-[192px] rounded-2xl overflow-hidden relative cursor-pointer flex-shrink-0" onClick={() => setActiveExhibitionId(ex.id)}>
                        <img src={ex.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={ex.name} />
                        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md rounded-full px-2 py-1 text-[10px] font-black text-slate-900 shadow-sm flex items-center gap-1">
                          ⭐ {ex.rating}
                        </div>
                      </div>
                      <div className="flex-1 py-3 px-2 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] mb-2 flex items-center gap-2">
                            <span>🔥 {ex.category}</span>
                          </div>
                          <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-[var(--color-primary)] transition-colors cursor-pointer" onClick={() => setActiveExhibitionId(ex.id)}>{ex.name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mb-3">
                            <p className="text-xs font-medium text-slate-500 flex items-center gap-2">📍 {ex.loc}</p>
                            <p className="text-xs font-medium text-slate-500 flex items-center gap-2">🕒 {ex.time}</p>
                            {ex.tickets && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mt-1 md:mt-0 col-span-1 md:col-span-2">🎟️ {ex.tickets}</p>}
                          </div>
                          {ex.inside && (
                            <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-white/5 mb-4 leading-relaxed">
                              {ex.inside}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                          <button onClick={() => window.open(ex.link || "https://in.bookmyshow.com", "_blank")} className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-[var(--color-primary)] dark:hover:bg-[var(--color-primary)] dark:hover:text-white transition-all shadow-md">
                            {ex.tickets?.includes('Free') ? 'Visit Website' : 'Book Tickets'}
                          </button>
                          <button
                            onClick={() => {
                              setSavedExhibitions(prev =>
                                prev.includes(ex.id) ? prev.filter(id => id !== ex.id) : [...prev, ex.id]
                              )
                            }}
                            className={`px-4 py-3 rounded-xl border-2 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1 ${savedExhibitions.includes(ex.id) ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}
                          >
                            {savedExhibitions.includes(ex.id) ? 'Saved' : 'Save'} <Heart size={14} className="ml-1" fill={savedExhibitions.includes(ex.id) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Right Side: Live Map Shell or Details Pane */}
              <div className="relative bg-slate-100 dark:bg-slate-800 border-l border-white/20 h-full min-h-[400px]">
                {(() => {
                  const activeExhibition = exhibitionsData.find(e => e.id === activeExhibitionId);
                  if (activeExhibition) {
                    return (
                      <div className="absolute inset-0 h-full bg-white dark:bg-slate-900 p-8 flex flex-col z-20 overflow-hidden animate-in slide-in-from-right-8 duration-500 shadow-2xl">
                        <button onClick={() => setActiveExhibitionId(null)} className="absolute top-6 right-6 bg-slate-100/80 backdrop-blur-md dark:bg-slate-800/80 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 z-30 transition-colors shadow-sm">
                          <X size={18} className="text-slate-600 dark:text-slate-300" />
                        </button>
                        <div className="relative w-full h-56 shrink-0 rounded-2xl overflow-hidden mb-6 shadow-md border border-slate-100 dark:border-white/5">
                          <img src={activeExhibition.img} className="w-full h-full object-cover" alt={activeExhibition.name} />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] shadow-sm">
                            {activeExhibition.category}
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 pb-6 custom-scrollbar">
                          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 leading-tight">{activeExhibition.name}</h2>
                          <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 flex items-center gap-2">📍 {activeExhibition.loc}</p>

                          <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">🕒 Timings & Schedule</h4>
                              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{activeExhibition.time}</p>
                            </div>

                            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                              <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-1 flex items-center gap-2">🎟️ Ticket Pricing</h4>
                              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-500">{activeExhibition.tickets || 'Free Entry'}</p>
                            </div>

                            {activeExhibition.inside && (
                              <div className="bg-orange-50 dark:bg-orange-950/20 p-5 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                <h4 className="text-sm font-bold text-orange-900 dark:text-orange-400 mb-2 flex items-center gap-2">✨ Inner Details</h4>
                                <p className="text-sm font-medium text-orange-800/80 dark:text-orange-300/80 leading-relaxed">{activeExhibition.inside}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="pt-5 mt-auto border-t border-slate-100 dark:border-white/10 shrink-0">
                          <button onClick={() => window.open(activeExhibition.link || "https://in.bookmyshow.com", "_blank")} className="w-full py-4 bg-[var(--color-primary)] text-white rounded-xl font-black uppercase tracking-widest hover:bg-orange-600 shadow-lg hover:shadow-orange-500/25 transition-all flex justify-center items-center gap-2">
                            {activeExhibition.tickets?.includes('Free') ? 'Visit Official Website' : 'Book Ticket Now'} <ArrowUpRight size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="absolute inset-0 w-full h-full z-10">
                      <iframe
                        width="100%"
                        height="100%"
                        className="opacity-90 filter grayscale contrast-125 hover:grayscale-0 hover:opacity-100 transition-all duration-700 w-full h-full"
                        src={`https://maps.google.com/maps?q=${selectedExhibitionState === "All" ? "India" : selectedExhibitionState}&t=&z=10&ie=UTF8&iwloc=&output=embed`}
                        style={{ border: 0 }}
                        loading="lazy"
                      ></iframe>
                      <div className="absolute top-6 right-6 bg-slate-900/90 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 shadow-2xl flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(`https://maps.google.com/maps?q=${selectedExhibitionState === "All" ? "India" : selectedExhibitionState}`)}>
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Open Live Map</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="search-glass-panel mx-auto mb-6 w-full max-w-[1800px] rounded-[32px] p-5 md:p-6"
          style={{ boxShadow: `0 24px 80px ${moodTheme.glow}` }}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Mood Discovery</div>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">Discover by atmosphere</h2>
            </div>
            <form onSubmit={submitSearch} className="relative w-full max-w-md">
              <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--color-primary)] transition-colors">
                <Search size={18} />
              </button>
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search a mood, artist, or medium"
                className="w-full rounded-full border border-white/70 bg-white/65 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[var(--color-primary)]"
              />
            </form>
          </div>

          <div className="flex flex-wrap gap-3">
            {moodOptions.map((mood) => {
              const active = selectedMood === mood;
              return (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={`mood-chip ${active ? "active" : ""} bg-gradient-to-r ${isDarkMode ? moodThemes[mood].dark.accent : moodThemes[mood].light.accent}`}
                >
                  {mood}
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {moodDiscoveryArt.slice(0, 4).map((art, index) => (
              <motion.button
                key={art._id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                onClick={() => navigate(`/art/${art._id}`)}
                className="search-glass-panel floating-card overflow-hidden rounded-[28px] p-3 text-left"
              >
                <div className="overflow-hidden rounded-[22px]">
                  <img src={normalizeImage(art)} alt={art.title} className="h-44 w-full object-cover" />
                </div>
                <div className="px-1 pb-1 pt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{art.derivedMood}</div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{art.title}</h3>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="mx-auto grid w-full max-w-[1800px] gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="search-glass-panel h-fit rounded-[30px] p-5 md:p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Filter Studio</div>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Collector Filters</h2>
              </div>
              <button
                onClick={resetFilters}
                className="rounded-full border border-white/60 bg-white/65 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:border-teal-200 hover:text-teal-700"
              >
                Reset
              </button>
            </div>

            <div className="space-y-4">
              <section className="rounded-[24px] border border-white/60 bg-white/45 px-4 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700">
                      <SlidersHorizontal size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Price Ceiling</div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Live range</div>
                    </div>
                  </div>
                  <div className="rounded-full bg-teal-500/10 px-3 py-1 text-sm font-semibold text-teal-800">
                    Rs {Math.round(priceCap).toLocaleString()}
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxAvailablePrice}
                  value={priceCap}
                  onChange={(event) => setPriceCap(Number(event.target.value))}
                  className="search-range w-full"
                  style={{
                    background: `linear-gradient(90deg, rgba(13,148,136,0.9) 0%, rgba(45,212,191,0.85) ${(priceCap / maxAvailablePrice) * 100
                      }%, rgba(148,163,184,0.18) ${(priceCap / maxAvailablePrice) * 100}%, rgba(148,163,184,0.18) 100%)`,
                  }}
                />
                <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
                  <span>Rs 0</span>
                  <span>Rs {Math.round(maxAvailablePrice).toLocaleString()}</span>
                </div>
              </section>

              {[
                {
                  key: "category" as const,
                  title: "Categories",
                  icon: Palette,
                  content: renderFilterChips(categories, selectedCategories, handleCategorySelect),
                },
                {
                  key: "style" as const,
                  title: "Style",
                  icon: Sparkles,
                  content: renderFilterChips(styles, selectedStyle || "All", setSelectedStyle),
                },
                {
                  key: "orientation" as const,
                  title: "Orientation",
                  icon: Frame,
                  content: renderFilterChips(
                    orientationLabels,
                    selectedOrientation || "All",
                    (value) => setSelectedOrientation(value as OrientationOption),
                  ),
                },
              ].map((section) => {
                const Icon = section.icon;
                const isOpen = openSections[section.key];

                return (
                  <section
                    key={section.key}
                    className="rounded-[24px] border border-white/60 bg-white/45 px-4 py-4"
                  >
                    <button
                      onClick={() => toggleSection(section.key)}
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700">
                          <Icon size={18} />
                        </div>
                        <span className="text-base font-semibold text-slate-900">{section.title}</span>
                      </div>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                        <ChevronDown size={18} className="text-slate-500" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4">{section.content}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                );
              })}
            </div>
          </motion.aside>

          <section className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="search-glass-panel cinematic-panel mb-6 overflow-hidden rounded-[34px] p-4 md:p-5"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-amber-200/70">Cinematic Preview</div>
                  <h2 className="mt-1 text-2xl font-semibold text-white">Motion trailer for the collection</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-slate-200">
                  02:18 runtime
                </div>
              </div>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-black/50">
                  <video
                    ref={videoRef}
                    src="https://www.w3schools.com/html/mov_bbb.mp4"
                    poster={recommendedArtworks[0] ? normalizeImage(recommendedArtworks[0]) : "/art_feature_image.png"}
                    className="h-[420px] w-full object-cover opacity-80 transition-transform duration-700"
                    loop
                    playsInline
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        setVideoProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        if (videoPlaying) {
                          videoRef.current.pause();
                        } else {
                          videoRef.current.play();
                        }
                        setVideoPlaying(!videoPlaying);
                      }
                    }}
                    className="video-play-button absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/14 text-white backdrop-blur-xl transition-all hover:scale-110"
                  >
                    {videoPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} className="ml-1" fill="currentColor" />}
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-300">
                      <span>{videoPlaying ? "Now Playing" : "Hover Preview"}</span>
                      <span>Collector Reel</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-200 via-amber-400 to-white transition-all duration-500"
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="search-glass-panel rounded-[28px] p-5">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">3D Preview</div>
                    <div className="mt-4 h-[210px] rounded-[24px] bg-gradient-to-br from-slate-950 via-zinc-900 to-amber-950/60 overflow-hidden relative cursor-move">
                      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                        <ambientLight intensity={0.8} />
                        <directionalLight position={[5, 5, 5]} intensity={1.5} />
                        <Suspense fallback={null}>
                          <ArtworkModel url={recommendedArtworks[0] ? normalizeImage(recommendedArtworks[0]) : "/art_feature_image.png"} />
                        </Suspense>
                        <OrbitControls enableZoom={true} autoRotate autoRotateSpeed={2} />
                      </Canvas>
                    </div>
                  </div>

                  <div className="search-glass-panel rounded-[28px] p-5">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Checkout Flow</div>
                    <div className="mt-4 space-y-3">
                      {checkoutHighlights.map((art) => (
                        <div key={art._id} className="flex items-center justify-between gap-3 rounded-[18px] bg-white/50 px-4 py-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{art.title}</div>
                            <div className="truncate text-xs text-slate-500">{art.artistBrandName || art.artistName || "Unknown Artist"}</div>
                          </div>
                          <div className="text-sm font-semibold text-slate-900">Rs {Number(art.price || 0).toLocaleString()}</div>
                        </div>
                      ))}
                      <button className="preview-action-button mt-2 inline-flex h-12 w-full items-center justify-center rounded-[18px] bg-slate-950 text-sm font-semibold text-white">
                        Secure Checkout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="search-glass-panel mb-6 rounded-[32px] p-5 md:p-6"
            >
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">AI Vision Search</div>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">Find similar artworks</h2>
                </div>
                <p className="max-w-xl text-sm text-slate-500">
                  Drop in a reference image and browse visually related works in a clean collector-facing grid.
                </p>
              </div>

              <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingUpload(true);
                  }}
                  onDragLeave={() => setIsDraggingUpload(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDraggingUpload(false);
                    handleReferenceFile(event.dataTransfer.files?.[0] || null);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`image-search-upload group relative cursor-pointer overflow-hidden rounded-[28px] border p-5 transition-all duration-300 ${isDraggingUpload
                    ? "border-teal-300 bg-teal-500/10 shadow-[0_0_60px_rgba(45,212,191,0.18)]"
                    : "border-white/70 bg-white/50 hover:border-teal-200"
                    }`}
                >
                  <div className="image-search-ripple" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleReferenceFile(event.target.files?.[0] || null)}
                  />

                  {uploadedReference ? (
                    <div className="relative z-10 space-y-4">
                      <div className="overflow-hidden rounded-[22px]">
                        <img src={uploadedReference} alt="Uploaded reference" className="h-56 w-full object-cover" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Reference image</div>
                        <div className="mt-1 truncate text-sm font-medium text-slate-700">{uploadedReferenceName}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 flex min-h-[320px] flex-col items-center justify-center text-center">
                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                        <Upload size={22} />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900">Drop artwork reference here</h3>
                      <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">
                        Drag and drop an image or click to upload and let the visual search surface similar pieces.
                      </p>
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  {uploadedReference ? (
                    <div
                      key={uploadedReference}
                      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    >
                      {similarArtworks.map((art, index) => (
                        <motion.button
                          key={art._id}
                          initial={{ opacity: 0, y: 18, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
                          onClick={() => navigate(`/art/${art._id}`)}
                          className="search-glass-panel overflow-hidden rounded-[26px] p-3 text-left transition-transform duration-300 hover:-translate-y-1"
                        >
                          <div className="overflow-hidden rounded-[20px]">
                            <img
                              src={normalizeImage(art)}
                              alt={art.title}
                              className="h-40 w-full object-cover"
                            />
                          </div>
                          <div className="px-1 pb-1 pt-4">
                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
                              <ImagePlus size={13} />
                              Similar match
                            </div>
                            <h3 className="mt-2 text-base font-semibold text-slate-900">{art.title}</h3>
                            <p className="mt-1 truncate text-sm text-slate-500">
                              {art.artistBrandName || art.artistName || "Unknown Artist"}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-dashed border-white/70 bg-white/35 px-8 text-center">
                      <div>
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-teal-500/10 text-teal-700">
                          <Sparkles size={20} />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-slate-900">Preview-ready visual search</h3>
                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                          Once you upload a reference, this area fills with visually similar artworks in a soft, futuristic grid.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {recommendedArtworks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12 }}
                className="search-glass-panel mb-6 overflow-hidden rounded-[32px] p-5 md:p-6"
              >
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-400">AI Curation</div>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">Recommended for you</h2>
                  </div>
                  <p className="max-w-xl text-sm text-slate-500">
                    Personalized picks based on your current search mood, artwork popularity, and style affinity.
                  </p>
                </div>

                <div className="recommendation-marquee group">
                  <div className="recommendation-track">
                    {[...recommendedArtworks, ...recommendedArtworks].map((art, index) => {
                      const artist = art.artistBrandName || art.artistName || "Unknown Artist";
                      return (
                        <button
                          key={`${art._id}-${index}`}
                          onClick={() => navigate(`/art/${art._id}`)}
                          className="recommendation-card text-left"
                        >
                          <div className="relative overflow-hidden rounded-[24px]">
                            <img
                              src={normalizeImage(art)}
                              alt={art.title}
                              className="h-52 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute left-4 top-4 rounded-full border border-white/45 bg-white/78 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-800 backdrop-blur-xl">
                              AI Match
                            </div>
                          </div>

                          <div className="space-y-3 p-4">
                            <div>
                              <h3 className="truncate text-lg font-semibold text-slate-900">{art.title}</h3>
                              <p className="mt-1 truncate text-sm text-slate-500">{artist}</p>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-semibold text-slate-900">
                                Rs {Number(art.price || 0).toLocaleString()}
                              </span>
                              <span className="rounded-full bg-slate-900/5 px-3 py-1 font-medium text-slate-600">
                                {Number(art.averageRating || 0).toFixed(1)} rating
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {artistSpotlights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.14 }}
                className="search-glass-panel mb-6 rounded-[32px] p-5 md:p-6"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Artist Profiles</div>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">Featured artists</h2>
                  </div>
                  <WandSparkles size={18} className="text-amber-500" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {artistSpotlights.map((art, index) => (
                    <motion.button
                      key={`${art._id}-artist`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.06 }}
                      onClick={() => navigate(`/art/${art._id}`)}
                      className="search-glass-panel floating-card rounded-[28px] p-4 text-left"
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                          <UserRound size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">{art.artistBrandName || art.artistName || "Unknown Artist"}</div>
                          <div className="truncate text-xs text-slate-500">{art.derivedStyle}</div>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-[20px]">
                        <img src={normalizeImage(art)} alt={art.title} className="h-36 w-full object-cover" />
                      </div>
                      <div className="mt-4 text-sm text-slate-500">Known for {art.category || "mixed media"} and cinematic composition.</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            <div id="search-results" className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Results Grid</div>
                <h2
                  onClick={() => {
                    resetFilters();
                    navigate("/search?query=glass");
                  }}
                  className="mt-1 text-2xl font-semibold text-slate-900 cursor-pointer hover:text-teal-600 transition-colors flex items-center gap-2 group"
                >
                  Soft glass curation
                  <Search size={18} className="text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-4 py-2 text-sm font-medium text-slate-600">
                <Grid3X3 size={16} className="text-teal-700" />
                {selectedCategories.length === 0 ? "All categories" : selectedCategories.join(", ")}
              </div>
            </div>

            {loading ? (
              <div className="search-masonry-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="search-masonry-item search-glass-panel overflow-hidden rounded-[30px] p-4"
                  >
                    <div className={`skeleton w-full rounded-[24px] ${getMasonryHeightClass(index)}`} />
                    <div className="mt-4 space-y-3">
                      <div className="skeleton h-5 w-2/3" />
                      <div className="skeleton h-4 w-1/2" />
                      <div className="skeleton h-12 w-full rounded-[18px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredResults.length > 0 ? (
              <div
                key={`${selectedCategories.join('-')}-${selectedStyle}-${selectedOrientation}-${priceCap}-${searchValue}`}
                className="search-masonry-grid"
              >
                {visibleResults.map((art, index) => {
                  const isInWishlist = user?.wishlist?.includes(art._id);
                  const isInCart = cart.some((item: any) => item._id === art._id);
                  const artist = art.artistBrandName || art.artistName || "Unknown Artist";
                  const mediaHeightClass = getMasonryHeightClass(index);
                  const parallaxY = ((scrollY * ((index % 4) + 1)) / 140) % 18;

                  return (
                    <motion.article
                      key={art._id}
                      initial={{ opacity: 0, y: 30, scale: 0.9, filter: "brightness(2.5) contrast(1.2) blur(12px)" }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: "brightness(1) contrast(1) blur(0px)" }}
                      transition={{ duration: 0.7, delay: index * 0.05, ease: "easeOut" }}
                      whileHover={{ y: -8 }}
                      onHoverStart={() => handleHoverStart(art._id)}
                      onHoverEnd={() => handleHoverEnd(art._id)}
                      className="search-masonry-item search-glass-panel group overflow-hidden rounded-[30px] p-4"
                    >
                      <button
                        onClick={() => navigate(`/art/${art._id}`)}
                        className="block w-full text-left"
                      >
                        <div className={`relative overflow-hidden rounded-[24px] ${mediaHeightClass}`}>
                          {!imageLoaded[art._id] && <div className="skeleton absolute inset-0 rounded-[24px]" />}
                          <img
                            src={normalizeImage(art)}
                            alt={art.title}
                            loading="lazy"
                            onLoad={() =>
                              setImageLoaded((current) => ({
                                ...current,
                                [art._id]: true,
                              }))
                            }
                            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.06] search-parallax-image ${imageLoaded[art._id] ? "opacity-100 blur-0" : "opacity-0 blur-md"
                              }`}
                            style={{ ["--parallax-y" as string]: `${parallaxY}px` }}
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/18 via-transparent to-white/20" />

                          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 backdrop-blur-xl">
                            {art.derivedStyle}
                          </div>

                          <div className="absolute bottom-4 left-4 rounded-full border border-white/35 bg-white/75 px-3 py-1.5 text-xs font-semibold text-slate-700 backdrop-blur-xl">
                            {art.derivedOrientation}
                          </div>

                          <div className="absolute bottom-4 right-4 rounded-full bg-slate-950/78 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur-xl">
                            Rs {Number(art.price || 0).toLocaleString()}
                          </div>
                        </div>
                      </button>

                      <div className="px-1 pb-1 pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-xl font-semibold text-slate-900">{art.title}</h3>
                            <p className="mt-1 truncate text-sm text-slate-500">{artist}</p>
                          </div>
                          <button
                            onClick={() => {
                              if (!user) {
                                window.dispatchEvent(new Event("open-login-modal"));
                                return;
                              }
                              toggleWishlist(art._id);
                            }}
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300 ${isInWishlist
                              ? "border-rose-200 bg-rose-500/12 text-rose-500"
                              : "border-white/70 bg-white/65 text-slate-500 hover:border-teal-200 hover:text-teal-700"
                              }`}
                          >
                            <Heart size={18} fill={isInWishlist ? "currentColor" : "none"} />
                          </button>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-600">
                            {art.category || "Unlisted"}
                          </span>
                          <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-600">
                            Rating {Number(art.averageRating || 0).toFixed(1)}
                          </span>
                        </div>

                        <button
                          onClick={() => (isInCart ? removeFromCart(art._id) : addToCart(art))}
                          disabled={Number(art.stock || 0) <= 0}
                          className={`mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[20px] text-sm font-semibold transition-all duration-300 ${Number(art.stock || 0) <= 0
                            ? "cursor-not-allowed bg-slate-200 text-slate-400"
                            : isInCart
                              ? "bg-slate-950 text-white"
                              : "bg-teal-600 text-white hover:scale-[1.01] hover:bg-teal-700"
                            }`}
                        >
                          <ShoppingBag size={16} />
                          {Number(art.stock || 0) <= 0 ? "Unavailable" : isInCart ? "Added to Collection" : "Add to Cart"}
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="search-glass-panel rounded-[32px] px-8 py-14 text-center"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/10 text-teal-700">
                  <Search size={30} />
                </div>
                <h3 className="mt-6 text-3xl font-semibold text-slate-900">Not Available</h3>
                <p className="mx-auto mt-3 max-w-xl text-slate-500">
                  The artwork you are looking for is currently not available in our collection.
                </p>
              </motion.div>
            )}

            {(hasMoreResults || loadingMore) && !loading && filteredResults.length > 0 && (
              <div className="mt-8">
                {loadingMore && (
                  <div className="search-masonry-grid">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={`loading-${index}`}
                        className="search-masonry-item search-glass-panel overflow-hidden rounded-[30px] p-4"
                      >
                        <div className={`skeleton w-full rounded-[24px] ${getMasonryHeightClass(index + visibleCount)}`} />
                        <div className="mt-4 space-y-3">
                          <div className="skeleton h-5 w-2/3" />
                          <div className="skeleton h-4 w-1/2" />
                          <div className="skeleton h-12 w-full rounded-[18px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div ref={loadMoreRef} className="h-10 w-full" />
              </div>
            )}
          </section>
        </div>
      </div>

      <AnimatePresence>
        {hoverPreviewArt && (
          <>
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(18px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={`fixed inset-0 z-40 ${isDarkMode ? "bg-slate-950/65" : "bg-slate-900/40"}`}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
              className="pointer-events-none fixed inset-x-0 top-1/2 z-50 mx-auto w-[min(92vw,760px)] -translate-y-1/2 px-4"
            >
              <div
                className={`preview-modal pointer-events-auto grid overflow-hidden rounded-[34px] border ${isDarkMode
                  ? "border-white/12 bg-slate-900/90 shadow-[0_40px_120px_rgba(0,0,0,0.6)]"
                  : "border-slate-200 bg-white shadow-[0_40px_120px_rgba(0,0,0,0.18)]"
                  } md:grid-cols-[1.08fr_0.92fr]`}
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                  setHoverPreviewId(hoverPreviewArt._id);
                }}
                onMouseLeave={() => handleHoverEnd(hoverPreviewArt._id)}
              >
                <div className="relative min-h-[300px] overflow-hidden bg-slate-950/35">
                  <img
                    src={normalizeImage(hoverPreviewArt)}
                    alt={hoverPreviewArt.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-white/10" />
                  <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100 backdrop-blur-xl">
                    Artwork Preview
                  </div>
                </div>

                <div className={`flex flex-col justify-between gap-5 p-6 md:p-7 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  <div>
                    <div className={`text-xs uppercase tracking-[0.24em] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Collector Snapshot</div>
                    <h3 className={`mt-3 text-3xl font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {hoverPreviewArt.title}
                    </h3>
                    <p className={`mt-2 text-base ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                      {hoverPreviewArt.artistBrandName || hoverPreviewArt.artistName || "Unknown Artist"}
                    </p>
                    <div className={`mt-4 inline-flex rounded-full border px-4 py-2 text-lg font-semibold ${isDarkMode ? "border-teal-500/30 bg-teal-500/10 text-teal-400" : "border-teal-200 bg-teal-50 text-teal-700"
                      }`}>
                      Rs {Number(hoverPreviewArt.price || 0).toLocaleString()}
                    </div>
                    <p className={`mt-5 line-clamp-4 text-sm leading-7 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      {hoverPreviewArt.description ||
                        "A quietly luxurious work selected for its atmosphere, form, and collector appeal within this curated feed."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => {
                        const isInCart = cart.some((item: any) => item._id === hoverPreviewArt._id);
                        isInCart ? removeFromCart(hoverPreviewArt._id) : addToCart(hoverPreviewArt);
                      }}
                      className="preview-action-button inline-flex h-12 items-center justify-center rounded-[18px] bg-teal-500/88 px-5 text-sm font-semibold text-white"
                    >
                      <ShoppingBag size={16} className="mr-2" />
                      {cart.some((item: any) => item._id === hoverPreviewArt._id) ? "Added to Cart" : "Add to Cart"}
                    </button>
                    <button
                      onClick={() => navigate(`/art/${hoverPreviewArt._id}`)}
                      className="preview-action-button inline-flex h-12 items-center justify-center rounded-[18px] border border-white/16 bg-white/10 px-5 text-sm font-semibold text-white"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchPage;
