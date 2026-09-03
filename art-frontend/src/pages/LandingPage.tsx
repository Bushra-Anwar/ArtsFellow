import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ShoppingBag, Check, Star, Search, AlertCircle, Play, ArrowRight } from "lucide-react";
import { ArtistService } from "../services/artist.service";
import { ArtworkService } from "../services/artwork.service";
import { RatingService } from "../services/rating.service";
import PaintStainsBackground from "../components/PaintStainsBackground";
import EternalFooter from "../components/EternalFooter";
import { SkeletonGrid } from "../components/SkeletonLoader";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";

/* 🔥 LIQUID SHADER (distortion feel) */
function Liquid({ color, position }: { color: string, position: [number, number, number] }) {
  const mesh = useRef<any>(null);

  useFrame(({ clock }) => {
    if (mesh.current) {
      mesh.current.rotation.z = Math.sin(clock.elapsedTime * 0.4) * 0.3;
      mesh.current.position.y = Math.sin(clock.elapsedTime) * 0.3;
    }
  });

  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[1.6, 64, 64]} />
      <MeshDistortMaterial color={color} distort={0.5} speed={2} roughness={0.2} metalness={0.1} />
    </mesh>
  );
}

const FESTIVAL_CONFIG: Record<string, any> = {
  eid: {
    id: "eid",
    name: "Eid al-Fitr",
    subtitle: "Crescent Moon Series",
    colors: "from-emerald-950 via-teal-950 to-slate-950",
    accent: "text-emerald-400",
    icons: ["🌙", "🕯️", "🕌"],
    message: "Celebrate the joy of Eid with masterpieces inspired by divine beauty. Curated art for your sacred spaces.",
    button: "Shop the Moon Collection",
    emoji: "🌙",
    tag: "Spirit of Gratitude"
  },
  akshaya_tritiya: {
    id: "akshaya_tritiya",
    name: "Akshaya Tritiya",
    subtitle: "The Eternal Prosperity Sale",
    colors: "from-yellow-900 via-amber-900 to-amber-950",
    accent: "text-amber-400",
    icons: ["🏺", "✨", "💰"],
    message: "Invest in timeless gold-leaf masterpieces and original art that brings eternal prosperity to your home.",
    button: "Curate Prosperity",
    emoji: "✨",
    tag: "Eternal Wealth"
  },
  baisakhi: {
    id: "baisakhi",
    name: "Vaisakhi",
    subtitle: "Harvest of Creativity",
    colors: "from-orange-900 via-amber-900 to-yellow-950",
    accent: "text-orange-400",
    icons: ["🌾", "🥁", "☀️"],
    message: "A celebration of colors and new beginnings. Fresh masterpieces directly from the heart of the studios.",
    button: "Shop Fresh Harvest",
    emoji: "☀️",
    tag: "New Beginnings"
  },
  easter: {
    id: "easter",
    name: "Easter Special",
    subtitle: "Spring Awakening",
    colors: "from-sky-950 via-blue-950 to-slate-900",
    accent: "text-sky-400",
    icons: ["🌸", "🥚", "🐣"],
    message: "Fresh perspectives and vibrant energy for your walls. Celebrate the resurrection of art this spring.",
    button: "Explore Spring Art",
    emoji: "🌸",
    tag: "Fresh Bloom"
  },
  diwali: {
    id: "diwali",
    name: "Festival of Lights",
    subtitle: "Dussehra & Diwali Series",
    colors: "from-orange-950 via-amber-950 to-red-950",
    accent: "text-orange-400",
    icons: ["🪔", "🎇", "✨"],
    message: "Celebrate the victory of light over darkness with exclusive curated art and shimmering masterpieces.",
    button: "Shop Diwali Collection",
    emoji: "🪔",
    tag: "Victory of Light"
  },
  none: {
    id: "none",
    name: "Season of Art",
    subtitle: "Modern Masterpieces",
    colors: "from-slate-950 via-slate-900 to-slate-950",
    accent: "text-[var(--color-primary)]",
    icons: ["🎨", "📐", "🖌️"],
    message: "Curated collection of original art for the modern visionary. Experience the eternal beauty of creativity.",
    button: "Shop The Collection",
    emoji: "🎨",
    tag: "Modern Vision"
  }
};

