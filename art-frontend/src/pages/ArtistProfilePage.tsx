import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  CheckCircle,
  MessageSquare,
  UserPlus,
  Palette,
  Filter,
  Heart,
  Check,
  Camera,
  Sparkles,
  Star,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import PaintFlowBackground from "../components/PaintFlowBackground";

interface Artist {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  location?: string;
  verificationBadge?: boolean;
  rating?: number;
  totalSales?: number;
  artStyles?: string[];
  mediums?: string[];
  languages?: string[];
  followers?: string[];
  following?: string[];
}

interface Artwork {
  _id: string;
  title: string;
  images: string[];
  price: number;
  category: string;
  description?: string;
  artistId: string;
}

const ArtistProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openChat } = useChat();
  const { user, toggleWishlist, updateProfile } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high">(
    "newest",
  );

  const sortedArtworks = [...artworks].sort((a, b) => {
    if (sortBy === "price_low") return a.price - b.price;
    if (sortBy === "price_high") return b.price - a.price;
    return 0;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artistRes, worksRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/artist/${id}`),
          fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/artist/${id}/artworks`),
        ]);

        if (artistRes.ok) {
          const data = await artistRes.json();
          setArtist(data.artist);
          setFollowersCount(data.artist.followers?.length || 0);

          if (user && data.artist.followers?.includes(user._id)) {
            setIsFollowing(true);
          }
        }
        if (worksRes.ok) {
          const data = await worksRes.json();
          setArtworks(data.artworks);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, user?._id]);

  const handleFollowToggle = async () => {
    if (!user) {
      window.dispatchEvent(new Event("open-login-modal"));
      return;
    }

    try {
      const newIsFollowing = !isFollowing;
      setIsFollowing(newIsFollowing);
      setFollowersCount((prev) => (newIsFollowing ? prev + 1 : prev - 1));

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/artist/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          artistId: artist?._id,
        }),
      });

      const data = await response.json();

      if (data.status === "ok") {
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);

        if (user.following) {
          const updatedFollowing = data.isFollowing
            ? [...(user.following || []), artist?._id].filter(
              (id): id is string => !!id,
            )
            : (user.following || []).filter((id: string) => id !== artist?._id);
          updateProfile({ following: updatedFollowing });
        }
      } else {
        setIsFollowing(!newIsFollowing);
        setFollowersCount((prev) => (!newIsFollowing ? prev + 1 : prev - 1));
        alert(data.message || "Action failed");
      }
    } catch (err) {
      console.error(err);
      setIsFollowing(!isFollowing);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen pt-24 text-center dark:text-white">
        Drawing Profile...
      </div>
    );
  if (!artist)
    return (
      <div className="min-h-screen pt-24 text-center dark:text-white">
        Artist disappeared into the canvas.
      </div>
    );

  const isOwner = user && user._id === artist._id;

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent text-[#1a202c] dark:text-slate-200 transition-colors duration-500 overflow-hidden relative">
      <Navbar />
      <PaintFlowBackground color="var(--color-primary)" opacity={0.15} />

      {/* Header / Banner - Enhanced Glassmorphism */}
      <div className="relative z-10 bg-white/60 dark:bg-[var(--bg-primary)]/40 backdrop-blur-3xl pt-36 pb-20 px-8 border-b border-[var(--primary)]/10 dark:border-white/5 shadow-2xl">
        <PaintFlowBackground color="#184954" opacity={0.15} />
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center md:items-start text-center md:text-left">
          {/* Avatar with Animated Glow */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)] to-cyan-400 rounded-full blur-3xl opacity-20 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse" />
            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-[8px] border-white dark:border-[var(--bg-primary)] shadow-[0_20px_60px_rgba(63,154,174,0.3)] bg-white dark:bg-[var(--bg-primary)] transition-all duration-1000 shrink-0 transform-gpu hover:scale-105">
              <img
                src={
                  artist.avatar ||
                  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
                }
                alt={artist.name}
                className="w-full h-full object-cover"
              />
              {isOwner && (
                <button
                  onClick={() => navigate("/profile")}
                  className="absolute inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="text-white drop-shadow-md" size={32} />
                </button>
              )}
            </div>
          </div>

          {/* Artist Details */}
          <div className="flex-1 flex flex-col items-center md:items-start w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <h1 className="text-4xl md:text-5xl font-serif-magic italic font-black text-[var(--text-main)] tracking-tight flex items-center gap-4">
                {artist.name}
                <Sparkles className="text-[var(--primary)] size-8 animate-pulse" />
              </h1>
              {artist.verificationBadge && (
                <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 border border-[var(--color-primary)]/20 shadow-sm uppercase tracking-widest">
                  <CheckCircle size={14} /> Verified Artist
                </span>
              )}
            </div>

            {/* Stats - Premium Look */}
            <div className="flex flex-wrap justify-center md:justify-start gap-8 mb-8">
              <div className="text-center md:text-left">
                <span className="block text-3xl font-black text-[var(--color-primary)]">
                  {followersCount}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--text-muted)]">
                  Followers
                </span>
              </div>
              <div className="w-px bg-gray-200 dark:bg-white/10" />
              <div className="text-center md:text-left">
                <span className="block text-3xl font-black text-[var(--color-primary)]">
                  {artworks.length}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--text-muted)]">
                  Masterpieces
                </span>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-lg mb-8 max-w-2xl leading-relaxed font-medium italic">
              "{artist.bio || "Adding vibrant colors to the tapestry of life."}"
            </p>

            <div className="flex flex-wrap gap-4 mb-10 justify-center md:justify-start">
              {artist.location && (
                <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-4 py-2 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm text-sm font-bold">
                  <MapPin size={16} className="text-[var(--color-primary)]" />{" "}
                  {artist.location}
                </div>
              )}
              <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-4 py-2 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm text-sm font-bold">
                <Palette size={16} className="text-[var(--color-primary)]" />{" "}
                {artist.artStyles?.join(", ") || "Fine Art"}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start w-full">
              {!isOwner && user?.role !== "admin" && (
                <button
                  onClick={handleFollowToggle}
                  className={`flex items-center gap-2.5 px-8 py-4 rounded-2xl font-black transition-all duration-300 shadow-xl text-sm uppercase tracking-widest ${isFollowing ? "bg-white dark:bg-white/5 text-[var(--text-muted)]" : "bg-[var(--color-primary)] text-white hover:shadow-[var(--color-primary)]/40 hover:-translate-y-1"}`}
                >
                  {isFollowing ? <Check size={18} /> : <UserPlus size={18} />}
                  {isFollowing ? "Following" : "Follow Artist"}
                </button>
              )}

              {!isOwner && (
                <button
                  onClick={() => {
                    if (!user) {
                      window.dispatchEvent(new Event("open-login-modal"));
                      return;
                    }
                    openChat({
                      id: artist._id,
                      name: artist.name,
                      avatar: artist.avatar,
                      role: "artist",
                    });
                  }}
                  className="flex items-center gap-2.5 px-8 py-4 bg-white dark:bg-white/5 text-[var(--color-primary)] rounded-2xl font-black hover:bg-[var(--color-primary)] hover:text-white transition-all text-sm border-2 border-[var(--color-primary)]/20 uppercase tracking-widest shadow-lg"
                >
                  <MessageSquare size={18} /> Chat
                </button>
              )}
              {(!user || user?.role === "customer") && (
                <button
                  onClick={() => {
                    if (!user) {
                      window.dispatchEvent(new Event("open-login-modal"));
                      return;
                    }
                    navigate("/custom", {
                      state: { artistId: artist._id, artistName: artist.name },
                    });
                  }}
                  className="flex items-center gap-2.5 px-8 py-4 bg-[var(--primary)] text-white rounded-2xl font-black hover:bg-[var(--secondary)] transition-all text-sm uppercase tracking-[0.2em] shadow-2xl shadow-[var(--primary)]/30"
                >
                  <Star size={18} className="fill-current" /> Commission Art
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-16 gap-6">
          <div className="mb-0">
            <h2 className="text-3xl md:text-4xl font-serif-magic text-[var(--text-main)] tracking-tighter uppercase italic leading-tight">
              Artist's <span className="text-[var(--primary)]">Portfolio</span>
            </h2>
            <div className="h-1 w-20 bg-[var(--primary)] rounded-full mt-2" />
          </div>

          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl hover:shadow-xl transition-all font-black text-sm uppercase tracking-widest relative"
          >
            <Filter size={18} className="text-[var(--color-primary)]" /> Sort
            Works
            {filterOpen && (
              <div className="absolute right-0 top-full mt-4 w-56 bg-white dark:bg-[var(--bg-primary)] rounded-[2rem] shadow-2xl border border-gray-100 dark:border-white/5 z-50 overflow-hidden py-4">
                <button
                  onClick={() => {
                    setSortBy("newest");
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-6 py-3 text-sm font-bold ${sortBy === "newest" ? "text-[var(--color-primary)]" : "text-gray-500"}`}
                >
                  Latest First
                </button>
                <button
                  onClick={() => {
                    setSortBy("price_low");
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-6 py-3 text-sm font-bold ${sortBy === "price_low" ? "text-[var(--color-primary)]" : "text-gray-500"}`}
                >
                  Price: L-H
                </button>
                <button
                  onClick={() => {
                    setSortBy("price_high");
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-6 py-3 text-sm font-bold ${sortBy === "price_high" ? "text-[var(--color-primary)]" : "text-gray-500"}`}
                >
                  Price: H-L
                </button>
              </div>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <AnimatePresence>
            {sortedArtworks.map((art, idx) => (
              <motion.div
                key={art._id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white dark:bg-[#0a1c22]/80 backdrop-blur-md rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-white/5 flex flex-col cursor-pointer"
                onClick={() => navigate(`/art/${art._id}`)}
              >
                {/* Image with overlaid price badge and wishlist button */}
                <div className="relative overflow-hidden aspect-[4/5] bg-gray-100 dark:bg-gray-800">
                  <img
                    src={art.images[0]?.startsWith("http") ? art.images[0] : `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") || "http://localhost:5005"}${art.images[0]}`}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Price badge top-right */}
                  <span className="absolute top-3 right-3 bg-white/90 dark:bg-black/70 backdrop-blur-sm text-[#184954] dark:text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                    ₹{art.price.toLocaleString()}
                  </span>
                  {/* Wishlist heart top-left */}
                  {(!user || user?.role === "customer") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) {
                          window.dispatchEvent(new Event("open-login-modal"));
                          return;
                        }
                        toggleWishlist(art._id);
                      }}
                      className={`absolute top-3 left-3 p-1.5 rounded-lg shadow-sm transition-all ${user?.wishlist?.includes(art._id)
                          ? "bg-red-50 text-red-500"
                          : "bg-white/80 backdrop-blur-md text-gray-400 hover:text-red-500"
                        }`}
                    >
                      <Heart
                        size={14}
                        fill={user?.wishlist?.includes(art._id) ? "currentColor" : "none"}
                      />
                    </button>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 flex flex-col gap-3">
                  <div>
                    <h3 className="font-black text-[15px] dark:text-white truncate tracking-tight group-hover:text-[var(--color-primary)] transition-colors">
                      {art.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">
                      by <span className="text-[var(--color-primary)]">{artist?.name || "Artist"}</span>
                    </p>
                  </div>

                  {/* Buttons Row */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/art/${art._id}`);
                      }}
                      className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-xs hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all duration-300"
                    >
                      Details
                    </button>
                    {/* Delete button only for the owner artist */}
                    {isOwner && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm("Delete this artwork?")) {
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
                        className="flex-1 py-2 rounded-xl border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-500 hover:text-white transition-all duration-300"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfilePage;