const getActiveFestival = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const day = now.getDate();

  // Simulation: If April (Current simulation date is April 5, 2026)
  if (month === 3) {
    if (day <= 7) return FESTIVAL_CONFIG.easter;
    if (day > 7 && day <= 15) return FESTIVAL_CONFIG.baisakhi;
    if (day > 15 && day <= 22) return FESTIVAL_CONFIG.eid;
    return FESTIVAL_CONFIG.akshaya_tritiya;
  }

  if (month === 10) return FESTIVAL_CONFIG.diwali; // November

  return FESTIVAL_CONFIG.none;
};

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const { addToCart, cart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [artworks, setArtworks] = useState<any[]>([]);
  const [latestArtworks, setLatestArtworks] = useState<any[]>([]);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [currentFestival, setCurrentFestival] = useState(getActiveFestival());

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Parallax constraints per user snippet 
  const rotateX = useTransform(mouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 800], [10, -10]);
  const rotateY = useTransform(mouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1400], [-10, 10]);

  useEffect(() => {
    setCurrentFestival(getActiveFestival());
  }, []);

  const [hoveredArtForRating, setHoveredArtForRating] = useState<string | null>(null);
  const [localRatings, setLocalRatings] = useState<Record<string, number>>({});

  const handleRate = async (e: React.MouseEvent, artId: string, artistId: string, rating: number) => {
    e.stopPropagation();
    if (!user) {
      window.dispatchEvent(new Event("open-login-modal"));
      return;
    }
    setLocalRatings(prev => ({ ...prev, [artId]: rating }));
    setHoveredArtForRating(null);
    try {
      await RatingService.rateArtwork(artId, artistId, user._id, rating);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [topArtRes, topArtistsRes, latestRes]: any[] = await Promise.all([
          ArtworkService.getTopRatedArt(8),
          ArtistService.getTopArtists(5),
          ArtworkService.getLatestArt(8)
        ]);

        if (topArtRes.status === "ok") {
          setArtworks(topArtRes.artworks);
        }

        if (topArtistsRes.status === "ok") {
          setTopArtists(topArtistsRes.artists);
        }

        if (latestRes.status === "ok") {
          setLatestArtworks(latestRes.artworks);
        }
      } catch (err) {
        console.error("Failed to fetch landing data", err);
      }
    };
    fetchLandingData();
  }, []);

  useEffect(() => {
    const fetchUserRatings = async () => {
      if (user?.role === "customer" && user._id) {
        try {
          const res = await RatingService.getCustomerRatings(user._id);
          if (res.status === "ok") {
            const mappedRatings: Record<string, number> = {};
            res.ratings.forEach((r: any) => {
              if (r.artworkId) mappedRatings[r.artworkId] = r.rating;
            });
            setLocalRatings(mappedRatings);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchUserRatings();
  }, [user]);

  return (
    <div
      onMouseMove={(e) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }}
      className="min-h-screen bg-[#fcfcfc] dark:bg-[#070a0f] text-[var(--text-main)] font-['Outfit',_sans-serif] relative overflow-hidden transition-colors duration-500 page-enter"
    >
      <PaintStainsBackground opacity={0.3} interactive={false} />

      {/* Hero Section */}
      <section className="relative min-h-[100vh] w-full flex flex-col items-center justify-center pt-24 overflow-hidden z-20">

        {/* 🔥 3D LIQUID SUB-BACKGROUND (A bit smaller) */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60 mix-blend-multiply dark:mix-blend-screen transition-opacity">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[0, 5, 5]} intensity={2} color="#ffffff" />
            <Liquid color="#0f2027" position={[-4.5, 0, -1]} />
            <Liquid color="#fb923c" position={[4.5, 0, -1]} />
          </Canvas>
        </div>

        {/* 3. LEFT BACKGROUND WAVE & ELEMENTS */}
        <motion.div
          animate={{ y: [-15, 15, -15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[-15%] md:left-[-5%] top-[5%] w-[60vw] md:w-[45vw] h-[70vh] pointer-events-none z-10"
        >
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-[#0a1628]/10 blur-[80px] rounded-full" />

          <svg viewBox="0 0 1000 800" className="absolute inset-0 w-full h-full drop-shadow-2xl">
            <path
              d="M -100,700 C 100,500 150,800 500,450 C 700,250 800,150 1100,300"
              fill="none" stroke="url(#darkLiquid1)" strokeWidth="130" strokeLinecap="round"
            />
            <path
              d="M 50,650 C 150,450 200,750 550,400 C 750,200 850,100 1150,250"
              fill="none" stroke="#e2e8f0" strokeWidth="2" opacity="0.4" strokeLinecap="round"
            />
            <defs>
              <linearGradient id="darkLiquid1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="50%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#334155" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* 4. DISCOVER THE UNSEEN CARD (Left Floating) */}
        {artworks.length > 2 && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            whileHover={{ y: -5 }}
            onClick={() => navigate(`/art/${artworks[2]._id}`)}
            className="hidden lg:flex absolute left-10 top-[35%] z-40 bg-white/60 dark:bg-gray-800/80 backdrop-blur-3xl border border-white dark:border-gray-700 shadow-[0_20px_40px_rgba(0,0,0,0.05)] rounded-3xl overflow-hidden w-[220px] flex-col items-center cursor-pointer group"
          >
            <div className="w-full h-[120px] bg-slate-100 overflow-hidden relative">
               <img src={artworks[2].images?.[0]?.startsWith('http') ? artworks[2].images[0] : (artworks[2].images?.[0] ? `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") || "http://localhost:5005"}${artworks[2].images[0]}` : '')} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Left floating art" />
               <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                 <span className="text-[10px]">✦</span>
               </div>
            </div>
            <div className="p-4 flex flex-col items-center text-center">
               <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 truncate w-full">{artworks[2].title}</h3>
               <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 truncate w-full">
                 by {artworks[2].artistBrandName || artworks[2].artistName || "Unknown Artist"}
               </p>
               <button className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 text-slate-800 dark:text-gray-300 group-hover:text-teal-600 transition-colors">
                 View Details <ArrowRight size={10} />
               </button>
            </div>
          </motion.div>
        )}

        {/* 5. RIGHT BACKGROUND WAVE & ELEMENTS */}
        <motion.div
          animate={{ y: [15, -15, 15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[-15%] md:right-[-5%] top-[5%] w-[60vw] md:w-[45vw] h-[70vh] pointer-events-none z-10"
        >
          <div className="absolute top-1/4 right-0 w-3/4 h-1/2 bg-amber-500/10 blur-[80px] rounded-full" />

          <svg viewBox="0 0 1000 800" className="absolute inset-0 w-full h-full drop-shadow-2xl">
            <path
              d="M 1100,700 C 900,450 850,750 500,400 C 300,200 200,100 -100,250"
              fill="none" stroke="url(#goldLiquid1)" strokeWidth="120" strokeLinecap="round"
            />
            <path
              d="M 1050,650 C 850,400 800,700 450,350 C 250,150 150,50 -150,200"
              fill="none" stroke="#fff" strokeWidth="2" opacity="0.4" strokeLinecap="round"
            />
            <defs>
              <linearGradient id="goldLiquid1" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="50%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* 6. WATCH GALLERY PREVIEW (Right Circular Floating) */}
        {artworks.length > 3 && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate(`/art/${artworks[3]._id}`)}
          className="hidden lg:flex absolute right-10 top-[40%] z-40 bg-white/60 dark:bg-gray-800/80 backdrop-blur-3xl border border-white dark:border-gray-700 shadow-[0_20px_40px_rgba(0,0,0,0.05)] rounded-3xl overflow-hidden w-[220px] flex-col items-center cursor-pointer group"
        >
            <div className="w-full h-[120px] bg-slate-100 overflow-hidden relative">
               <img src={artworks[3].images?.[0]?.startsWith('http') ? artworks[3].images[0] : (artworks[3].images?.[0] ? `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") || "http://localhost:5005"}${artworks[3].images[0]}` : '')} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Right floating art" />
               <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                 <Play size={10} className="ml-0.5 text-teal-600" fill="currentColor" />
               </div>
            </div>
            <div className="p-4 flex flex-col items-center text-center">
               <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 truncate w-full">{artworks[3].title}</h3>
               <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 truncate w-full">
                 by {artworks[3].artistBrandName || artworks[3].artistName || "Unknown Artist"}
               </p>
               <button className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 text-slate-800 dark:text-gray-300 group-hover:text-teal-600 transition-colors">
                 View Masterpiece <ArrowRight size={10} />
               </button>
            </div>
        </motion.div>
        )}

        {/* CENTER PARALLAX WRAPPER */}
        <motion.div
          className="relative z-10 text-center px-4 max-w-7xl mx-auto flex flex-col items-center w-full"
          style={{ rotateX, rotateY, transformPerspective: 1200 }}
        >
          <div className="px-5 py-1.5 bg-black/5 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-gray-800 rounded-full inline-block mb-8 shadow-sm">
            <span className="text-[9px] uppercase tracking-[0.4em] font-black text-slate-800 dark:text-gray-300">THE DIGITAL SANCTUARY</span>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-6xl md:text-8xl lg:text-[100px] font-serif font-black tracking-tighter text-[#0a1628] dark:text-white leading-[1.0] mb-8 drop-shadow-2xl"
          >
            DISCOVER & BUY <br />
            <span className="text-teal-700 dark:text-teal-400">ORIGINAL ART</span>
          </motion.h1>

          <p className="text-md md:text-lg italic text-slate-600 dark:text-slate-400 max-w-2xl mb-12 px-4 leading-relaxed font-serif">
            "Explore unique masterpieces from brilliant, visionary<br />artists spanning the globe."
          </p>

          {/* SEARCH BAR */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-lg mx-auto mb-6"
          >
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get("searchQuery")?.toString();
                if (q?.trim()) navigate(`/search?query=${q.trim()}`);
              }}
              className="flex items-center bg-white dark:bg-gray-900 rounded-[30px] p-2 pr-3 shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-slate-100 dark:border-gray-800"
            >
              <Search size={22} className="text-slate-400 ml-4 mr-2" />
              <input
                name="searchQuery"
                placeholder="Search artworks, artists..."
                className="flex-1 bg-transparent border-none outline-none px-2 py-3 text-sm md:text-base font-semibold text-slate-800 dark:text-white placeholder:text-slate-400"
              />
              <button type="submit" className="bg-teal-600 text-white rounded-[24px] px-8 py-3 font-bold text-[10px] md:text-xs tracking-widest uppercase hover:bg-teal-700 hover:scale-105 transition-all shadow-md">
                SEARCH
              </button>
            </form>
          </motion.div>

          {/* CHIPS */}
          <div className="flex flex-wrap justify-center gap-3 mb-10 px-4 font-sans relative z-30">
            {[
              { label: "Digital Art" },
              { label: "Sketch" },
              { label: "Paintings" },
              { label: "Canva Art" }
            ].map(chip => (
              <div
                key={chip.label}
                onClick={() => navigate(`/search?query=${chip.label}`)}
                className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-slate-200 dark:border-gray-700 shadow-sm cursor-pointer hover:shadow-md hover:border-teal-200 transition-all font-bold text-[9px] uppercase tracking-wider text-slate-800 dark:text-white"
              >
                {chip.label}
              </div>
            ))}
          </div>

          {/* CTA BUTTON */}
          <button onClick={() => navigate('/explore')} className="relative z-30 flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 text-white border border-white/20 rounded-full font-black text-sm uppercase tracking-[0.25em] shadow-[0_15px_40px_rgba(20,184,166,0.3)] hover:scale-105 hover:shadow-[0_20px_50px_rgba(20,184,166,0.4)] transition-all font-sans">
             EXPLORE ART
          </button>

          {/* 🌊 INFINITE WAVE SLIDER */}
          <div className="w-full max-w-[100vw] overflow-hidden mt-6 pb-24">
            <motion.div
              className="flex gap-4 sm:gap-6 mt-10 shrink-0 w-max px-4"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            >
              {/* Duplicate the array twice so it scrolls infinitely without empty gap */}
              {[...(artworks.length > 0 ? artworks : [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]), ...(artworks.length > 0 ? artworks : [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])].map((art, i) => {
                const imgUrl = art.images?.[0]?.startsWith('http')
                  ? art.images[0]
                  : (art.images?.[0] ? `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") || "http://localhost:5005"}${art.images?.[0]}` : `https://picsum.photos/300/400?${i}`);

                return (
                  <motion.div
                    key={`wave-${i}`}
                    className="w-[180px] h-[240px] md:w-[220px] md:h-[300px] bg-white rounded-3xl overflow-hidden shadow-2xl shrink-0 cursor-pointer border-[3px] border-white/40"
                    style={{
                      y: Math.sin(i * 1.5) * 40, // Mathematical wave offset!
                    }}
                    whileHover={{ scale: 1.08, y: 0, zIndex: 50 }}
                    onClick={() => art._id && navigate(`/art/${art._id}`)}
                  >
                    <img src={imgUrl} className="w-full h-full object-cover filter transition duration-500 hover:contrast-110" />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      </section>
      {/* Featured Categories Section */}
      <section className="relative z-10 max-w-[90rem] mx-auto px-6 pt-8 pb-6 mt-4 md:mt-8">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-4xl md:text-5xl font-black mb-3 text-[var(--text-main)] italic">
            Featured Categories
          </h2>
          <p className="text-slate-500 dark:text-slate-400 italic">
            Explore diverse styles curated just for you.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 border-t border-[var(--color-primary)]/10 pt-8">
          {[
            { title: "Canva Art", img: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg", param: "Canva Art", color: "from-orange-500/80", icon: "🎨" },
            { title: "Digital Art", img: "https://upload.wikimedia.org/wikipedia/en/d/dd/The_Persistence_of_Memory.jpg", param: "Digital Art", color: "from-blue-600/80", icon: "💻" },
            { title: "3D Modeling", img: "https://upload.wikimedia.org/wikipedia/commons/8/80/Michelangelo%27s_David_-_Right_View.jpg", param: "3D Modeling", color: "from-indigo-600/80", icon: "🧊" },
            { title: "AI Creations", img: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg", param: "AI Generations", color: "from-pink-600/80", icon: "🤖" },
            { title: "Photography", img: "https://upload.wikimedia.org/wikipedia/commons/0/0f/1665_Girl_with_a_Pearl_Earring.jpg", param: "Photography", color: "from-gray-700/80", icon: "📷" },
            { title: "Illustration", img: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Grant_Wood_-_American_Gothic_-_Google_Art_Project.jpg", param: "Illustration", color: "from-teal-500/80", icon: "✒️" },
            { title: "Abstract", img: "https://upload.wikimedia.org/wikipedia/commons/4/40/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg", param: "Abstract", color: "from-purple-600/80", icon: "🌀" },
            { title: "Portrait", img: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg", param: "Portrait", color: "from-rose-600/80", icon: "👤" },
            { title: "Watercolor", img: "https://upload.wikimedia.org/wikipedia/commons/0/0a/The_Great_Wave_off_Kanagawa.jpg", param: "Watercolor", color: "from-cyan-500/80", icon: "💧" },
            { title: "Oil Painting", img: "https://upload.wikimedia.org/wikipedia/commons/7/7d/A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg", param: "Oil Painting", color: "from-amber-600/80", icon: "🖼️" },
            { title: "Sketch", img: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg", param: "Sketch", color: "from-slate-600/80", icon: "✏️" },
            { title: "Sculpture", img: "https://upload.wikimedia.org/wikipedia/commons/8/80/Michelangelo%27s_David_-_Right_View.jpg", param: "Sculpture", color: "from-emerald-600/80", icon: "🗿" },
          ].map((cat, idx) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.07, duration: 0.5 }}
              onClick={() => navigate(`/search?query=${cat.param}`)}
              className="group relative h-[200px] rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 border border-white/5"
            >
              <div className="absolute inset-0 bg-gray-900">
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-110 transition-all duration-700"
                />
              </div>
              {/* Gradient overlay with category color */}
              <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} via-black/30 to-transparent`} />

              {/* Icon badge top-left */}
              <div className="absolute top-3 left-3 text-lg bg-black/40 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center border border-white/10 shadow-md">
                {cat.icon}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-center text-center transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-base font-black text-white mb-1.5 tracking-wide drop-shadow-lg">{cat.title}</h3>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-white/20">
                  Browse →
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Blueprint Top-Rated Art Layout Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-[var(--text-main)] italic tracking-tight flex items-center justify-center gap-3">
            <span className="text-[var(--color-primary)]">⧉</span> The Masterpiece Blueprint
          </h2>
          <p className="text-slate-500 dark:text-slate-400 italic font-mono text-sm max-w-2xl mx-auto">
            Technical analysis of the highest-rated sold artwork. From canvas dimensions to stroke orientation.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-stretch pt-4">

          {/* Left Side: The Artwork */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-[45%] rounded-[3rem] overflow-hidden bg-[#0c1214] shadow-2xl relative group border border-[var(--color-primary)]/20 p-4"
          >
            <div className="absolute top-8 left-8 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-yellow-500/30 font-bold text-xs text-white z-20 flex items-center gap-2">
              <Star size={12} className="text-yellow-400 fill-yellow-400" /> TOP SELLING
            </div>
            <div className="w-full h-full min-h-[400px] lg:min-h-[500px] rounded-[2rem] overflow-hidden relative shadow-inner">
              <img
                src={latestArtworks[0]?.images?.[0]?.startsWith('http') ? latestArtworks[0]?.images?.[0] : `https://upload.wikimedia.org/wikipedia/commons/5/5a/The_Night_Watch_-_HD.jpg`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter contrast-125 saturate-150"
                alt="Top Sold Blueprint Art"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1214] via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-black text-white leading-tight drop-shadow-md mb-1">
                  {latestArtworks[0]?.title || "The Endless Horizon"}
                </h3>
                <p className="text-[var(--color-primary)] font-bold text-xs uppercase tracking-widest">
                  Sold for ₹{Number(latestArtworks[0]?.price || 85000).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Side: The Technical Grid/Blueprint */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-[55%] rounded-[3rem] bg-[#f4f2ef] dark:bg-[#071317] border border-gray-300 dark:border-white/10 relative overflow-hidden shadow-xl p-8 md:p-12 flex flex-col justify-center"
          >
            {/* Blueprint Grid Background Pattern */}
            <div className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none"
              style={{ backgroundImage: 'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Top Ruler Bar */}
            <div className="absolute top-0 left-0 w-full h-8 border-b border-gray-400 dark:border-white/20 bg-gray-200 dark:bg-black/40 flex items-end px-12 z-20 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="flex-1 border-l border-gray-400 h-1/2 flex items-start justify-start pt-1">
                  <span className="text-[7px] text-gray-500 -ml-1.5 leading-none">{i * 2}</span>
                </div>
              ))}
              <span className="absolute right-4 text-[8px] font-bold text-[var(--color-primary)] bottom-1 uppercase">CM</span>
            </div>

            {/* Left Ruler Bar */}
            <div className="absolute top-8 left-0 w-8 h-full border-r border-gray-400 dark:border-white/20 bg-gray-200 dark:bg-black/40 flex flex-col items-center py-4 z-20 overflow-hidden">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="flex-1 w-1/2 border-t border-gray-400 flex items-end justify-end pr-1">
                  <span className="text-[7px] text-gray-500 -mb-2 leading-none">{i * 2}</span>
                </div>
              ))}
            </div>

            <div className="relative z-10 ml-8 mt-4 grid grid-cols-2 gap-8 h-full">
              <div className="flex flex-col gap-6 justify-center border-r border-gray-300 dark:border-white/10 pr-6">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-[0.2em] mb-1">Scale Format</h4>
                  <div className="text-3xl font-black text-slate-900 dark:text-white font-mono flex items-end gap-2">
                    A3 <span className="text-sm font-normal text-[var(--color-primary)] mb-1">Standard</span>
                  </div>
                </div>

                <div className="w-full h-[1px] bg-gray-300 dark:bg-white/10" />

                <div>
                  <h4 className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-[0.2em] mb-1">Dimensions (H x W)</h4>
                  <div className="text-xl font-bold text-slate-800 dark:text-white font-mono flex items-center gap-3">
                    42.0 <span className="text-xs font-normal">cm</span> <span className="text-gray-300 dark:text-gray-600">×</span> 29.7 <span className="text-xs font-normal">cm</span>
                  </div>
                  <div className="text-xs text-gray-400 font-mono mt-1">16.5 × 11.7 inches</div>
                </div>

                <div className="w-full h-[1px] bg-gray-300 dark:bg-white/10" />

                <div>
                  <h4 className="text-[10px] uppercase font-bold text-[var(--color-primary)] tracking-[0.2em] mb-2">Technical Execution</h4>
                  <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed font-mono">
                    This masterpiece requires precise brush strokes. Optimal canvas distance is min 30cm for visual clarity. High density color packing.
                  </p>
                </div>
              </div>

              {/* Wireframe A3 Display */}
              <div className="flex items-center justify-center relative">
                <div className="relative w-[180px] h-[254px] border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/5 dark:bg-[var(--color-primary)]/10 shadow-[0_0_30px_rgba(32,178,170,0.1)] flex items-center justify-center backdrop-blur-sm">
                  {/* Dimension lines */}
                  <div className="absolute -top-6 w-full flex items-center justify-between text-[8px] font-mono text-[var(--color-primary)] font-bold">
                    <span>|</span> <span className="border-t border-[var(--color-primary)] border-dashed flex-1 mx-2" /> 297mm <span className="border-t border-[var(--color-primary)] border-dashed flex-1 mx-2" /> <span>|</span>
                  </div>
                  <div className="absolute -left-8 h-full flex flex-col items-center justify-between text-[8px] font-mono text-[var(--color-primary)] font-bold">
                    <span>—</span> <span className="border-l border-[var(--color-primary)] border-dashed flex-1 my-2" /> <span className="-rotate-90 origin-center whitespace-nowrap">420mm</span> <span className="border-l border-[var(--color-primary)] border-dashed flex-1 my-2" /> <span>—</span>
                  </div>

                  {/* Inner safe zone */}
                  <div className="w-[85%] h-[85%] border border-gray-400/50 dark:border-white/20 border-dashed flex items-center justify-center p-4 text-center">
                    <span className="text-gray-400 dark:text-gray-500 font-mono text-[10px] leading-tight">SAFE<br />PRINT<br />ZONE</span>
                  </div>

                  {/* Corner marks */}
                  <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-[var(--color-primary)]" />
                  <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-[var(--color-primary)]" />
                  <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-[var(--color-primary)]" />
                  <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-[var(--color-primary)]" />
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-6 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-[var(--color-primary)]/10 pb-4">
          <div>
            <h2 className="text-4xl font-bold mb-4 flex items-center gap-3 text-[var(--text-main)]">
              Trending Masterpieces
            </h2>
            <p className="text-slate-500 dark:text-slate-400 italic">
              Curated pick from our top artists this week
            </p>
          </div>
          <button
            onClick={() => navigate("/explore")}
            className="text-[var(--color-primary)] font-bold hover:underline tracking-widest text-sm uppercase"
          >
            View All Gallery →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {artworks.length === 0 ? (
            <SkeletonGrid count={4} />
          ) : artworks.map((art, index) => (
            <motion.div
              key={art._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              onClick={() => navigate(`/art/${art._id}`)}
              className="group relative bg-white dark:bg-[#041116]/80 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-md dark:shadow-[0_8px_40px_rgba(11,43,54,0.4)] border border-[var(--color-primary)]/10 dark:border-[var(--color-primary)]/20 hover:shadow-xl hover:border-[var(--color-primary)]/40 transition-all duration-500 cursor-pointer card-lift"
            >
              {/* Image Container (The Frame) */}
              <div className="aspect-square overflow-hidden relative bg-gray-100 dark:bg-gray-800">
                <motion.img
                  initial={{ opacity: 0, scale: 1.2 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (index * 0.1) + 0.5, duration: 1 }}
                  src={
                    art.images?.[0]?.startsWith("http") ||
                      art.images?.[0]?.includes("/assets")
                      ? art.images[0]
                      : `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") || "http://localhost:5005"}${art.images?.[0]}`
                  }
                  alt={art.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1"
                />
                <div className="absolute top-6 right-6 bg-[#0a1c22]/40 backdrop-blur-xl text-white px-5 py-2 rounded-full text-sm font-bold border border-white/20 shadow-lg">
                  ₹{Number(art.price || 0).toLocaleString()}
                </div>
                {art.stock !== undefined && art.stock <= 0 && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-500">
                    <span className="bg-white/90 text-red-600 font-extrabold px-4 py-1.5 rounded-full shadow-2xl border border-red-200 text-[10px] tracking-widest uppercase flex items-center gap-1">
                      <AlertCircle size={14} /> Sold Out
                    </span>
                  </div>
                )}
              </div>

              {/* Content & Actions */}
              <div className="p-4">
                <div className="mb-3">
                  <h3 className="text-xl font-bold mb-1 text-slate-800 dark:text-[var(--text-main)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                    {art.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    by{" "}
                    <span className="text-[var(--color-primary)] font-bold not-italic">
                      {art.artistBrandName ||
                        art.artistName ||
                        "Unknown Creator"}
                    </span>
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-[var(--color-primary)]/10">
                  {/* Rating Feature */}
                  {(!user || user?.role === "customer") && (
                    <div className="mb-2 relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[var(--color-primary)] font-bold text-sm">
                          {localRatings[art._id] ? (
                            Array.from({ length: localRatings[art._id] }).map((_, i) => (
                              <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paintbrush-2"><path d="M14 19.5v.5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-.5" /><path d="M5 8h14" /><path d="m7 8 2-4h6l2 4" /><path d="m5 8 1 8h12l1-8" /><path d="M9 16v4" /><path d="M15 16v4" /></svg>
                            ))
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs italic">No rating yet</span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hoveredArtForRating === art._id) setHoveredArtForRating(null);
                            else setHoveredArtForRating(art._id);
                          }}
                          className="text-xs font-bold text-gray-500 hover:text-[var(--color-primary)] flex items-center gap-1 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paintbrush-2"><path d="M14 19.5v.5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-.5" /><path d="M5 8h14" /><path d="m7 8 2-4h6l2 4" /><path d="m5 8 1 8h12l1-8" /><path d="M9 16v4" /><path d="M15 16v4" /></svg> Rate
                        </button>
                      </div>

                      {/* Animated Rating Overlay */}
                      {hoveredArtForRating === art._id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute bottom-6 right-0 left-0 bg-white/90 dark:bg-[#0a1c22]/90 backdrop-blur-xl p-3 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 flex justify-center gap-2 overflow-hidden"
                        /* Rating animated stains */
                        >
                          <div className="absolute inset-0 pointer-events-none opacity-50 flex items-center justify-center gap-2 mix-blend-multiply dark:mix-blend-screen overflow-hidden">
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5], rotate: [0, 45, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="w-8 h-8 rounded-full bg-pink-500/60 blur-md absolute top-1 left-2 flex items-center justify-center">
                              <svg className="w-4 h-4 text-pink-700/80 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor"><path d="M14 19.5v.5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-.5" /><path d="M5 8h14" /><path d="m7 8 2-4h6l2 4" /><path d="m5 8 1 8h12l1-8" /><path d="M9 16v4" /><path d="M15 16v4" /></svg>
                            </motion.div>
                            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3], rotate: [0, -45, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="w-10 h-10 rounded-full bg-blue-500/60 blur-md absolute bottom-1 right-2 flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-800/80 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor"><circle cx="13.5" cy="5.5" r="2.5" /><circle cx="17.5" cy="10.5" r="2.5" /><circle cx="15.5" cy="16.5" r="2.5" /><circle cx="9.5" cy="18.5" r="2.5" /><circle cx="5.5" cy="13.5" r="2.5" /><circle cx="7.5" cy="7.5" r="2.5" /><path d="M13.5 5.5A8 8 0 1 0 21 16" /></svg>
                            </motion.div>
                            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ repeat: Infinity, duration: 2.5 }} className="w-6 h-6 rounded-full bg-yellow-500/60 blur-md absolute top-2 right-8 flex items-center justify-center">
                              <svg className="w-3 h-3 text-yellow-800/80 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3" /><circle cx="19" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><path d="M10.4 21.6a10 10 0 0 0 9.2-9.2" /></svg>
                            </motion.div>
                          </div>

                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              onClick={(e) => handleRate(e, art._id, art.artistObjectId || art.artistId || "", num)}
                              className="relative z-10 text-gray-400 hover:text-[var(--color-primary)] hover:scale-125 transition-all"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={localRatings[art._id] >= num ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paintbrush-2"><path d="M14 19.5v.5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-.5" /><path d="M5 8h14" /><path d="m7 8 2-4h6l2 4" /><path d="m5 8 1 8h12l1-8" /><path d="M9 16v4" /><path d="M15 16v4" /></svg>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  )}

                  {(!user || user?.role === "customer") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const isInCart = cart.some(
                          (item: any) => item._id === art._id,
                        );
                        if (isInCart) {
                          removeFromCart(art._id);
                        } else {
                          addToCart(art);
                        }
                      }}
                      disabled={art.stock !== undefined && art.stock <= 0}
                      className={`w-full py-2 rounded-xl font-black flex items-center justify-center gap-2 transition-all duration-300 shadow-sm uppercase tracking-widest text-xs ${art.stock !== undefined && art.stock <= 0
                        ? "bg-gray-100 dark:bg-gray-800/50 text-gray-400 cursor-not-allowed border-none shadow-none"
                        : cart.some((item: any) => item._id === art._id)
                          ? "bg-[var(--color-primary)] text-white shadow-[var(--color-primary)]/20"
                          : "bg-transparent border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
                        }`}
                    >
                      {art.stock !== undefined && art.stock <= 0 ? (
                        <>
                          <AlertCircle size={18} /> Sold Out
                        </>
                      ) : cart.some((item: any) => item._id === art._id) ? (
                        <>
                          <Check size={20} /> Added
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={20} /> Add to Cart
                        </>
                      )}
                    </button>
                  )}

                  <div className={`grid gap-4 ${user?.role === "admin" ? "grid-cols-1" : "grid-cols-2"}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/art/${art._id}`);
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border border-[var(--color-primary)]/20 bg-gray-50 dark:bg-white/5 hover:bg-[var(--color-primary)]/10 transition-all text-slate-600 dark:text-slate-300"
                    >
                      Details
                    </button>
                    {(!user || user?.role === "customer") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/custom");
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border border-dashed border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all w-full"
                      >
                        Custom
                      </button>
                    )}

                    {/* Delete button — only artist viewing their OWN artwork */}
                    {user?.role === "artist" && (
                      (art.artistId === user?._id || art.artistObjectId === user?._id) ? (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm("Delete this artwork permanently?")) {
                              try {
                                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/artworks/${art._id}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                  }
                                });
                                if (res.ok) window.location.reload();
                              } catch (err) {
                                console.error(err);
                              }
                            }
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border border-dashed border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40 transition-all w-full"
                        >
                          Delete
                        </button>
                      ) : null
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Latest Uploads Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-[var(--color-primary)]/10 pb-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 flex items-center gap-3 text-[var(--text-main)]">
              Latest Uploads
            </h2>
            <p className="text-slate-500 dark:text-slate-400 italic">
              Fresh masterpieces directly from the studios
            </p>
          </div>
          <button
            onClick={() => navigate("/explore")}
            className="text-[var(--color-primary)] font-bold hover:underline tracking-widest text-sm uppercase"
          >
            Explore Fresh Art →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestArtworks.length === 0 ? (
            <SkeletonGrid count={4} />
          ) : latestArtworks.map((art, index) => (
            <motion.div
              key={art._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              onClick={() => navigate(`/art/${art._id}`)}
              className="group relative bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 dark:border-white/5 hover:border-[var(--color-primary)]/30 transition-all duration-300 cursor-pointer p-3"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 relative">
                <img
                  src={
                    art.images?.[0]?.startsWith("http") || art.images?.[0]?.includes("/assets")
                      ? art.images[0]
                      : `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") || "http://localhost:5005"}${art.images?.[0]}`
                  }
                  alt={art.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/90 text-slate-900 dark:text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                  ₹{Number(art.price || 0).toLocaleString()}
                </div>
                {art.stock !== undefined && art.stock <= 0 && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-500">
                    <span className="bg-white/90 text-red-600 font-extrabold px-4 py-1.5 rounded-full shadow-2xl border border-red-200 text-[9px] tracking-widest uppercase flex items-center gap-1">
                      <AlertCircle size={12} /> Sold Out
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 px-1">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate group-hover:text-[var(--color-primary)] transition-colors">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic truncate">
                  by {art.artistBrandName || art.artistName || "Unknown Artist"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Top Artists & Newly Added Art Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-8 mb-4 perspective-[2000px]">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-[var(--color-primary)]/10 pb-4">
          <div>
            <h2 className="text-4xl font-bold mb-4 flex items-center gap-3 text-[var(--text-main)]">
              Leading Visionaries
            </h2>
            <p className="text-slate-500 dark:text-slate-400 italic">
              Discover top-rated artists and their latest creations.
            </p>
          </div>
          <button
            onClick={() => navigate("/artists")}
            className="text-[var(--color-primary)] font-bold hover:underline tracking-widest text-sm uppercase"
          >
            Explore All Artists →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topArtists.map((artist, i) => (
            <motion.div
              key={artist._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              onClick={() => navigate(`/artist/${artist._id}`)}
              className="bg-white dark:bg-[#0a1c22]/60 rounded-3xl p-6 shadow-xl border border-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/40 hover:shadow-[0_10px_40px_rgba(32,178,170,0.15)] transition-all cursor-pointer group flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-[#041116] shadow-md mb-4 group-hover:scale-105 transition-transform">
                {artist.profileImage ? (
                  <img src={artist.profileImage.startsWith('http') ? artist.profileImage : `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") || "http://localhost:5005"}${artist.profileImage}`} alt={artist.brandName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-slate-800 flex items-center justify-center text-white text-3xl font-black">
                    {(artist.brandName || artist.name || "A")[0]}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 group-hover:text-[var(--color-primary)] transition-colors">
                {artist.brandName || artist.name || "Unknown Artist"}
              </h3>

              <div className="flex items-center gap-1 mb-4">
                <Star size={14} className={artist.rating?.count > 0 ? "text-yellow-500 fill-yellow-500" : "text-gray-400 fill-gray-400"} />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {artist.rating?.average ? artist.rating.average.toFixed(1) : "0.0"}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                  ({artist.rating?.count || 0} reviews)
                </span>
              </div>

              {/* Curated Space - Latest Art */}
              <div className="w-full mt-4 pt-4 border-t border-[var(--color-primary)]/10 border-dashed">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-3">Recently Added</p>
                {artist.artworks && artist.artworks.length > 0 ? (
                  <div className="flex gap-2 justify-center">
                    {artist.artworks.slice(0, 3).map((art: any, j: number) => (
                      <div key={art._id || j} className="w-16 h-16 rounded-lg overflow-hidden border border-[var(--color-primary)]/20 group-hover:border-[var(--color-primary)]/50 transition-colors">
                        <img
                          src={art.images?.[0]?.startsWith("http") || art.images?.[0]?.includes("/assets") ? art.images[0] : `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") || "http://localhost:5005"}${art.images?.[0]}`}
                          alt="Artwork"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No recent artworks</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Seasonal Festive Dynamic Banner */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-10 mb-4">
        <motion.div
          key={currentFestival.id}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className={`relative rounded-[3rem] overflow-hidden min-h-[450px] bg-gradient-to-br ${currentFestival.colors} shadow-2xl border border-white/10 group`}
        >
          {/* Animated Background Ornaments */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

          {/* Floating Festival Icons */}
          {currentFestival.icons.map((icon: string, i: number) => (
            <motion.div
              key={i}
              animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3], rotate: [0, 10, 0] }}
              transition={{ duration: 5 + i * 1, repeat: Infinity, delay: i * 0.8 }}
              className="absolute text-4xl md:text-5xl pointer-events-none z-10 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              style={{ left: `${15 + i * 30}%`, top: `${20 + (i % 2) * 40}%` }}
            >
              {icon}
            </motion.div>
          ))}

          {/* Atmospheric Glow Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t ${currentFestival.colors.split(' ')[0]}/80 via-transparent to-white/5 pointer-events-none`} />

          {/* Banner Content */}
          <div className="relative z-20 flex flex-col items-center justify-center text-center px-8 py-20 h-full">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center mb-6"
            >
              <span className="text-3xl">{currentFestival.emoji}</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`${currentFestival.accent} text-xs font-black uppercase tracking-[0.5em] mb-4`}
            >
              {currentFestival.tag}
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="text-5xl md:text-7xl lg:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40 mb-6 font-serif-magic drop-shadow-2xl leading-[0.9]"
            >
              {currentFestival.name}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="relative mb-8"
            >
              <span className="text-4xl md:text-6xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                {currentFestival.subtitle}
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-white/60 max-w-lg text-sm leading-relaxed mb-10"
            >
              {currentFestival.message}
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              onClick={() => navigate('/explore')}
              className={`px-12 py-5 bg-white text-black font-black text-sm uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-[0_10px_40px_rgba(255,255,255,0.2)]`}
            >
              {currentFestival.button}
            </motion.button>
          </div>
        </motion.div>

        {/* Real-time Curated Collection for the Active Festival */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-8 px-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2 italic uppercase tracking-tighter">
              <span className={currentFestival.accent}>{currentFestival.emoji}</span> Curated for {currentFestival.name}
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60">Spring 2026 Collection</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-2">
            {artworks
              .slice(0, 4)
              .map((art, i) => (
                <motion.div
                  key={art._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(`/art/${art._id}`)}
                  className="group relative cursor-pointer"
                >
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-lg border border-slate-100 dark:border-white/5 bg-white dark:bg-white/5">
                    <img
                      src={art.images?.[0]?.startsWith('http') ? art.images[0] : (art.images?.[0]?.includes("/assets") ? art.images[0] : `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") || "http://localhost:5005"}${art.images?.[0]}`)}
                      alt={art.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-3 right-3 bg-white/95 dark:bg-black/90 text-[10px] font-black px-2 py-1 rounded-lg border border-gray-100 dark:border-white/10">
                      ₹{Number(art.price).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-3">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate group-hover:text-[var(--color-primary)] transition-colors">{art.title}</h4>
                    <p className="text-[10px] text-slate-400 italic">by {art.artistBrandName || art.artistName}</p>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* Custom Arts — Commission Section */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-10 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[3rem] overflow-hidden min-h-[550px] bg-[#0b0c14] dark:bg-gradient-to-br dark:from-[#0c0d18] dark:via-[#12141f] dark:to-[#0a0c14] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col md:flex-row items-center"
        >
          {/* Floating Orbiting Icons */}
          {['✏️', '🖌️', '🖊️', '🎨'].map((icon, i) => (
            <motion.div
              key={i}
              animate={{
                rotate: 360,
              }}
              transition={{ duration: 12 + i * 4, repeat: Infinity, ease: "linear" }}
              className="absolute pointer-events-none z-10"
              style={{
                top: '50%', left: '25%',
                width: `${200 + i * 80}px`,
                height: `${200 + i * 80}px`,
                marginTop: `-${100 + i * 40}px`,
                marginLeft: `-${100 + i * 40}px`,
              }}
            >
              <span className="absolute top-0 left-1/2 -translate-x-1/2 text-2xl md:text-3xl opacity-20 dark:opacity-40 text-white">
                {icon}
              </span>
            </motion.div>
          ))}

          {/* Left: Digital Canvas with Before/After */}
          <div className="w-full md:w-1/2 relative min-h-[400px] flex items-center justify-center p-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 1 }}
              className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl"
            >
              {/* Before: Sketch Layer */}
              <div className="absolute inset-0 z-0">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg" className="w-full h-full object-cover grayscale opacity-60" alt="Sketch" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c14] via-transparent to-transparent" />
              </div>
              {/* After: High-detail Render — paint splash reveal on scroll */}
              <motion.div
                initial={{ clipPath: 'circle(0% at 50% 0%)' }}
                whileInView={{ clipPath: 'circle(120% at 50% 50%)' }}
                viewport={{ once: true }}
                transition={{ delay: 1.2, duration: 1.5 }}
                className="absolute inset-0 z-10"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/40/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg" className="w-full h-full object-cover saturate-125 contrast-110" alt="Final Render" />
              </motion.div>
              {/* Labels */}
              <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                Before → After
              </div>
            </motion.div>

            {/* Limited Time Sale Tag */}
            <motion.div
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute bottom-6 left-6 px-4 py-2 bg-red-500/90 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-400/30 backdrop-blur-md z-20"
            >
              ⚡ Limited Time Sale
            </motion.div>
          </div>

          {/* Right: Commission Content */}
          <div className="w-full md:w-1/2 p-10 md:p-16 relative z-20">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[var(--color-primary)] font-mono text-xs uppercase tracking-[0.5em] mb-4 font-bold"
            >
              Custom Commissions
            </motion.p>
            <motion.h2
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-black italic leading-tight mb-6 font-serif-magic"
              style={{
                color: '#ffffff',
                textShadow: '0 0 10px rgba(0, 128, 128, 0.3)' // Subtle Teal Glow
              }}
            >
              Bring Your<br />
              <span style={{
                color: '#ffffff',
                textShadow: '0 0 25px rgba(32, 178, 170, 0.8), 0 0 45px rgba(32, 178, 170, 0.4)' // Stronger Theme Glow (Teal)
              }}>Vision to Life</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 1 }}
              whileInView={{ opacity: 1 }}
              className="text-sm leading-relaxed mb-8 max-w-sm"
              style={{ color: '#cbd5e1' }} // Light gray/slate
            >
              From a rough pencil sketch to a hyper-detailed masterpiece. Our artists transform your imagination into tangible art — tailored exclusively for you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={() => navigate('/custom')}
                className="heartbeat-pulse px-8 py-4 bg-[var(--color-primary)] font-black text-xs uppercase tracking-widest rounded-full hover:brightness-110 shadow-[0_0_30px_rgba(32,178,170,0.3)] transition-all"
                style={{ color: '#ffffff' }}
              >
                Commission Me
              </button>
              <button
                onClick={() => navigate('/explore')}
                className="px-8 py-4 border border-white/20 font-bold text-xs uppercase tracking-widest rounded-full hover:border-white hover:bg-white/10 transition-all backdrop-blur-md"
                style={{ color: '#ffffff' }}
              >
                Browse Artists
              </button>
            </motion.div>

            {/* Stats & Artist Badges */}
            <div className="flex flex-col gap-6 mt-10 pt-6 border-t border-slate-200 dark:border-white/10">
              <div className="flex gap-8">
                {[
                  { num: "500+", label: "Delivered" },
                  { num: "50+", label: "Elite Artists" },
                  { num: "4.9★", label: "Quality" }
                ].map((stat, i) => (
                  <div key={i}>
                    <span className="text-xl font-black" style={{ color: '#ffffff' }}>{stat.num}</span>
                    <p className="text-[9px] uppercase tracking-widest font-bold mt-1" style={{ color: '#94a3b8' }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Professional Artist Workflow Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="flex items-center gap-4 py-3 px-4 bg-white/10 rounded-2xl border border-white/5 shadow-inner"
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-7 h-7 rounded-full bg-slate-800 border-2 border-[#0b0c14] flex items-center justify-center text-[11px] shadow-lg">👑</div>
                  ))}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: '#94a3b8' }}>
                  <span className="text-[var(--color-primary)]">Certified Artist</span> ▪ Encrypted Inquiries ▪ Instant Delivery
                </div>
              </motion.div>

              {/* Live Availability Ticker */}
              <div className="mt-2 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>
                  Live: Artists currently queuing commission requests
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* The Eternal Horizon Footer */}
      <EternalFooter />
    </div>
  );
};

export default LandingPage;
